"""Cost vs. quality experiment for the report's Tokenomics section (real model calls, about $0.05 total).

Three typical caregiver questions, each run under three settings:
  A  our setup      : reasoning effort "low",    prompt caching ON
  B  no caching     : reasoning effort "low",    prompt caching OFF
  C  more reasoning : reasoning effort "medium", prompt caching ON
Quality is scored automatically: required facts present, email drafted when asked, every source
verified (no hallucinated sources), and no exclusionary language. Results -> logs/cost_experiment.json

Run from the repo folder:  python scripts/cost_experiment.py
"""
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from backend import llm, orchestrator  # noqa: E402

QUESTIONS = [
    {"id": "oakland_hockey", "message": "We live in Oakland and our 9-year-old son has cerebral palsy and uses a wheelchair. Where can he try sled hockey, and what is something free to do this weekend?",
     "must": ["BORP", "Lake Merritt"], "email": False},
    {"id": "grandparent_iep", "message": "I'm raising my 8-year-old grandson who uses a manual wheelchair. His school told me I have to drive him separately to their zoo field trip because the regular bus doesn't have a lift, and insurance denied his adaptive tricycle. Draft a polite, firm email to his IEP case manager and tell me what grants can cover the adaptive bike.",
     "must": ["AMBUCS", "transportation"], "email": True},
    {"id": "new_haven", "message": "I'm in New Haven babysitting my 9-year-old cousin who uses a power wheelchair. What free things can we do, and where can her family get IEP help in Connecticut?",
     "must": ["Peabody", "CPAC"], "email": False},
]
SETTINGS = {"A_our_setup": ("low", True), "B_no_caching": ("low", False), "C_more_reasoning": ("medium", True)}
BAD = re.compile(r"\b(moms? and dads?|wheelchair[- ]bound|confined to a wheelchair|suffers? from)\b", re.I)


def score(q, rec):
    a = rec["answer"]
    text = a["message_markdown"] + " " + json.dumps(a.get("cards", {})) + " " + (a["draft_email"]["body"] if a.get("draft_email") else "")
    checks = {f"mentions {m}": m.lower() in text.lower() for m in q["must"]}
    if q["email"]:
        checks["drafts the email"] = bool(a.get("draft_email"))
    checks["all sources verified"] = not any(e["type"] == "hallucinated_source_removed" for e in rec["safety_events"])
    checks["inclusive language"] = not BAD.search(text)
    checks["answered (not blocked)"] = rec["blocked"] is None
    return round(100 * sum(checks.values()) / len(checks)), checks


results = []
for name, (effort, cache) in SETTINGS.items():
    llm.REASONING_EFFORT, llm.PROMPT_CACHING = effort, cache
    for q in QUESTIONS:
        rec = orchestrator.run_copilot(q["message"], f"exp-{name}-{q['id']}", "full", lambda e: None)
        pct, checks = score(q, rec)
        t = rec["totals"]
        row = {"setting": name, "question": q["id"], "quality_pct": pct, "checks": checks,
               "model_calls": t["model_calls"], "input_tokens": t["input_tokens"], "cached_tokens": t["cached_tokens"],
               "output_tokens": t["output_tokens"], "reasoning_tokens": t["reasoning_tokens"],
               "cost_usd": t["cost_usd"], "latency_s": round(rec["latency_ms"] / 1000, 1),
               "sources": len(rec["answer"].get("sources", []))}
        results.append(row)
        print(f"{name:17} {q['id']:16} quality {pct:3}%  in {t['input_tokens']:6} cached {t['cached_tokens']:6} "
              f"out {t['output_tokens']:5}  ${t['cost_usd']:.5f}  {row['latency_s']:5}s")

summary = {}
for name in SETTINGS:
    rows = [r for r in results if r["setting"] == name]
    n = len(rows)
    summary[name] = {k: round(sum(r[k] for r in rows) / n, 6 if k == "cost_usd" else 1) for k in
                     ("quality_pct", "input_tokens", "cached_tokens", "output_tokens", "reasoning_tokens", "cost_usd", "latency_s")}
out = Path(__file__).resolve().parent.parent / "logs" / "cost_experiment.json"
out.write_text(json.dumps({"summary": summary, "runs": results}, indent=2))
print("\nAVERAGES:")
for k, v in summary.items():
    print(f"{k:17} quality {v['quality_pct']}%  cost ${v['cost_usd']:.5f}  cached {v['cached_tokens']}  latency {v['latency_s']}s")
