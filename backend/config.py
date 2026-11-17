"""App configuration: the two-location .env lookup, API keys, model, limits and prices.

Grading rule (MGT 409): look for .env in this repo folder first, then one folder up (../.env),
where the teaching staff keep their keys. Keys already exported in the shell also work.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent          # the repo folder (joy-risers/)
DATA_DIR = ROOT / "data"
LOG_DIR = ROOT / "logs"
FRONTEND_DIST = ROOT / "frontend" / "dist"

BRAND = "Hope Compass"


def env_candidates(root: Path = ROOT) -> list[tuple[str, Path]]:
    """The two places we look for a .env file, in order: the repo folder, then one folder up."""
    return [("./.env", root / ".env"), ("../.env", root.parent / ".env")]


def _load_env() -> str:
    """Check ./.env first, then ../.env (one folder up, where the grading keys live).

    Both are loaded if both exist, with override=False: a key exported in the shell wins, then
    ./.env, then ../.env fills in anything still missing. Returns which file(s) were used.
    """
    used = []
    for label, candidate in env_candidates():
        if candidate.is_file():
            load_dotenv(candidate, override=False)
            used.append(label)
    return " + ".join(used) if used else "none (shell environment only)"


ENV_FILE_USED = _load_env()

# --- model + provider --------------------------------------------------------
MODEL_NAME = "gpt-6-luna"                       # the only model allowed on the course key
PORTKEY_BASE_URL = "https://api.portkey.ai/v1"  # Portkey's OpenAI-compatible endpoint

PORTKEY_API_KEY = os.getenv("PORTKEY_API_KEY", "").strip()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "").strip()

if PORTKEY_API_KEY:
    PROVIDER = "portkey"
elif OPENAI_API_KEY:
    PROVIDER = "openai"
else:
    PROVIDER = "offline"   # no key: the app still runs; Ask Hope answers from local data only

# --- dataset toggle (full vs. small test set) --------------------------------
DEFAULT_DATASET = os.getenv("JOY_DATASET", "full").strip().lower()
if DEFAULT_DATASET not in ("full", "test"):
    DEFAULT_DATASET = "full"

# --- budget / circuit-breaker limits (anti-overspending defense) ------------
LIMITS = {
    "max_message_chars": 2_000,        # longer messages are refused before any model call
    "max_turns_per_session": 25,       # Ask Hope questions per browser session
    "max_tokens_per_session": 150_000, # input + output tokens per session (all agents)
    "max_model_calls_per_run": 10,     # across all four agents in one run
    "max_tool_rounds_per_agent": 4,    # tool-calling loop cap per specialist agent
    "max_output_tokens_per_call": 8_000,  # reasoning tokens count toward this cap
    "max_usd_per_session": 0.25,       # hard dollar ceiling per session
    # site-wide guards for the public online version (anyone with the link shares one course key)
    "max_runs_per_ip_per_hour": 15,    # Ask Hope questions per visitor (IP address) per hour
    "max_usd_per_day_site": 2.00,      # whole-site dollar ceiling per UTC day (~1,000 typical runs)
}

PRICES = json.loads((DATA_DIR / "prices.json").read_text(encoding="utf-8"))[MODEL_NAME]


def public_config() -> dict:
    """Safe-to-show settings for the UI (never the keys themselves)."""
    return {
        "brand": BRAND,
        "model": MODEL_NAME,
        "provider": PROVIDER,
        "env_file": ENV_FILE_USED,
        "dataset": DEFAULT_DATASET,
        "limits": LIMITS,
        "prices_per_1m": PRICES,
    }
