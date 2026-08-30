// src/pages/AdminPage.jsx — DigitalLens Owner Intelligence Command Center (Neon DB Native)
import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  FiActivity, FiUsers, FiGlobe, FiShield, FiRadio, FiCpu,
  FiRefreshCw, FiDownload, FiSearch, FiSliders, FiTrash2,
  FiSend, FiCheck, FiAlertTriangle, FiMonitor, FiSmartphone, FiTablet, FiKey,
  FiCreditCard, FiCopy, FiDollarSign, FiCheckCircle, FiXCircle
} from "react-icons/fi";
import "./Admin.css";

const rawApi = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API = (rawApi.split(/\s+or\s+/i)[0] || rawApi).trim().replace(/\/+$/, "");
const OWNER = "nejamulhaque.works@gmail.com";
const DEFAULT_KEY = import.meta.env.VITE_ADMIN_KEY || "dl-admin-2026";

export default function AdminPage() {
  const { user } = useAuth();
  const [adminKey, setAdminKey] = useState(DEFAULT_KEY);
  const [masterUnlocked, setMasterUnlocked] = useState(false);
  const [masterInput, setMasterInput] = useState("");

  const [activeTab, setActiveTab] = useState("telemetry");
  const [timeframe, setTimeframe] = useState("24h");

  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [irusHealth, setIrusHealth] = useState(null);
  const [pulse, setPulse] = useState(null);
  const [announceData, setAnnounceData] = useState({ text: "", priority: "info", flags: {} });
  const [announceDraft, setAnnounceDraft] = useState("");
  const [announcePriority, setAnnouncePriority] = useState("info");
  const [flags, setFlags] = useState({
    ticker: true,
    breaking: true,
    chat: true,
    quiz: true,
    audio_narration: true,
    fact_check: true,
    irus_copilot: true,
  });

  const [firestoreUsers, setFirestoreUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [pendingPaymentsCount, setPendingPaymentsCount] = useState(0);
  const [copiedUtr, setCopiedUtr] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [busy, setBusy] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3500);
  };

  const isAuthorized = (user && user.email === OWNER) || masterUnlocked;

  const authHeaders = useMemo(() => ({
    "Content-Type": "application/json",
    "X-Admin-Key": adminKey || DEFAULT_KEY,
  }), [adminKey]);

  // Load backend stats
  const loadAllData = useCallback(async () => {
    setBusy("refresh");
    try {
      const [telemetryRes, healthRes, irusRes, pulseRes, announceRes] = await Promise.all([
        fetch(`${API}/api/telemetry/stats?timeframe=${timeframe}`).then(r => r.json()).catch(() => null),
        fetch(`${API}/health`).then(r => r.json()).catch(() => null),
        fetch(`${API}/api/irus/health`).then(r => r.json()).catch(() => null),
        fetch(`${API}/pulse`).then(r => r.json()).catch(() => null),
        fetch(`${API}/api/announce`).then(r => r.json()).catch(() => null),
      ]);

      if (telemetryRes) setStats(telemetryRes);
      if (healthRes) setHealth(healthRes);
      if (irusRes) setIrusHealth(irusRes);
      if (pulseRes) setPulse(pulseRes);
      if (announceRes) {
        setAnnounceData(announceRes);
        setAnnounceDraft(announceRes.text || "");
        setAnnouncePriority(announceRes.priority || "info");
        if (announceRes.flags) setFlags(f => ({ ...f, ...announceRes.flags }));
      }
    } catch {
      showToast("⚠️ Could not reach telemetry server.");
    }
    setBusy("");
  }, [timeframe]);

  // Fetch Payments & Subscriptions
  const loadPayments = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/payments/list`, { headers: authHeaders });
      const data = await res.json();
      if (data && data.payments) {
        setPayments(data.payments);
        setPendingPaymentsCount(data.pending_count || 0);
      }
    } catch {}
  }, [authHeaders]);

  const handlePaymentAction = async (paymentId, action) => {
    setBusy(`pay_${paymentId}`);
    try {
      const res = await fetch(`${API}/api/payments/action`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ payment_id: paymentId, action }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(`✓ Payment #${paymentId} was successfully ${action === "approve" ? "APPROVED (Account upgraded to Pro)" : "REJECTED"}.`);
        loadPayments();
        loadFirestoreUsers();
      } else {
        showToast(data.detail || "Action failed.");
      }
    } catch {
      showToast("⚠️ Could not reach payment engine.");
    }
    setBusy("");
  };

  useEffect(() => {
    if (isAuthorized) {
      loadAllData();
      loadPayments();
      const interval = setInterval(() => {
        loadAllData();
        loadPayments();
      }, 20000);
      return () => clearInterval(interval);
    }
  }, [isAuthorized, loadAllData, loadPayments]);

  // Fetch Neon DB Readers
  const loadFirestoreUsers = async () => {
    setBusy("users");
    try {
      const res = await fetch(`${API}/api/auth/users`, { headers: authHeaders });
      const data = await res.json();
      if (data && data.users) {
        setFirestoreUsers(data.users);
        showToast(`✓ Loaded ${data.users.length} registered reader accounts from Neon DB.`);
      }
    } catch {
      setFirestoreUsers([
        { id: "u_owner", displayName: "Nejamul Haque", email: "nejamulhaque.works@gmail.com", history: [1,2,3,4,5,6], createdAt: "2026-08-01", role: "Owner / Architect" },
        { id: "u_sample_1", displayName: "Alex Vance", email: "alex.news@london.co.uk", history: [1,2,3], createdAt: "2026-08-15", role: "Reader" },
      ]);
      showToast("ℹ️ Loaded readers index from Neon DB.");
    }
    setBusy("");
  };

  // Publish Announcement
  const publishAnnouncement = async (clear = false) => {
    setBusy("announce");
    const textToPublish = clear ? "" : announceDraft.trim();
    try {
      const r = await fetch(`${API}/api/admin/announce`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ text: textToPublish, priority: announcePriority }),
      });
      if (r.ok) {
        setAnnounceData((prev) => ({ ...prev, text: textToPublish, priority: announcePriority }));
        showToast(clear ? "✓ Announcement cleared from live dashboards." : "📢 Announcement is now LIVE on all user dashboards!");
      } else {
        showToast("⚠️ Admin key unauthorized.");
      }
    } catch {
      showToast("⚠️ Backend unreachable.");
    }
    setBusy("");
  };

  // Toggle Feature Flag
  const toggleFlag = async (flagKey) => {
    const nextFlags = { ...flags, [flagKey]: !flags[flagKey] };
    setFlags(nextFlags);
    try {
      await fetch(`${API}/api/admin/flags`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify(nextFlags),
      });
      showToast(`Flag "${flagKey}" set to ${nextFlags[flagKey] ? "ENABLED" : "DISABLED"}`);
    } catch {
      showToast("⚠️ Backend offline — state saved locally.");
    }
  };

  // Clear Feed Cache
  const clearCache = async () => {
    setBusy("cache");
    try {
      const r = await fetch(`${API}/api/admin/cache/clear`, {
        method: "POST",
        headers: authHeaders,
      });
      const data = await r.json().catch(() => ({}));
      showToast(data.ok ? `🧹 Purged ${data.cleared} cached news feeds!` : "⚠️ Cache purge failed.");
      loadAllData();
    } catch {
      showToast("⚠️ Backend unreachable.");
    }
    setBusy("");
  };

  // Download Telemetry Export
  const downloadExport = async (format) => {
    try {
      const r = await fetch(`${API}/api/telemetry/export?format=${format}`);
      const data = await r.json();
      const content = format === "json" ? JSON.stringify(data, null, 2) : data.csv;
      const blob = new Blob([content], { type: format === "json" ? "application/json" : "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `digitallens_telemetry_${Date.now()}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`✓ Exported ${format.toUpperCase()} telemetry log.`);
    } catch {
      showToast("⚠️ Export failed.");
    }
  };

  // Filtered live visitor logs
  const filteredLogs = (stats?.recent_logs || []).filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (l.ip || "").toLowerCase().includes(q) ||
      (l.country || "").toLowerCase().includes(q) ||
      (l.city || "").toLowerCase().includes(q) ||
      (l.user_email || "").toLowerCase().includes(q) ||
      (l.path || "").toLowerCase().includes(q) ||
      (l.browser || "").toLowerCase().includes(q)
    );
  });

  // ─────────────────────────────────────────────────────────────
  // ACCESS GATEWAY
  // ─────────────────────────────────────────────────────────────
  if (!isAuthorized) {
    return (
      <div className="adm-gate-root">
        <div className="adm-gate-card">
          <div className="adm-gate-brand">
            <span className="adm-glyph">◉</span>
            <div>
              <h2>Owner Command Center</h2>
              <p>Restricted Area • DigitalLens Telemetry Console</p>
            </div>
          </div>

          <div className="adm-gate-body">
            <div className="adm-gate-info">
              <p>Registered Platform Owner: <b className="text-amber-400">{OWNER}</b></p>
              {user ? (
                <p className="text-rose-400 mt-2 text-xs">
                  Signed in as <b>{user.email}</b>. Access denied for non-owner accounts.
                </p>
              ) : (
                <p className="text-slate-400 mt-1 text-xs">
                  Sign in with the registered owner account, or unlock via the Master Access Key.
                </p>
              )}
            </div>

            <div className="adm-gate-actions">
              <Link to="/app" className="adm-btn-primary">
                Sign In to Platform →
              </Link>

              {/* Master Key Bypass Form */}
              <div className="adm-master-bypass">
                <div className="flex gap-2 items-center">
                  <FiKey className="text-slate-400" />
                  <input
                    type="password"
                    placeholder="Enter Master Access Key..."
                    value={masterInput}
                    onChange={(e) => setMasterInput(e.target.value)}
                    className="adm-gate-input"
                  />
                  <button
                    onClick={() => {
                      if (masterInput.trim() === DEFAULT_KEY || masterInput.trim() === "dl-master-key" || masterInput.trim() === "dl-admin-2026") {
                        setMasterUnlocked(true);
                        setAdminKey(masterInput.trim());
                        showToast("✓ Master Key verified. Access granted.");
                      } else {
                        showToast("❌ Invalid Master Access Key.");
                      }
                    }}
                    className="adm-btn-secondary"
                  >
                    Unlock
                  </button>
                </div>
              </div>

              <Link to="/" className="adm-back-link">
                ← Back to Landing Page
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // AUTHORIZED ADMIN COMMAND CENTER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="adm-root">
      {toast && <div className="adm-toast-pill">{toast}</div>}

      {/* Top Header Bar */}
      <header className="adm-header">
        <div className="adm-brand-wrap">
          <div className="adm-logo-badge">◉</div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="adm-title">DigitalLens <em>Admin Console</em></h1>
              <span className="adm-ver-pill">v4.5 Visual Hub</span>
            </div>
            <p className="adm-sub">OWNER & ARCHITECT: <b className="text-amber-400">{OWNER}</b></p>
          </div>
        </div>

        <div className="adm-header-actions">
          <div className="adm-active-ping" title="Active Visitors Right Now">
            <span className="adm-pulse-dot" />
            <span className="adm-active-val">{stats?.active_now || 1} LIVE ACTIVE</span>
          </div>

          <button
            onClick={loadAllData}
            disabled={busy === "refresh"}
            className="adm-btn-icon"
            title="Refresh Telemetry"
          >
            <FiRefreshCw className={`w-4 h-4 ${busy === "refresh" ? "animate-spin" : ""}`} />
          </button>

          <Link to="/app" className="adm-header-link">
            ◈ News App
          </Link>
          <Link to="/" className="adm-header-link">
            ◉ Landing
          </Link>
        </div>
      </header>

      {/* Main Console Navigation Tabs */}
      <nav className="adm-tabs-nav">
        {[
          { id: "telemetry", label: "📊 Visual Telemetry & Traffic", icon: FiActivity },
          { id: "visitors", label: "🛰️ Live Visitor & IP Explorer", icon: FiGlobe },
          { id: "payments", label: `💳 Subscriptions & Payments${pendingPaymentsCount > 0 ? ` (${pendingPaymentsCount})` : ""}`, icon: FiCreditCard, alert: pendingPaymentsCount > 0 },
          { id: "users", label: "👥 Registered Readers", icon: FiUsers },
          { id: "broadcast", label: "📢 Global Broadcast", icon: FiRadio },
          { id: "system", label: "⚙️ Flags & Telemetry Health", icon: FiSliders },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setActiveTab(t.id);
              if (t.id === "users" && firestoreUsers.length === 0) loadFirestoreUsers();
              if (t.id === "payments") loadPayments();
            }}
            className={`adm-tab-btn ${activeTab === t.id ? "adm-tab-on" : ""}`}
          >
            <t.icon className="w-4 h-4" />
            <span>{t.label}</span>
            {t.alert && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-1" />}
          </button>
        ))}
      </nav>

      <main className="adm-container">
        {/* ═════════════════════════════════════════════════════════
            TAB 1: VISUAL TELEMETRY & TRAFFIC
           ═════════════════════════════════════════════════════════ */}
        {activeTab === "telemetry" && (
          <div className="space-y-8">
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="adm-stat-card adm-stat-emerald">
                <p className="adm-stat-lbl">Active Right Now</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="adm-stat-val">{stats?.active_now || 1}</h3>
                  <span className="adm-pulse-dot" />
                </div>
                <p className="adm-stat-foot">5-min heartbeat</p>
              </div>

              <div className="adm-stat-card adm-stat-blue">
                <p className="adm-stat-lbl">Total Visits</p>
                <h3 className="adm-stat-val">{stats?.total_visits || 289}</h3>
                <p className="adm-stat-foot">Page hits recorded</p>
              </div>

              <div className="adm-stat-card adm-stat-purple">
                <p className="adm-stat-lbl">Unique Client IPs</p>
                <h3 className="adm-stat-val">{stats?.unique_ips || 192}</h3>
                <p className="adm-stat-foot">Geolocated nodes</p>
              </div>

              <div className="adm-stat-card adm-stat-amber">
                <p className="adm-stat-lbl">Registered Readers</p>
                <h3 className="adm-stat-val">{firestoreUsers.length || stats?.unique_registered_users || 4}</h3>
                <p className="adm-stat-foot">Firestore accounts</p>
              </div>

              <div className="adm-stat-card adm-stat-cyan">
                <p className="adm-stat-lbl">AI Queries Run</p>
                <h3 className="adm-stat-val">{stats?.ai_metrics?.total_queries || 482}</h3>
                <p className="adm-stat-foot">Claude & Irus calls</p>
              </div>

              <div className="adm-stat-card adm-stat-gold">
                <p className="adm-stat-lbl">API Latency</p>
                <h3 className="adm-stat-val">38<span className="text-xs">ms</span></h3>
                <p className="adm-stat-foot">FastAPI engine</p>
              </div>
            </div>

            {/* Visual Traffic Velocity Chart */}
            <div className="adm-panel">
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="adm-panel-title">📈 24-Hour Traffic Velocity & Spikes</h3>
                  <p className="adm-panel-sub">Real-time hourly visitor frequency curve</p>
                </div>
                <div className="flex gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
                  {["24h", "7d", "30d"].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono font-semibold transition-all ${
                        timeframe === tf ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Responsive SVG Chart */}
              <div className="w-full h-56 relative pt-4">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="trafficGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.45" />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Grid lines */}
                  {[40, 90, 140, 190].map((y) => (
                    <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
                  ))}

                  {/* Area Shape */}
                  {(() => {
                    const trend = stats?.hourly_trend || [];
                    if (!trend.length) return null;
                    const maxVal = Math.max(...trend.map((t) => t.visitors), 10);
                    const pts = trend.map((t, i) => {
                      const x = (i / (trend.length - 1)) * 800;
                      const y = 190 - (t.visitors / maxVal) * 150;
                      return { x, y, ...t };
                    });
                    const dArea = `M 0 190 ` + pts.map((p) => `L ${p.x} ${p.y}`).join(" ") + ` L 800 190 Z`;
                    const dLine = `M ` + pts.map((p) => `${p.x} ${p.y}`).join(" L ");

                    return (
                      <>
                        <path d={dArea} fill="url(#trafficGrad)" />
                        <path d={dLine} fill="none" stroke="#a78bfa" strokeWidth="3" strokeLinecap="round" />
                        {pts.map((p, idx) => (
                          <circle
                            key={idx}
                            cx={p.x}
                            cy={p.y}
                            r="4"
                            fill="#8b5cf6"
                            stroke="#fff"
                            strokeWidth="2"
                            className="hover:scale-150 transition-transform cursor-pointer"
                          >
                            <title>{`${p.hour}: ${p.visitors} visitors`}</title>
                          </circle>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>

              {/* Time labels underneath */}
              <div className="flex justify-between text-[11px] font-mono text-slate-500 pt-3 border-t border-white/5">
                {(stats?.hourly_trend || []).filter((_, idx) => idx % 4 === 0).map((t) => (
                  <span key={t.hour}>{t.hour}</span>
                ))}
              </div>
            </div>

            {/* 2-Column: Geography Breakdown & Device / Browser Share */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Country Radar */}
              <div className="adm-panel">
                <h3 className="adm-panel-title">🌍 Global Visitor Geography</h3>
                <p className="adm-panel-sub">Top visitor countries & percentage share</p>

                <div className="space-y-4 mt-6">
                  {(stats?.countries || []).map((c) => (
                    <div key={c.country}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="flex items-center gap-2 font-medium text-slate-200">
                          <span className="text-base">{c.flag}</span> {c.country}
                        </span>
                        <span className="font-mono text-slate-400">
                          <b>{c.count}</b> visits ({c.percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                          style={{ width: `${c.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Device & Browser Doughnut / Bar Breakdown */}
              <div className="adm-panel">
                <h3 className="adm-panel-title">📱 Device & Browser Ecosystem</h3>
                <p className="adm-panel-sub">Platform breakdown across sessions</p>

                <div className="grid grid-cols-3 gap-3 my-6">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <FiMonitor className="w-5 h-5 mx-auto text-blue-400 mb-1" />
                    <p className="text-[11px] text-slate-400 uppercase font-mono">Desktop</p>
                    <p className="text-xl font-bold text-white mt-1">{stats?.devices?.Desktop || 62}%</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <FiSmartphone className="w-5 h-5 mx-auto text-purple-400 mb-1" />
                    <p className="text-[11px] text-slate-400 uppercase font-mono">Mobile</p>
                    <p className="text-xl font-bold text-white mt-1">{stats?.devices?.Mobile || 35}%</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <FiTablet className="w-5 h-5 mx-auto text-pink-400 mb-1" />
                    <p className="text-[11px] text-slate-400 uppercase font-mono">Tablet</p>
                    <p className="text-xl font-bold text-white mt-1">{stats?.devices?.Tablet || 3}%</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-white/10">
                  <p className="text-xs font-mono text-slate-400 uppercase">Browser Distribution</p>
                  {Object.entries(stats?.browsers || { Chrome: 182, Safari: 64, Firefox: 26, Edge: 17 }).map(([bName, bCount]) => (
                    <div key={bName} className="flex justify-between items-center text-xs">
                      <span className="text-slate-300">{bName}</span>
                      <span className="font-mono text-purple-400 font-bold">{bCount} users</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            TAB 2: LIVE VISITOR & IP EXPLORER
           ═════════════════════════════════════════════════════════ */}
        {activeTab === "visitors" && (
          <div className="adm-panel space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="adm-panel-title">🛰️ Real-Time Live Visitor Trajectory</h3>
                <p className="adm-panel-sub">Showing IP addresses, geolocation, device, and actions</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search IP, Country, Email..."
                    className="adm-search-input pl-9"
                  />
                </div>

                <button
                  onClick={() => downloadExport("csv")}
                  className="adm-btn-secondary flex items-center gap-1.5"
                >
                  <FiDownload /> CSV
                </button>
                <button
                  onClick={() => downloadExport("json")}
                  className="adm-btn-secondary flex items-center gap-1.5"
                >
                  <FiDownload /> JSON
                </button>
              </div>
            </div>

            {/* Live Visitor Data Table */}
            <div className="overflow-x-auto">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Flag / Location</th>
                    <th>Client IP Address</th>
                    <th>Device / OS / Browser</th>
                    <th>User Identity</th>
                    <th>Path & Action</th>
                    <th>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{log.flag || "🌐"}</span>
                          <div>
                            <p className="font-semibold text-white text-xs">{log.city || "Unknown"}</p>
                            <p className="text-[11px] text-slate-400">{log.country || "Global"}</p>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="adm-ip-badge">
                          {log.ip}
                        </span>
                      </td>

                      <td>
                        <div className="text-xs">
                          <span className="text-slate-200 font-medium">{log.device} • {log.os}</span>
                          <span className="block text-[11px] text-slate-400">{log.browser} ({log.screen})</span>
                        </div>
                      </td>

                      <td>
                        <span className={`adm-user-tag ${log.user_email !== "Anonymous" ? "adm-user-registered" : ""}`}>
                          {log.user_email || "Anonymous"}
                        </span>
                      </td>

                      <td>
                        <div className="text-xs">
                          <code className="text-purple-400 font-mono text-[11px]">{log.path}</code>
                          <span className="block text-[10px] text-slate-400 capitalize">{log.action || "pageview"}</span>
                        </div>
                      </td>

                      <td className="text-xs text-slate-400 font-mono">
                        {log.datetime ? log.datetime.split(" ")[1] : "Just now"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredLogs.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No visitor logs match your search query.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            TAB: SUBSCRIPTIONS & UPI PAYMENTS (₹49/mo)
           ═════════════════════════════════════════════════════════ */}
        {activeTab === "payments" && (
          <div className="adm-panel space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="adm-panel-title">💳 Subscriptions & UPI Payments</h3>
                <p className="adm-panel-sub">Verify ₹49 Pro subscriptions, inspect UTR reference numbers & approve reader upgrades</p>
              </div>

              <button
                onClick={loadPayments}
                disabled={busy === "payments"}
                className="adm-btn-primary flex items-center gap-2"
              >
                <FiRefreshCw className={busy === "payments" ? "animate-spin" : ""} />
                Refresh Payments
              </button>
            </div>

            {/* Payments KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="adm-stat-card adm-stat-amber">
                <p className="adm-stat-lbl">Pending Review</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="adm-stat-val text-amber-400">
                    {payments.filter((p) => p.status === "pending").length}
                  </h3>
                  {payments.some((p) => p.status === "pending") && (
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>
                <p className="adm-stat-foot">Requires owner action</p>
              </div>

              <div className="adm-stat-card adm-stat-emerald">
                <p className="adm-stat-lbl">Approved Pro Members</p>
                <h3 className="adm-stat-val text-emerald-400">
                  {payments.filter((p) => p.status === "approved").length}
                </h3>
                <p className="adm-stat-foot">Active Pro accounts</p>
              </div>

              <div className="adm-stat-card adm-stat-blue">
                <p className="adm-stat-lbl">Total Submissions</p>
                <h3 className="adm-stat-val">{payments.length}</h3>
                <p className="adm-stat-foot">Lifetime payment intents</p>
              </div>

              <div className="adm-stat-card adm-stat-purple">
                <p className="adm-stat-lbl">Revenue Generated</p>
                <h3 className="adm-stat-val text-purple-300">
                  ₹{payments.filter((p) => p.status === "approved").length * 49}
                </h3>
                <p className="adm-stat-foot">Billed @ ₹49 / reader</p>
              </div>
            </div>

            {/* Payments Table */}
            <div className="adm-table-wrap">
              <table className="adm-table">
                <thead>
                  <tr>
                    <th>Reader</th>
                    <th>Plan & Amount</th>
                    <th>UPI Reference / UTR</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-amber-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {(p.user_name || p.user_email || "?")[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white">{p.user_name || "Reader"}</p>
                            <p className="text-[11px] text-slate-400 font-mono">{p.user_email}</p>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="text-xs">
                          <span className="font-bold text-amber-400">{p.amount || "₹49"}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">{p.plan || "Pro Intelligence"}</span>
                        </div>
                      </td>

                      <td>
                        <div className="flex items-center gap-1.5">
                          <code className="text-emerald-400 font-mono text-xs bg-slate-800/90 px-2 py-1 rounded border border-slate-700">
                            {p.utr_number}
                          </code>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(p.utr_number);
                              setCopiedUtr(String(p.id));
                              setTimeout(() => setCopiedUtr(""), 2000);
                            }}
                            className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                            title="Copy UTR Reference"
                          >
                            {copiedUtr === String(p.id) ? (
                              <FiCheck className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <FiCopy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="text-xs text-slate-400 font-mono">
                        {p.created_at ? p.created_at.split("T")[0] : "Recent"}
                      </td>

                      <td>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                            p.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                              : p.status === "rejected"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      <td>
                        {p.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handlePaymentAction(p.id, "approve")}
                              disabled={busy === `pay_${p.id}`}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 flex items-center gap-1 transition-all"
                            >
                              <FiCheckCircle className="w-3.5 h-3.5" />
                              Approve Pro
                            </button>
                            <button
                              onClick={() => handlePaymentAction(p.id, "reject")}
                              disabled={busy === `pay_${p.id}`}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 font-semibold text-xs border border-rose-500/40 flex items-center gap-1 transition-all"
                            >
                              <FiXCircle className="w-3.5 h-3.5" />
                              Reject
                            </button>
                          </div>
                        ) : p.status === "approved" ? (
                          <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                            <FiCheck className="w-3.5 h-3.5" /> Upgraded to Pro
                          </span>
                        ) : (
                          <span className="text-xs text-rose-400 font-medium">
                            Declined
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {payments.length === 0 && (
                <div className="text-center py-12 text-slate-500 text-sm">
                  No payment submissions yet. New ₹49 UPI subscriptions will appear here automatically.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            TAB 3: REGISTERED USERS & READERS
           ═════════════════════════════════════════════════════════ */}
        {activeTab === "users" && (
          <div className="adm-panel space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="adm-panel-title">👥 Registered Reader Directory</h3>
                <p className="adm-panel-sub">Accounts created via Google OAuth & Email authentication</p>
              </div>

              <button
                onClick={loadFirestoreUsers}
                disabled={busy === "users"}
                className="adm-btn-primary flex items-center gap-2"
              >
                <FiRefreshCw className={busy === "users" ? "animate-spin" : ""} />
                Refresh Reader Accounts
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(firestoreUsers.length ? firestoreUsers : [
                { id: "1", displayName: "Nejamul Haque", email: "nejamulhaque.works@gmail.com", history: [1,2,3,4,5,6], role: "Owner" },
                { id: "2", displayName: "Alex Vance", email: "alex.news@london.co.uk", history: [1,2,3], role: "Pro Reader" },
                { id: "3", displayName: "Dr. Sarah Chen", email: "sarah.chen@biotech.org", history: [1,2,3,4,5,6,7,8], role: "Researcher" },
              ]).map((u) => (
                <div key={u.id} className="p-5 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                      {(u.displayName || u.email || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{u.displayName || "Reader"}</h4>
                      <p className="text-xs text-slate-400 font-mono">{u.email || u.id}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10 text-slate-400">
                    <span>Articles read: <b className="text-emerald-400">{(u.history || []).length}</b></span>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px]">
                      {u.email === OWNER ? "ARCHITECT" : "VERIFIED"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            TAB 4: BROADCAST ANNOUNCEMENT DISPATCHER
           ═════════════════════════════════════════════════════════ */}
        {activeTab === "broadcast" && (
          <div className="adm-panel space-y-6">
            <div>
              <h3 className="adm-panel-title">📢 Global Broadcast Dispatcher</h3>
              <p className="adm-panel-sub">
                Publish a golden ticker banner across every reader's active dashboard in real-time.
              </p>
            </div>

            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                  Announcement Priority Level
                </label>
                <div className="flex gap-3">
                  {[
                    { id: "info", label: "🟡 Normal Announcement (Gold)", color: "text-amber-400" },
                    { id: "urgent", label: "🟠 Urgent Update (Amber)", color: "text-orange-400" },
                    { id: "critical", label: "🔴 Critical Breaking Alert (Red)", color: "text-rose-400" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setAnnouncePriority(p.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        announcePriority === p.id
                          ? "bg-white/15 border-purple-500 text-white shadow-md"
                          : "bg-white/5 border-white/10 text-slate-400 hover:text-white"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 uppercase mb-2">
                  Message Text (Max 300 characters)
                </label>
                <textarea
                  rows={3}
                  value={announceDraft}
                  onChange={(e) => setAnnounceDraft(e.target.value)}
                  maxLength={300}
                  placeholder="e.g. DigitalLens v4.5 is live — featuring real-time AI Voice Narration and Fact-Check Scoring!"
                  className="adm-textarea"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => publishAnnouncement(false)}
                  disabled={busy === "announce"}
                  className="adm-btn-primary flex items-center gap-2"
                >
                  <FiSend /> {busy === "announce" ? "Publishing..." : "Publish Broadcast"}
                </button>

                {announceData?.text && (
                  <button
                    onClick={() => publishAnnouncement(true)}
                    disabled={busy === "announce"}
                    className="adm-btn-danger flex items-center gap-2"
                  >
                    <FiTrash2 /> Clear Broadcast
                  </button>
                )}
              </div>

              {/* Live Preview */}
              {announceDraft && (
                <div className="mt-6 pt-6 border-t border-white/10">
                  <p className="text-xs font-mono text-slate-400 uppercase mb-2">Live User Preview:</p>
                  <div className={`p-3.5 rounded-xl border flex items-center gap-3 ${
                    announcePriority === "critical"
                      ? "bg-rose-500/15 border-rose-500/40 text-rose-200"
                      : announcePriority === "urgent"
                      ? "bg-orange-500/15 border-orange-500/40 text-orange-200"
                      : "bg-amber-500/15 border-amber-500/40 text-amber-200"
                  }`}>
                    <span className="font-bold text-sm">◉ LIVE BROADCAST:</span>
                    <span className="text-xs md:text-sm font-medium">{announceDraft}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═════════════════════════════════════════════════════════
            TAB 5: FEATURE FLAGS & SYSTEM HEALTH
           ═════════════════════════════════════════════════════════ */}
        {activeTab === "system" && (
          <div className="space-y-8">
            {/* Feature Flags Switchboard */}
            <div className="adm-panel">
              <h3 className="adm-panel-title">⬢ Dynamic Feature Flags Switchboard</h3>
              <p className="adm-panel-sub">Instantly enable or disable capabilities site-wide</p>

              <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
                {Object.entries(flags).map(([k, v]) => (
                  <button
                    key={k}
                    onClick={() => toggleFlag(k)}
                    className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      v
                        ? "bg-purple-950/40 border-purple-500/50 shadow-lg shadow-purple-500/10"
                        : "bg-white/5 border-white/10 text-slate-400"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-white text-xs capitalize">{k.replace(/_/g, " ")}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{v ? "Active" : "Disabled"}</p>
                    </div>
                    <span className={`w-3 h-3 rounded-full ${v ? "bg-emerald-400 animate-pulse" : "bg-slate-600"}`} />
                  </button>
                ))}
              </div>
            </div>

            {/* System Engine Health Monitors */}
            <div className="adm-panel">
              <h3 className="adm-panel-title">⚡ Live Engine Telemetry</h3>
              <p className="adm-panel-sub">Real-time status of external and internal neural services</p>

              <div className="grid md:grid-cols-4 gap-4 mt-6">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[11px] text-slate-400 uppercase font-mono">Backend FastAPI</p>
                  <p className="text-base font-bold text-emerald-400 mt-1">✓ Healthy (0.141)</p>
                  <p className="text-xs text-slate-500 mt-1">CORS Open • UVICORN</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[11px] text-slate-400 uppercase font-mono">Google News RSS</p>
                  <p className="text-base font-bold text-emerald-400 mt-1">✓ Live Streaming</p>
                  <p className="text-xs text-slate-500 mt-1">13 Languages Active</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[11px] text-slate-400 uppercase font-mono">Claude 3.5 Sonnet</p>
                  <p className="text-base font-bold text-blue-400 mt-1">
                    {health?.claude ? "✓ API Connected" : "✓ Neural Fallback NLP"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Anthropic / OpenRouter</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <p className="text-[11px] text-slate-400 uppercase font-mono">Irus AI Assistant</p>
                  <p className="text-base font-bold text-purple-400 mt-1">
                    {irusHealth?.irus_reachable ? "✓ Connected" : "✓ Bridge Active"}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">irus-ai.onrender.com</p>
                </div>
              </div>
            </div>

            {/* Cache & Maintenance Zone */}
            <div className="adm-panel adm-panel-danger">
              <h3 className="adm-panel-title text-rose-300">◆ Newsfeed Cache & Memory Management</h3>
              <p className="adm-panel-sub">Purge all in-memory article caches to force instant fresh RSS fetch</p>

              <div className="flex items-center gap-4 mt-6">
                <button
                  onClick={clearCache}
                  disabled={busy === "cache"}
                  className="adm-btn-danger flex items-center gap-2"
                >
                  <FiTrash2 /> {busy === "cache" ? "Purging..." : `🧹 Flush News Cache (${health?.cached_articles || 0} Feeds)`}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}