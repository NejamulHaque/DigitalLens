import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiX, FiMail, FiLock, FiUser } from "react-icons/fi";
import { FcGoogle } from "react-icons/fc";
import { useAuth } from "../context/AuthContext";

interface AuthModalProps {
  type: "login" | "signup";
  onClose: () => void;
  onSwitch: (t: "login" | "signup") => void;
}

const ERR: Record<string, string> = {
  "auth/invalid-credential": "Wrong email or password. Try again.",
  "auth/user-not-found": "No account found — create one instead.",
  "auth/wrong-password": "Wrong password. Try again.",
  "auth/email-already-in-use": "Email already registered — sign in instead.",
  "auth/weak-password": "Password must be at least 6 characters.",
  "auth/too-many-requests": "Too many attempts. Wait a moment.",
  "auth/network-request-failed": "Network error — check your connection.",
  "auth/popup-closed-by-user": "Google popup was closed.",
  "auth/popup-blocked": "Popup blocked — allow popups for this site.",
};

export default function AuthModal({ type, onClose, onSwitch }: AuthModalProps) {
  const auth: any = useAuth();
  // 👇 Fallbacks in case your AuthContext uses different names
  const login = auth.login || auth.signIn || auth.loginWithEmail;
  const signup = auth.signup || auth.register || auth.signUp;
  const loginWithGoogle = auth.loginWithGoogle || auth.googleLogin || auth.signInWithGoogle;
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"form" | "google" | null>(null);
  const [error, setError] = useState("");

  const finish = () => {
    onClose();
    navigate("/app"); // 🚀 straight into the newsroom
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setBusy("form");
    try {
      if (type === "signup") await signup(name, email, password);
      else await login(email, password);
      finish();
    } catch (err: any) {
      setError(ERR[err?.code] || "Something went wrong. Please try again.");
      setBusy(null);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setBusy("google");
    try {
      await loginWithGoogle();
      finish();
    } catch (err: any) {
      setError(ERR[err?.code] || "Google sign-in failed.");
      setBusy(null);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-md bg-slate-900 rounded-2xl border border-white/10 p-8"
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/40 hover:text-white transition-colors">
          <FiX className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <span className="text-white font-bold text-lg">◉</span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-1">
            {type === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-white/60 text-sm">
            {type === "login" ? "Sign in to continue to DigitalLens" : "Free forever. No credit card."}
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
            ⚠ {error}
          </div>
        )}

        <button
          onClick={handleGoogle}
          disabled={busy !== null}
          className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white rounded-xl font-semibold text-slate-900 hover:bg-white/90 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed mb-5"
        >
          {busy === "google" ? (
            <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin" />
          ) : (
            <FcGoogle className="w-5 h-5" />
          )}
          Continue with Google
        </button>

        <div className="relative mb-5">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
          <div className="relative flex justify-center text-sm"><span className="px-4 bg-slate-900 text-white/40">or with email</span></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {type === "signup" && (
            <div className="relative">
              <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
              <input type="text" required placeholder="Full Name" value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all" />
            </div>
          )}

          <div className="relative">
            <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="email" required placeholder="Email Address" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all" />
          </div>

          <div className="relative">
            <FiLock className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
            <input type="password" required minLength={6} placeholder="Password (6+ characters)" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all" />
          </div>

          <button type="submit" disabled={busy !== null}
            className="w-full px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed">
            {busy === "form" ? "Please wait…" : type === "login" ? "Sign In →" : "Create Free Account →"}
          </button>
        </form>

        <p className="text-center text-white/60 mt-5 text-sm">
          {type === "login" ? "Don't have an account? " : "Already have an account? "}
          <button onClick={() => onSwitch(type === "login" ? "signup" : "login")}
            className="text-purple-400 hover:text-purple-300 font-semibold transition-colors">
            {type === "login" ? "Sign Up" : "Sign In"}
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
}