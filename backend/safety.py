"""Code-level safety defenses (they run before and after the model, so they cannot be talked out of).

(a) Prompt injection   - pattern pre-filter on input + secret/canary scan on every output.
(b) Clinical hallucination / unsafe medical advice - detector on input (routes to a safe redirect)
                         + dosage/diagnosis scrubber on output.
(c) Runaway overspending - message-size cap, runaway-demand detector, per-session turn / token /
                         dollar circuit breaker, per-run model-call cap (see SessionStore + RunBudget).
"""

from __future__ import annotations

import re
import threading
import time
from dataclasses import dataclass, field

from .config import LIMITS, OPENAI_API_KEY, PORTKEY_API_KEY

# A random-looking marker planted in every system prompt. If it ever shows up in an output, the
# model is leaking its instructions, and the output scanner blocks the answer.
CANARY = "JR-CANARY-7f3a91"

# ----------------------------------------------------------------------------- (a) injection
INJECTION_PATTERNS = [
    (r"\b(ignore|disregard|forget|override|bypass)\b[^.\n]{0,40}\b(previous|prior|above|earlier|all|your|system)\b[^.\n]{0,25}\b(instruction|prompt|rule|guideline|direction)s?",
     "Asks the assistant to ignore its instructions"),
    (r"\b(reveal|print|dump|show|repeat|output|leak|display|tell me)\b[^.\n]{0,40}\b(system|hidden|initial|developer|secret)\s+(prompt|instruction|message|rules?)",
     "Asks for the hidden system prompt"),
    (r"\b(api[\s_-]?keys?|secret[\s_-]?keys?|access\s+tokens?|portkey_api_key|openai_api_key|\.env\b|environment variables?)",
     "Asks for keys, tokens or environment secrets"),
    (r"\b(you are now|act as|pretend (to be|you are)|roleplay as)\b[^.\n]{0,40}\b(dan|developer mode|devmode|jailbr\w*|unfiltered|unrestricted|no rules|evil)",
     "Role-play jailbreak"),
    (r"\b(jailbreak|developer mode|devmode|do anything now)\b", "Known jailbreak phrase"),
    (r"(<\|im_start\|>|<\|system\|>|\[/?INST\]|^\s*(system|assistant)\s*:)", "Fake chat-role markup"),
    (r"\b(new|updated|real)\s+(system\s+)?(instructions|rules)\s*:", "Injected 'new instructions' block"),
]
_INJ = [(re.compile(p, re.I | re.M), why) for p, why in INJECTION_PATTERNS]

# ----------------------------------------------------------------------------- (b) medical
MEDS = (r"baclofen|botox|botulinum|diazepam|valium|gabapentin|tizanidine|dantrolene|clonidine|melatonin|"
        r"ibuprofen|advil|motrin|acetaminophen|tylenol|keppra|levetiracetam|depakote|lamotrigine|"
        r"oxybutynin|glycopyrrolate|miralax|prednisone|steroids?|opioids?|oxycodone|morphine|antibiotics?|"
        r"cbd|thc|epidiolex|adderall|ritalin|methylphenidate|risperidone|insulin")
MEDICAL_PATTERNS = [
    (rf"\b(dose|dosage|dosing|how (much|many)|mg|milligrams?|ml|increase|decrease|double|stop|taper|switch|wean)\b[^.?\n]{{0,60}}\b({MEDS})\b",
     "Medication dosing question"),
    (rf"\b({MEDS})\b[^.?\n]{{0,60}}\b(dose|dosage|dosing|how much|mg|ml|increase|decrease|double|stop|taper|give)\b",
     "Medication dosing question"),
    (r"\b(diagnose|diagnosis)\b[^.?\n]{0,60}\b(my|our|her|his|their|the)\b", "Asks for a diagnosis"),
    (r"\b(does|do|could|might)\s+(she|he|they|my (child|son|daughter|grandchild|grandson|granddaughter|kid|nephew|niece))\s+(have|has)\b[^.?\n]{0,50}\b(cp|cerebral palsy|dystonia|scoliosis|seizure|epilepsy|dysplasia|spasticity|infection|fracture|condition|disorder|syndrome)",
     "Asks whether a child has a condition"),
    (r"\b(what (medicine|medication|meds|drug)|which (medicine|medication|meds|drug))\b", "Asks which medication to use"),
]
_MED = [(re.compile(p, re.I), why) for p, why in MEDICAL_PATTERNS]

