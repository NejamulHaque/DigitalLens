import os
import httpx
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/irus", tags=["Irus AI"])

IRUS_BASE = os.getenv("IRUS_AI_BASE_URL", "https://irus-ai.onrender.com")

class IrusChat(BaseModel):
    message: str
    context: Optional[str] = None
    conversation_id: Optional[str] = None

# Tries the most common chat routes so it works regardless of Irus's exact API shape
CANDIDATE_PATHS = ["/api/chat", "/chat", "/api/v1/chat"]

def _extract(data):
    """Pull a text reply out of any reasonable response shape."""
    if isinstance(data, dict):
        for k in ("reply", "response", "answer", "message", "content", "text", "output"):
            v = data.get(k)
            if isinstance(v, str) and v.strip():
                return v
            if isinstance(v, dict):
                inner = _extract(v)
                if inner: return inner
        if isinstance(data.get("data"), (dict, list)):
            inner = _extract(data["data"])
            if inner: return inner
    if isinstance(data, list) and data:
        return _extract(data[0])
    return None

@router.post("/chat")
async def irus_chat(req: IrusChat):
    payload = {"message": req.message}
    if req.context: payload["context"] = req.context
    if req.conversation_id: payload["conversation_id"] = req.conversation_id

    last_err = None
    async with httpx.AsyncClient(timeout=30) as client:
        for path in CANDIDATE_PATHS:
            try:
                r = await client.post(f"{IRUS_BASE}{path}", json=payload)
                if r.status_code == 404:
                    continue
                r.raise_for_status()
                try:
                    data = r.json()
                except Exception:
                    data = None
                reply = _extract(data) if data is not None else None
                if not reply and isinstance(r.text, str) and r.text.strip() and len(r.text) < 2000:
                    reply = r.text.strip()
                if reply:
                    return {"reply": reply, "engine": "irus", "path": path}
            except Exception as e:
                last_err = str(e)[:120]

    # Signal the frontend to fall back to Claude
    return {"reply": None, "fallback": True, "detail": last_err or "Irus AI unreachable"}

@router.get("/health")
async def irus_health():
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(IRUS_BASE)
            return {"status": "ok", "irus_reachable": r.status_code < 500, "base": IRUS_BASE}
    except Exception as e:
        return {"status": "degraded", "irus_reachable": False, "detail": str(e)[:120]}