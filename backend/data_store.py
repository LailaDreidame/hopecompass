"""Loads the bundled JSON datasets (no external database).

data/full/  - the rich nationwide dataset (default)
data/test/  - a small test dataset for quick local runs and grading
Switch with JOY_DATASET=test in .env, the dataset toggle in the UI header, or ?dataset=test.
"""

from __future__ import annotations

import json
from functools import lru_cache

from .config import DATA_DIR, DEFAULT_DATASET

FILES = ("hotspots", "activities", "providers", "equipment", "equipment_programs",
         "policies", "accommodations", "sanctuary", "profiles")

SCORE_KEYS = ("transit_curb_cuts", "inclusive_playgrounds", "medicaid_waiver",
              "pediatric_specialty", "inclusive_schools")


def normalize(dataset: str | None) -> str:
    d = (dataset or DEFAULT_DATASET).strip().lower()
    return d if d in ("full", "test") else DEFAULT_DATASET


@lru_cache(maxsize=4)
def load(dataset: str | None = None) -> dict:
    """All datasets for 'full' or 'test', plus a source index used by the hallucination guard."""
    d = normalize(dataset)
    folder = DATA_DIR / d
    out = {name: json.loads((folder / f"{name}.json").read_text(encoding="utf-8")) for name in FILES}
    for h in out["hotspots"]["hotspots"]:
        h["overall"] = round(sum(h["scores"][k] for k in SCORE_KEYS) / len(SCORE_KEYS))
    out["sources"] = build_source_index(out)
    out["dataset"] = d
    return out


def build_source_index(db: dict) -> dict[str, dict]:
    """Every record that an agent may cite, keyed by id -> {label, module}."""
    idx: dict[str, dict] = {}

    def add(items, module, label_fn):
        for it in items:
            idx[it["id"]] = {"label": label_fn(it), "module": module}

    add(db["hotspots"]["hotspots"], "map", lambda h: f"{h['city']}, {h['state']} city dossier")
    add(db["activities"]["activities"], "play", lambda a: f"{a['name']} ({a['city']}, {a['state']})")
    add(db["providers"]["providers"], "providers", lambda p: f"{p['name']}, {p['practice']} (sample listing)")
    add(db["equipment"]["equipment"], "equipment", lambda e: f"{e['name']} guide")
    add(db["equipment_programs"]["programs"], "equipment", lambda p: p["name"])
    add(db["policies"]["policies"], "iep", lambda p: f"{p['title']} ({p['citation']})")
    add(db["accommodations"]["accommodations"], "iep", lambda a: f"Accommodation: {a['label']}")
    add(db["sanctuary"]["respite_grants"], "sanctuary", lambda r: r["name"])
    add(db["sanctuary"]["support_groups"], "sanctuary", lambda g: g["name"])
    add(db["sanctuary"]["resets"], "sanctuary", lambda r: f"5-minute reset: {r['title']}")
    return idx
