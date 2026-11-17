"""Pre-translate every displayed text in the bundled datasets into the 5 site languages.

Interface strings (buttons, headings) are added by crawling the site in each language
(the browser asks /api/translate, which caches them). Results land in data/translations/<lang>.json,
which ships in the repo so visitors get instant, free translations.

    python scripts/prewarm_translations.py            # all languages
    python scripts/prewarm_translations.py --count    # just count strings
"""
import json
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from backend import i18n  # noqa: E402
from backend.config import DATA_DIR  # noqa: E402

SKIP_KEYS = {"id", "hotspot_id", "source_id", "url", "website", "category", "cost_tier", "setting", "specialty",
             "type", "scope", "format", "access", "ages", "stages", "legal_basis", "topics", "audience", "states",
             "covers", "lat", "lon", "state", "emoji", "avatar", "scores", "aliases", "schedule", "real_org",
             "sample", "accepting_new", "telehealth", "version", "region", "cost_of_living", "city", "flag_words",
             "minutes", "child_age", "ages_served", "credentials", "law", "citation", "days", "start", "end"}


def strings_in(obj, out):
    if isinstance(obj, dict):
        for k, v in obj.items():
            if k not in SKIP_KEYS:
                strings_in(v, out)
    elif isinstance(obj, list):
        for v in obj:
            strings_in(v, out)
    elif isinstance(obj, str) and i18n.HAS_LETTERS.search(obj) and len(obj) <= i18n.MAX_LEN:
        out.add(obj.strip())


def collect() -> list[str]:
    out: set[str] = set()
    for folder in ("full", "test"):
        for f in sorted((DATA_DIR / folder).glob("*.json")):
            strings_in(json.loads(f.read_text(encoding="utf-8")), out)
    ui = DATA_DIR / "translations" / "_ui_strings.json"     # interface text gathered from every page
    if ui.exists():
        out |= {s for s in json.loads(ui.read_text(encoding="utf-8")) if len(s) <= i18n.MAX_LEN}
    return sorted(s for s in out if s)


def run(lang: str, strings: list[str], workers: int = 8) -> tuple[int, float]:
    cache = i18n.load(lang)
    todo = [s for s in strings if s not in cache]
    chunks = [todo[i:i + i18n.BATCH] for i in range(0, len(todo), i18n.BATCH)]
    cost = 0.0
    with ThreadPoolExecutor(max_workers=workers) as pool:
        futs = {pool.submit(i18n._translate_with_model, lang, c): c for c in chunks}
        for f in as_completed(futs):
            c = futs[f]
            try:
                out, c_cost = f.result()
            except Exception as e:  # retry once in smaller pieces
                print(f"  {lang}: retrying a batch ({type(e).__name__})")
                out, c_cost = [], 0.0
                for half in (c[: len(c) // 2], c[len(c) // 2:]):
                    try:
                        o, cc = i18n._translate_with_model(lang, half)
                        out += o; c_cost += cc
                    except Exception:
                        out += [''] * len(half)   # not cached, so it stays English and is retried next run
                c = c[: len(out)]
            cost += c_cost
            for src, tgt in zip(c, out):
                if tgt.strip():
                    cache[src] = tgt
    i18n._save(lang)
    return len(todo), cost


if __name__ == "__main__":
    strings = collect()
    print(f"{len(strings)} distinct data strings, {sum(len(s) for s in strings):,} characters")
    if "--count" in sys.argv:
        sys.exit()
    langs = [a for a in sys.argv[1:] if a in i18n.LANGS] or list(i18n.LANGS)
    total = 0.0
    for lang in langs:
        n, cost = run(lang, strings)
        total += cost
        print(f"{lang}: translated {n} new strings · ${cost:.4f} · cache now {len(i18n.load(lang))}")
    print(f"TOTAL ${total:.4f}")
