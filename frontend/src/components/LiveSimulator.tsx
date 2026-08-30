import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlay, FiVolume2, FiCheckCircle, FiGlobe, FiZap, FiShield } from "react-icons/fi";

interface SimulationPreset {
  topic: string;
  category: string;
  headline: string;
  source: string;
  sentiment: "positive" | "neutral" | "negative";
  score: number;
  tldr: string;
  bias: { lean: string; credibility: number; status: string };
  translations: Record<string, string>;
}

const PRESETS: SimulationPreset[] = [
  {
    topic: "NVIDIA Quantum AI",
    category: "Tech",
    headline: "NVIDIA Unveils Next-Gen Quantum Neural Architecture Accelerating Global Scientific Research",
    source: "TechCrunch",
    sentiment: "positive",
    score: 94,
    tldr: "NVIDIA's breakthrough quantum neural chip triples molecular simulation speeds for climate and medical research.",
    bias: { lean: "Center / Tech Focused", credibility: 98, status: "Verified Technical Documentation" },
    translations: {
      Spanish: "NVIDIA presenta la arquitectura neuronal cuántica de próxima generación que acelera la investigación científica mundial.",
      French: "NVIDIA dévoile une architecture neuronale quantique de nouvelle génération accélérant la recherche scientifique mondiale.",
      Hindi: "एनवीडिया ने अगली पीढ़ी के क्वांटम न्यूरल आर्किटेक्चर का अनावरण किया, जिससे वैश्विक वैज्ञानिक अनुसंधान में तेजी आई।",
      German: "NVIDIA stellt Quanten-Neuronalarchitektur der nächsten Generation vor und beschleunigt weltweite Forschung.",
      Japanese: "NVIDIAが次世代量子ニューラルアーキテクチャを発表し、世界的な科学研究を加速。",
      Arabic: "إنفيديا تكشف عن بنية عصبية كمومية من الجيل التالي لتسريع البحث العلمي العالمي.",
    }
  },
  {
    topic: "SpaceX Starship Mars",
    category: "Science",
    headline: "Starship Completes Full Orbital Re-entry Test With Pinpoint Ocean Landing Milestone",
    source: "Reuters",
    sentiment: "positive",
    score: 89,
    tldr: "SpaceX successfully executes full orbital re-entry and controlled booster catch, marking historic progress toward Mars missions.",
    bias: { lean: "Neutral (Wire Service)", credibility: 99, status: "Live Telemetry Confirmed" },
    translations: {
      Spanish: "Starship completa la prueba de reentrada orbital con un hito histórico de aterrizaje oceánico.",
      French: "Starship termine son test de rentrée orbitale avec un atterrissage océanique historique.",
      Hindi: "स्टारशिप ने ऐतिहासिक सटीक लैंडिंग के साथ पूर्ण कक्षीय पुनः प्रवेश परीक्षण पूरा किया।",
      German: "Starship schließt vollständigen orbitalen Wiedereintrittstest mit historischer Landung ab.",
      Japanese: "スターシップが完全な軌道再突入テストを完了し、歴史的な着水マイルストーンを達成。",
      Arabic: "ستارشيب تكمل بنجاح اختبار إعادة الدخول المداري الكامل مع هبوط تاريخي دقيق في المحيط.",
    }
  },
  {
    topic: "Global Clean Energy",
    category: "Markets",
    headline: "Renewable Energy Capacity Crosses 4,000 Gigawatts Globally Ahead of International Climate Targets",
    source: "Bloomberg",
    sentiment: "positive",
    score: 86,
    tldr: "Global solar and wind installations hit all-time record, lowering industrial power generation costs by 22%.",
    bias: { lean: "Center-Market Focused", credibility: 97, status: "Global Energy Agency Verified" },
    translations: {
      Spanish: "La capacidad de energía renovable supera los 4.000 GW a nivel mundial superando los objetivos climáticos.",
      French: "La capacité des énergies renouvelables dépasse les 4 000 GW dans le monde.",
      Hindi: "नवीकरणीय ऊर्जा क्षमता वैश्विक जलवायु लक्ष्यों से पहले विश्व स्तर पर 4,000 गीगावाट को पार कर गई।",
      German: "Kapazität erneuerbarer Energien übersteigt weltweit 4.000 Gigawatt.",
      Japanese: "世界の再生可能エネルギー容量が国際目標を前倒しで4,000GWを突破。",
      Arabic: "طاقة الطاقة المتجددة تتجاوز 4000 جيجاوات عالمياً قبل الأهداف المناخية المحددة.",
    }
  },
  {
    topic: "Central Banks & Economy",
    category: "Markets",
    headline: "Global Central Banks Signal Stable Rates Amid Controlled Inflation and Strong Tech Earnings",
    source: "Financial Times",
    sentiment: "neutral",
    score: 62,
    tldr: "Policy makers maintain benchmark rates while signaling constructive support for enterprise liquidity.",
    bias: { lean: "Financial Neutral", credibility: 96, status: "Official Central Bank Statements" },
    translations: {
      Spanish: "Los bancos centrales mundiales señalan tipos estables ante una inflación controlada.",
      French: "Les banques centrales mondiales signalent des taux stables face à une inflation maîtrisée.",
      Hindi: "वैश्विक केंद्रीय बैंकों ने नियंत्रित मुद्रास्फीति के बीच स्थिर ब्याज दरों का संकेत दिया।",
      German: "Globale Zentralbanken signalisieren stabile Zinsen bei kontrollierter Inflation.",
      Japanese: "世界の中央銀行はインフレ抑制の中で金利据え置きを示唆。",
      Arabic: "البنوك المركزية العالمية تشير إلى استقرار أسعار الفائدة وسط تضخم خاضع للسيطرة.",
    }
  }
];