CRISIS = re.compile(r"\b(kill myself|end my life|suicid\w*|want to die|hurt myself|can'?t go on|"
                    r"hurt (my|the) (child|kid|son|daughter|grand\w+))\b", re.I)

# ----------------------------------------------------------------------------- (c) runaway
RUNAWAY = re.compile(
    r"\b(repeat|write|generate|list|produce|create)\b[^.\n]{0,40}\b(\d{3,}|thousand|million|infinite|unlimited|forever|endless)\b"
    r"|\b(loop|keep going|run|continue)\b[^.\n]{0,20}\b(forever|infinitely|endlessly|nonstop|until you run out)\b"
    r"|\b(\d{3,})\s*(pages|times|plans|emails|variations|versions)\b", re.I)

# ----------------------------------------------------------------------------- output scanners
DOSAGE_OUT = re.compile(r"[^.\n]*\b\d+(\.\d+)?\s?(mg|mcg|milligrams?|ml|milliliters?|units?|tablets?|pills?|drops?)\b[^.\n]*[.\n]?", re.I)
DIAGNOSIS_OUT = re.compile(r"[^.\n]*\b(your (child|grandchild|son|daughter|kid) (has|likely has|probably has|may have)|"
                           r"this (is|sounds like|indicates|means) (a |an )?(sign of |symptom of )?(dystonia|spasticity|"
                           r"infection|seizure|scoliosis|hip dysplasia|regression))\b[^.\n]*[.\n]?", re.I)
SECRET_OUT = re.compile(r"(sk-[A-Za-z0-9_\-]{12,}|pk-[A-Za-z0-9_\-]{12,}|" + re.escape(CANARY) + r")")
EXCLUSIVE_LANG = [
    (re.compile(r"\bmoms? and dads?\b", re.I), "caregivers"),
    (re.compile(r"\bmothers? and fathers?\b", re.I), "caregivers"),
    (re.compile(r"\byour (mom|dad|mother|father)\b", re.I), "your family"),
    (re.compile(r"\b(wheelchair[- ]bound|confined to a wheelchair)\b", re.I), "uses a wheelchair"),
    (re.compile(r"\bsuffers? from\b", re.I), "lives with"),
    (re.compile(r"\b(handicapped|crippled)\b", re.I), "disabled"),
    (re.compile(r"\bspecial needs parents?\b", re.I), "caregivers"),
]


def check_injection(text: str) -> list[str]:
    return [why for rx, why in _INJ if rx.search(text)]


def check_medical(text: str) -> list[str]:
    return sorted({why for rx, why in _MED if rx.search(text)})


def check_crisis(text: str) -> bool:
    return bool(CRISIS.search(text))


def check_runaway(text: str) -> list[str]:
    reasons = []
    if len(text) > LIMITS["max_message_chars"]:
        reasons.append(f"Message is {len(text):,} characters (limit {LIMITS['max_message_chars']:,})")
    if RUNAWAY.search(text):
        reasons.append("Asks for unbounded / mass-produced output")
    return reasons


def scrub_output(text: str) -> tuple[str, list[dict]]:
    """Remove leaked secrets, dosage instructions and diagnoses; fix exclusionary language."""
    events: list[dict] = []
    for secret in (PORTKEY_API_KEY, OPENAI_API_KEY):
        if secret and len(secret) > 8 and secret in text:
            text = text.replace(secret, "[redacted]")
            events.append({"layer": "output scanner", "type": "secret_leak", "detail": "API key redacted"})
    if SECRET_OUT.search(text):
        text = SECRET_OUT.sub("[redacted]", text)
        events.append({"layer": "output scanner", "type": "secret_leak", "detail": "Key-like string or canary redacted"})
    for rx, kind in ((DOSAGE_OUT, "dosage"), (DIAGNOSIS_OUT, "diagnosis")):
        for m in list(rx.finditer(text)):
            frag = m.group(0).strip()
            if frag:
                events.append({"layer": "output scanner", "type": f"clinical_{kind}_removed", "detail": frag[:160]})
        text = rx.sub(" ", text)
    for rx, repl in EXCLUSIVE_LANG:
        if rx.search(text):
            events.append({"layer": "output scanner", "type": "inclusive_language_fix",
                           "detail": f"'{rx.search(text).group(0)}' → '{repl}'"})
            text = rx.sub(repl, text)
    return re.sub(r"[ \t]{2,}", " ", text).strip(), events


# ----------------------------------------------------------------------------- budgets
class CircuitBreakerTripped(Exception):
    pass


