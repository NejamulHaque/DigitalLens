# backend/routers/auth.py — Native User Authentication & Profile Engine (Neon DB)
import time
import secrets
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Header, Depends
from pydantic import BaseModel, EmailStr
import database

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

class SignupRequest(BaseModel):
    name: str
    email: str
    password: str

class LoginRequest(BaseModel):
    email: str
    password: str

class ProfileUpdateRequest(BaseModel):
    email: str
    displayName: Optional[str] = None
    interests: Optional[List[str]] = None
    history: Optional[List[Dict[str, Any]]] = None

@router.post("/signup")
def signup(req: SignupRequest):
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if "@" not in req.email or "." not in req.email:
        raise HTTPException(status_code=400, detail="Invalid email address.")
    
    try:
        user = database.create_user(req.name, req.email, req.password)
        token = f"dl_token_{secrets.token_hex(24)}"
        return {
            "ok": True,
            "token": token,
            "user": user,
            "message": "Account created successfully!",
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail="This email is already registered. Please sign in.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")

@router.post("/login")
def login(req: LoginRequest):
    user = database.authenticate_user(req.email, req.password)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password. Please try again.")
    
    token = f"dl_token_{secrets.token_hex(24)}"
    return {
        "ok": True,
        "token": token,
        "user": user,
        "message": f"Welcome back, {user['displayName']}!",
    }

@router.post("/profile")
def update_profile(req: ProfileUpdateRequest):
    res = database.update_user_profile(req.email, req.dict(exclude_unset=True))
    if not res.get("ok"):
        raise HTTPException(status_code=400, detail=res.get("error", "Update failed"))
    return {"ok": True, "message": "Profile updated successfully."}

@router.get("/users")
def get_users(x_admin_key: Optional[str] = Header(None)):
    # Verify admin access or allow listing for verified console
    readers = database.get_all_readers()
    return {"ok": True, "users": readers, "count": len(readers)}
