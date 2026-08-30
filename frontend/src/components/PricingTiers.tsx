import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiCheck, FiZap } from "react-icons/fi";
import PaymentModal from "./PaymentModal";

const TIERS = [
  {
    name: "Explorer",
    tagline: "Essential news reading & mood pulse",
    price: "Free",
    period: "Forever",
    featured: false,
    cta: "Start Reading",
    link: "/app",
    features: [
      "Real-time Google RSS feed aggregation",
      "Live NLP Sentiment Scoring (Pos / Neu / Neg)",
      "Daily AI Digest generation",
      "7 Core categories + Search",
      "Bookmarks & local reading history",
      "Basic dark / light broadsheet mode",
    ],
  },
  {
    name: "Pro Intelligence",
    tagline: "Power users, researchers & journalists",
    price: "₹49",
    period: "per month (Billed via UPI)",
    featured: true,
    badge: "Most Popular",
    cta: "Upgrade to Pro — ₹49/mo →",
    link: "payment_modal",
    features: [
      "Everything in Explorer",
      "Claude 3.5 Sonnet Deep Newsroom Takeaways",
      "Irus AI Assistant Copilot & Voice Mode",
      "Instant 13-Language Neural Translation",
      "AI Bias & Source Credibility Radar",
      "Daily Interactive 4-Question News Quiz",
      "Audio Speech Narration Player",
      "Export reports to Markdown & Text",
    ],
  },
  {
    name: "Enterprise Lens",
    tagline: "Custom newsroom & API telemetry",
    price: "Custom",
    period: "Tailored deployment",
    featured: false,
    cta: "Contact Architect",
    link: "#contact",
    features: [
      "Everything in Pro Intelligence",
      "Dedicated high-speed FastAPI endpoints",
      "Custom RSS feeds & private sources ingestion",
      "Full Telemetry & Visitor Analytics suite",
      "Multi-tenant owner command console",
      "Custom domain & white-label design system",
    ],
  },
];

export default function PricingTiers() {
  const [isPayOpen, setIsPayOpen] = useState(false);

  return (
    <section className="py-24 bg-slate-950 relative" id="pricing">
      <PaymentModal isOpen={isPayOpen} onClose={() => setIsPayOpen(false)} />
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono tracking-widest uppercase mb-4">
            <FiZap className="w-3.5 h-3.5 text-purple-400" /> Intelligence Plans
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
            Transparent, Open Intelligence
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Free forever for personal reading. Full AI capabilities unlocked for all registered readers.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {TIERS.map((tier, idx) => (
            <motion.div
              key={tier.name}
              className={`rounded-3xl p-8 flex flex-col justify-between relative transition-all duration-300 ${
                tier.featured
                  ? "bg-gradient-to-b from-[#1c1240] to-slate-900 border-2 border-purple-500/60 shadow-2xl shadow-purple-500/20 md:-translate-y-3"
                  : "bg-white/[0.03] border border-white/10 hover:border-white/20"
              }`}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: idx * 0.1 }}
            >
              {tier.badge && (
                <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-md">
                  {tier.badge}
                </span>
              )}

              <div>
                <h3 className="text-2xl font-bold text-white mb-2">{tier.name}</h3>
                <p className="text-slate-400 text-xs leading-relaxed min-h-[36px]">{tier.tagline}</p>

                <div className="my-6">
                  <span className="text-4xl md:text-5xl font-extrabold text-white">{tier.price}</span>
                  <span className="text-slate-400 text-xs font-mono ml-2 block mt-1">{tier.period}</span>
                </div>

                <div className="space-y-3 pt-4 border-t border-white/10">
                  {tier.features.map((f) => (
                    <div key={f} className="flex items-start gap-3 text-xs text-slate-300">
                      <FiCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4">
                {tier.link === "payment_modal" ? (
                  <button
                    type="button"
                    onClick={() => setIsPayOpen(true)}
                    className="block w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-center bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white shadow-lg shadow-purple-500/30 transition-all cursor-pointer"
                  >
                    {tier.cta}
                  </button>
                ) : tier.link.startsWith("#") ? (
                  <a
                    href={tier.link}
                    className="block w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-center bg-white/10 hover:bg-white/20 text-white transition-all"
                  >
                    {tier.cta}
                  </a>
                ) : (
                  <Link
                    to={tier.link}
                    className="block w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-center bg-white/10 hover:bg-white/20 text-white transition-all"
                  >
                    {tier.cta}
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
