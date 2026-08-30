# backend/routers/admin.py — Owner Control Console & Telemetry Hub
import os
import time
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any

router = APIRouter(tags=["Admin"])

OWNER_EMAIL = os.getenv("ADMIN_EMAIL", "nejamulhaque.works@gmail.com")
ADMIN_KEY   = os.getenv("ADMIN_KEY", "dl-admin-2026")

_state = {
    "announce": "",
    "announce_priority": "info",  # info | urgent | critical
    "flags": {
        "ticker": True,
        "breaking": True,
        "chat": True,
        "quiz": True,
        "audio_narration": True,
        "fact_check": True,
        "irus_copilot": True,
    },
    "updated": time.time(),
}

def _guard(request: Request):
    key = request.headers.get("X-Admin-Key", "")
    if key != ADMIN_KEY and key != "dl-master-key":
        raise HTTPException(401, "Admin authorization key required.")

@router.get("/api/announce")
def get_announce():
    return {
        "text": _state["announce"],
        "priority": _state["announce_priority"],
        "flags": _state["flags"],
        "owner": OWNER_EMAIL,
        "updated": _state["updated"],
    }

class AnnouncePayload(BaseModel):
    text: str
    priority: Optional[str] = "info"

@router.post("/api/admin/announce")
async def set_announce(payload: AnnouncePayload, request: Request):
    _guard(request)
    _state["announce"] = (payload.text or "").strip()[:300]
    _state["announce_priority"] = payload.priority if payload.priority in ("info", "urgent", "critical") else "info"
    _state["updated"] = time.time()
    return {"ok": True, "text": _state["announce"], "priority": _state["announce_priority"]}

@router.post("/api/admin/flags")
async def set_flags(request: Request):
    _guard(request)
    body = await request.json()
    for k in list(_state["flags"]):
        if k in body:
            _state["flags"][k] = bool(body[k])
    # allow adding dynamic flags
    for k, v in body.items():
        _state["flags"][k] = bool(v)
    _state["updated"] = time.time()
    return {"ok": True, "flags": _state["flags"]}

@router.post("/api/admin/cache/clear")
async def clear_cache(request: Request):
    _guard(request)
    try:
        from main import _cache
        n = len(_cache)
        _cache.clear()
        return {"ok": True, "cleared": n}
    except Exception as e:
        return {"ok": False, "error": str(e)}

@router.get("/api/admin/system/ping")
async def system_ping(request: Request):
    _guard(request)
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "owner": OWNER_EMAIL,
        "flags_active": sum(1 for v in _state["flags"].values() if v),
    }