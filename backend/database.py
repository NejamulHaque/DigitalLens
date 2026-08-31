# backend/database.py — Serverless Neon PostgreSQL & Persistent DB Layer
import os
import sys
import json
import time
import sqlite3
import hashlib
import secrets
from datetime import datetime, timezone

DATABASE_URL = os.getenv("DATABASE_URL") or os.getenv("NEON_DATABASE_URL") or os.getenv("POSTGRES_URL")

# Flag indicating DB type
DB_TYPE = "sqlite"
pg_conn = None

# Attempt to load PostgreSQL library if available and configured
if DATABASE_URL and (DATABASE_URL.startswith("postgres://") or DATABASE_URL.startswith("postgresql://")):
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        pg_conn = psycopg2.connect(DATABASE_URL)
        pg_conn.autocommit = True
        DB_TYPE = "neon_postgres"
        print(f"[Database] Connected to Neon PostgreSQL: {DATABASE_URL.split('@')[-1]}")
    except Exception as e:
        print(f"[Database] Could not connect to PostgreSQL ({e}). Falling back to persistent SQLite.")
        DB_TYPE = "sqlite"

SQLITE_PATH = os.path.join(os.path.dirname(__file__), "digitallens.db")

def get_connection():
    if DB_TYPE == "neon_postgres" and pg_conn:
        try:
            with pg_conn.cursor() as cur:
                cur.execute("SELECT 1;")
            return pg_conn
        except Exception:
            try:
                import psycopg2
                conn = psycopg2.connect(DATABASE_URL)
                conn.autocommit = True
                return conn
            except Exception:
                pass
    
    # SQLite connection
    conn = sqlite3.connect(SQLITE_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

# ── Password Hashing Helpers (PBKDF2-HMAC-SHA256 with 100,000 rounds) ──
def hash_password(password: str, salt: str = None) -> tuple[str, str]:
    if not salt:
        salt = secrets.token_hex(16)
    # Using military-grade PBKDF2-HMAC-SHA256
    hashed = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        100000
    ).hex()
    return hashed, salt

def verify_password(password: str, hashed: str, salt: str) -> bool:
    expected_hash, _ = hash_password(password, salt)
    if secrets.compare_digest(expected_hash, hashed):
        return True
    # Legacy SHA256 fallback compatibility for existing accounts
    legacy_hash = hashlib.sha256((salt + password).encode("utf-8")).hexdigest()
    return secrets.compare_digest(legacy_hash, hashed)

