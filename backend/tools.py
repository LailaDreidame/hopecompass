"""Local lookup tools the specialist agents can call (tool calling).

Every tool reads only the bundled JSON data and returns records with a `source_id`. The Toolbox
remembers every source_id it handed out during a run; the Empathy & Verification Editor may
only cite those ids (hallucination guardrail, enforced in code in orchestrator.py).
"""

from __future__ import annotations

import json
from typing import Any, Callable

from . import data_store

AGE_BANDS = ["0-5", "6-12", "13-17", "18-21"]
ACCESS = ["wheelchair", "cane", "walker", "vision", "hearing"]
BUDGETS = ["free", "under25", "under50", "under100", "over100"]
SETTINGS = ["indoor", "outdoor", "hybrid"]
SPECIALTIES = ["pediatrician", "physiatrist", "physical_therapist", "occupational_therapist", "orthotist"]
STAGES = ["ifsp", "iep", "504", "transition"]
POLICY_TOPICS = ["iep", "ifsp", "504", "transition", "equipment", "assistive_tech", "pe", "transportation",
                 "field_trips", "evacuation", "medicaid", "caregiver_rights", "school_access", "funding"]
ACC_CATEGORIES = ["adaptive_pe", "field_trip_transport", "evacuation", "passing_time", "assistive_tech",
                  "seating_positioning", "personal_care", "transportation", "recess_playground", "testing",
                  "vision", "hearing", "transition", "early_intervention"]
EQUIPMENT_IDS = ["custom-manual-wheelchair", "power-wheelchair", "cane", "walker-gait-trainer", "stander",
                 "home-ramp", "vehicle-ramp-lift", "bath-shower-chair", "adaptive-bike"]
AUDIENCES = ["all", "grandparents", "foster_resource", "kinship", "bipoc", "male_caregivers", "spanish_speaking",
             "lgbtq", "siblings", "young_adult_transition"]


def budget_ok(tier: str, cap: str | None) -> bool:
    """Budget filter: 'under50' means anything up to $50 (free included); 'over100' means splurges only."""
    if not cap:
        return True
    if cap == "over100":
        return tier == "over100"
    return BUDGETS.index(tier) <= BUDGETS.index(cap)


def _nullable(schema: dict) -> dict:
    t = schema.get("type")
    return {**schema, "type": [t, "null"]} if isinstance(t, str) else schema


def _enum_list(values: list[str]) -> dict:
    return {"type": ["array", "null"], "items": {"type": "string", "enum": values}}


def _fn(name: str, description: str, props: dict) -> dict:
    """OpenAI Responses-API function tool in strict mode (all fields required; optional ones nullable)."""
    return {"type": "function", "name": name, "description": description, "strict": True,
            "parameters": {"type": "object", "properties": props, "required": list(props),
                           "additionalProperties": False}}


