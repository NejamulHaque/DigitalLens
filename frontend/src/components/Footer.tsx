import { useState } from "react";
import { Link } from "react-router-dom";
import { FiSend, FiCheck, FiShield, FiHeart } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const auth: any = useAuth();
  const user = auth?.user;
  const isOwner = user?.email === "nejamulhaque.works@gmail.com";

  const handleSubscribe = (e: any) => {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <footer className="bg-slate-950 border-t border-white/10 pt-16 pb-12 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-16 border-b border-white/10">
          {/* Col 1: Brand & Bio */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                DL
              </div>
              <span className="text-xl font-bold text-white tracking-tight">DigitalLens</span>
            </Link>

            <p className="text-slate-400 leading-relaxed text-xs md:text-sm max-w-sm">
              Next-generation AI news intelligence platform uniting real-time Google RSS aggregation, Claude 3.5 Sonnet analysis, Irus AI superpowers, and instant 13-language translation.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-emerald-300">All Neural Services 100% Operational</span>
            </div>
          </div>

          {/* Col 2: Platform Links */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider font-mono">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/app" className="hover:text-white transition-colors">◉ Open Dashboard</Link></li>
              <li><a href="#simulator" className="hover:text-white transition-colors">⚡ Live AI Simulator</a></li>
              <li><a href="#sentiment-radar" className="hover:text-white transition-colors">📊 Sentiment Radar</a></li>
              <li><a href="#comparison" className="hover:text-white transition-colors">🛡️ Feature Matrix</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">💎 Intelligence Plans</a></li>
            </ul>
          </div>

          {/* Col 3: Ecosystem & Portfolio */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider font-mono">Ecosystem</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="https://irus-ai.onrender.com/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Irus AI Assistant ↗</a></li>
              <li><a href="https://collabsheets.onrender.com/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">CollabSheets ↗</a></li>
              <li><a href="https://nestfy-beta.vercel.app/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Nestfy Finance ↗</a></li>
              <li><a href="https://github.com/NejamulHaque" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub Repositories ↗</a></li>
              <li><a href="https://nejamulhaque.vercel.app/" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Developer Portfolio ↗</a></li>
            </ul>
          </div>

          {/* Col 4: Daily Digest Newsletter */}
          <div className="space-y-3">
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider font-mono">Daily Briefing</h4>
            <p className="text-xs text-slate-400">Get the morning AI news digest in your inbox daily.</p>
            {subscribed ? (
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono bg-emerald-500/10 p-2.5 rounded-xl border border-emerald-500/20">
                <FiCheck /> Subscribed successfully!
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@email.com"
                  className="px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                >
                  <FiSend className="w-3 h-3" /> Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Credits Bar */}
        <div className="pt-8 flex flex-wrap items-center justify-between gap-4 text-xs">
          <p>© 2026 DigitalLens. Built with passion by <b className="text-slate-200">Nejamul Haque</b>.</p>
          <div className="flex items-center gap-6">
            <a href="mailto:nejamulhaque.works@gmail.com" className="hover:text-white transition-colors">
              nejamulhaque.works@gmail.com
            </a>
            <a href="https://github.com/NejamulHaque/DigitalLens" target="_blank" rel="noreferrer" className="text-slate-500 hover:text-slate-300 transition-colors">
              Open Source
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
