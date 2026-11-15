"""Offline tests for the grading rules and safety defenses (no API calls, no tokens).

Run from the repo folder:  python -m pytest -q
"""
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend import config, data_store, orchestrator, safety  # noqa: E402
from backend.tools import Toolbox  # noqa: E402


def test_env_lookup_order_repo_first_then_parent(tmp_path):
    repo = tmp_path / "submissions" / "joy-risers"
    repo.mkdir(parents=True)
    labels = [(label, path) for label, path in config.env_candidates(repo)]
    assert labels[0] == ("./.env", repo / ".env")
    assert labels[1] == ("../.env", tmp_path / "submissions" / ".env")


def test_only_course_model():
    assert config.MODEL_NAME == "gpt-6-luna"
    assert config.PORTKEY_BASE_URL == "https://api.portkey.ai/v1"


def _run(**kw):
    events = []
    rec = orchestrator.run_copilot(kw.get("message", ""), f"pytest-{kw.get('redteam')}", "test", events.append,
                                   redteam=kw.get("redteam"))
    return rec, events


def test_prompt_injection_blocked_before_any_model_call():
    rec, _ = _run(redteam="injection")
    assert rec["blocked"] == "prompt_injection"
    assert rec["totals"]["model_calls"] == 0 and rec["totals"]["cost_usd"] == 0


def test_runaway_request_blocked_before_any_model_call():
    rec, _ = _run(redteam="runaway")
    assert rec["blocked"] == "runaway"
    assert rec["totals"]["model_calls"] == 0


def test_session_circuit_breaker():
    s = safety.SESSIONS.reset("pytest-budget")
    s.input_tokens = config.LIMITS["max_tokens_per_session"]
    rec = orchestrator.run_copilot("Fun things in Denver?", "pytest-budget", "test", lambda e: None)
    assert rec["blocked"] == "budget" and rec["totals"]["model_calls"] == 0


def test_medical_detector_flags_dosing_and_diagnosis():
    msg = orchestrator.RED_TEAM["medical"]["message"]
    assert safety.check_medical(msg)
    assert not safety.check_medical("Who should I ask about getting a stander for my son?")


def test_output_scrubber_removes_doses_secrets_and_exclusive_language():
    text = (f"Give him 5 mg of baclofen tonight. Moms and dads love this park. Marker {safety.CANARY}. "
            "He is wheelchair-bound.")
    clean, events = safety.scrub_output(text)
    assert "5 mg" not in clean and safety.CANARY not in clean
    assert "Moms and dads" not in clean and "wheelchair-bound" not in clean
    kinds = {e["type"] for e in events}
    assert {"clinical_dosage_removed", "secret_leak", "inclusive_language_fix"} <= kinds


def test_hallucinated_sources_are_dropped():
    run = orchestrator.Run("x", "pytest-verify", "test", lambda e: None, None)
    run.toolbox.search_activities(place="Denver")
    allowed = sorted(run.toolbox.cited)[0]
    final = {"headline": "h", "message_markdown": "ok", "draft_email": None, "action_checklist": [],
             "sources": [{"source_id": allowed, "label": "a"}, {"source_id": "made-up-foundation", "label": "b"}]}
    answer = orchestrator._verify(run, final, {})
    assert [s["source_id"] for s in answer["sources"]] == [allowed]
    assert any(e["type"] == "hallucinated_source_removed" for e in run.events)


def test_test_dataset_is_small_and_consistent():
    db = data_store.load("test")
    ids = {h["id"] for h in db["hotspots"]["hotspots"]}
    assert 0 < len(ids) <= 8
    assert all(a["hotspot_id"] in ids for a in db["activities"]["activities"])
    full = data_store.load("full")
    pol = {p["id"] for p in full["policies"]["policies"]}
    assert all(set(a["legal_basis"]) <= pol for a in full["accommodations"]["accommodations"])


def test_strict_tool_schemas_are_valid_json():
    from backend.tools import ADVOCATE_TOOLS, SCOUT_TOOLS
    for t in ADVOCATE_TOOLS + SCOUT_TOOLS:
        json.dumps(t)
        assert set(t["parameters"]["required"]) == set(t["parameters"]["properties"])


def test_site_guard_limits_per_visitor_and_per_day():
    g = safety.SiteGuard()
    for _ in range(config.LIMITS["max_runs_per_ip_per_hour"]):
        assert g.gate("1.2.3.4") == []
    assert g.gate("1.2.3.4")            # next one from the same visitor is refused
    assert g.gate("5.6.7.8") == []       # other visitors unaffected
    g.add_cost(config.LIMITS["max_usd_per_day_site"])
    assert g.gate("9.9.9.9")             # whole site paused after the daily ceiling


def test_translation_uses_cache_and_rejects_unknown_languages(monkeypatch):
    from backend import i18n
    monkeypatch.setitem(i18n._cache, "es", {"Free admission": "Entrada gratis"})
    out = i18n.translate("es", ["Free admission", "Not cached yet", "x" * (i18n.MAX_LEN + 1)], allow_ai=False)
    assert out["translations"] == {"Free admission": "Entrada gratis"}      # cache hit; others stay English
    assert out["ai_batches"] == 0 and out["cost_usd"] == 0
    try:
        i18n.translate("klingon", ["hi"], allow_ai=False)
        assert False, "unsupported language should raise"
    except ValueError:
        pass


def test_internal_source_ids_never_reach_caregivers():
    ids = data_store.load("full")["sources"].keys()
    out = orchestrator._strip_source_ids("Ask BORP (Sources: act-172, prog-031). Fuente: act-171. Lift-equipped bus [prog-003].", ids)
    assert "act-17" not in out and "prog-0" not in out and "Lift-equipped bus" in out
