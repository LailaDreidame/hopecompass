"""Run Ask Hope from the terminal (handy for testing and for collecting telemetry).

    python scripts/run_copilot.py "Free wheelchair-friendly weekend ideas in Denver for my 7-year-old"
    python scripts/run_copilot.py --redteam injection      # or medical / runaway / stealth
"""
import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from backend.orchestrator import run_copilot  # noqa: E402


def show(ev):
    if ev["type"] == "step":
        s = ev["step"]
        print(f"  [{s['status']:>7}] {s['label']}: {s.get('summary', '')}")
    elif ev["type"] == "tool":
        t = ev["tool"]
        print(f"      tool {t['tool']}({json.dumps(t['arguments'])[:90]}) -> {t['result_count']} records")
    elif ev["type"] == "safety":
        e = ev["event"]
        print(f"      SAFETY [{e['layer']}] {e['type']}: {e['detail'][:100]} -> {e['action']}")


ap = argparse.ArgumentParser()
ap.add_argument("message", nargs="?", default="")
ap.add_argument("--redteam", choices=["injection", "medical", "runaway", "stealth"])
ap.add_argument("--dataset", default=None)
a = ap.parse_args()
rec = run_copilot(a.message, "cli", a.dataset, show, redteam=a.redteam)
ans, t = rec["answer"], rec["totals"]
print("\n" + ans["headline"] + "\n" + ans["message_markdown"])
if ans.get("draft_email"):
    print("\n--- draft email ---\n" + ans["draft_email"]["subject"] + "\n" + ans["draft_email"]["body"])
print("\nsources:", [s["source_id"] for s in ans.get("sources", [])])
print(f"\ntokens in={t['input_tokens']} cached={t['cached_tokens']} out={t['output_tokens']} "
      f"calls={t['model_calls']} cost=${t['cost_usd']:.6f} latency={rec['latency_ms']}ms blocked={rec['blocked']}")
