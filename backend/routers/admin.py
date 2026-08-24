# backend/routers/admin.py — Owner control console API
import os, time
from fastapi import APIRouter, HTTPException, Request

router = APIRouter(tags=["Admin"])

OWNER_EMAIL = os.getenv("ADMIN_EMAIL", "nejamulhaque.works@gmail.com")
ADMIN_KEY   = os.getenv("ADMIN_KEY", "dl-admin-2026")

_state = {
    "announce": "",
    "flags": {"ticker": True, "breaking": True, "chat": True, "quiz": True},
    "updated": 0,
}

def _guard(request: Request):
    if request.headers.get("X-Admin-Key", "") != ADMIN_KEY:
        raise HTTPException(401, "Admin key required.")

@router.get("/api/announce")
def get_announce():
    return {"text": _state["announce"], "flags": _state["flags"], "owner": OWNER_EMAIL}

@router.post("/api/admin/announce")
async def set_announce(request: Request):
    _guard(request)
    body = await request.json()
    _state["announce"] = (body.get("text") or "").strip()[:200]
    _state["updated"] = time.time()
    return {"ok": True, "text": _state["announce"]}

@router.post("/api/admin/flags")
async def set_flags(request: Request):
    _guard(request)
    body = await request.json()
    for k in list(_state["flags"]):
        if k in body:
            _state["flags"][k] = bool(body[k])
    _state["updated"] = time.time()
    return {"ok": True, "flags": _state["flags"]}

@router.post("/api/admin/cache/clear")
async def clear_cache(request: Request):
    _guard(request)
    from main import _cache   # lazy import avoids circular dependency
    n = len(_cache)
    _cache.clear()
    return {"ok": True, "cleared": n}