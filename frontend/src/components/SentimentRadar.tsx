import { useState } from "react";
import { motion } from "framer-motion";
import { FiTrendingUp, FiActivity, FiGlobe, FiPieChart } from "react-icons/fi";

const CATEGORIES = [
  { id: "world", name: "Global / World", icon: "◉", pos: 48, neu: 34, neg: 18, highlight: "International trade talks stabilize key diplomatic ties." },
  { id: "tech", name: "Technology & AI", icon: "⬡", pos: 76, neu: 18, neg: 6, highlight: "Next-gen open source LLMs show 40% efficiency gains." },
  { id: "markets", name: "Markets & Economy", icon: "◈", pos: 62, neu: 26, neg: 12, highlight: "Indices climb on strong quarterly earnings and lowered rate risk." },
  { id: "science", name: "Science & Space", icon: "⬢", pos: 84, neu: 12, neg: 4, highlight: "New lunar rover completes first subterranean mapping run." },
  { id: "health", name: "Health & Medicine", icon: "♥", pos: 70, neu: 22, neg: 8, highlight: "AI-guided antibody discovery enters clinical trials." },
  { id: "culture", name: "Culture & Media", icon: "◆", pos: 65, neu: 28, neg: 7, highlight: "Global creative arts festivals report record in-person attendance." },
];

const TREND_TOPICS = [
  { tag: "Neural Architecture", mood: "pos" },
  { tag: "Quantum Computing", mood: "pos" },
  { tag: "Central Bank Rates", mood: "neu" },
  { tag: "Clean Energy Grid", mood: "pos" },
  { tag: "Biotech Breakthrough", mood: "pos" },
  { tag: "SpaceX Starship", mood: "pos" },
  { tag: "Semiconductor Supply", mood: "neu" },
  { tag: "Global Climate Summit", mood: "neu" },
];

export default function SentimentRadar() {
  const [activeCat, setActiveCat] = useState(CATEGORIES[1]); // Tech default

  return (
    <section className="py-24 bg-slate-950 relative overflow-hidden" id="sentiment-radar">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono tracking-widest uppercase mb-4">
            <FiActivity className="w-3.5 h-3.5 text-blue-400" /> Global Mood Spectrum
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
            Real-Time Sentiment Radar
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Every minute, DigitalLens processes thousands of global RSS feeds, classifying tone, optimism, and risk vectors across every major editorial sector.
          </p>
        </motion.div>

        {/* 2-Column Visual Intelligence Grid */}
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          {/* Left: Category Selector List */}
          <div className="lg:col-span-5 space-y-3">
            {CATEGORIES.map((cat) => {
              const isSelected = activeCat.id === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat)}
                  className={`w-full p-4 rounded-2xl text-left transition-all duration-300 border flex items-center justify-between ${
                    isSelected
                      ? "bg-white/10 border-blue-500/50 shadow-lg shadow-blue-500/10 scale-[1.02]"
                      : "bg-white/5 hover:bg-white/[0.08] border-white/10 text-slate-300"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-xl text-blue-400 font-mono">{cat.icon}</span>
                    <div>
                      <h4 className="font-semibold text-white text-base">{cat.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{cat.pos}% Positive Momentum</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    <FiTrendingUp className="w-3.5 h-3.5" />
                    +{cat.pos}%
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Active Category Deep Dive */}
          <div className="lg:col-span-7 bg-slate-900/90 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <span className="text-3xl text-blue-400">{activeCat.icon}</span>
                <div>
                  <h3 className="text-2xl font-bold text-white">{activeCat.name}</h3>
                  <p className="text-xs font-mono text-slate-400">Live Global Sector Analysis</p>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-mono text-slate-400 uppercase">Sector Health</span>
                <p className="text-emerald-400 font-bold text-sm">Bullish & Constructive</p>
              </div>
            </div>

            {/* Tri-Color Sentiment Meter Bar */}
            <div className="my-8 space-y-3">
              <div className="flex justify-between text-xs font-mono text-slate-300">
                <span className="text-emerald-400 font-semibold">● Positive {activeCat.pos}%</span>
                <span className="text-slate-400 font-semibold">● Neutral {activeCat.neu}%</span>
                <span className="text-rose-400 font-semibold">● Negative {activeCat.neg}%</span>
              </div>

              <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  style={{ width: `${activeCat.pos}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${activeCat.pos}%` }}
                  transition={{ duration: 0.6 }}
                />
                <motion.div
                  className="h-full bg-slate-500"
                  style={{ width: `${activeCat.neu}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${activeCat.neu}%` }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                />
                <motion.div
                  className="h-full bg-rose-500"
                  style={{ width: `${activeCat.neg}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${activeCat.neg}%` }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                />
              </div>
            </div>

            {/* Top Story Takeaway */}
            <div className="p-5 rounded-2xl bg-white/5 border border-white/10 mb-6">
              <p className="text-xs font-mono text-purple-400 uppercase tracking-wider mb-1.5">Sector Lead Insight</p>
              <p className="text-slate-200 text-sm md:text-base font-serif italic">
                "{activeCat.highlight}"
              </p>
            </div>

            {/* Trending Keyword Cloud */}
            <div>
              <p className="text-xs font-mono text-slate-400 uppercase tracking-wider mb-3">Trending Sector Vectors</p>
              <div className="flex flex-wrap gap-2">
                {TREND_TOPICS.map((t) => (
                  <span
                    key={t.tag}
                    className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 hover:border-blue-400/40 hover:text-white transition-all cursor-default"
                  >
                    #{t.tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
