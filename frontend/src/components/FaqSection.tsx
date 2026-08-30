import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronDown, FiHelpCircle } from "react-icons/fi";

const FAQS = [
  {
    q: "How does DigitalLens source real-time news for free?",
    a: "DigitalLens parses direct, unfiltered Google News RSS feeds across global editions, updating every 5 minutes. When specific keyword queries are requested, it seamlessly uses fallback caching mechanisms and live topic pipelines to guarantee zero rate-limit blocks.",
  },
  {
    q: "How does the AI Sentiment analysis work?",
    a: "Every article headline and description is processed through our real-time NLP lexicon and sentiment scoring engine. The system analyzes weighted positive indicators (growth, rally, breakthrough) and negative indicators (crisis, decline, conflict) to produce normalized scores and a real-time mood ring.",
  },
  {
    q: "What is the difference between Claude 3.5 Sonnet and Irus AI in DigitalLens?",
    a: "Claude 3.5 Sonnet powers deep editorial analysis, 1-sentence TL;DR compression, and knowledge quizzes. Irus AI acts as an interactive copilot equipped with real-time web search capabilities, document intelligence, voice interactions, and long-term memory.",
  },
  {
    q: "How does the real-time 13-language translation work?",
    a: "Articles can be translated on demand into Spanish, French, German, Hindi, Bengali, Urdu, Arabic, Chinese, Japanese, and more using instant neural language models while preserving original editorial tone and context.",
  },
  {
    q: "Can I customize my personalized feed and save stories?",
    a: "Yes! You can choose your preferred interest categories (Tech, Markets, Science, World, Health, etc.) in the 'For You' tab and save articles to your local bookmarks with one click for distraction-free reading anytime.",
  },
];

export default function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="py-24 bg-gradient-to-b from-[#080518] to-slate-950 relative" id="faq">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono tracking-widest uppercase mb-4">
            <FiHelpCircle className="w-3.5 h-3.5 text-blue-400" /> Frequently Asked Questions
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
            Everything You Need to Know
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Got questions about how our AI and RSS pipelines operate? Here are answers to common questions.
          </p>
        </motion.div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <motion.div
                key={faq.q}
                className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                  isOpen ? "bg-white/[0.06] border-purple-500/40 shadow-lg" : "bg-white/[0.02] border-white/10 hover:border-white/20"
                }`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4"
                >
                  <span className="font-bold text-white text-base md:text-lg">
                    {faq.q}
                  </span>
                  <FiChevronDown
                    className={`w-5 h-5 text-slate-400 transition-transform duration-300 shrink-0 ${
                      isOpen ? "rotate-180 text-purple-400" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-6 text-slate-300 text-sm md:text-base leading-relaxed border-t border-white/5 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
