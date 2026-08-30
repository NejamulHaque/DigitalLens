// src/pages/AuthPage.jsx — DigitalLens v4.1 PREMIUM AUTH
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import "./AuthPage.css";

const FEATURES = [
  { glyph: "◈", title: "Sentiment Intelligence", body: "Every story scored positive, neutral or negative — live, as it breaks." },
  { glyph: "⬡", title: "Claude AI Analysis", body: "Key takeaways, context and what to watch next, on demand." },
  { glyph: "◉", title: "Personal Daily Digest", body: "A briefing written for you, from the topics you actually care about." },
  { glyph: "⬢", title: "13-Language Translation", body: "Read the world's news in your own language, instantly." },
];

const STATS = [
  { n: "10K+", l: "Articles analysed" },
  { n: "13", l: "Languages" },
  { n: "8", l: "Live categories" },
];

const TICKER = ["AI reshapes global markets", "Markets rally on tech gains", "Science breakthrough announced", "Sports finals set records", "Health study published"];

function friendlyError(msg) {
  if (!msg) return "Authentication error. Please check your credentials.";
  const text = String(msg);
  if (text.includes("already registered") || text.includes("already-in-use")) return "This email is already registered — please Sign In.";
  if (text.includes("Invalid email or password") || text.includes("invalid-credential") || text.includes("wrong-password")) return "Invalid email or password. Please try again.";
  if (text.includes("at least 6 characters") || text.includes("weak-password")) return "Password must be at least 6 characters.";
  if (text.includes("Invalid email") || text.includes("invalid-email")) return "Please enter a valid email address.";
  return text;
}

