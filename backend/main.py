"""Joy Risers API + static frontend server.

Run from the repo folder:   python -m uvicorn backend.main:app --port 8000
Then open http://localhost:8000
"""

from __future__ import annotations

import json
import queue
import threading
import uuid
from typing import Optional

from fastapi import FastAPI, Header, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from . import data_store, orchestrator, safety, telemetry
from .config import FRONTEND_DIST, public_config

app = FastAPI(title="Joy Risers API", version="1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
                   allow_methods=["*"], allow_headers=["*"])


@app.get("/api/health")
def health():
    return {"ok": True, **public_config()}


@app.get("/api/data")
def all_data(dataset: Optional[str] = Query(None)):
    """Every bundled dataset for the six modules (the UI filters client-side)."""
    db = data_store.load(dataset)
    return {k: v for k, v in db.items() if k != "sources"}


@app.get("/api/redteam")
def redteam_presets():
    return {k: {"label": v["label"], "message": v["message"][:400]} for k, v in orchestrator.RED_TEAM.items()}


class CopilotRequest(BaseModel):
    message: str = ""
    dataset: Optional[str] = None
    redteam: Optional[str] = None


@app.post("/api/copilot")
def copilot(req: CopilotRequest, request: Request, x_session_id: Optional[str] = Header(None)):
    """Runs the 4-agent pipeline and streams NDJSON events: step / tool / safety / result."""
    sid = (x_session_id or uuid.uuid4().hex)[:64]
    # Behind Render's proxy the visitor's IP is the first X-Forwarded-For entry.
    fwd = request.headers.get("x-forwarded-for", "")
    ip = fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else None)
    q: queue.Queue = queue.Queue()

    def worker():
        try:
            orchestrator.run_copilot(req.message, sid, req.dataset, q.put, redteam=req.redteam, ip=ip)
        except Exception as e:  # last-resort guard so the stream always ends
            q.put({"type": "error", "message": f"{type(e).__name__}: {e}"})
        finally:
            q.put(None)

    threading.Thread(target=worker, daemon=True).start()

    def stream():
        while True:
            ev = q.get()
            if ev is None:
                break
            yield json.dumps(ev, ensure_ascii=False, default=str) + "\n"

    return StreamingResponse(stream(), media_type="application/x-ndjson")


@app.get("/api/telemetry")
def get_telemetry(x_session_id: Optional[str] = Header(None), limit: int = 20):
    runs = telemetry.read_runs(200)
    mine = [r for r in runs if r.get("session_id") == x_session_id][-limit:] if x_session_id else []
    return {"session": safety.SESSIONS.get(x_session_id).snapshot() if x_session_id else None,
            "recent_runs": [{k: r[k] for k in ("run_id", "ts", "message_preview", "blocked", "totals",
                                               "latency_ms", "redteam")} for r in mine][::-1],
            "all_time": telemetry.summary(), "site": safety.SITE.snapshot(), "config": public_config()}


@app.post("/api/session/reset")
def reset_session(x_session_id: Optional[str] = Header(None)):
    if not x_session_id:
        return JSONResponse({"error": "missing X-Session-Id"}, status_code=400)
    return {"session": safety.SESSIONS.reset(x_session_id).snapshot()}


# --------------------------------------------------------------------------- frontend
if (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")


@app.get("/{path:path}")
def spa(path: str):
    f = FRONTEND_DIST / path
    if path and f.is_file() and FRONTEND_DIST in f.resolve().parents:
        return FileResponse(f)
    index = FRONTEND_DIST / "index.html"
    if index.exists():
        return FileResponse(index)
    return JSONResponse({"error": "Frontend not built. See README (frontend/dist is missing)."}, status_code=500)
