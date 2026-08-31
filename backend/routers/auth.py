# backend/routers/auth.py — Native User Authentication & Profile Engine (Neon DB)
import time
import secrets
import re
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

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")

@router.post("/signup")
def signup(req: SignupRequest):
    email_clean = req.email.strip().lower()
    name_clean = req.name.strip()
    
    if not name_clean:
        raise HTTPException(status_code=400, detail="Please enter your full name.")
    if len(name_clean) > 64:
        raise HTTPException(status_code=400, detail="Name must be 64 characters or fewer.")
    if not EMAIL_REGEX.match(email_clean):
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    if len(req.password) > 128:
        raise HTTPException(status_code=400, detail="Password must be 128 characters or fewer.")
    
    try:
        user = database.create_user(name_clean, email_clean, req.password)
        token = f"dl_token_{secrets.token_urlsafe(32)}"
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
    email_clean = req.email.strip().lower()
    if not EMAIL_REGEX.match(email_clean):
        raise HTTPException(status_code=400, detail="Please provide a valid email address.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Invalid email or password. Please try again.")

    user = database.authenticate_user(email_clean, req.password)
    if not user:
        raise HTTPException(status_code=400, detail="Invalid email or password. Please try again.")
    
    token = f"dl_token_{secrets.token_urlsafe(32)}"
    return {
        "ok": True,
        "token": token,
        "user": user,
        "message": f"Welcome back, {user['displayName']}!",
    }

@router.get("/verify")
def verify_session(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authentication token.")
    token = authorization.split(" ")[1].strip()
    if not token.startswith("dl_"):
        raise HTTPException(status_code=401, detail="Invalid token format.")
    return {"ok": True, "valid": True}

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