def init_db():
    """Initializes all database tables on startup (works on Neon PostgreSQL & SQLite)."""
    conn = get_connection()
    try:
        if DB_TYPE == "neon_postgres":
            with conn.cursor() as cur:
                # User Accounts Table
                cur.execute("""
                CREATE TABLE IF NOT EXISTS user_accounts (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(128) UNIQUE NOT NULL,
                    password_hash VARCHAR(128) NOT NULL,
                    salt VARCHAR(64) NOT NULL,
                    display_name VARCHAR(128),
                    role VARCHAR(32) DEFAULT 'Reader',
                    interests JSONB DEFAULT '["general", "technology"]'::jsonb,
                    history JSONB DEFAULT '[]'::jsonb,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                """)
                # Telemetry Logs Table
                cur.execute("""
                CREATE TABLE IF NOT EXISTS telemetry_logs (
                    id SERIAL PRIMARY KEY,
                    ip VARCHAR(64),
                    country VARCHAR(64),
                    city VARCHAR(64),
                    flag VARCHAR(8),
                    device VARCHAR(32),
                    browser VARCHAR(32),
                    os VARCHAR(32),
                    screen VARCHAR(32),
                    path VARCHAR(256),
                    referrer VARCHAR(256),
                    user_email VARCHAR(128),
                    user_name VARCHAR(128),
                    action VARCHAR(64),
                    metadata JSONB DEFAULT '{}'::jsonb,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                """)
                # Bookmarks Table
                cur.execute("""
                CREATE TABLE IF NOT EXISTS bookmarks (
                    id SERIAL PRIMARY KEY,
                    user_email VARCHAR(128) NOT NULL,
                    article_url TEXT NOT NULL,
                    title TEXT NOT NULL,
                    summary TEXT,
                    source VARCHAR(64),
                    sentiment VARCHAR(32),
                    published_at VARCHAR(64),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    UNIQUE(user_email, article_url)
                );
                """)
                # Broadcast Announcements Table
                cur.execute("""
                CREATE TABLE IF NOT EXISTS broadcasts (
                    id SERIAL PRIMARY KEY,
                    text TEXT NOT NULL,
                    priority VARCHAR(32) DEFAULT 'info',
                    flags JSONB DEFAULT '{}'::jsonb,
                    is_active BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                """)
                # Subscriptions & Payments Table
                cur.execute("""
                CREATE TABLE IF NOT EXISTS payments (
                    id SERIAL PRIMARY KEY,
                    user_email VARCHAR(128) NOT NULL,
                    user_name VARCHAR(128),
                    plan VARCHAR(64) DEFAULT 'Pro Intelligence',
                    amount VARCHAR(32) DEFAULT '₹49',
                    currency VARCHAR(8) DEFAULT 'INR',
                    utr_number VARCHAR(128) NOT NULL,
                    status VARCHAR(32) DEFAULT 'pending',
                    notes TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                );
                """)
            print("[Database] Neon PostgreSQL schema verified.")
        else:
            with conn:
                conn.execute("""
                CREATE TABLE IF NOT EXISTS user_accounts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL DEFAULT '',
                    salt TEXT NOT NULL DEFAULT '',
                    display_name TEXT,
                    role TEXT DEFAULT 'Reader',
                    interests TEXT DEFAULT '["general", "technology"]',
                    history TEXT DEFAULT '[]',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """)
                # Auto-migrate any existing SQLite table columns
                try:
                    cur = conn.cursor()
                    cur.execute("PRAGMA table_info(user_accounts);")
                    cols = [r["name"] if isinstance(r, sqlite3.Row) else r[1] for r in cur.fetchall()]
                    if "password_hash" not in cols:
                        conn.execute("ALTER TABLE user_accounts ADD COLUMN password_hash TEXT DEFAULT '';")
                    if "salt" not in cols:
                        conn.execute("ALTER TABLE user_accounts ADD COLUMN salt TEXT DEFAULT '';")
                    if "history" not in cols:
                        conn.execute("ALTER TABLE user_accounts ADD COLUMN history TEXT DEFAULT '[]';")
                except Exception:
                    pass
                conn.execute("""
                CREATE TABLE IF NOT EXISTS telemetry_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    ip TEXT,
                    country TEXT,
                    city TEXT,
                    flag TEXT,
                    device TEXT,
                    browser TEXT,
                    os TEXT,
                    screen TEXT,
                    path TEXT,
                    referrer TEXT,
                    user_email TEXT,
                    user_name TEXT,
                    action TEXT,
                    metadata TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """)
                conn.execute("""
                CREATE TABLE IF NOT EXISTS bookmarks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_email TEXT NOT NULL,
                    article_url TEXT NOT NULL,
                    title TEXT NOT NULL,
                    summary TEXT,
                    source TEXT,
                    sentiment TEXT,
                    published_at TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE(user_email, article_url)
                );
                """)
                conn.execute("""
                CREATE TABLE IF NOT EXISTS broadcasts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    text TEXT NOT NULL,
                    priority TEXT DEFAULT 'info',
                    flags TEXT DEFAULT '{}',
                    is_active INTEGER DEFAULT 1,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """)
                conn.execute("""
                CREATE TABLE IF NOT EXISTS payments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_email TEXT NOT NULL,
                    user_name TEXT,
                    plan TEXT DEFAULT 'Pro Intelligence',
                    amount TEXT DEFAULT '₹49',
                    currency TEXT DEFAULT 'INR',
                    utr_number TEXT NOT NULL,
                    status TEXT DEFAULT 'pending',
                    notes TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
                """)
            print(f"[Database] SQLite schema verified at {SQLITE_PATH}.")
    except Exception as e:
        print(f"[Database] Schema init warning: {e}")

# ── User Account Operations ──
def create_user(name: str, email: str, password: str) -> dict:
    email_clean = email.strip().lower()
    clean_name = name.strip() if name and name.strip() else ""
    if email_clean == "nejamulhaque.works@gmail.com" or not clean_name or "@" in clean_name:
        if email_clean == "nejamulhaque.works@gmail.com":
            clean_name = "Nejamul Haque"
        elif not clean_name or "@" in clean_name:
            prefix = email_clean.split("@")[0].replace(".", " ").replace("_", " ").title()
            clean_name = prefix or "Reader"

    hashed, salt = hash_password(password)
    role = "Owner / Architect" if email_clean == "nejamulhaque.works@gmail.com" else "Reader"
    conn = get_connection()
    try:
        if DB_TYPE == "neon_postgres":
            with conn.cursor() as cur:
                cur.execute("""
                INSERT INTO user_accounts (email, password_hash, salt, display_name, role)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, email, display_name, role, interests, history, created_at;
                """, (email_clean, hashed, salt, clean_name, role))
                row = cur.fetchone()
                return {
                    "id": str(row[0]), "email": row[1], "displayName": row[2],
                    "role": row[3], "interests": row[4] if isinstance(row[4], list) else json.loads(row[4] or "[]"),
                    "history": row[5] if isinstance(row[5], list) else json.loads(row[5] or "[]"),
                }
        else:
            with conn:
                cur = conn.cursor()
                cur.execute("""
                INSERT INTO user_accounts (email, password_hash, salt, display_name, role)
                VALUES (?, ?, ?, ?, ?);
                """, (email_clean, hashed, salt, clean_name, role))
                user_id = cur.lastrowid
                return {
                    "id": str(user_id), "email": email_clean, "displayName": clean_name,
                    "role": role, "interests": ["general", "technology"], "history": [],
                }
    except Exception as e:
        if "unique" in str(e).lower():
            raise ValueError("Email already registered")
        raise e