class Toolbox:
    def __init__(self, dataset: str | None = None):
        self.db = data_store.load(dataset)
        self.cited: set[str] = set()          # every source_id returned to any agent this run

    # ------------------------------------------------------------------ helpers
    def _remember(self, records: list[dict]) -> list[dict]:
        for r in records:
            self.cited.add(r["source_id"])
        return records

    def _find_hotspot(self, place: str | None) -> dict | None:
        if not place:
            return None
        p = place.strip().lower()
        for h in self.db["hotspots"]["hotspots"]:
            if p in (h["id"], h["city"].lower(), f"{h['city']}, {h['state']}".lower(),
                     f"{h['city']} {h['state']}".lower()):
                return h
        for h in self.db["hotspots"]["hotspots"]:
            if h["city"].lower() in p or p in h["city"].lower():
                return h
        return None

    def _state_of(self, place: str | None) -> str | None:
        if not place:
            return None
        if len(place.strip()) == 2:
            return place.strip().upper()
        h = self._find_hotspot(place)
        return h["state"] if h else None

    # ------------------------------------------------------------------ Scout tools
    def _activity_rows(self, h, state, access, age_band, max_budget, setting) -> list[dict]:
        rows = []
        for a in self.db["activities"]["activities"]:
            if h and a["hotspot_id"] != h["id"]:
                continue
            if not h and state and a["state"] != state:
                continue
            if access and not set(access) & set(a["access"]):
                continue
            if age_band and age_band not in a["ages"]:
                continue
            if not budget_ok(a["cost_tier"], max_budget):
                continue
            if setting and a["setting"] != setting and a["setting"] != "hybrid":
                continue
            rows.append({"source_id": a["id"], "name": a["name"], "city": a["city"], "state": a["state"],
                         "category": a["category"], "cost_tier": a["cost_tier"], "price_note": a["price_note"],
                         "setting": a["setting"], "access": a["access"], "ages": a["ages"],
                         "description": a["description"], "accessibility_notes": a["accessibility_notes"],
                         "best_time": a["best_time"], "caregiver_tip": a.get("caregiver_tip", ""),
                         "venue": a.get("venue", ""), "neighborhood": a.get("neighborhood", ""),
                         "schedule": a.get("schedule"), "how_to_join": a.get("how_to_join", ""),
                         "website": a.get("website", "")})
        rows.sort(key=lambda r: BUDGETS.index(r["cost_tier"]))
        return rows

    def search_activities(self, place: str | None = None, access: list[str] | None = None,
                          age_band: str | None = None, max_budget: str | None = None,
                          setting: str | None = None, limit: int | None = 8) -> dict:
        """Exact matches first. If fewer than 3, widen step by step (never dropping the child's access
        needs): budget one tier up at a time → any age → indoor/outdoor → whole state. Each widened
        match says how it stretches the request, so the agents can be honest about it."""
        h = self._find_hotspot(place)
        state = self._state_of(place)
        limit = max(1, min(limit or 8, 12))
        rows = self._activity_rows(h, state, access, age_band, max_budget, setting)
        widened: list[str] = []
        steps = []
        if max_budget and max_budget != "over100":
            for tier in BUDGETS[BUDGETS.index(max_budget) + 1:]:
                steps.append((f"stretches the budget ({tier.replace('under', 'under $')})",
                              dict(h=h, state=state, access=access, age_band=age_band, max_budget=tier, setting=setting)))
        if age_band:
            steps.append(("open to all ages (check fit)", dict(h=h, state=state, access=access, age_band=None,
                                                              max_budget=None, setting=setting)))
        if setting:
            steps.append(("different setting (indoor/outdoor)", dict(h=h, state=state, access=access, age_band=None,
                                                                   max_budget=None, setting=None)))
        if h:
            steps.append((f"elsewhere in {h['state']}", dict(h=None, state=h["state"], access=access, age_band=age_band,
                                                             max_budget=None, setting=None)))
        seen = {r["source_id"] for r in rows}
        for why, kw in steps:
            if len(rows) >= 3:
                break
            extra = [r for r in self._activity_rows(**kw) if r["source_id"] not in seen]
            for r in extra:
                r["stretch"] = why
                seen.add(r["source_id"])
            if extra:
                widened.append(why)
                rows += extra
        rows = rows[:limit]
        return {"matches": self._remember(rows), "count": len(rows),
                "exact_matches": sum(1 for r in rows if "stretch" not in r),
                "widened": widened,
                "note": "Sample listings; hours and prices are illustrative — confirm before going. "
                        "Matches with a 'stretch' field go beyond the exact request; say so plainly."}

    def get_city_dossier(self, place: str) -> dict:
        h = self._find_hotspot(place)
        if not h:
            known = [f"{x['city']}, {x['state']}" for x in self.db["hotspots"]["hotspots"]]
            return {"error": f"No dossier for '{place}'.", "available_cities": known}
        rec = {"source_id": h["id"], **{k: h[k] for k in (
            "city", "state", "region", "scores", "overall", "tagline", "highlights", "pediatric_hospitals",
            "inclusive_playgrounds", "transit_notes", "waiver_notes", "school_notes", "insider_tips",
            "watch_outs", "cost_of_living")}}
        return {"dossier": self._remember([rec])[0], "note": "Illustrative scores; verify locally."}

    def rank_cities(self, priorities: list[str] | None = None, region: str | None = None,
                    cost_of_living: str | None = None, limit: int | None = 5) -> dict:
        keys = priorities or list(data_store.SCORE_KEYS)
        rows = []
        for h in self.db["hotspots"]["hotspots"]:
            if region and region.lower() not in h["region"].lower():
                continue
            if cost_of_living and h["cost_of_living"] != cost_of_living:
                continue
            score = round(sum(h["scores"][k] for k in keys) / len(keys))
            rows.append({"source_id": h["id"], "city": h["city"], "state": h["state"],
                         "priority_score": score, "overall": h["overall"], "scores": h["scores"],
                         "tagline": h["tagline"], "watch_outs": h["watch_outs"],
                         "cost_of_living": h["cost_of_living"]})
        rows.sort(key=lambda r: -r["priority_score"])
        return {"ranked": self._remember(rows[: max(1, min(limit or 5, 10))]), "ranked_by": keys}

    def search_providers(self, place: str | None = None, specialty: str | None = None,
                         insurance: str | None = None, language: str | None = None,
                         limit: int | None = 5) -> dict:
        h = self._find_hotspot(place)
        state = self._state_of(place)
        rows = []
        for p in self.db["providers"]["providers"]:
            if h and p["hotspot_id"] != h["id"] and p["state"] != h["state"]:
                continue
            if not h and state and p["state"] != state:
                continue
            if specialty and p["specialty"] != specialty:
                continue
            if insurance and not any(insurance.lower() in i.lower() for i in p["insurance"]):
                continue
            if language and not any(language.lower() in lang.lower() for lang in p["languages"]):
                continue
            rows.append({"source_id": p["id"], "name": p["name"], "credentials": p["credentials"],
                         "specialty": p["specialty"], "practice": p["practice"], "city": p["city"],
                         "state": p["state"], "insurance": p["insurance"], "languages": p["languages"],
                         "telehealth": p["telehealth"], "accepting_new": p["accepting_new"],
                         "green_flags": p["green_flags"]})
        rows.sort(key=lambda r: (not r["accepting_new"]))
        return {"matches": self._remember(rows[: max(1, min(limit or 5, 8))]),
                "note": "Fictional sample listings in this demo; always confirm network status with your plan."}

    # ------------------------------------------------------------------ Advocate tools
    def lookup_policy(self, topics: list[str] | None = None, stage: str | None = None,
                      limit: int | None = 6) -> dict:
        rows = []
        for p in self.db["policies"]["policies"]:
            if topics and not set(topics) & set(p.get("topics", [])):
                continue
            rows.append({"source_id": p["id"], "title": p["title"], "law": p["law"], "citation": p["citation"],
                         "ages": p["ages"], "plain_language": p["plain_language"],
                         "use_it_when": p["use_it_when"], "sample_language": p["sample_language"]})
        if stage:
            pref = {"ifsp": "Part C", "504": "504", "transition": "transition"}.get(stage)
            if pref:
                rows.sort(key=lambda r: pref.lower() not in (r["law"] + r["title"]).lower())
        return {"policies": self._remember(rows[: max(1, min(limit or 6, 10))]),
                "note": "General information, not legal advice."}

    def find_accommodations(self, categories: list[str] | None = None, stage: str | None = None,
                            limit: int | None = 8) -> dict:
        rows = []
        for a in self.db["accommodations"]["accommodations"]:
            if categories and a["category"] not in categories:
                continue
            if stage and stage not in a["stages"]:
                continue
            rows.append({"source_id": a["id"], "category": a["category"], "label": a["label"],
                         "language": a["language"], "legal_basis": a["legal_basis"],
                         "data_to_bring": a["data_to_bring"]})
        checklist = self.db["accommodations"]["checklists"].get(stage or "iep", [])
        return {"accommodations": self._remember(rows[: max(1, min(limit or 8, 12))]),
                "pre_meeting_checklist": checklist}

    def find_equipment_funding(self, equipment_id: str | None = None, state: str | None = None,
                               limit: int | None = 6) -> dict:
        eq = next((e for e in self.db["equipment"]["equipment"] if e["id"] == equipment_id), None)
        cover_map = {"custom-manual-wheelchair": "manual_wheelchair", "power-wheelchair": "power_wheelchair",
                     "cane": "cane", "walker-gait-trainer": "walker", "stander": "stander",
                     "home-ramp": "home_ramp", "vehicle-ramp-lift": "vehicle", "bath-shower-chair": "bath",
                     "adaptive-bike": "adaptive_bike"}
        cover = cover_map.get(equipment_id or "")
        st = self._state_of(state) if state else None
        progs = []
        for p in self.db["equipment_programs"]["programs"]:
            if cover and not ({cover, "any"} & set(p["covers"])):
                continue
            if st and "ALL" not in p["states"] and st not in p["states"]:
                continue
            progs.append({"source_id": p["id"], "name": p["name"], "type": p["type"], "scope": p["scope"],
                          "what_they_offer": p["what_they_offer"], "how_to_apply": p["how_to_apply"],
                          "url": p.get("url", ""), "real_org": p.get("real_org", False)})
        # Best matches first: built for this exact item, real organizations, then local before national.
        exact = {p["id"]: bool(cover and cover in p["covers"]) for p in self.db["equipment_programs"]["programs"]}
        progs.sort(key=lambda r: (not exact.get(r["source_id"]), not r["real_org"], r["scope"] == "national"))
        out: dict[str, Any] = {"programs": self._remember(progs[: max(1, min(limit or 6, 10))])}
        if eq:
            out["equipment_guide"] = self._remember([{
                "source_id": eq["id"], "name": eq["name"], "who_prescribes": eq["who_prescribes"],
                "typical_steps": eq["typical_steps"], "lmn_must_include": eq["lmn_must_include"],
                "funding_paths": eq["funding_paths"], "typical_timeline": eq["typical_timeline"]}])[0]
        return out

    def find_caregiver_support(self, audience: list[str] | None = None, state: str | None = None,
                               limit: int | None = 5) -> dict:
        st = self._state_of(state) if state else None
        s = self.db["sanctuary"]
        groups = [g for g in s["support_groups"]
                  if (not audience or set(audience) & set(g["audience"]) or "all" in g["audience"])
                  and (not st or g["format"] == "virtual" or g.get("state") in (st, "", None))]
        groups.sort(key=lambda g: not (audience and set(audience) & set(g["audience"])))
        respite = [r for r in s["respite_grants"] if not st or "ALL" in r["states"] or st in r["states"]]
        g_rows = [{"source_id": g["id"], "name": g["name"], "audience": g["audience"], "format": g["format"],
                   "schedule": g["schedule"], "description": g["description"], "url": g.get("url", "")}
                  for g in groups[: max(1, min(limit or 5, 8))]]
        r_rows = [{"source_id": r["id"], "name": r["name"], "what_they_offer": r["what_they_offer"],
                   "eligibility": r["eligibility"], "how_to_apply": r["how_to_apply"], "url": r.get("url", "")}
                  for r in respite[:4]]
        reset = s["resets"][0]
        return {"support_groups": self._remember(g_rows), "respite": self._remember(r_rows),
                "quick_reset": self._remember([{"source_id": reset["id"], "title": reset["title"],
                                                "steps": reset["steps"]}])[0]}

    # ------------------------------------------------------------------ dispatch
    def call(self, name: str, args_json: str) -> str:
        fn: Callable[..., dict] | None = getattr(self, name, None) if name in TOOL_NAMES else None
        if fn is None:
            return json.dumps({"error": f"Unknown tool {name}"})
        try:
            args = json.loads(args_json or "{}")
            return json.dumps(fn(**{k: v for k, v in args.items() if v is not None}), ensure_ascii=False)
        except Exception as e:  # a bad argument should not crash the run
            return json.dumps({"error": f"{type(e).__name__}: {e}"})


