"""Build the small test dataset (data/test/) from the full dataset (data/full/).

Keeps 6 cities and only the records tied to them, so the app loads instantly and the
graders can run everything locally.  Run from the repo folder:  python scripts/make_test_data.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FULL, TEST = ROOT / "data" / "full", ROOT / "data" / "test"
CITIES = ["denver-co", "austin-tx", "atlanta-ga", "philadelphia-pa", "seattle-wa", "chicago-il"]
STATES = {"CO", "TX", "GA", "PA", "WA", "IL"}


def load(name):
    return json.loads((FULL / f"{name}.json").read_text(encoding="utf-8"))


def save(name, obj):
    (TEST / f"{name}.json").write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


TEST.mkdir(exist_ok=True)
h = load("hotspots"); h["hotspots"] = [x for x in h["hotspots"] if x["id"] in CITIES]; save("hotspots", h)
a = load("activities"); a["activities"] = [x for x in a["activities"] if x["hotspot_id"] in CITIES]; save("activities", a)
p = load("providers"); p["providers"] = [x for x in p["providers"] if x["hotspot_id"] in CITIES]; save("providers", p)
e = load("equipment"); save("equipment", e)
g = load("equipment_programs")
g["programs"] = [x for x in g["programs"] if "ALL" in x["states"] or set(x["states"]) & STATES][:16]; save("equipment_programs", g)
pol = load("policies"); save("policies", pol)
acc = load("accommodations"); save("accommodations", acc)
s = load("sanctuary")
s["respite_grants"] = [x for x in s["respite_grants"] if "ALL" in x["states"] or set(x["states"]) & STATES][:8]
s["support_groups"] = [x for x in s["support_groups"] if x["format"] == "virtual" or x.get("state") in STATES][:10]
s["resets"] = s["resets"][:4]
save("sanctuary", s)
pr = load("profiles"); save("profiles", pr)
print({"hotspots": len(h["hotspots"]), "activities": len(a["activities"]), "providers": len(p["providers"]),
       "programs": len(g["programs"]), "respite": len(s["respite_grants"]), "groups": len(s["support_groups"])})