def authenticate_user(email: str, password: str) -> dict:
    email_clean = email.strip().lower()
    conn = get_connection()
    try:
        if DB_TYPE == "neon_postgres":
            with conn.cursor() as cur:
                cur.execute("""
                SELECT id, email, password_hash, salt, display_name, role, interests, history
                FROM user_accounts WHERE email = %s;
                """, (email_clean,))
                row = cur.fetchone()
                if not row:
                    return None
                if not verify_password(password, row[2], row[3]):
                    return None
                
                disp_name = row[4]
                if email_clean == "nejamulhaque.works@gmail.com":
                    disp_name = "Nejamul Haque"
                    cur.execute("UPDATE user_accounts SET display_name = 'Nejamul Haque' WHERE id = %s;", (row[0],))
                elif not disp_name or "@" in str(disp_name):
                    disp_name = email_clean.split("@")[0].replace(".", " ").replace("_", " ").title() or "Reader"
                    cur.execute("UPDATE user_accounts SET display_name = %s WHERE id = %s;", (disp_name, row[0]))

                # Update last active
                cur.execute("UPDATE user_accounts SET last_active = NOW() WHERE id = %s;", (row[0],))
                return {
                    "id": str(row[0]), "email": row[1], "displayName": disp_name,
                    "role": row[5], "interests": row[6] if isinstance(row[6], list) else json.loads(row[6] or "[]"),
                    "history": row[7] if isinstance(row[7], list) else json.loads(row[7] or "[]"),
                }
        else:
            cur = conn.cursor()
            cur.execute("""
            SELECT id, email, password_hash, salt, display_name, role, interests, history
            FROM user_accounts WHERE email = ?;
            """, (email_clean,))
            row = cur.fetchone()
            if not row:
                return None
            if not verify_password(password, row["password_hash"], row["salt"]):
                return None
            with conn:
                conn.execute("UPDATE user_accounts SET last_active = CURRENT_TIMESTAMP WHERE id = ?;", (row["id"],))
            return {
                "id": str(row["id"]), "email": row["email"], "displayName": row["display_name"],
                "role": row["role"], "interests": json.loads(row["interests"] or "[]"),
                "history": json.loads(row["history"] or "[]"),
            }
    except Exception as e:
        print(f"[Database] authenticate_user error: {e}")
        return None

def update_user_profile(email: str, data: dict) -> dict:
    email_clean = email.strip().lower()
    conn = get_connection()
    display_name = data.get("displayName")
    interests = data.get("interests")
    history = data.get("history")
    
    try:
        if DB_TYPE == "neon_postgres":
            with conn.cursor() as cur:
                if display_name is not None:
                    cur.execute("UPDATE user_accounts SET display_name = %s WHERE email = %s;", (display_name, email_clean))
                if interests is not None:
                    cur.execute("UPDATE user_accounts SET interests = %s::jsonb WHERE email = %s;", (json.dumps(interests), email_clean))
                if history is not None:
                    cur.execute("UPDATE user_accounts SET history = %s::jsonb WHERE email = %s;", (json.dumps(history), email_clean))
        else:
            with conn:
                if display_name is not None:
                    conn.execute("UPDATE user_accounts SET display_name = ? WHERE email = ?;", (display_name, email_clean))
                if interests is not None:
                    conn.execute("UPDATE user_accounts SET interests = ? WHERE email = ?;", (json.dumps(interests), email_clean))
                if history is not None:
                    conn.execute("UPDATE user_accounts SET history = ? WHERE email = ?;", (json.dumps(history), email_clean))
        return {"ok": True}
    except Exception as e:
        print(f"[Database] update_user_profile error: {e}")
        return {"ok": False, "error": str(e)}

