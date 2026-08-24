// src/pages/AdminPage.jsx — DigitalLens Owner Console
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/config";
import "./Admin.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";
const OWNER = "nejamulhaque.works@gmail.com";
const KEY = import.meta.env.VITE_ADMIN_KEY || "dl-admin-2026";
const H = { "Content-Type": "application/json", "X-Admin-Key": KEY };

function Stat({ icon, label, value, tone }) {
  return (
    <div className={`ad-stat ad-${tone || "plain"}`}>
      <span className="ad-stat-icon">{icon}</span>
      <div><p className="ad-stat-v">{value}</p><p className="ad-stat-l">{label}</p></div>
    </div>
  );
}

export default function AdminPage() {
  const { user } = useAuth();
  const [health, setHealth] = useState(null);
  const [irus, setIrus] = useState(null);
  const [pulse, setPulse] = useState(null);
  const [announce, setAnnounce] = useState("");
  const [draft, setDraft] = useState("");
  const [flags, setFlags] = useState({ ticker: true, breaking: true, chat: true, quiz: true });
  const [users, setUsers] = useState(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const note = (m) => { setMsg(m); setTimeout(() => setMsg(""), 2600); };

  const load = useCallback(async () => {
    const j = async (u) => { try { const r = await fetch(u); return await r.json(); } catch { return null; } };
    const [a, b, c, d] = await Promise.all([
      j(`${API}/health`), j(`${API}/api/irus/health`), j(`${API}/pulse`), j(`${API}/api/announce`),
    ]);
    setHealth(a); setIrus(b); setPulse(c);
    if (d) { setAnnounce(d.text || ""); setDraft(d.text || ""); setFlags(f => ({ ...f, ...(d.flags || {}) })); }
  }, []);
  useEffect(() => { if (user?.email === OWNER) load(); }, [user, load]);

  const loadUsers = async () => {
    setBusy("users");
    try {
      const snap = await getDocs(collection(db, "users"));
      setUsers(snap.docs.map(dc => ({ id: dc.id, ...dc.data() })));
    } catch { setUsers([]); note("⚠ Firestore rules blocked the user list."); }
    setBusy("");
  };

  const publish = async (text) => {
    setBusy("announce");
    try {
      const r = await fetch(`${API}/api/admin/announce`, { method: "POST", headers: H, body: JSON.stringify({ text }) });
      if (r.ok) { setAnnounce(text); setDraft(text); note(text ? "📢 Announcement is live on all dashboards" : "Announcement cleared"); }
      else note("⚠ Admin key rejected");
    } catch { note("⚠ Backend unreachable"); }
    setBusy("");
  };

  const toggle = async (k) => {
    const next = { ...flags, [k]: !flags[k] };
    setFlags(next);
    try { await fetch(`${API}/api/admin/flags`, { method: "POST", headers: H, body: JSON.stringify(next) }); } catch {}
    note(`"${k}" ${next[k] ? "enabled" : "disabled"} for all readers`);
  };

  const clearCache = async () => {
    setBusy("cache");
    try {
      const r = await fetch(`${API}/api/admin/cache/clear`, { method: "POST", headers: H });
      const d = await r.json().catch(() => ({}));
      note(d.ok ? `🧹 Cleared ${d.cleared} cached feeds` : "⚠ Failed");
      load();
    } catch { note("⚠ Backend unreachable"); }
    setBusy("");
  };

  // ── Gate 1: not signed in ──
  if (!user) return (
    <div className="ad-root"><div className="ad-lock">
      <span className="ad-lock-glyph">◉</span>
      <h1>Owner Console</h1>
      <p>This area is restricted. Sign in with the owner account to continue.</p>
      <Link to="/app" className="ad-cta">Sign In →</Link>
      <Link to="/" className="ad-back">← Back to home</Link>
    </div></div>
  );

  // ── Gate 2: signed in but not owner ──
  if (user.email !== OWNER) return (
    <div className="ad-root"><div className="ad-lock">
      <span className="ad-lock-glyph">⬢</span>
      <h1>403 — Restricted</h1>
      <p>Signed in as <b>{user.email}</b>.<br />Only the owner ({OWNER}) can access this console.</p>
      <Link to="/app" className="ad-cta">← Back to Dashboard</Link>
    </div></div>
  );

  // ── Owner console ──
  return (
    <div className="ad-root">
      {msg && <div className="ad-toast">{msg}</div>}
      <header className="ad-nav">
        <div className="ad-brand"><span>◉</span>
          <div><h1>DigitalLens <em>Admin</em></h1><p>OWNER CONSOLE · {OWNER}</p></div>
        </div>
        <div className="ad-nav-links">
          <Link to="/app">◈ Dashboard</Link>
          <Link to="/">◉ Landing</Link>
          <button onClick={load}>↺ Refresh</button>
        </div>
      </header>

      <main className="ad-main">
        <section className="ad-sec">
          <h2 className="ad-sec-t">System Monitor</h2>
          <p className="ad-hint">Live status of every engine powering DigitalLens.</p>
          <div className="ad-grid">
            <Stat icon="⬢" label="Backend API" value={health ? "Healthy" : "…"} tone={health ? "ok" : "warn"} />
            <Stat icon="◈" label="News Engine" value={health?.news_rss ? "Google RSS" : "Offline"} tone={health?.news_rss ? "ok" : "warn"} />
            <Stat icon="⬡" label="Claude AI" value={health?.claude ? "Active" : "No key"} tone={health?.claude ? "ok" : "warn"} />
            <Stat icon="◉" label="Irus AI" value={irus?.irus_reachable ? "Reachable" : "Down"} tone={irus?.irus_reachable ? "ok" : "warn"} />
            <Stat icon="◎" label="Cached Articles" value={health?.cached_articles ?? "—"} />
            <Stat icon="◆" label="Overall Mood" value={pulse?.overall_mood || "—"} />
          </div>
        </section>

        <section className="ad-sec">
          <h2 className="ad-sec-t">📢 Broadcast Announcement</h2>
          <p className="ad-hint">Shows as a gold banner on every reader's dashboard, instantly.</p>
          <div className="ad-row">
            <input value={draft} onChange={e => setDraft(e.target.value)} maxLength={200}
              placeholder="e.g. New AI features dropping this week — stay tuned!" />
            <button className="ad-cta" onClick={() => publish(draft)} disabled={busy === "announce"}>
              {busy === "announce" ? "…" : "Publish"}
            </button>
            {announce && <button className="ad-ghost" onClick={() => publish("")}>Clear</button>}
          </div>
          {announce && <div className="ad-preview">◉ {announce}</div>}
        </section>

        <section className="ad-sec">
          <h2 className="ad-sec-t">⬢ Feature Flags</h2>
          <p className="ad-hint">Toggle site-wide features for every reader in real time.</p>
          <div className="ad-flags">
            {Object.entries(flags).map(([k, v]) => (
              <button key={k} className={`ad-flag${v ? " ad-flag-on" : ""}`} onClick={() => toggle(k)}>
                <span className="ad-flag-dot" /> {k}
              </button>
            ))}
          </div>
        </section>

        <section className="ad-sec">
          <h2 className="ad-sec-t">◈ Reader Directory</h2>
          <p className="ad-hint">Everyone who has read or saved stories (Firestore).</p>
          <button className="ad-ghost" onClick={loadUsers} disabled={busy === "users"}>
            {busy === "users" ? "Loading…" : "Load Users"}
          </button>
          {users && users.length > 0 && (
            <div className="ad-table">
              {users.map(u => (
                <div key={u.id} className="ad-tr">
                  <span className="ad-td-avi">{(u.displayName || u.email || "?")[0].toUpperCase()}</span>
                  <div className="ad-td-main"><p>{u.displayName || "Reader"}</p><p className="ad-dim">{u.email || u.id}</p></div>
                  <span className="ad-dim">{(u.history || []).length} read</span>
                </div>
              ))}
            </div>
          )}
          {users && users.length === 0 && <p className="ad-hint" style={{ marginTop: 12 }}>No user documents found (or Firestore rules restrict reads).</p>}
        </section>

        <section className="ad-sec ad-danger">
          <h2 className="ad-sec-t">◆ Danger Zone</h2>
          <button className="ad-danger-btn" onClick={clearCache} disabled={busy === "cache"}>
            🧹 Clear News Cache ({health?.cached_articles ?? 0} feeds)
          </button>
        </section>
      </main>
    </div>
  );
}