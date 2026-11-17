"""Offline mode: when no API key is found Hope still answers from local data.

Same guardrails, same tools, but a keyword router and a template replace the four model calls
(telemetry shows 0 tokens and provider=offline). Useful for grading without keys or network.
"""

from __future__ import annotations

import re

from .tools import AGE_BANDS

KEYWORDS = {
    "advocate": r"\b(iep|ifsp|504|school|teacher|accommodat\w*|evacuat\w*|pe\b|field trip|transition|equipment|"
                r"new (wheelchair|chair|walker|cane)|stander|ramp|bath chair|lmn|letter of medical|grant|medicaid|"
                r"insurance|denied|appeal|respite)\b",
    "scout": r"\b(weekend|fun|play|park|museum|trail|splash|sport|things to do|activit\w*|city|cities|move|"
             r"relocat\w*|best place|doctor|pediatrician|therap\w*|provider|support group|friends)\b",
}
EQUIP = {"power": "power-wheelchair", "wheelchair": "custom-manual-wheelchair", "stander": "stander",
         "ramp": "home-ramp", "van": "vehicle-ramp-lift", "walker": "walker-gait-trainer", "cane": "cane",
         "bath": "bath-shower-chair"}


def _age_band(text: str) -> str | None:
    m = re.search(r"\b(\d{1,2})\s*(-|\s)?(year|yr|yo)", text, re.I)
    if not m:
        return None
    age = int(m.group(1))
    return next((b for b in AGE_BANDS if int(b.split("-")[0]) <= age <= int(b.split("-")[1])), None)


def offline_answer(run, medical: bool) -> dict:
    msg = run.message
    tb = run.toolbox
    run.step("intake", "done", summary="Offline keyword router (no API key found)")
    place = next((f"{h['city']}, {h['state']}" for h in tb.db["hotspots"]["hotspots"]
                  if h["city"].lower() in msg.lower()), None)
    lines, cards, sources = [], {}, []

    if medical:
        found = tb.search_providers(place=place, specialty="physiatrist", limit=3)["matches"]
        cards["provider_matches"] = [{"name": p["name"], "source_id": p["source_id"], "why": p["practice"]}
                                     for p in found]
        lines = ["I can't advise on diagnoses or medication doses — that belongs with your child's care team, "
                 "who know their full history. For anything urgent, call your child's doctor; in an emergency, call 911.",
                 "### Questions to bring to the appointment",
                 *[f"- {q}" for q in tb.db["providers"]["green_flag_questions"][0]["questions"][:3]]]
        headline = "Let's get this question to the right expert"
    else:
        routes = [k for k, rx in KEYWORDS.items() if re.search(rx, msg, re.I)] or ["scout"]
        if "advocate" in routes:
            run.step("advocate", "done", summary="Offline tools")
            pol = tb.lookup_policy(topics=["iep", "504", "equipment"], limit=3)["policies"]
            eq = next((v for k, v in EQUIP.items() if k in msg.lower()), None)
            progs = tb.find_equipment_funding(equipment_id=eq, state=place, limit=3)["programs"]
            cards["legal_citations"] = [{"source_id": p["source_id"], "citation": p["citation"],
                                         "plain": p["plain_language"]} for p in pol]
            cards["program_matches"] = [{"source_id": p["source_id"], "name": p["name"], "why": p["what_they_offer"]}
                                        for p in progs]
            lines += ["### Your rights, in plain language", *[f"- **{p['title']}** ({p['citation']}): "
                                                              f"{p['plain_language']}" for p in pol]]
        if "scout" in routes:
            run.step("scout", "done", summary="Offline tools")
            acts = tb.search_activities(place=place, age_band=_age_band(msg), max_budget="under25",
                                        limit=4)["matches"]
            cards["plan"] = [{"when": a["best_time"], "activity": a["name"], "source_id": a["source_id"],
                              "cost": a["price_note"], "why_it_fits": a["description"],
                              "access_notes": "; ".join(a["accessibility_notes"][:2])} for a in acts]
            lines += ["### Joyful, low-cost ideas", *[f"- **{a['name']}** ({a['city']}) — {a['price_note']}"
                                                       for a in acts]]
        headline = "Here's a head start from our local guides"
    for sid in sorted(tb.cited):
        meta = tb.db["sources"].get(sid)
        if meta:
            sources.append({"source_id": sid, **meta})
    run.step("editor", "done", summary="Offline template (add a key for the full 4-agent run)")
    answer = {"headline": headline, "message_markdown": "\n".join(lines) +
              "\n\n*Offline mode: add PORTKEY_API_KEY or OPENAI_API_KEY for the full multi-agent Ask Hope.*",
              "draft_email": None,
              "action_checklist": ["Save one idea above to try this week", "Call ahead to confirm details",
                                   "Take five minutes for yourself today"],
              "sources": sources, "cards": cards, "mode": "safe_redirect" if medical else "offline"}
    return run.finish(answer)