def get_all_readers() -> list:
    conn = get_connection()
    try:
        if DB_TYPE == "neon_postgres":
            with conn.cursor() as cur:
                cur.execute("""
                SELECT id, email, display_name, role, interests, history, created_at, last_active
                FROM user_accounts ORDER BY id DESC;
                """)
                rows = cur.fetchall()
                return [{
                    "id": str(r[0]), "email": r[1], "displayName": r[2], "role": r[3],
                    "interests": r[4] if isinstance(r[4], list) else json.loads(r[4] or "[]"),
                    "history": r[5] if isinstance(r[5], list) else json.loads(r[5] or "[]"),
                    "createdAt": str(r[6]), "lastActive": str(r[7]),
                } for r in rows]
        else:
            cur = conn.cursor()
            cur.execute("""
            SELECT id, email, display_name, role, interests, history, created_at, last_active
            FROM user_accounts ORDER BY id DESC;
            """)
            rows = cur.fetchall()
            return [{
                "id": str(r["id"]), "email": r["email"], "displayName": r["display_name"], "role": r["role"],
                "interests": json.loads(r["interests"] or "[]"),
                "history": json.loads(r["history"] or "[]"),
                "createdAt": r["created_at"], "lastActive": r["last_active"],
            } for r in rows]
    except Exception as e:
        print(f"[Database] get_all_readers error: {e}")
        return []

# Telemetry helper
def insert_telemetry_event(event: dict):
    conn = get_connection()
    meta = json.dumps(event.get("metadata", {}))
    try:
        if DB_TYPE == "neon_postgres":
            with conn.cursor() as cur:
                cur.execute("""
                INSERT INTO telemetry_logs (ip, country, city, flag, device, browser, os, screen, path, referrer, user_email, user_name, action, metadata)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """, (
                    event.get("ip"), event.get("country"), event.get("city"), event.get("flag"),
                    event.get("device"), event.get("browser"), event.get("os"), event.get("screen"),
                    event.get("path"), event.get("referrer"), event.get("user_email"), event.get("user_name"),
                    event.get("action"), meta
                ))
        else:
            with conn:
                conn.execute("""
                INSERT INTO telemetry_logs (ip, country, city, flag, device, browser, os, screen, path, referrer, user_email, user_name, action, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
                """, (
                    event.get("ip"), event.get("country"), event.get("city"), event.get("flag"),
                    event.get("device"), event.get("browser"), event.get("os"), event.get("screen"),
                    event.get("path"), event.get("referrer"), event.get("user_email"), event.get("user_name"),
                    event.get("action"), meta
                ))
    except Exception as e:
        print(f"[Database] insert_telemetry_event error: {e}")

# Broadcast helper
def set_broadcast(text: str, priority: str = "info", flags: dict = None):
    conn = get_connection()
    flags_json = json.dumps(flags or {})
    try:
        if DB_TYPE == "neon_postgres":
            with conn.cursor() as cur:
                cur.execute("UPDATE broadcasts SET is_active = FALSE;")
                if text:
                    cur.execute("""
                    INSERT INTO broadcasts (text, priority, flags, is_active)
                    VALUES (%s, %s, %s, TRUE);
                    """, (text, priority, flags_json))
        else:
            with conn:
                conn.execute("UPDATE broadcasts SET is_active = 0;")
                if text:
                    conn.execute("""
                    INSERT INTO broadcasts (text, priority, flags, is_active)
                    VALUES (?, ?, ?, 1);
                    """, (text, priority, flags_json))
    except Exception as e:
        print(f"[Database] set_broadcast error: {e}")

def get_broadcast():
    conn = get_connection()
    try:
        if DB_TYPE == "neon_postgres":
            with conn.cursor() as cur:
                cur.execute("SELECT text, priority, flags FROM broadcasts WHERE is_active = TRUE ORDER BY id DESC LIMIT 1;")
                row = cur.fetchone()
                if row:
                    flags = row[2] if isinstance(row[2], dict) else json.loads(row[2] or "{}")
                    return {"text": row[0], "priority": row[1], "flags": flags}
        else:
            cur = conn.cursor()
            cur.execute("SELECT text, priority, flags FROM broadcasts WHERE is_active = 1 ORDER BY id DESC LIMIT 1;")
            row = cur.fetchone()
            if row:
                flags = json.loads(row["flags"] or "{}")
                return {"text": row["text"], "priority": row["priority"], "flags": flags}
    except Exception as e:
        print(f"[Database] get_broadcast error: {e}")
    return {"text": "", "priority": "info", "flags": {}}

