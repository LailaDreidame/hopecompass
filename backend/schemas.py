"""Structured-output JSON schemas (strict mode) for the four agents."""

from __future__ import annotations

from .tools import ACCESS, AGE_BANDS, BUDGETS, SETTINGS

S = {"type": "string"}
B = {"type": "boolean"}
NS = {"type": ["string", "null"]}


def obj(props: dict) -> dict:
    return {"type": "object", "properties": props, "required": list(props), "additionalProperties": False}


def arr(items: dict) -> dict:
    return {"type": "array", "items": items}


INTENTS = ["iep_504", "equipment", "funding_grants", "activities_play", "relocation_city", "providers",
           "caregiver_wellbeing", "medical_question", "general", "off_topic"]

INTAKE_SCHEMA = obj({
    "intent": {"type": "string", "enum": INTENTS},
    "routes": arr({"type": "string", "enum": ["advocate", "scout"]}),
    "safety": obj({
        "prompt_injection": B, "medical_advice_request": B, "crisis": B, "off_topic": B,
        "runaway_request": B, "reason": S}),
    "profile": obj({
        "child_age": {"type": ["integer", "null"]},
        "age_band": {"type": ["string", "null"], "enum": AGE_BANDS + [None]},
        "access_needs": arr({"type": "string", "enum": ACCESS}),
        "place": NS, "state": NS,
        "budget": {"type": ["string", "null"], "enum": BUDGETS + [None]},
        "setting": {"type": ["string", "null"], "enum": SETTINGS + [None]},
        "caregiver_role": NS}),
    "task_for_specialists": S,
})

SOURCE_REF = obj({"source_id": S, "why": S})

ADVOCATE_SCHEMA = obj({
    "title": S, "summary": S,
    "sections": arr(obj({"heading": S, "body": S})),
    "draft_email": {"anyOf": [obj({"subject": S, "body": S}), {"type": "null"}]},
    "checklist": arr(S),
    "program_matches": arr(obj({"source_id": S, "name": S, "why": S})),
    "legal_citations": arr(obj({"source_id": S, "citation": S, "plain": S})),
    "source_ids": arr(S),
})

SCOUT_SCHEMA = obj({
    "title": S, "summary": S,
    "plan": arr(obj({"when": S, "activity": S, "source_id": S, "cost": S, "why_it_fits": S, "access_notes": S})),
    "city_comparison": arr(obj({"city": S, "source_id": S, "overall": {"type": "integer"}, "standout": S,
                                "watch_out": S})),
    "provider_matches": arr(obj({"name": S, "source_id": S, "why": S})),
    "support_matches": arr(obj({"name": S, "source_id": S, "why": S})),
    "know_before_you_go": arr(S),
    "source_ids": arr(S),
})

EDITOR_SCHEMA = obj({
    "headline": S,
    "message_markdown": S,
    "draft_email": {"anyOf": [obj({"subject": S, "body": S}), {"type": "null"}]},
    "action_checklist": arr(S),
    "sources": arr(obj({"source_id": S, "label": S})),
    "edits_made": arr(S),
    "clinical_content_removed": arr(S),
    "inclusive_language_fixes": arr(S),
    "self_check": obj({"all_sources_allowed": B, "contains_diagnosis_or_dose": B, "tone": S}),
})