# --------------------------------------------------------------------------- schemas
STR = {"type": "string"}
INT = {"type": "integer"}

SCOUT_TOOLS = [
    _fn("search_activities", "Find accessible, joyful things to do from the Joy & Play directory.", {
        "place": _nullable({**STR, "description": "City name, 'City, ST', or 2-letter state"}),
        "access": _enum_list(ACCESS),
        "age_band": {"type": ["string", "null"], "enum": AGE_BANDS + [None]},
        "max_budget": {"type": ["string", "null"], "enum": BUDGETS + [None],
                       "description": "Budget cap; 'over100' returns splurges only"},
        "setting": {"type": ["string", "null"], "enum": SETTINGS + [None]},
        "limit": _nullable(INT)}),
    _fn("get_city_dossier", "Full Best-Places-to-Thrive dossier for one city (scores, insider tips, watch-outs).", {
        "place": {**STR, "description": "City name or 'City, ST'"}}),
    _fn("rank_cities", "Rank cities by the inclusion scores a family cares about most (for relocation comparisons).", {
        "priorities": {"type": ["array", "null"], "items": {"type": "string", "enum": list(data_store.SCORE_KEYS)}},
        "region": _nullable(STR),
        "cost_of_living": {"type": ["string", "null"], "enum": ["low", "moderate", "high", None]},
        "limit": _nullable(INT)}),
    _fn("search_providers", "Find affirming, disability-competent pediatric providers.", {
        "place": _nullable(STR),
        "specialty": {"type": ["string", "null"], "enum": SPECIALTIES + [None]},
        "insurance": _nullable({**STR, "description": "e.g. Medicaid, CHIP, TRICARE, Aetna"}),
        "language": _nullable(STR),
        "limit": _nullable(INT)}),
    _fn("find_caregiver_support", "Support groups, respite grants and a 5-minute reset for the caregiver.", {
        "audience": _enum_list(AUDIENCES), "state": _nullable(STR), "limit": _nullable(INT)}),
]

