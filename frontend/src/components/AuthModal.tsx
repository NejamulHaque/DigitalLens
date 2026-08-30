// src/components/AuthModal.tsx — Unified & Resilient Auth Modal
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiMail, FiLock, FiUser, FiArrowRight, FiShield, FiCheckCircle } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

interface AuthModalProps {
  type?: "login" | "signup";
  isOpen?: boolean;
  onClose: () => void;
  onSwitch?: (t: "login" | "signup") => void;
}

export default function AuthModal({
  type: initialType = "login",
  isOpen = true,
  onClose,
  onSwitch,
}: AuthModalProps) {
  const { login, signup }: any = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"login" | "signup">(initialType);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (initialType) setMode(initialType);
  }, [initialType]);

  const handleSwitchMode = (newMode: "login" | "signup") => {
    setMode(newMode);
    setError("");
    setSuccessMsg("");
    if (onSwitch) onSwitch(newMode);
  };

  const cleanErrorMessage = (err: any): string => {
    const raw = String(err?.message || err?.detail || err || "");
    if (raw.toLowerCase().includes("already registered") || raw.toLowerCase().includes("already-in-use")) {
      return "This email is already registered. Please sign in.";
    }
    if (raw.toLowerCase().includes("invalid email or password") || raw.toLowerCase().includes("invalid-credential") || raw.toLowerCase().includes("bad request")) {
      return "Invalid email or password. If you haven't created an account yet, click 'Create Account' above.";
    }
    if (raw.toLowerCase().includes("at least 6 characters") || raw.toLowerCase().includes("weak-password")) {
      return "Password must be at least 6 characters long.";
    }
    if (raw.toLowerCase().includes("invalid email")) {
      return "Please enter a valid email address.";
    }
    return raw || "Authentication failed. Please check your credentials.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        await signup(name.trim() || "Reader", email.trim().toLowerCase(), password);
        setSuccessMsg("Account created successfully!");
      } else {
        await login(email.trim().toLowerCase(), password);
        setSuccessMsg("Welcome back!");
      }

      setTimeout(() => {
        onClose();
        navigate("/app");
      }, 500);
    } catch (err: any) {
      setError(cleanErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          className="relative w-full max-w-md bg-slate-900 border border-purple-500/30 rounded-3xl p-7 md:p-8 shadow-2xl text-white overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.22 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/5 hover:bg-white/15 text-slate-400 hover:text-white transition-colors"
          >
            <FiX className="w-5 h-5" />
          </button>

          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
              <span className="text-white font-bold text-xl">◉</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {mode === "login" ? "Welcome Back" : "Create Your Account"}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              {mode === "login"
                ? "Sign in to access your personalized AI newsroom"
                : "Free forever · No credit card required"}
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex p-1 rounded-xl bg-slate-800/80 border border-slate-700 mb-5">
            <button
              type="button"
              onClick={() => handleSwitchMode("login")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === "login"
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleSwitchMode("signup")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === "signup"
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 text-xs leading-relaxed"
            >
              <p>⚠ {error}</p>
              {mode === "login" && error.includes("Invalid email or password") && (
                <button
                  type="button"
                  onClick={() => handleSwitchMode("signup")}
                  className="mt-2 text-amber-300 hover:text-amber-200 underline font-semibold text-[11px] block"
                >
                  → Click here to register this email with Create Account
                </button>
              )}
            </motion.div>
          )}

          {/* Success Message */}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2"
            >
              <FiCheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === "signup" && (
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Full Name</label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nejamul Haque"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Email Address</label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Password {mode === "signup" && <span className="text-slate-500 font-normal">(min. 6 characters)</span>}
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full mt-2 py-3 px-6 rounded-xl font-bold text-sm text-center bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-xl shadow-purple-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {busy ? (
                "Authenticating…"
              ) : mode === "login" ? (
                <>
                  <span>Enter Newsroom</span>
                  <FiArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Create Free Account</span>
                  <FiArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-5 pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <FiShield className="w-3.5 h-3.5 text-emerald-400" />
              <span>Protected by Neon Database & End-to-End Cryptography</span>
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}