# Joy Risers: Multi-Agent Architecture

## Mermaid diagram

```mermaid
flowchart TD
    U([Caregiver message]) --> L0

    subgraph L0 [Layer 0 · Code guardrails · 0 tokens]
        B[Session circuit breaker<br/>turns · tokens · USD]
        R[Runaway filter<br/>2,000-char cap + mass-output regex]
        I[Prompt-injection regex filter]
        C[Crisis detector → 911 / 988]
        M[Medical dosing / diagnosis detector]
    end

    L0 -->|blocked| X[[Warm safe reply · logged]]
    L0 --> A1

    A1["Agent 1 · Intake & Safety Router<br/>gpt-6-luna · structured JSON<br/>intent · routes · safety flags · profile"]
    A1 -->|injection / runaway / crisis / off-topic| X
    A1 -->|medical request| MED[Orchestrator: provider lookup only<br/>specialists skipped]
    A1 -->|routes| PAR{{parallel fan-out}}

    PAR --> A2["Agent 2 · Rights, IEP & Equipment Advocate<br/>tools: lookup_policy · find_accommodations<br/>find_equipment_funding · find_caregiver_support"]
    PAR --> A3["Agent 3 · Joy, Play & Hotspot Scout<br/>tools: search_activities · get_city_dossier<br/>rank_cities · search_providers · find_caregiver_support"]

    A2 --> A4
    A3 --> A4
    MED --> A4
    A4["Agent 4 · Empathy & Verification Editor<br/>warm inclusive voice · strips diagnoses/doses<br/>may cite ALLOWED_SOURCE_IDS only"]

    A4 --> L5["Layer 5 · Code verification<br/>drop un-sourced ids · dosage/diagnosis scrubber<br/>secret + canary scan · inclusive-language fixes"]
    L5 --> OUT([Answer + checklist + email + verified sources])

    DATA[(data/full or data/test<br/>bundled JSON)] -.-> A2
    DATA -.-> A3
    L5 --> T[(Telemetry: tokens · cached · cost · latency<br/>safety events → UI Inspector + logs/telemetry.jsonl)]
```

## ASCII version

```
caregiver message
      │
      ▼
┌──────────────────────── Layer 0 · code guardrails (no tokens) ────────────────────────┐
│ session circuit breaker │ runaway filter │ injection regex │ crisis │ medical detector │
└───────────────────────────────────────────────────────────────────────────────────────┘
      │ pass                                         │ block → warm safe reply ($0.00)
      ▼
┌─────────────────────────────────────┐
│ Agent 1 · Intake & Safety Router    │  JSON: intent, routes[], safety{}, profile{}
└─────────────────────────────────────┘
      │ routes                 │ medical → provider lookup only     │ attack → blocked
      ├──────────────┬─────────┘
      ▼              ▼            (run in parallel threads)
┌──────────────┐ ┌───────────────┐
│ Agent 2      │ │ Agent 3       │   each: ≤4 tool rounds over local JSON tools,
│ Advocate     │ │ Scout         │   structured JSON draft with source_ids
└──────────────┘ └───────────────┘
      └──────┬───────┘
             ▼
┌─────────────────────────────────────┐
│ Agent 4 · Empathy & Verification    │  JSON: headline, message, email, checklist,
│ Editor                              │  sources (ALLOWED_SOURCE_IDS only), removals
└─────────────────────────────────────┘
             ▼
┌─────────────────────────────────────┐
│ Layer 5 · code verification         │  drop invented sources · scrub doses/diagnoses
│                                     │  redact keys/canary · fix exclusionary words
└─────────────────────────────────────┘
             ▼
 answer → UI      telemetry → Inspector drawer + logs/telemetry.jsonl
```

## Why this design

| Choice | Why |
|---|---|
| Code guardrails before and after the model | Regex filters, budgets and scrubbers can't be argued with. Obvious attacks cost **$0.00** because no model is called. |
| Router agent with structured safety flags | Catches subtle attacks the regex misses (see the "stealth" red-team test) and routes only to the specialists a question needs. |
| Two specialists in parallel | IEP/equipment questions and play/place questions need different tools; running both at once cuts wall-clock time. |
| Tools over bundled JSON | Agents can only cite records that exist. Each record has a `source_id`, so the editor and code can verify grounding. |
| Editor agent last | Inclusive voice standards, clinical boundary and hallucination check happen on every answer, not as an afterthought. |
| One model (gpt-6-luna) | Course rule; it is fast and cheap. Reasoning effort is set to low and outputs are strict JSON schemas. |

## Prompt caching

Every agent's instructions = **SHARED_PREFIX** (≈1,300 tokens: brand voice, inclusion standards, safety
policy, data dictionary) + a static role block. All dynamic text (the caregiver's message, drafts, ids)
goes in the user turn *after* the instructions. Each agent uses its own `prompt_cache_key`
(`joy-risers-intake`, `…-advocate`, `…-scout`, `…-editor`), so repeat calls read the prefix from cache at
$0.01/1M instead of $0.10/1M. The Inspector shows cached tokens and the % saved vs. no caching.

## Budget limits (`backend/config.py → LIMITS`)

| Limit | Value |
|---|---|
| Message length | 2,000 characters |
| Joy Compass turns per session | 25 |
| Tokens per session (all agents) | 150,000 |
| Dollar ceiling per session | $0.25 |
| Model calls per run | 10 |
| Tool rounds per specialist | 4 (last round forced to answer) |
| Output tokens per call | 8,000 |