# ── Subscriptions & Payments Helpers ──
def create_payment(user_email: str, user_name: str, plan: str, amount: str, utr_number: str, notes: str = "") -> dict:
    email_clean = user_email.strip().lower()
    conn = get_connection()
    try:
        if DB_TYPE == "neon_postgres":
            with conn.cursor() as cur:
                cur.execute("""
                INSERT INTO payments (user_email, user_name, plan, amount, currency, utr_number, status, notes)
                VALUES (%s, %s, %s, %s, %s, %s, 'pending', %s)
                RETURNING id, user_email, user_name, plan, amount, currency, utr_number, status, notes, created_at;
                """, (email_clean, user_name.strip(), plan, amount, "INR", utr_number.strip(), notes.strip()))
                row = cur.fetchone()
                return {
                    "id": row[0], "user_email": row[1], "user_name": row[2],
                    "plan": row[3], "amount": row[4], "currency": row[5],
                    "utr_number": row[6], "status": row[7], "notes": row[8],
                    "created_at": str(row[9])
                }
        else:
            with conn:
                cur = conn.cursor()
                cur.execute("""
                INSERT INTO payments (user_email, user_name, plan, amount, currency, utr_number, status, notes)
                VALUES (?, ?, ?, ?, ?, ?, 'pending', ?);
                """, (email_clean, user_name.strip(), plan, amount, "INR", utr_number.strip(), notes.strip()))
                pay_id = cur.lastrowid
                return {
                    "id": pay_id, "user_email": email_clean, "user_name": user_name.strip(),
                    "plan": plan, "amount": amount, "currency": "INR",
                    "utr_number": utr_number.strip(), "status": "pending", "notes": notes.strip(),
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
    except Exception as e:
        print(f"[Database] create_payment error: {e}")
        raise e

def get_all_payments() -> list:
    conn = get_connection()
    try:
        if DB_TYPE == "neon_postgres":
            with conn.cursor() as cur:
                cur.execute("""
                SELECT id, user_email, user_name, plan, amount, currency, utr_number, status, notes, created_at, updated_at
                FROM payments ORDER BY id DESC;
                """)
                rows = cur.fetchall()
                return [{
                    "id": r[0], "user_email": r[1], "user_name": r[2], "plan": r[3],
                    "amount": r[4], "currency": r[5], "utr_number": r[6], "status": r[7],
                    "notes": r[8], "created_at": str(r[9]), "updated_at": str(r[10])
                } for r in rows]
        else:
            cur = conn.cursor()
            cur.execute("""
            SELECT id, user_email, user_name, plan, amount, currency, utr_number, status, notes, created_at, updated_at
            FROM payments ORDER BY id DESC;
            """)
            rows = cur.fetchall()
            return [{
                "id": r["id"], "user_email": r["user_email"], "user_name": r["user_name"], "plan": r["plan"],
                "amount": r["amount"], "currency": r["currency"], "utr_number": r["utr_number"], "status": r["status"],
                "notes": r["notes"], "created_at": str(r["created_at"]), "updated_at": str(r["updated_at"])
            } for r in rows]
    except Exception as e:
        print(f"[Database] get_all_payments error: {e}")
        return []

def update_payment_status(payment_id: int, status: str) -> dict:
    valid_statuses = ["pending", "approved", "rejected"]
    status_clean = status.strip().lower()
    if status_clean not in valid_statuses:
        raise ValueError(f"Invalid status: {status}")
    
    conn = get_connection()
    try:
        user_email = None
        if DB_TYPE == "neon_postgres":
            with conn.cursor() as cur:
                cur.execute("SELECT user_email FROM payments WHERE id = %s;", (payment_id,))
                row = cur.fetchone()
                if row:
                    user_email = row[0]
                cur.execute("UPDATE payments SET status = %s, updated_at = NOW() WHERE id = %s;", (status_clean, payment_id))
                if status_clean == "approved" and user_email:
                    cur.execute("UPDATE user_accounts SET role = 'Pro Reader' WHERE email = %s;", (user_email,))
        else:
            with conn:
                cur = conn.cursor()
                cur.execute("SELECT user_email FROM payments WHERE id = ?;", (payment_id,))
                row = cur.fetchone()
                if row:
                    user_email = row["user_email"]
                conn.execute("UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;", (status_clean, payment_id))
                if status_clean == "approved" and user_email:
                    conn.execute("UPDATE user_accounts SET role = 'Pro Reader' WHERE email = ?;", (user_email,))
        return {"ok": True, "payment_id": payment_id, "status": status_clean, "user_email": user_email}
    except Exception as e:
        print(f"[Database] update_payment_status error: {e}")
        return {"ok": False, "error": str(e)}

