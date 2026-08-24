import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

const WORDS = ["Real-Time Sentiment.", "AI News Digests.", "Irus AI Superpowers.", "13-Language Translation.", "Live Breaking Alerts."];

function useTypewriter(words: string[], typeMs = 65, delMs = 28, pauseMs = 1500) {
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

/* ── 3D rotating particle globe (pure canvas, no deps) ── */
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

    // Fibonacci sphere = evenly distributed dots
    const N = 450;
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
      rot += 0.003;

      // ambient glow
      const g = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 1.2);
      g.addColorStop(0, "rgba(124,58,237,0.10)");
      g.addColorStop(0.7, "rgba(59,130,246,0.06)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      const cos = Math.cos(rot), sin = Math.sin(rot);
      const tilt = 0.4, ct = Math.cos(tilt), st = Math.sin(tilt);

      for (const p of pts) {
        const x1 = p.x * cos + p.z * sin;
        const z1 = -p.x * sin + p.z * cos;
        const y1 = p.y * ct - z1 * st;
        const z2 = p.y * st + z1 * ct;

        const px = cx + x1 * R;
        const py = cy + y1 * R;
        const depth = (z2 + 1) / 2; // 0 = back, 1 = front

        const size = (0.6 + depth * 1.9) * dpr;
        const alpha = 0.10 + depth * 0.85;
        const hue = 215 + (p.y + 1) * 38; // blue → violet by latitude

        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${hue}, 90%, ${55 + depth * 20}%, ${alpha})`;
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
  { glyph: "◈", title: "Sentiment AI", sub: "live mood scoring", style: { top: "4%", left: "-2%" }, delay: "0s" },
  { glyph: "⬡", title: "Irus AI Inside", sub: "chat · search · voice", style: { top: "14%", right: "-4%" }, delay: "1.4s" },
  { glyph: "🌐", title: "13 Languages", sub: "instant translation", style: { bottom: "16%", left: "-6%" }, delay: "2.2s" },
  { glyph: "◉", title: "Daily Digest", sub: "personalised briefing", style: { bottom: "4%", right: "0%" }, delay: "3s" },
];

export default function Hero() {
  const typed = useTypewriter(WORDS);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-slate-950 via-[#151030] to-slate-950 pt-28 pb-20">
      <style>{`
        .globe-canvas{width:100%;max-width:540px;aspect-ratio:1/1;display:block;margin:0 auto;filter:drop-shadow(0 0 46px rgba(124,58,237,.3))}
        .globe-wrap{position:relative}
        .chip{position:absolute;display:flex;gap:10px;align-items:center;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);backdrop-filter:blur(12px);border-radius:14px;padding:10px 14px;animation:chipFloat 7s ease-in-out infinite;box-shadow:0 10px 30px rgba(0,0,0,.35)}
        .chip-glyph{font-size:16px}
        .chip-title{font-size:12.5px;font-weight:700;color:#fff}
        .chip-sub{font-size:10.5px;color:rgba(255,255,255,.55)}
        @keyframes chipFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        .type-grad{background:linear-gradient(90deg,#60a5fa,#a78bfa,#f472b6,#60a5fa);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:gradFlow 5s linear infinite}
        @keyframes gradFlow{from{background-position:0 0}to{background-position:200% 0}}
        .caret{color:#a78bfa;animation:caretBlink 1s steps(1) infinite;font-weight:300}
        @keyframes caretBlink{50%{opacity:0}}
        @media(max-width:1024px){.chip{display:none}}
      `}</style>

      {/* ambient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(3)].map((_, i) => (
          <motion.div key={i} className="absolute w-96 h-96 rounded-full opacity-20"
            style={{
              background: `radial-gradient(circle, ${["#8b5cf6", "#3b82f6", "#ec4899"][i]} 0%, transparent 70%)`,
              left: `${15 + i * 30}%`, top: `${8 + i * 22}%`,
            }}
            animate={{ x: [0, 90, 0], y: [0, -45, 0], scale: [1, 1.18, 1] }}
            transition={{ duration: 11 + i * 2, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center w-full">
        {/* ── Left: copy ── */}
        <div>
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-7">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-sm text-white/80">Now powered by Irus AI</span>
            </div>
          </motion.div>

          <motion.h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-[1.08]"
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.15 }}>
            The news, decoded by
            <br />
            <span className="type-grad">{typed}</span><span className="caret">|</span>
          </motion.h1>

          <motion.p className="text-lg md:text-xl text-white/60 mb-10 max-w-xl leading-relaxed"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.35 }}>
            DigitalLens fuses real-time news aggregation with sentiment intelligence,
            Claude AI analysis and Irus AI superpowers — so you stay informed, never overwhelmed.
          </motion.p>

          <motion.div className="flex flex-col sm:flex-row gap-4 mb-10"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.5 }}>
            <Link to="/app"
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-xl text-center hover:shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 transform hover:-translate-y-1">
              Launch DigitalLens →
            </Link>
            <a href="https://irus-ai.onrender.com/" target="_blank" rel="noopener noreferrer"
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl text-center hover:bg-white/20 transition-all duration-300">
              Explore Irus AI
            </a>
          </motion.div>

          <motion.div className="flex flex-wrap gap-6"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.7 }}>
            {[["8+", "AI superpowers"], ["13", "languages"], ["24/7", "live sentiment"]].map(([n, l]) => (
              <div key={l}>
                <p className="text-2xl font-bold text-white">{n}</p>
                <p className="text-xs text-white/50 uppercase tracking-wider">{l}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── Right: 3D globe + floating chips ── */}
        <motion.div className="globe-wrap hidden lg:block"
          initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1, delay: 0.3 }}>
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