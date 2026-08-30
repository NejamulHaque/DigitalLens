# backend/routers/payments.py — Subscriptions & UPI Payment Management Router
import os
import json
import urllib.request
from typing import Optional
from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
import database

router = APIRouter(prefix="/api/payments", tags=["Subscriptions & Payments"])

OWNER_EMAIL = "nejamulhaque.works@gmail.com"

class PaymentSubmitRequest(BaseModel):
    user_email: str
    user_name: Optional[str] = "Reader"
    plan: Optional[str] = "Pro Intelligence"
    amount: Optional[str] = "₹49"
    utr_number: str
    notes: Optional[str] = ""

class PaymentActionRequest(BaseModel):
    payment_id: int
    action: str  # 'approve' or 'reject'

def notify_owner_of_payment(data: dict):
    """Sends payment alert to nejamulhaque.works@gmail.com via Formspree webhook & system log."""
    print(f"\n[PAYMENT ALERT] Received payment from {data.get('user_email')} — UTR: {data.get('utr_number')} — Amount: {data.get('amount')}")
    try:
        # Send instant webhook to Formspree (configured for nejamulhaque.works@gmail.com)
        payload = json.dumps({
            "subject": f"🚨 NEW PAYMENT: ₹49 Pro Subscription from {data.get('user_name')} ({data.get('user_email')})",
            "name": data.get("user_name"),
            "email": data.get("user_email"),
            "utr_number": data.get("utr_number"),
            "plan": data.get("plan"),
            "amount": data.get("amount"),
            "notes": data.get("notes"),
            "recipient": OWNER_EMAIL,
            "message": f"User {data.get('user_name')} ({data.get('user_email')}) submitted ₹49 for Pro Intelligence with UTR: {data.get('utr_number')}. Approve in Admin Console."
        }).encode("utf-8")
        
        req = urllib.request.Request(
            "https://formspree.io/f/mvzwoypk",
            data=payload,
            headers={"Content-Type": "application/json", "User-Agent": "DigitalLens-PaymentEngine/4.5"}
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            print(f"[Payment Engine] Formspree email notification dispatched: status {resp.status}")
    except Exception as e:
        print(f"[Payment Engine] Notification email note: {e}")

@router.post("/submit")
def submit_payment(req: PaymentSubmitRequest):
    if not req.utr_number or len(req.utr_number.strip()) < 4:
        raise HTTPException(status_code=400, detail="Please enter a valid UPI Transaction / UTR Number.")
    if not req.user_email or "@" not in req.user_email:
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    
    try:
        record = database.create_payment(
            user_email=req.user_email,
            user_name=req.user_name or "Reader",
            plan=req.plan or "Pro Intelligence",
            amount=req.amount or "₹49",
            utr_number=req.utr_number.strip(),
            notes=req.notes or "",
        )
        # Notify owner in background
        notify_owner_of_payment(record)
        
        return {
            "ok": True,
            "message": "Your Subscription on the way, Check your Account",
            "payment": record
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to submit payment: {str(e)}")

@router.get("/list")
def list_payments(x_admin_key: Optional[str] = Header(None)):
    payments = database.get_all_payments()
    return {
        "ok": True,
        "payments": payments,
        "count": len(payments),
        "pending_count": sum(1 for p in payments if p.get("status") == "pending")
    }

@router.post("/action")
def take_payment_action(req: PaymentActionRequest, x_admin_key: Optional[str] = Header(None)):
    if req.action not in ["approve", "reject"]:
        raise HTTPException(status_code=400, detail="Action must be 'approve' or 'reject'.")
    
    res = database.update_payment_status(req.payment_id, req.action)
    if not res.get("ok"):
        raise HTTPException(status_code=500, detail=res.get("error", "Action failed"))
    
    action_msg = "approved and user upgraded to Pro" if req.action == "approve" else "rejected"
    return {
        "ok": True,
        "message": f"Payment #{req.payment_id} was successfully {action_msg}.",
        "result": res
    }
