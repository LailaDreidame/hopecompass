"""Tokenomics: cost per model call / run, projections for 100 and 10,000 users, and a run log.

Every Joy Compass run is appended to logs/telemetry.jsonl so the report can quote real measured
numbers (input, cached and output tokens, latency, cost).
"""

from __future__ import annotations

import json
import threading
from statistics import mean

from .config import LOG_DIR, PRICES

LOG_FILE = LOG_DIR / "telemetry.jsonl"
RUNS_PER_USER_PER_MONTH = 12     # assumption: about three Joy Compass questions a week per family
_lock = threading.Lock()


def call_cost(input_tokens: int, cached: int, cache_write: int, output: int) -> float:
    """USD for one model call: uncached input + cached input + cache writes + output (incl. reasoning)."""
    uncached = max(0, input_tokens - cached - cache_write)
    return round((uncached * PRICES["input_per_1m"] + cached * PRICES["cached_input_per_1m"]
                  + cache_write * PRICES["cache_write_per_1m"] + output * PRICES["output_per_1m"]) / 1e6, 8)


def projections(cost_per_run: float) -> dict:
    per_user_month = cost_per_run * RUNS_PER_USER_PER_MONTH
    return {"cost_per_run": round(cost_per_run, 6),
            "runs_per_user_per_month": RUNS_PER_USER_PER_MONTH,
            "per_user_per_month": round(per_user_month, 6),
            "users_100_per_month": round(per_user_month * 100, 4),
            "users_10000_per_month": round(per_user_month * 10_000, 2),
            "users_100_one_run_each": round(cost_per_run * 100, 4),
            "users_10000_one_run_each": round(cost_per_run * 10_000, 2)}


def totals(steps: list[dict]) -> dict:
    t = {"model_calls": 0, "input_tokens": 0, "cached_tokens": 0, "cache_write_tokens": 0,
         "output_tokens": 0, "reasoning_tokens": 0, "cost_usd": 0.0, "tool_calls": 0}
    for s in steps:
        for c in s.get("model_calls", []):
            t["model_calls"] += 1
            for k in ("input_tokens", "cached_tokens", "cache_write_tokens", "output_tokens", "reasoning_tokens"):
                t[k] += c.get(k, 0)
            t["cost_usd"] += c.get("cost_usd", 0.0)
        t["tool_calls"] += len(s.get("tool_calls", []))
    t["cost_usd"] = round(t["cost_usd"], 8)
    t["cache_hit_rate"] = round(t["cached_tokens"] / t["input_tokens"], 3) if t["input_tokens"] else 0.0
    # What the same tokens would cost with no prompt caching (every input token at full price).
    t["cost_without_cache_usd"] = round((t["input_tokens"] * PRICES["input_per_1m"]
                                         + t["output_tokens"] * PRICES["output_per_1m"]) / 1e6, 8)
    return t


def log_run(record: dict) -> None:
    LOG_DIR.mkdir(exist_ok=True)
    with _lock, LOG_FILE.open("a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")


def read_runs(limit: int = 200) -> list[dict]:
    if not LOG_FILE.exists():
        return []
    lines = LOG_FILE.read_text(encoding="utf-8").splitlines()[-limit:]
    out = []
    for ln in lines:
        try:
            out.append(json.loads(ln))
        except json.JSONDecodeError:
            continue
    return out


def summary() -> dict:
    """Averages over every logged run that actually called the model (for the report)."""
    runs = read_runs(1000)
    live = [r for r in runs if r["totals"]["model_calls"] > 0]
    blocked = [r for r in runs if r.get("blocked")]
    if not live:
        return {"runs_logged": len(runs), "live_runs": 0, "blocked_runs": len(blocked)}
    avg = {k: round(mean(r["totals"][k] for r in live), 2) for k in
           ("input_tokens", "cached_tokens", "output_tokens", "reasoning_tokens", "model_calls", "tool_calls")}
    avg_cost = mean(r["totals"]["cost_usd"] for r in live)
    avg_nocache = mean(r["totals"].get("cost_without_cache_usd", r["totals"]["cost_usd"]) for r in live)
    return {"runs_logged": len(runs), "live_runs": len(live), "blocked_runs": len(blocked),
            "avg": avg, "avg_latency_ms": round(mean(r["latency_ms"] for r in live)),
            "avg_cost_usd": round(avg_cost, 8), "avg_cost_without_cache_usd": round(avg_nocache, 8),
            "cache_savings_pct": round(100 * (1 - avg_cost / avg_nocache), 1) if avg_nocache else 0.0,
            "projections": projections(avg_cost)}
