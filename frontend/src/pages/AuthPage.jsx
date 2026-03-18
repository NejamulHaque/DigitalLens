// src/pages/AuthPage.jsx
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./AuthPage.css";

const HEADLINES = [
  "Stay ahead with AI-curated news",
  "Sentiment analysis on every story",
  "Personalised feeds. Zero noise.",
  "Real-time summaries. Deep insights.",
];

export default function AuthPage() {
  const { loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const [mode, setMode]         = useState("login"); // "login" | "register"
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [name, setName]         = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [headline, setHeadline] = useState(0);

  // Rotate headlines
  useEffect(() => {
    const t = setInterval(() => setHeadline(h => (h + 1) % HEADLINES.length), 3200);
    return () => clearInterval(t);
  }, []);

  const friendlyError = (code) => {
    const map = {
      "auth/user-not-found":      "No account found with this email.",
      "auth/wrong-password":      "Incorrect password. Try again.",
      "auth/email-already-in-use":"This email is already registered.",
      "auth/weak-password":       "Password must be at least 6 characters.",
      "auth/invalid-email":       "Please enter a valid email address.",
      "auth/popup-closed-by-user":"Google sign-in was cancelled.",
      "auth/network-request-failed": "Network error. Check your connection.",
    };
    return map[code] || "Something went wrong. Please try again.";
  };

  const handleGoogle = async () => {
    setError(""); setLoading(true);
    try { await loginWithGoogle(); }
    catch (e) { setError(friendlyError(e.code)); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
      } else {
        if (!name.trim()) { setError("Please enter your name."); setLoading(false); return; }
        await registerWithEmail(email, password, name.trim());
      }
    } catch (err) {
      setError(friendlyError(err.code));
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-root">
      {/* ── Left panel ── */}
      <div className="auth-left">
        <div className="auth-left-inner">
          <div className="auth-brand">
            <span className="auth-logo-icon">📰</span>
            <span className="auth-logo-text">DigitalLens</span>
          </div>

          <div className="auth-headline-wrap">
            {HEADLINES.map((h, i) => (
              <p key={i} className={`auth-headline ${i === headline ? "visible" : ""}`}>{h}</p>
            ))}
          </div>

          <p className="auth-sub">
            AI-powered news summaries with real-time sentiment analysis.
            Personalised to what matters to you.
          </p>

          <div className="auth-features">
            {[
              { icon: "🤖", text: "AI summarisation on every article" },
              { icon: "📊", text: "Sentiment & mood analysis" },
              { icon: "🔖", text: "Save & bookmark across sessions" },
              { icon: "⚡", text: "Personalised category feeds" },
            ].map((f, i) => (
              <div key={i} className="auth-feature" style={{ animationDelay: `${i * 0.1}s` }}>
                <span className="auth-feature-icon">{f.icon}</span>
                <span className="auth-feature-text">{f.text}</span>
              </div>
            ))}
          </div>

          {/* Floating cards decoration */}
          <div className="auth-deco">
            <div className="deco-card deco-c1">
              <span className="deco-up">↑ 34%</span>
              <span className="deco-label">Positive stories today</span>
            </div>
            <div className="deco-card deco-c2">
              <span className="deco-num">2.4k</span>
              <span className="deco-label">Articles analysed</span>
            </div>
          </div>
        </div>

        {/* Mesh background blobs */}
        <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
      </div>

      {/* ── Right panel ── */}
      <div className="auth-right">
        <div className="auth-card">
          {/* Mode toggle */}
          <div className="auth-toggle">
            <button className={mode === "login" ? "at-active" : ""} onClick={() => { setMode("login"); setError(""); }}>
              Sign In
            </button>
            <button className={mode === "register" ? "at-active" : ""} onClick={() => { setMode("register"); setError(""); }}>
              Create Account
            </button>
          </div>

          <div className="auth-card-body">
            <h1 className="auth-title">
              {mode === "login" ? "Welcome back" : "Join DigitalLens"}
            </h1>
            <p className="auth-desc">
              {mode === "login"
                ? "Sign in to your personalised news dashboard"
                : "Set up your account in under a minute"}
            </p>

            {/* Google button */}
            <button className="google-btn" onClick={handleGoogle} disabled={loading}>
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            <div className="auth-divider"><span>or</span></div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="auth-form">
              {mode === "register" && (
                <div className="form-group">
                  <label>Full name</label>
                  <input type="text" placeholder="Nejamul Haque"
                    value={name} onChange={e => setName(e.target.value)} required />
                </div>
              )}
              <div className="form-group">
                <label>Email address</label>
                <input type="email" placeholder="you@example.com"
                  value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="form-group">
                <label>
                  Password
                  {mode === "register" && <span className="label-hint">min. 6 characters</span>}
                </label>
                <div className="pass-wrap">
                  <input type={showPass ? "text" : "password"}
                    placeholder={mode === "register" ? "Create a password" : "Enter your password"}
                    value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" className="pass-toggle" onClick={() => setShowPass(s => !s)}>
                    {showPass ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {error && (
                <div className="auth-error">
                  <span>⚠️</span> {error}
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading
                  ? <span className="btn-spinner" />
                  : mode === "login" ? "Sign In →" : "Create Account →"}
              </button>
            </form>

            {mode === "login" && (
              <p className="auth-footer-text">
                Don't have an account?{" "}
                <button className="text-link" onClick={() => { setMode("register"); setError(""); }}>
                  Sign up free
                </button>
              </p>
            )}
            {mode === "register" && (
              <p className="auth-footer-text">
                Already have an account?{" "}
                <button className="text-link" onClick={() => { setMode("login"); setError(""); }}>
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        <p className="auth-legal">
          By continuing you agree to our Terms of Service & Privacy Policy.
          <br />Built by <a href="https://github.com/NejamulHaque" target="_blank" rel="noreferrer">Nejamul Haque</a>
        </p>
      </div>
    </div>
  );
}