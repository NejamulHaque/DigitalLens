import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiPlay, FiZap, FiCheckCircle } from "react-icons/fi";

const WORDS = [
  "Claude 3.5 Sonnet Deep Insights.",
  "Real-Time NLP Sentiment Scoring.",
  "Irus AI Voice & Search Copilot.",
  "13-Language Neural Translation.",
  "Instant 1-Sentence AI TL;DRs.",
];

function useTypewriter(words: string[], typeMs = 60, delMs = 25, pauseMs = 1600) {
  const [text, setText] = useState("");
  const [idx, setIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const word = words[idx % words.length];
    let t: any;
    if (!deleting && text === word) t = setTimeout(() => setDeleting(true), pauseMs);
    else if (deleting && text === "") { setDeleting(false); setIdx((i) => i + 1); }
    else t = setTimeout(() => setText(word.slice(0, text.length + (deleting ? -1 : 1))), deleting ? delMs : typeMs);
    return () => clearTimeout(t);
  }, [text, deleting, idx, words, typeMs, delMs, pauseMs]);

  return text;
}

/* ── 3D rotating particle globe ── */
function Globe() {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      const size = canvas.offsetWidth;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    const N = 480;
    const pts: { x: number; y: number; z: number }[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const th = golden * i;
      pts.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r });
    }

    let rot = 0;
    let raf = 0;
    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      const R = W * 0.42;
      const cx = W / 2, cy = H / 2;
      rot += 0.0035;

      const g = ctx.createRadialGradient(cx, cy, R * 0.35, cx, cy, R * 1.25);
      g.addColorStop(0, "rgba(147, 51, 234, 0.18)");
      g.addColorStop(0.5, "rgba(59, 130, 246, 0.10)");
      g.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      const cos = Math.cos(rot), sin = Math.sin(rot);
      const tilt = 0.38, ct = Math.cos(tilt), st = Math.sin(tilt);

      for (const p of pts) {
        const x1 = p.x * cos + p.z * sin;
        const z1 = -p.x * sin + p.z * cos;
        const y1 = p.y * ct - z1 * st;
        const z2 = p.y * st + z1 * ct;

        const px = cx + x1 * R;
        const py = cy + y1 * R;
        const depth = (z2 + 1) / 2;

        const size = (0.6 + depth * 2.0) * dpr;
        const alpha = 0.15 + depth * 0.85;
        const hue = 220 + (p.y + 1) * 45;

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 92%, ${60 + depth * 20}%, ${alpha})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return <canvas ref={ref} className="globe-canvas" />;
}

const CHIPS = [
  { glyph: "◈", title: "Sentiment Radar", sub: "Live NLP Tone Dial", style: { top: "6%", left: "-4%" }, delay: "0s" },
  { glyph: "⬡", title: "Claude Sonnet 4.5", sub: "Deep Analytical Takeaways", style: { top: "16%", right: "-6%" }, delay: "1.4s" },
  { glyph: "🌐", title: "13 Global Languages", sub: "Instant Neural Translation", style: { bottom: "18%", left: "-8%" }, delay: "2.2s" },
  { glyph: "◉", title: "Irus AI Copilot", sub: "Live Web Search & Voice", style: { bottom: "6%", right: "-2%" }, delay: "3s" },
];

export default function Hero() {
  const typed = useTypewriter(WORDS);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-[#100b2b] to-slate-950 pt-32 pb-24">
      <style>{`
        .globe-canvas{width:100%;max-width:540px;aspect-ratio:1/1;display:block;margin:0 auto;filter:drop-shadow(0 0 50px rgba(139,92,246,.35))}
        .globe-wrap{position:relative}
        .chip{position:absolute;display:flex;gap:12px;align-items:center;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(16px);border-radius:16px;padding:12px 16px;animation:chipFloat 6.5s ease-in-out infinite;box-shadow:0 12px 35px rgba(0,0,0,.45)}
        .chip-glyph{font-size:18px;color:#a78bfa}
        .chip-title{font-size:13px;font-weight:700;color:#fff}
        .chip-sub{font-size:11px;color:rgba(255,255,255,.6)}
        @keyframes chipFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        .type-grad{background:linear-gradient(90deg,#60a5fa,#a78bfa,#f472b6,#60a5fa);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:gradFlow 5s linear infinite}
        @keyframes gradFlow{from{background-position:0 0}to{background-position:200% 0}}
        .caret{color:#a78bfa;animation:caretBlink 1s steps(1) infinite;font-weight:300}
        @keyframes caretBlink{50%{opacity:0}}
        @media(max-width:1024px){.chip{display:none}}
      `}</style>

      {/* Ambient background glowing orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-[450px] h-[450px] rounded-full opacity-25"
            style={{
              background: `radial-gradient(circle, ${["#7c3aed", "#2563eb", "#ec4899"][i]} 0%, transparent 70%)`,
              left: `${10 + i * 32}%`,
              top: `${5 + i * 20}%`,
            }}
            animate={{ x: [0, 80, 0], y: [0, -50, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 12 + i * 2, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center w-full">
        {/* Left Column: Headlines & CTAs */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8 shadow-inner">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wider">
                DigitalLens Intelligence Live
              </span>
            </div>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 leading-[1.08] tracking-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            The News, Decoded by
            <br />
            <span className="type-grad">{typed}</span>
            <span className="caret">|</span>
          </motion.h1>

          <motion.p
            className="text-base sm:text-lg text-slate-300 mb-10 max-w-xl leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.35 }}
          >
            DigitalLens fuses real-time Google RSS feeds with instant sentiment scoring, Claude 3.5 Sonnet analysis, Irus AI superpowers, and automated audio voice narration. Stay informed, never overwhelmed.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row gap-4 mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5 }}
          >
            <Link
              to="/app"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-2xl text-center hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2"
            >
              Launch Intelligence App <FiArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#simulator"
              className="px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold rounded-2xl text-center hover:bg-white/20 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <FiZap className="w-4 h-4 text-purple-400" /> Test Live AI Simulator
            </a>
          </motion.div>

          {/* Real-Time Platform Stats Counter */}
          <motion.div
            className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-white/10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.65 }}
          >
            {[
              ["<65ms", "Neural Scan"],
              ["2.4M+", "Stories Scored"],
              ["13", "Global Languages"],
              ["99.8%", "Fact Accuracy"],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="text-2xl font-extrabold text-white tracking-tight">{n}</p>
                <p className="text-[11px] text-slate-400 uppercase font-mono tracking-wider mt-0.5">{l}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right Column: 3D Holographic Particle Globe */}
        <motion.div
          className="globe-wrap hidden lg:block"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <Globe />
          {CHIPS.map((c) => (
            <div key={c.title} className="chip" style={{ ...c.style, animationDelay: c.delay }}>
              <span className="chip-glyph">{c.glyph}</span>
              <div>
                <p className="chip-title">{c.title}</p>
                <p className="chip-sub">{c.sub}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}