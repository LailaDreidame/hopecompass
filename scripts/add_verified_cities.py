"""Merge researched, fact-checked city data (scripts/verified/<hotspot-id>.json) into data/full.

Each verified file holds {"hotspot", "activities", "programs", "respite_grants", "support_groups"};
every record carries "verified_sources" (the URLs used to confirm it). For each city this script:
  - replaces the city's hotspot dossier,
  - removes ALL of the city's sample activities and adds the verified ones,
  - adds/replaces the verified programs, respite options and support groups (by id),
and marks every activity from a verified city (including Oakland and New Haven) with "verified": true
so the app can label it "Verified listing". Safe to re-run.

    python scripts/add_verified_cities.py
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FULL = ROOT / "data" / "full"
VERIFIED = Path(__file__).resolve().parent / "verified"
ALREADY_VERIFIED = {"oakland-ca", "new-haven-ct"}     # added earlier by add_oakland.py / add_new_haven.py


def load(name):
    return json.loads((FULL / f"{name}.json").read_text(encoding="utf-8"))


def save(name, obj):
    (FULL / f"{name}.json").write_text(json.dumps(obj, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def upsert(rows, new):
    ids = {r["id"] for r in new}
    return [r for r in rows if r["id"] not in ids] + new


h, a, p, s = load("hotspots"), load("activities"), load("equipment_programs"), load("sanctuary")
cities = []
for f in sorted(VERIFIED.glob("*.json")):
    v = json.loads(f.read_text(encoding="utf-8"))
    hid = v["hotspot"]["id"]
    cities.append(hid)
    h["hotspots"] = [x for x in h["hotspots"] if x["id"] != hid] + [v["hotspot"]]
    acts = []
    for x in v["activities"]:
        x = {**x, "hotspot_id": hid, "verified": True}
        x.setdefault("schedule", None)
        acts.append(x)
    a["activities"] = [x for x in a["activities"] if x["hotspot_id"] != hid] + acts
    p["programs"] = upsert(p["programs"], v.get("programs", []))
    s["respite_grants"] = upsert(s["respite_grants"], v.get("respite_grants", []))
    s["support_groups"] = upsert(s["support_groups"], v.get("support_groups", []))
    print(f"{hid}: {len(acts)} verified activities, {len(v.get('programs', []))} programs, "
          f"{len(v.get('respite_grants', []))} respite, {len(v.get('support_groups', []))} groups")

for x in a["activities"]:                      # label earlier verified cities too
    if x["hotspot_id"] in ALREADY_VERIFIED:
        x["verified"] = True
save("hotspots", h); save("activities", a); save("equipment_programs", p); save("sanctuary", s)
print("verified cities:", sorted(set(cities) | ALREADY_VERIFIED),
      "| verified activities:", sum(1 for x in a["activities"] if x.get("verified")), "of", len(a["activities"]))