ADVOCATE_TOOLS = [
    _fn("lookup_policy", "Look up the federal rights (IDEA, Section 504, ADA, Medicaid EPSDT, ABLE) in our policy library.", {
        "topics": _enum_list(POLICY_TOPICS),
        "stage": {"type": ["string", "null"], "enum": STAGES + [None]},
        "limit": _nullable(INT)}),
    _fn("find_accommodations", "Get legally grounded accommodation language and the pre-meeting checklist.", {
        "categories": _enum_list(ACC_CATEGORIES),
        "stage": {"type": ["string", "null"], "enum": STAGES + [None]},
        "limit": _nullable(INT)}),
    _fn("find_equipment_funding", "Equipment guide (who prescribes, Letter of Medical Necessity must-haves) plus loan closets, grants and swaps.", {
        "equipment_id": {"type": ["string", "null"], "enum": EQUIPMENT_IDS + [None]},
        "state": _nullable({**STR, "description": "2-letter state or city"}),
        "limit": _nullable(INT)}),
    _fn("find_caregiver_support", "Respite grants, support groups and a 5-minute reset for the caregiver.", {
        "audience": _enum_list(AUDIENCES), "state": _nullable(STR), "limit": _nullable(INT)}),
]

TOOL_NAMES = {t["name"] for t in SCOUT_TOOLS + ADVOCATE_TOOLS}