@dataclass
class Session:
    id: str
    turns: int = 0
    input_tokens: int = 0
    cached_tokens: int = 0
    output_tokens: int = 0
    usd: float = 0.0
    blocked_attacks: int = 0
    created: float = field(default_factory=time.time)

    @property
    def tokens(self) -> int:
        return self.input_tokens + self.output_tokens

    def snapshot(self) -> dict:
        return {"turns_used": self.turns, "tokens_used": self.tokens, "usd_used": round(self.usd, 6),
                "blocked_attacks": self.blocked_attacks,
                "turns_left": max(0, LIMITS["max_turns_per_session"] - self.turns),
                "tokens_left": max(0, LIMITS["max_tokens_per_session"] - self.tokens),
                "usd_left": round(max(0.0, LIMITS["max_usd_per_session"] - self.usd), 6)}


class SessionStore:
    def __init__(self):
        self._s: dict[str, Session] = {}
        self._lock = threading.Lock()

    def get(self, sid: str) -> Session:
        with self._lock:
            if sid not in self._s:
                self._s[sid] = Session(sid)
            return self._s[sid]

    def reset(self, sid: str) -> Session:
        with self._lock:
            self._s[sid] = Session(sid)
            return self._s[sid]


SESSIONS = SessionStore()


class SiteGuard:
    """Site-wide circuit breaker: protects the shared key when the app is public.
    A visitor can open endless browser sessions, so we also cap Ask Hope runs per IP per hour and
    total spend per UTC day."""

    def __init__(self):
        self._lock = threading.Lock()
        self._runs: dict[str, list[float]] = {}
        self._day = time.strftime("%Y-%m-%d", time.gmtime())
        self.usd_today = 0.0

    def _roll(self):
        today = time.strftime("%Y-%m-%d", time.gmtime())
        if today != self._day:
            self._day, self.usd_today = today, 0.0

    def gate(self, ip: str | None) -> list[str]:
        """Reasons to refuse (empty = OK). Records the run for the IP when allowed."""
        with self._lock:
            self._roll()
            reasons = []
            if self.usd_today >= LIMITS["max_usd_per_day_site"]:
                reasons.append(f"Site-wide daily budget reached (${LIMITS['max_usd_per_day_site']:.2f}); resets at midnight UTC")
            if ip:
                now = time.time()
                recent = [t for t in self._runs.get(ip, []) if now - t < 3600]
                if len(recent) >= LIMITS["max_runs_per_ip_per_hour"]:
                    reasons.append(f"Hourly limit reached for this visitor ({LIMITS['max_runs_per_ip_per_hour']} questions per hour)")
                elif not reasons:
                    recent.append(now)
                self._runs[ip] = recent
            return reasons

    def add_cost(self, usd: float):
        with self._lock:
            self._roll()
            self.usd_today += usd

    def snapshot(self) -> dict:
        with self._lock:
            self._roll()
            return {"usd_today": round(self.usd_today, 6), "usd_day_limit": LIMITS["max_usd_per_day_site"]}


SITE = SiteGuard()


def session_gate(s: Session) -> list[str]:
    """Reasons the session circuit breaker is open (empty list = OK to run)."""
    reasons = []
    if s.turns >= LIMITS["max_turns_per_session"]:
        reasons.append(f"Session turn limit reached ({LIMITS['max_turns_per_session']})")
    if s.tokens >= LIMITS["max_tokens_per_session"]:
        reasons.append(f"Session token budget used up ({LIMITS['max_tokens_per_session']:,})")
    if s.usd >= LIMITS["max_usd_per_session"]:
        reasons.append(f"Session dollar ceiling reached (${LIMITS['max_usd_per_session']})")
    return reasons


class RunBudget:
    """Per-run guard checked before every model call (thread-safe; specialists run in parallel)."""

    def __init__(self, session: Session):
        self.session = session
        self.calls = 0
        self.tokens = 0
        self._lock = threading.Lock()

    def before_call(self, agent: str):
        with self._lock:
            if self.calls >= LIMITS["max_model_calls_per_run"]:
                raise CircuitBreakerTripped(
                    f"{agent}: model-call cap reached ({LIMITS['max_model_calls_per_run']} per run)")
            if self.session.tokens + self.tokens >= LIMITS["max_tokens_per_session"]:
                raise CircuitBreakerTripped(f"{agent}: session token budget exhausted")
            self.calls += 1

    def add(self, tokens: int):
        with self._lock:
            self.tokens += tokens