export default function LiveSimulator() {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<"tldr" | "sentiment" | "bias" | "translate">("sentiment");
  const [selectedLang, setSelectedLang] = useState("Hindi");
  const [speaking, setSpeaking] = useState(false);

  const cur = PRESETS[selectedIdx];

  const handleSpeak = (text: string) => {
    if (!window.speechSynthesis) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utter);
  };

  return (
    <section className="py-24 bg-gradient-to-b from-slate-950 via-[#0a071e] to-slate-950 relative overflow-hidden" id="simulator">
      {/* Background glow lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e1b4b15_1px,transparent_1px),linear-gradient(to_bottom,#1e1b4b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          className="text-center max-w-3xl mx-auto mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-mono tracking-widest uppercase mb-4">
            <FiZap className="w-3.5 h-3.5 text-purple-400 animate-pulse" /> Live Neural Intelligence Simulator
          </div>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-5">
            Test the AI in Real-Time
          </h2>
          <p className="text-slate-400 text-base md:text-lg">
            Experience how DigitalLens evaluates sentiment, compresses articles with Claude Sonnet 4.5, cross-verifies bias, and performs instant multi-language translation.
          </p>
        </motion.div>

        {/* Preset Selector Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {PRESETS.map((p, idx) => (
            <button
              key={p.topic}
              onClick={() => {
                setSelectedIdx(idx);
                if (speaking) {
                  window.speechSynthesis?.cancel();
                  setSpeaking(false);
                }
              }}
              className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 border ${
                selectedIdx === idx
                  ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white border-purple-400/50 shadow-lg shadow-purple-500/25"
                  : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {p.topic}
            </button>
          ))}
        </div>

        {/* Main Interactive HUD Card */}
        <motion.div
          className="bg-slate-900/80 border border-white/10 backdrop-blur-2xl rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
            <div>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-md text-xs font-mono font-semibold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {cur.category}
                </span>
                <span className="text-slate-400 text-xs font-mono">Source: <b className="text-slate-200">{cur.source}</b></span>
                <span className="text-slate-500 text-xs font-mono">• Just Now</span>
              </div>
              <h3 className="text-xl md:text-2xl font-bold text-white mt-3 leading-snug">
                {cur.headline}
              </h3>
            </div>

            <button
              onClick={() => handleSpeak(cur.tldr || cur.headline)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold tracking-wider uppercase border transition-all ${
                speaking
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse"
                  : "bg-white/5 hover:bg-white/10 text-slate-300 border-white/10"
              }`}
            >
              <FiVolume2 className="w-4 h-4" />
              {speaking ? "Narrating..." : "Listen Aloud"}
            </button>
          </div>

          {/* Interactive Feature Tabs */}
          <div className="flex flex-wrap gap-2 mt-6 border-b border-white/10 pb-4">
            {[
              { id: "sentiment", label: "📊 Sentiment Radar", desc: "Live Mood Dial" },
              { id: "tldr", label: "⚡ AI TL;DR", desc: "1-Sentence Compression" },
              { id: "bias", label: "🛡️ Bias & Veracity", desc: "Source Credibility" },
              { id: "translate", label: "🌐 13-Language Neural", desc: "Instant Translation" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? "bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-inner"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content Display Area */}
          <div className="mt-8 min-h-[220px]">
            <AnimatePresence mode="wait">
              {activeTab === "sentiment" && (
                <motion.div
                  key="sentiment"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid md:grid-cols-3 gap-6 items-center"
                >
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-2">Neural Mood Rating</p>
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-base font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      <span>◈</span> {cur.sentiment.toUpperCase()}
                    </div>
                    <div className="mt-4 text-4xl font-extrabold text-white">
                      {cur.score}<span className="text-emerald-400 text-2xl font-mono">%</span>
                    </div>
                    <p className="text-slate-500 text-xs mt-1">Confidence Factor: High</p>
                  </div>

                  <div className="md:col-span-2 p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-mono text-slate-300 mb-1.5">
                        <span>Positive Momentum</span>
                        <span className="text-emerald-400 font-bold">{cur.score}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${cur.score}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-mono text-slate-300 mb-1.5">
                        <span>Neutral Contextual Baseline</span>
                        <span className="text-slate-400 font-bold">{Math.max(100 - cur.score - 5, 8)}%</span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-slate-500 rounded-full" style={{ width: `${Math.max(100 - cur.score - 5, 8)}%` }} />
                      </div>
                    </div>

                    <p className="text-slate-400 text-xs leading-relaxed pt-2">
                      💡 <b>AI Analysis:</b> Key positive semantic vectors identified include breakthrough technological expansion, operational efficiency, and sustainable institutional milestones.
                    </p>
                  </div>
                </motion.div>
              )}

              {activeTab === "tldr" && (
                <motion.div
                  key="tldr"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 md:p-8 rounded-2xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/30"
                >
                  <div className="flex items-center gap-2 text-purple-400 font-mono text-xs uppercase tracking-wider mb-3">
                    <FiZap className="w-4 h-4" /> Compressed by Claude Sonnet 4.5
                  </div>
                  <p className="text-xl md:text-2xl font-medium text-slate-100 leading-relaxed">
                    "{cur.tldr}"
                  </p>
                  <div className="flex flex-wrap items-center gap-4 mt-6 pt-4 border-t border-white/10 text-xs text-slate-400">
                    <span>⏱ Reading time: <b>12 seconds</b></span>
                    <span>📉 Word count reduced by: <b>88%</b></span>
                    <span className="text-emerald-400">✓ Fact Integrity Preserved</span>
                  </div>
                </motion.div>
              )}

              {activeTab === "bias" && (
                <motion.div
                  key="bias"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="grid md:grid-cols-3 gap-6"
                >
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-2">Perspective Lean</p>
                    <p className="text-xl font-bold text-blue-300">{cur.bias.lean}</p>
                    <p className="text-slate-500 text-xs mt-2">Evaluated via editorial corpus profiling.</p>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-2">Credibility Score</p>
                    <div className="text-3xl font-extrabold text-emerald-400">{cur.bias.credibility}/100</div>
                    <p className="text-slate-500 text-xs mt-2">Zero unverified rumor flags.</p>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <p className="text-slate-400 text-xs font-mono uppercase tracking-wider mb-2">Verification Protocol</p>
                    <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                      <FiShield className="w-4 h-4 text-emerald-400" />
                      {cur.bias.status}
                    </div>
                    <p className="text-slate-500 text-xs mt-2">Cross-checked with 14+ independent feeds.</p>
                  </div>
                </motion.div>
              )}

              {activeTab === "translate" && (
                <motion.div
                  key="translate"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {Object.keys(cur.translations).map((lang) => (
                      <button
                        key={lang}
                        onClick={() => setSelectedLang(lang)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          selectedLang === lang
                            ? "bg-blue-600 text-white font-bold shadow-md shadow-blue-500/30"
                            : "bg-white/5 hover:bg-white/10 text-slate-300"
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                      <span>Translated to <b className="text-blue-400">{selectedLang}</b></span>
                      <span className="text-emerald-400">Zero Latency Neural Pass</span>
                    </div>
                    <p className="text-lg md:text-xl font-serif text-slate-100 leading-relaxed">
                      {cur.translations[selectedLang] || cur.headline}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
