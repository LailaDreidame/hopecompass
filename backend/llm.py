"""One wrapper for every model call: structured JSON output, tool calling, prompt caching, telemetry.

Uses the OpenAI Responses API (gpt-6-luna needs /v1/responses for function tools + reasoning),
either through Portkey (PORTKEY_API_KEY) or directly (OPENAI_API_KEY).
"""

from __future__ import annotations

import json
import time
from typing import Callable

from openai import OpenAI

from .config import (LIMITS, MODEL_NAME, OPENAI_API_KEY, PORTKEY_API_KEY, PORTKEY_BASE_URL, PROVIDER)
from .safety import RunBudget
from .telemetry import call_cost

_client: OpenAI | None = None


def client() -> OpenAI:
    global _client
    if _client is None:
        if PROVIDER == "portkey":
            # Portkey's response cache would replay an old answer for an identical request; force a
            # real model call so the telemetry shows true token counts.
            _client = OpenAI(api_key=PORTKEY_API_KEY, base_url=PORTKEY_BASE_URL, timeout=90, max_retries=1,
                             default_headers={"x-portkey-api-key": PORTKEY_API_KEY,
                                              "x-portkey-cache-force-refresh": "true"})
        elif PROVIDER == "openai":
            _client = OpenAI(api_key=OPENAI_API_KEY, timeout=90, max_retries=1)
        else:
            raise RuntimeError("No PORTKEY_API_KEY or OPENAI_API_KEY found (offline mode).")
    return _client


def _usage_record(resp, latency_ms: int, agent: str, round_no: int) -> dict:
    u = resp.usage
    itd = getattr(u, "input_tokens_details", None)
    otd = getattr(u, "output_tokens_details", None)
    cached = getattr(itd, "cached_tokens", 0) or 0
    write = getattr(itd, "cache_write_tokens", 0) or 0
    reasoning = getattr(otd, "reasoning_tokens", 0) or 0
    return {"agent": agent, "round": round_no, "model_reported": getattr(resp, "model", MODEL_NAME),
            "input_tokens": u.input_tokens, "cached_tokens": cached, "cache_write_tokens": write,
            "output_tokens": u.output_tokens, "reasoning_tokens": reasoning, "latency_ms": latency_ms,
            "cost_usd": call_cost(u.input_tokens, cached, write, u.output_tokens)}


def run_agent(*, agent: str, instructions: str, user_input: str, schema: dict, schema_name: str,
              budget: RunBudget, tools: list[dict] | None = None,
              tool_impl: Callable[[str, str], str] | None = None,
              on_tool: Callable[[dict], None] | None = None) -> tuple[dict, list[dict], list[dict]]:
    """Run one agent to a structured JSON answer, executing local tool calls along the way.

    Prompt caching: `instructions` is the agent's long static prompt (shared brand + safety prefix
    first, then its role); the dynamic request goes last in `user_input`. A per-agent
    prompt_cache_key routes calls to the same cache, so repeat runs read the prefix at the cached price.
    Returns (parsed_output, model_call_records, tool_call_records).
    """
    items: list = [{"role": "user", "content": user_input}]
    calls: list[dict] = []
    tool_log: list[dict] = []
    max_rounds = LIMITS["max_tool_rounds_per_agent"] if tools else 0

    for round_no in range(max_rounds + 1):
        budget.before_call(agent)                    # circuit breaker: may raise
        last_round = round_no == max_rounds
        kwargs = dict(model=MODEL_NAME, instructions=instructions, input=items,
                      text={"format": {"type": "json_schema", "name": schema_name, "schema": schema, "strict": True}},
                      max_output_tokens=LIMITS["max_output_tokens_per_call"], reasoning={"effort": "low"},
                      prompt_cache_key=f"joy-risers-{agent}", store=False, include=["reasoning.encrypted_content"])
        if tools:
            kwargs["tools"] = tools
            kwargs["tool_choice"] = "none" if last_round else "auto"   # last round: must answer
            kwargs["parallel_tool_calls"] = True
        t0 = time.perf_counter()
        resp = client().responses.create(**kwargs)
        rec = _usage_record(resp, round((time.perf_counter() - t0) * 1000), agent, round_no + 1)
        calls.append(rec)
        budget.add(rec["input_tokens"] + rec["output_tokens"])

        fn_calls = [o for o in resp.output if o.type == "function_call"]
        if fn_calls and tool_impl and not last_round:
            items += [o.model_dump(exclude_none=True) for o in resp.output]
            for fc in fn_calls:
                t1 = time.perf_counter()
                result = tool_impl(fc.name, fc.arguments)
                parsed = json.loads(result)
                ids = sorted({r["source_id"] for v in parsed.values() if isinstance(v, list)
                              for r in v if isinstance(r, dict) and "source_id" in r}
                             | ({v["source_id"] for v in parsed.values() if isinstance(v, dict) and "source_id" in v}))
                entry = {"agent": agent, "tool": fc.name, "arguments": json.loads(fc.arguments or "{}"),
                         "source_ids": ids, "result_count": len(ids), "error": parsed.get("error"),
                         "latency_ms": round((time.perf_counter() - t1) * 1000, 1)}
                tool_log.append(entry)
                if on_tool:
                    on_tool(entry)
                items.append({"type": "function_call_output", "call_id": fc.call_id, "output": result})
            continue

        text = resp.output_text or ""
        if resp.status == "incomplete" or not text.strip():
            raise RuntimeError(f"{agent}: model returned no final answer (status={resp.status}).")
        return json.loads(text), calls, tool_log

    raise RuntimeError(f"{agent}: tool loop ended without an answer.")