export default function AuthPage() {
  const auth = useAuth();
  // 👇 Adjust names if your AuthContext exports differently
  const login = auth.login || auth.signIn || auth.loginWithEmail;
  const signup = auth.signup || auth.register || auth.signUp;
  const loginWithGoogle = auth.loginWithGoogle || auth.googleLogin || auth.signInWithGoogle;

  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [fi, setFi] = useState(0);
  const rootRef = useRef();

  // Rotating feature showcase
  useEffect(() => {
    const t = setInterval(() => setFi((i) => (i + 1) % FEATURES.length), 3800);
    return () => clearInterval(t);
  }, []);

  // Mouse parallax on background orbs
  const onMove = (e) => {
    const r = rootRef.current;
    if (!r) return;
    r.style.setProperty("--mx", (e.clientX / window.innerWidth - 0.5) * 2);
    r.style.setProperty("--my", (e.clientY / window.innerHeight - 0.5) * 2);
  };

  const strength = (() => {
    let s = 0;
    if (pass.length >= 8) s++;
    if (/[A-Z]/.test(pass)) s++;
    if (/[0-9]/.test(pass)) s++;
    if (/[^A-Za-z0-9]/.test(pass)) s++;
    return s;
  })();

  const fail = (code) => {
    setError(friendlyError(code));
    setShake(true);
    setTimeout(() => setShake(false), 500);
    setLoading(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "signup") await signup(name, email, pass);
      else await login(email, pass);
    } catch (err) { fail(err.code || err.message); }
  };

  const google = async () => {
    setError(""); setLoading(true);
    try { await loginWithGoogle(); } catch (err) { fail(err.code || err.message); }
  };

  const f = FEATURES[fi];

  return (
    <div className="auth-root" ref={rootRef} onMouseMove={onMove}>
      {/* Animated background */}
      <div className="auth-bg">
        <div className="auth-grid-lines" />
        <div className="orb orb-1"><div className="orb-core" /></div>
        <div className="orb orb-2"><div className="orb-core" /></div>
        <div className="orb orb-3"><div className="orb-core" /></div>
      </div>

      <div className="auth-shell">
        {/* ── LEFT: Brand story ── */}
        <aside className="auth-brand">
          <a href="/" className="auth-home">← Back to home</a>

          <div className="auth-logo-row">
            <span className="auth-logo-glyph">◉</span>
            <div>
              <h1 className="auth-logo-name">DigitalLens</h1>
              <p className="auth-logo-sub">AI · SENTIMENT · LIVE</p>
            </div>
          </div>

          <h2 className="auth-headline">
            See the news through <span className="auth-gold">intelligence</span>.
          </h2>
          <p className="auth-sub">
            Real-time aggregation, sentiment analysis and Claude AI — in one editorial experience.
          </p>

          {/* Rotating feature card */}
          <div key={fi} className="feat-card">
            <span className="feat-glyph">{f.glyph}</span>
            <div>
              <p className="feat-title">{f.title}</p>
              <p className="feat-body">{f.body}</p>
            </div>
          </div>
          <div className="feat-dots">
            {FEATURES.map((_, i) => (
              <button key={i} className={`feat-dot${i === fi ? " feat-dot-on" : ""}`} onClick={() => setFi(i)} />
            ))}
          </div>

          <div className="auth-stats">
            {STATS.map((s) => (
              <div key={s.l} className="auth-stat">
                <span className="auth-stat-n">{s.n}</span>
                <span className="auth-stat-l">{s.l}</span>
              </div>
            ))}
          </div>

          {/* Mini live ticker */}
          <div className="auth-ticker">
            <span className="auth-ticker-live">LIVE</span>
            <div className="auth-ticker-track">
              <div className="auth-ticker-reel">
                {[...TICKER, ...TICKER].map((t, i) => (
                  <span key={i} className="auth-ticker-item">◆ {t}</span>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ── RIGHT: Auth card ── */}
        <main className="auth-form-side">
          <div className={`auth-card${shake ? " auth-shake" : ""}`}>
            {/* Mode switch */}
            <div className="mode-switch">
              <span className={`mode-pill${mode === "signup" ? " mode-right" : ""}`} />
              <button className={`mode-btn${mode === "login" ? " mode-on" : ""}`} onClick={() => { setMode("login"); setError(""); }}>Sign In</button>
              <button className={`mode-btn${mode === "signup" ? " mode-on" : ""}`} onClick={() => { setMode("signup"); setError(""); }}>Create Account</button>
            </div>

            <h3 className="auth-card-title">{mode === "login" ? "Welcome back" : "Join DigitalLens"}</h3>
            <p className="auth-card-sub">
              {mode === "login" ? "Your newsroom missed you." : "Free forever. No credit card."}
            </p>

            {error && <div className="auth-err">⚠ {error}</div>}

            <form onSubmit={submit} className="auth-form">
              {mode === "signup" && (
                <div className="fld">
                  <input id="a-name" type="text" required value={name} placeholder=" "
                    onChange={(e) => setName(e.target.value)} />
                  <label htmlFor="a-name">Full name</label>
                  <span className="fld-icon">◈</span>
                </div>
              )}

              <div className="fld">
                <input id="a-email" type="email" required value={email} placeholder=" "
                  onChange={(e) => setEmail(e.target.value)} />
                <label htmlFor="a-email">Email address</label>
                <span className="fld-icon">✉</span>
              </div>

              <div className="fld">
                <input id="a-pass" type={showPass ? "text" : "password"} required minLength={6}
                  value={pass} placeholder=" " onChange={(e) => setPass(e.target.value)} />
                <label htmlFor="a-pass">Password</label>
                <span className="fld-icon">⬡</span>
                <button type="button" className="fld-eye" onClick={() => setShowPass((s) => !s)}>
                  {showPass ? "🙈" : "👁"}
                </button>
              </div>

              {mode === "signup" && pass && (
                <div className="strength">
                  <div className="strength-bars">
                    {[1, 2, 3, 4].map((i) => (
                      <span key={i} className={`s-bar${strength >= i ? ` s-on-${strength}` : ""}`} />
                    ))}
                  </div>
                  <span className="strength-lbl">{["Weak", "Weak", "Okay", "Good", "Strong"][strength]}</span>
                </div>
              )}

              {mode === "login" && (
                <div className="auth-row">
                  <label className="remember"><input type="checkbox" defaultChecked /> Remember me</label>
                  <button type="button" className="forgot">Forgot password?</button>
                </div>
              )}

              <button type="submit" className="auth-cta" disabled={loading}>
                {loading ? <span className="auth-spin" /> : <span className="auth-cta-glyph">✦</span>}
                {loading ? "Please wait…" : mode === "login" ? "Enter the Newsroom" : "Create Free Account"}
              </button>
            </form>

            <p className="auth-swap">
              {mode === "login" ? "New to DigitalLens?" : "Already have an account?"}{" "}
              <button className="auth-swap-btn" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}>
                {mode === "login" ? "Create account" : "Sign in"}
              </button>
            </p>
          </div>

          <p className="auth-foot">◉ Crafted by Nejamul Haque · Powered by Irus AI</p>
        </main>
      </div>
    </div>
  );
}