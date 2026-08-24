import { motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { FiSearch, FiMessageSquare, FiFileText, FiImage, FiMic, FiZap } from "react-icons/fi";

const WORDS = ["amplified.", "personal.", "real-time.", "beautiful."];

function useTypewriter(words: string[], typeMs = 70, delMs = 30, pauseMs = 1400) {
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

const SERVICES = [
  { icon: FiSearch, title: "Live Web Search", desc: "Verify breaking news with Irus AI's real-time web search and cited sources.", grad: "linear-gradient(135deg,#3b82f6,#06b6d4)" },
  { icon: FiMessageSquare, title: "Intelligent Chat", desc: "Multi-turn conversations with long-term memory across all your news queries.", grad: "linear-gradient(135deg,#8b5cf6,#ec4899)" },
  { icon: FiFileText, title: "Document AI", desc: "Upload news reports or research papers. Chat with them semantically.", grad: "linear-gradient(135deg,#10b981,#34d399)" },
  { icon: FiImage, title: "AI Image Generation", desc: "Generate custom infographics and visualizations for any news story.", grad: "linear-gradient(135deg,#f59e0b,#ef4444)" },
  { icon: FiMic, title: "Voice Mode", desc: "Ask about news hands-free. Hear AI-generated summaries read aloud.", grad: "linear-gradient(135deg,#ec4899,#f43f5e)" },
  { icon: FiZap, title: "Sentiment Analytics", desc: "Real-time mood ring, trend clouds and breaking alerts, scored by AI.", grad: "linear-gradient(135deg,#eab308,#f59e0b)" },
];

const MARQUEE = ["Live Web Search", "Document AI", "Image Generation", "Voice Mode", "Long-Term Memory", "Sentiment Analysis", "13-Language Translation", "Daily Digest", "News Quiz", "AI TL;DR"];

function Orbit() {
  return (
    <div className="orbit-wrap">
      <div className="orbit-core">◉</div>
      <div className="orbit-ring orbit-r1">
        {["⬡", "◈", "⬢"].map((g, i) => (
          <span key={g} className="orbit-pos" style={{ transform: `rotate(${i * 120}deg) translateX(120px)` }}>
            <span className="orbit-node">{g}</span>
          </span>
        ))}
      </div>
      <div className="orbit-ring orbit-r2">
        {["◆", "✦", "◎"].map((g, i) => (
          <span key={g} className="orbit-pos" style={{ transform: `rotate(${i * 120 + 60}deg) translateX(172px)` }}>
            <span className="orbit-node">{g}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default function Services() {
  const typed = useTypewriter(WORDS);
  const secRef = useRef<HTMLElement | null>(null);

  const onMove = (e: any) => {
    const el = secRef.current;
    if (!el) return;
    el.style.setProperty("--mx", e.clientX + "px");
    el.style.setProperty("--my", e.clientY + "px");
  };

  return (
    <section ref={secRef} onMouseMove={onMove} className="svc-section" id="services">
      <style>{`
        .svc-section{position:relative;padding:110px 24px;background:linear-gradient(to bottom,#020617,#0b0720 55%,#020617);overflow:hidden}
        .svc-head{max-width:1200px;margin:0 auto 70px;display:grid;grid-template-columns:1.2fr .8fr;gap:40px;align-items:center}
        .svc-kicker{font-family:'DM Mono',monospace;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#a78bfa;margin-bottom:14px;display:flex;align-items:center;gap:10px}
        .svc-kicker::before{content:"";width:30px;height:1px;background:#a78bfa}
        .svc-h2{font-size:clamp(34px,4.6vw,56px);font-weight:800;color:#fff;line-height:1.1;margin-bottom:16px}
        .svc-typed{background:linear-gradient(90deg,#60a5fa,#a78bfa,#f472b6,#60a5fa);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:svcFlow 5s linear infinite}
        @keyframes svcFlow{from{background-position:0 0}to{background-position:200% 0}}
        .svc-caret{color:#a78bfa;animation:svcBlink 1s steps(1) infinite}
        @keyframes svcBlink{50%{opacity:0}}
        .svc-sub{color:rgba(255,255,255,.55);font-size:16px;line-height:1.7;max-width:520px}
        .orbit-wrap{position:relative;width:340px;height:340px;margin:0 auto}
        .orbit-core{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:74px;height:74px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:26px;color:#fff;background:linear-gradient(135deg,#7c3aed,#2563eb);animation:corePulse 3s ease-in-out infinite}
        @keyframes corePulse{0%,100%{box-shadow:0 0 40px rgba(124,58,237,.35)}50%{box-shadow:0 0 80px rgba(124,58,237,.65)}}
        .orbit-ring{position:absolute;border:1px dashed rgba(255,255,255,.12);border-radius:50%;animation:svcSpin 32s linear infinite}
        .orbit-r1{inset:25px}
        .orbit-r2{inset:-27px;animation-duration:46s;animation-direction:reverse;border-color:rgba(255,255,255,.08)}
        @keyframes svcSpin{to{transform:rotate(360deg)}}
        .orbit-pos{position:absolute;top:50%;left:50%}
        .orbit-node{position:absolute;width:34px;height:34px;margin:-17px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.16);backdrop-filter:blur(8px);color:#c4b5fd;font-size:14px;animation:svcSpinRev 32s linear infinite}
        .orbit-r2 .orbit-node{animation-name:svcSpin;animation-duration:46s}
        @keyframes svcSpinRev{to{transform:rotate(-360deg)}}
        .svc-grid{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
        .svc-card{position:relative;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:18px;padding:26px;overflow:hidden;backdrop-filter:blur(10px)}
        .svc-card::before{content:"";position:absolute;inset:0;background:radial-gradient(480px circle at var(--mx,50%) var(--my,50%),rgba(167,139,250,.12),transparent 45%);opacity:0;transition:opacity .3s;pointer-events:none}
        .svc-card:hover::before{opacity:1}
        .svc-card::after{content:"";position:absolute;inset:0;border-radius:inherit;padding:1px;background:linear-gradient(135deg,rgba(96,165,250,.5),transparent 30%,transparent 70%,rgba(244,114,182,.4));-webkit-mask:linear-gradient(#fff 0 0) content-box,linear-gradient(#fff 0 0);-webkit-mask-composite:xor;mask-composite:exclude;opacity:0;transition:opacity .4s;pointer-events:none}
        .svc-card:hover::after{opacity:1}
        .svc-icon{display:inline-flex;padding:12px;border-radius:12px;margin-bottom:16px;color:#fff}
        .svc-title{font-size:19px;font-weight:700;color:#fff;margin-bottom:8px}
        .svc-desc{font-size:13.5px;color:rgba(255,255,255,.55);line-height:1.7}
        .svc-tag{position:absolute;top:22px;right:22px;font-family:'DM Mono',monospace;font-size:9px;color:rgba(255,255,255,.35);letter-spacing:.14em}
        .svc-marquee{margin-top:70px;border-top:1px solid rgba(255,255,255,.08);border-bottom:1px solid rgba(255,255,255,.08);overflow:hidden;padding:14px 0}
        .svc-reel{display:flex;width:max-content;animation:svcReel 30s linear infinite}
        .svc-reel:hover{animation-play-state:paused}
        @keyframes svcReel{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .svc-m-item{padding:0 26px;font-family:'DM Mono',monospace;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.4);white-space:nowrap}
        @media(max-width:960px){.svc-grid{grid-template-columns:1fr 1fr}.svc-head{grid-template-columns:1fr}.orbit-wrap{display:none}}
        @media(max-width:640px){.svc-grid{grid-template-columns:1fr}}
      `}</style>

      <div className="svc-head">
        <div>
          <motion.p className="svc-kicker" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>Our Services</motion.p>
          <motion.h2 className="svc-h2" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }}>
            Intelligence, <span className="svc-typed">{typed}</span><span className="svc-caret">|</span>
          </motion.h2>
          <motion.p className="svc-sub" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            DigitalLens meets Irus AI. Eight superpowers working together to transform how you consume, understand and share the news.
          </motion.p>
        </div>
        <Orbit />
      </div>

      <div className="svc-grid">
        {SERVICES.map((s, i) => (
          <motion.div key={s.title} className="svc-card"
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08 }} whileHover={{ y: -8 }}>
            <span className="svc-tag">0{i + 1}</span>
            <span className="svc-icon" style={{ background: s.grad }}><s.icon className="w-6 h-6" size={22} /></span>
            <h3 className="svc-title">{s.title}</h3>
            <p className="svc-desc">{s.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="svc-marquee">
        <div className="svc-reel">
          {[...MARQUEE, ...MARQUEE].map((m, i) => (
            <span key={i} className="svc-m-item">✦ {m}</span>
          ))}
        </div>
      </div>
    </section>
  );
}