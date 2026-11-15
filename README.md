# Joy Risers 🌅
**A joyful digital sanctuary and multi-agent AI Co-Pilot for every caregiver raising a child or young adult (ages 0–21) with a physical disability.**

🌐 **Live app: [https://joy-risers.onrender.com](https://joy-risers.onrender.com)** · if it has been idle, the first visit can take about a minute to wake up.

Grandparents, aunts and uncles, foster, resource and kinship families, legal guardians, and parents of every shape can:

| Module | What it does |
|---|---|
| 🗺️ **Best Places to Live & Thrive** | Interactive U.S. hotspot map. Re-ranks 30 cities by what matters to *your* family (curb cuts/transit, inclusive playgrounds, Medicaid/waivers, pediatric specialists, inclusive schools). Click a city for its dossier, insider tips, and a side-by-side comparison. |
| 🎈 **Joy & Play Finder** | 80 accessible adventures, filterable by wheelchair/cane/walker/vision/hearing, age (0–5, 6–12, 13–17, 18–21), budget (Free → Over $100) and indoor/outdoor/hybrid. Plus a saved know-before-you-go checklist. |
| 🦽 **Equipment & Gear Navigator** | Guides for 8 kinds of gear, a **Checklist & Script Builder** for 10 roles (pediatrician → special needs trust attorney), a **Letter of Medical Necessity decoder**, and loan closets, grants and swap programs. |
| 📚 **IEP & 504 Powerhouse** | IFSP → IEP/504 → transition. An **Accommodation & Meeting Prep Builder** writes legally grounded accommodation language (adaptive PE, field-trip transport, evacuation plans, passing time, assistive tech…) with citations, plus a pre-meeting checklist. |
| 🩺 **Inclusive Provider Finder** | Disability-competent, culturally responsive pediatricians, physiatrists, PTs, OTs and orthotists with Medicaid/insurance, language and telehealth filters, plus **Green Flag Questions** for visit one. |
| 🌿 **Caregiver Sanctuary** | Respite grants, support circles for grandparents, foster/resource, BIPOC and male caregivers, and guided 5-minute resets. After 30 minutes of active use, a gentle ding-ding-ding breathing break appears. |
| ✨ **Multi-Agent Co-Pilot** | 4 agents with structured JSON outputs, tool calling, prompt caching, a live **Agent Telemetry & Safety Inspector** and one-click red-team tests. |

---

## ▶️ Run it locally (about 3 minutes)

You need **Python 3.9 or newer**. Node is **not** needed: the built frontend is already in `frontend/dist/`.

**1. Get the code and install the Python packages**
```bash
git clone <this-repo-url> joy-risers
cd joy-risers
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

**2. Add a key (pick ONE place).** The app checks for `.env` in this order:
1. `./.env`: inside this repo folder
2. `../.env`: one folder up (where the teaching staff keep their keys, e.g. `submissions/.env`)

Keys already exported in your shell also work. To make your own:
```bash
cp .env.example .env               # then paste PORTKEY_API_KEY=... (or OPENAI_API_KEY=...)
```
- `PORTKEY_API_KEY` → calls **gpt-6-luna** through Portkey's OpenAI-compatible endpoint `https://api.portkey.ai/v1` (used first).
- `OPENAI_API_KEY` → fallback, calls **gpt-6-luna** directly at OpenAI.
- No key? The whole site still works and the Co-Pilot runs in **offline mode** (local data only, 0 tokens).

**3. Start the app**
```bash
python -m uvicorn backend.main:app --port 8000
```
Open **http://localhost:8000**. That's it.

> The header shows which key source and dataset are active. So does the Telemetry & Safety drawer (e.g. `env: ../.env · portkey · gpt-6-luna`).

---

## 🧪 Full vs. test dataset

All data is bundled JSON in `data/`. There's no database and no internet needed for the directories.

| Dataset | Folder | Size |
|---|---|---|
| `full` (default) | `data/full/` | 30 cities, 80 activities, 50 providers, 33 programs, 22 laws, 32 accommodations |
| `test` (small) | `data/test/` | 6 cities, 18 activities, 12 providers, 16 programs |

Switch any of these ways:
- **In the app:** the **Data** dropdown in the header (Full / Test)
- **In the URL:** `http://localhost:8000/?dataset=test`
- **In `.env`:** `JOY_DATASET=test`

`python scripts/make_test_data.py` regenerates `data/test/` from `data/full/`.

---

## 🤖 How the agents work

See **[docs/architecture.md](docs/architecture.md)** for the Mermaid + ASCII diagrams.

1. **Layer 0: code guardrails (no tokens).** Session circuit breaker (turns/tokens/$), a 2,000-character cap and runaway-demand filter, prompt-injection regex, crisis detector (911/988), and a medical dosing/diagnosis detector.
2. **Agent 1 · Intake & Safety Router.** Returns strict JSON: intent, which specialists to run, safety flags (injection, medical, crisis, off-topic, runaway), and the family profile.
3. **Agent 2 · Rights, IEP & Equipment Advocate** *(tools: `lookup_policy`, `find_accommodations`, `find_equipment_funding`, `find_caregiver_support`)* and
   **Agent 3 · Joy, Play & Hotspot Scout** *(tools: `search_activities`, `get_city_dossier`, `rank_cities`, `search_providers`, `find_caregiver_support`)* run **in parallel** and return structured drafts. Every record they use has a `source_id`.
4. **Agent 4 · Empathy & Verification Editor.** Rewrites the drafts into warm, inclusive language (never "mom and dad"), strips any diagnosis or dose, and may only cite `ALLOWED_SOURCE_IDS`.
5. **Layer 5: code verification.** Drops any source the tools never returned, scrubs doses/diagnoses, redacts keys and the prompt canary, and fixes exclusionary words.

**Model:** `gpt-6-luna` only (Responses API: function tools + strict JSON-schema outputs, reasoning effort low).

## 💸 Tokenomics

- **Prompt caching:** each agent's long static prefix (brand voice, safety policy, data dictionary) comes first and stays byte-identical; dynamic text comes last, with a per-agent `prompt_cache_key`. Portkey's response cache is bypassed (`x-portkey-cache-force-refresh`) so every number is a real model call.
- Every run records **input, cached, cache-write, output and reasoning tokens, latency and USD cost** per model call (prices in `data/prices.json`). It also projects cost **per family per month and for 100 / 10,000 families**.
- Every run is appended to `logs/telemetry.jsonl`. The Inspector's "All logged runs" panel averages them.
- Terminal runs: `python scripts/run_copilot.py "your question"`

## 🛡️ Safety: try it live

Open **📊 Telemetry & Safety** (top right) and click a red-team button:

| Test | What happens |
|---|---|
| 💉 Prompt injection | Blocked at Layer 0 before any model call ($0.00) |
| 🩺 Unsafe medical advice | Flagged by Layer 0 + Agent 1. Specialists are skipped; the Editor writes a safe redirect with provider matches and questions to ask; dose content is removed |
| 🔥 Runaway token overspend | 2,000-character cap + runaway filter block it ($0.00). The session circuit breaker meters show the budget |
| 🕵️ Bonus: stealth injection | Skips the regex on purpose. Agent 1 flags it, and the canary/secret scanner is the last line |

Offline unit tests (no tokens): `python -m pytest -q`

## 🗂️ File tree
```
joy-risers/
├── README.md · .env.example · .gitignore · requirements.txt · render.yaml · .python-version
├── backend/
│   ├── main.py           FastAPI: /api/data, /api/copilot (NDJSON stream), /api/telemetry, serves frontend/dist
│   ├── config.py         two-location .env lookup, keys, model, limits, prices
│   ├── orchestrator.py   Layer 0 → Agent 1 → Agents 2+3 (parallel) → Agent 4 → Layer 5, red-team presets
│   ├── llm.py            Responses API wrapper: strict JSON, tool loop, prompt cache key, usage capture
│   ├── prompts.py        cached shared prefix + 4 agent role prompts
│   ├── schemas.py        structured-output JSON schemas
│   ├── tools.py          8 local lookup tools + strict tool schemas
│   ├── safety.py         injection/medical/runaway detectors, output scrubber, circuit breaker
│   ├── telemetry.py      cost math, projections, run log
│   ├── offline.py        no-key fallback
│   └── data_store.py     loads data/full or data/test
├── data/  full/*.json · test/*.json · prices.json
├── frontend/  src/ (React + Tailwind + d3-geo)  ·  dist/ (prebuilt, served by FastAPI)
├── docs/architecture.md
├── scripts/  run_copilot.py · make_test_data.py
├── tests/test_guardrails.py
└── logs/telemetry.jsonl  (created on first run)
```

## 🌐 Deploying online (Render, as in Lecture 8)
One **Web Service** is enough: FastAPI serves the prebuilt React site from `frontend/dist`.
1. Push this repo to GitHub.
2. On [render.com](https://render.com) → **New → Blueprint** → pick the repo (it reads `render.yaml`), or **New → Web Service** with:
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
   - Environment: `PYTHON_VERSION=3.12.7`, and your `PORTKEY_API_KEY` (entered in Render, never committed)
3. Public-use guards (in `backend/config.py`): 15 Co-Pilot questions per visitor per hour, and a $2.00 per day ceiling for the whole site, on top of the per-session limits.

## 🎨 Changing the frontend (optional)
```bash
cd frontend && npm install && npm run dev     # http://localhost:5173 (proxies /api to :8000)
npm run build                                 # rewrites frontend/dist for the FastAPI server
```

## ⚖️ About the data
- **National programs and laws are real** (e.g., IDEA, Section 504, ADA Title II, Medicaid EPSDT, ABLE; AT Act programs, AMBUCS Amtryke, Variety, Easterseals, ARCH Respite, Parent to Parent USA). Citations are general information, **not legal advice**.
- **Providers are fictional sample listings.** City scores, local activities, hours and prices are **illustrative** demo data. Every card says so, and you should always confirm.
- Joy Risers never diagnoses or gives medication advice. In an emergency call **911**. For crisis support call or text **988**.

*MGT 409 · AI Foundations for Managers · Final Project · Fall 2026*
