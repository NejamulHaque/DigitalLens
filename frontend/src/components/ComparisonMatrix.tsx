import { motion } from "framer-motion";
import { FiCheck, FiX, FiZap } from "react-icons/fi";

const FEATURES = [
  { name: "Real-Time NLP Sentiment Scoring", dl: true, traditional: false, aggregators: false },
  { name: "Claude 3.5 Sonnet Deep Insights", dl: true, traditional: false, aggregators: false },
  { name: "Irus AI Copilot & Voice Mode", dl: true, traditional: false, aggregators: false },
  { name: "Instant 1-Sentence AI TL;DR", dl: true, traditional: false, aggregators: "Limited" },
  { name: "13-Language Real-Time Translation", dl: true, traditional: false, aggregators: false },
  { name: "Source Bias & Credibility Meter", dl: true, traditional: false, aggregators: false },
  { name: "Interactive News Knowledge Quiz", dl: true, traditional: false, aggregators: false },
  { name: "Unlimited Free RSS Feed Stream", dl: true, traditional: false, aggregators: true },
  { name: "Distraction-Free Luxury Broadsheet UI", dl: true, traditional: false, aggregators: false },
];

export default function ComparisonMatrix() {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-950 to-[#080518] relative" id="comparison">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono tracking-widest uppercase mb-4">
            <FiZap className="w-3.5 h-3.5 text-emerald-400" /> Competitive Advantage
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
            Why Choose DigitalLens?
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            See how DigitalLens outperforms traditional media portals and basic RSS readers with advanced dual-engine AI.
          </p>
        </motion.div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wider font-mono">
                <th className="py-5 px-6 text-slate-400">Feature Capability</th>
                <th className="py-5 px-6 text-purple-400 bg-purple-950/30 rounded-t-2xl font-bold border-t border-x border-purple-500/30 text-center">
                  ◉ DigitalLens
                </th>
                <th className="py-5 px-6 text-slate-400 text-center">Traditional Portals</th>
                <th className="py-5 px-6 text-slate-400 text-center">Generic RSS Apps</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm">
              {FEATURES.map((row, idx) => (
                <tr key={row.name} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4 px-6 font-medium text-slate-200">
                    {row.name}
                  </td>
                  <td className="py-4 px-6 text-center bg-purple-950/20 border-x border-purple-500/20">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                      <FiCheck className="w-4 h-4" />
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center text-slate-400">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-rose-500/10 text-rose-400">
                      <FiX className="w-4 h-4" />
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center text-slate-400">
                    {typeof row.aggregators === "boolean" ? (
                      row.aggregators ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/10 text-emerald-400">
                          <FiCheck className="w-4 h-4" />
                        </span>
                      ) : (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-rose-500/10 text-rose-400">
                          <FiX className="w-4 h-4" />
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-amber-400 font-mono bg-amber-500/10 px-2 py-1 rounded">
                        {row.aggregators}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
