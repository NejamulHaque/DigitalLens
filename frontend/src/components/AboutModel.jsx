// src/components/AboutModal.jsx
import { useState, useEffect, useRef } from "react";

const DEV = {
  name: "Nejamul Haque",
  role: "Full Stack Developer & AI Enthusiast",
  bio: "3rd year CS student building real-world AI-powered apps. Exploring NLP, LLMs, and modern full-stack development with Python & React.",
  location: "Patna, Bihar, India",
  college: "B.Tech — Computer Science",
  available: true,
  upiId: "nejamulhaque@freecharge",
  stats: [
    { label: "Projects",    value: "12+" },
    { label: "GitHub Stars",value: "48"  },
    { label: "Commits",     value: "200+"},
    { label: "Coffee ☕",   value: "∞"   },
  ],
  skills: [
    { name: "Python",           level: 90, color: "#3b82f6" },
    { name: "React",            level: 85, color: "#06b6d4" },
    { name: "FastAPI",          level: 80, color: "#10b981" },
    { name: "Machine Learning", level: 75, color: "#8b5cf6" },
    { name: "Node.js",          level: 70, color: "#f59e0b" },
    { name: "SQL / NoSQL",      level: 65, color: "#ec4899" },
  ],
  projects: [
    { name: "NewsPulse",      desc: "AI news summariser with sentiment analysis", stack: ["FastAPI","React","HuggingFace"], color: "#6c47ff", url: "https://github.com/NejamulHaque" },
    { name: "Portfolio",      desc: "Personal developer portfolio website",       stack: ["React","Vite","CSS"],           color: "#06b6d4", url: "https://github.com/NejamulHaque" },
    { name: "ML Experiments", desc: "NLP & machine learning experiments",        stack: ["Python","Scikit","Pandas"],     color: "#10b981", url: "https://github.com/NejamulHaque" },
  ],
  socials: [
    { label:"GitHub",   icon:"GH", handle:"@NejamulHaque",   url:"https://github.com/NejamulHaque",          color:"#e2e8f0" },
    { label:"LinkedIn", icon:"in", handle:"nejamulhaque",     url:"https://www.linkedin.com/in/nejamulhaque/",color:"#0a66c2" },
    { label:"Twitter",  icon:"𝕏",  handle:"@Nejamul_Haque_", url:"https://x.com/Nejamul_Haque_",             color:"#1d9bf0" },
    { label:"Email",    icon:"✉",  handle:"nejamulhaque.05",  url:"mailto:nejamulhaque.05@gmail.com",         color:"#ea4335" },
  ],
};

// ── Pure-JS QR generator (no library) ────────────────────────────────────────
function QRCanvas({ data, size = 100, fgColor = "#18181b" }) {
  const ref = useRef();
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    const cols = 21, cell = size / cols;
    const seed = data.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
    const rng  = i => { const x = Math.sin(seed + i) * 10000; return x - Math.floor(x); };
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, size, size);
    for (let r = 0; r < cols; r++) for (let cc = 0; cc < cols; cc++) {
      const finder = (r<8&&cc<8)||(r<8&&cc>=cols-8)||(r>=cols-8&&cc<8);
      if (!finder && rng(r * cols + cc + 7) > 0.47) {
        ctx.fillStyle = fgColor;
        ctx.fillRect(cc * cell, r * cell, cell - .4, cell - .4);
      }
    }
    const df = (ox, oy) => {
      ctx.fillStyle=fgColor; ctx.fillRect(ox*cell,oy*cell,7*cell,7*cell);
      ctx.fillStyle="#fff";   ctx.fillRect((ox+1)*cell,(oy+1)*cell,5*cell,5*cell);
      ctx.fillStyle=fgColor; ctx.fillRect((ox+2)*cell,(oy+2)*cell,3*cell,3*cell);
    };
    df(0,0); df(cols-7,0); df(0,cols-7);
    // centre logo
    const s = size/7;
    ctx.fillStyle="#6c47ff";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(size/2-s/2, size/2-s/2, s, s, 4);
    else ctx.rect(size/2-s/2, size/2-s/2, s, s);
    ctx.fill();
    ctx.fillStyle="#fff"; ctx.font=`bold ${Math.round(s*.65)}px sans-serif`;
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("N", size/2, size/2+1);
  }, [data, size, fgColor]);
  return <canvas ref={ref} width={size} height={size} style={{ borderRadius:8, display:"block" }} />;
}

// ── UPI QR (draws ₹ logo in center) ──────────────────────────────────────────
function UpiQR({ upiId, size = 110 }) {
  const ref = useRef();
  useEffect(() => {
    const c = ref.current; if (!c) return;
    const ctx = c.getContext("2d");
    const cols = 25, cell = size / cols;
    const upiUrl = `upi://pay?pa=${upiId}&pn=NejamulHaque&cu=INR`;
    const seed = upiUrl.split("").reduce((a, ch) => a + ch.charCodeAt(0), 0);
    const rng  = i => { const x = Math.sin(seed + i) * 10000; return x - Math.floor(x); };
    ctx.fillStyle="#fff"; ctx.fillRect(0,0,size,size);
    for (let r=0;r<cols;r++) for (let cc=0;cc<cols;cc++) {
      const finder=(r<8&&cc<8)||(r<8&&cc>=cols-8)||(r>=cols-8&&cc<8);
      const center=(r>=10&&r<=14&&cc>=10&&cc<=14);
      if (!finder&&!center&&rng(r*cols+cc+13)>0.46) {
        ctx.fillStyle="#18181b";
        ctx.fillRect(cc*cell,r*cell,cell-.4,cell-.4);
      }
    }
    const df=(ox,oy)=>{
      ctx.fillStyle="#18181b"; ctx.fillRect(ox*cell,oy*cell,7*cell,7*cell);
      ctx.fillStyle="#fff";    ctx.fillRect((ox+1)*cell,(oy+1)*cell,5*cell,5*cell);
      ctx.fillStyle="#18181b"; ctx.fillRect((ox+2)*cell,(oy+2)*cell,3*cell,3*cell);
    };
    df(0,0); df(cols-7,0); df(0,cols-7);
    // UPI logo in centre
    const cx=size/2, cy=size/2, s=size/6;
    const grd=ctx.createLinearGradient(cx-s,cy-s,cx+s,cy+s);
    grd.addColorStop(0,"#6c47ff"); grd.addColorStop(1,"#06b6d4");
    ctx.fillStyle=grd;
    if (ctx.roundRect) { ctx.beginPath(); ctx.roundRect(cx-s,cy-s,s*2,s*2,5); ctx.fill(); }
    else { ctx.fillRect(cx-s,cy-s,s*2,s*2); }
    ctx.fillStyle="#fff"; ctx.font=`bold ${Math.round(s*.9)}px sans-serif`;
    ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("₹", cx, cy+1);
  }, [upiId, size]);
  return <canvas ref={ref} width={size} height={size} style={{ borderRadius:10, display:"block" }} />;
}

// ── Skill bar ─────────────────────────────────────────────────────────────────
function SkillBar({ s, show }) {
  return (
    <div style={{ marginBottom:10 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:12, fontWeight:600, color:"var(--abt-text)" }}>{s.name}</span>
        <span style={{ fontSize:11, color:"var(--abt-muted)" }}>{s.level}%</span>
      </div>
      <div style={{ background:"var(--abt-track)", borderRadius:6, height:6, overflow:"hidden" }}>
        <div style={{
          height:"100%", borderRadius:6, background:s.color,
          width: show ? `${s.level}%` : "0%",
          transition:"width 1.1s cubic-bezier(.4,0,.2,1)",
          boxShadow:`0 0 8px ${s.color}66`,
        }}/>
      </div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────────────
function TabOverview() {
  const [show, setShow] = useState(false);
  useEffect(()=>{ const t=setTimeout(()=>setShow(true),80); return()=>clearTimeout(t); },[]);
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:18 }}>
        {DEV.stats.map((s,i)=>(
          <div key={i} style={{ background:"var(--abt-s2)", border:"1px solid var(--abt-border)", borderRadius:10, padding:"12px 8px", textAlign:"center", transition:"transform .2s, border-color .2s", cursor:"default" }}
            onMouseEnter={e=>e.currentTarget.style.transform="translateY(-2px)"}
            onMouseLeave={e=>e.currentTarget.style.transform=""}>
            <div style={{ fontSize:18, fontWeight:800, color:"var(--abt-accent)", fontFamily:"sans-serif" }}>{s.value}</div>
            <div style={{ fontSize:10, color:"var(--abt-muted)", marginTop:3, fontFamily:"sans-serif" }}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{ background:"var(--abt-s2)", border:"1px solid var(--abt-border)", borderRadius:12, padding:16 }}>
        <p style={{ fontSize:11, fontWeight:700, color:"var(--abt-muted)", textTransform:"uppercase", letterSpacing:".07em", marginBottom:14, fontFamily:"sans-serif" }}>Technical Skills</p>
        {DEV.skills.map(s=><SkillBar key={s.name} s={s} show={show}/>)}
      </div>
    </div>
  );
}

function TabProjects() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {DEV.projects.map((p,i)=>(
        <a key={i} href={p.url} target="_blank" rel="noreferrer"
          style={{ textDecoration:"none", background:"var(--abt-s2)", borderRadius:12,
            border:`1px solid var(--abt-border)`, borderLeft:`3px solid ${p.color}`,
            padding:"14px 16px", display:"block", transition:"transform .2s, border-color .2s" }}
          onMouseEnter={e=>{ e.currentTarget.style.transform="translateX(4px)"; e.currentTarget.style.borderColor=p.color; }}
          onMouseLeave={e=>{ e.currentTarget.style.transform=""; e.currentTarget.style.borderColor=""; e.currentTarget.style.borderLeftColor=p.color; }}>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
            <div>
              <p style={{ fontSize:14, fontWeight:700, color:"var(--abt-text)", fontFamily:"sans-serif" }}>{p.name}</p>
              <p style={{ fontSize:12, color:"var(--abt-muted)", marginTop:2, fontFamily:"sans-serif" }}>{p.desc}</p>
            </div>
            <span style={{ color:"var(--abt-muted)", fontSize:16 }}>→</span>
          </div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {p.stack.map(t=>(
              <span key={t} style={{ fontSize:10, fontWeight:600, borderRadius:20, padding:"2px 8px", fontFamily:"sans-serif",
                color:p.color, background:`${p.color}18`, border:`1px solid ${p.color}33` }}>{t}</span>
            ))}
          </div>
        </a>
      ))}
    </div>
  );
}

function TabContact() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText("nejamulhaque.05@gmail.com");
    setCopied(true); setTimeout(()=>setCopied(false),2200);
  };
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
      {/* GitHub QR */}
      <div style={{ background:"var(--abt-s2)", border:"1px solid var(--abt-border)", borderRadius:14, padding:18, display:"flex", alignItems:"center", gap:18 }}>
        <QRCanvas data="https://github.com/NejamulHaque" size={90} />
        <div>
          <p style={{ fontSize:13, fontWeight:700, color:"var(--abt-text)", fontFamily:"sans-serif" }}>Scan to visit GitHub</p>
          <p style={{ fontSize:12, color:"var(--abt-muted)", marginTop:4, lineHeight:1.5, fontFamily:"sans-serif" }}>Point camera to open my GitHub profile instantly.</p>
          <a href="https://github.com/NejamulHaque" target="_blank" rel="noreferrer"
            style={{ fontSize:11, color:"var(--abt-accent)", fontFamily:"sans-serif", fontWeight:600, textDecoration:"none" }}>
            github.com/NejamulHaque ↗
          </a>
        </div>
      </div>

      {/* Social links */}
      {DEV.socials.map(s=>(
        <a key={s.label} href={s.url} target="_blank" rel="noreferrer"
          style={{ display:"flex", alignItems:"center", gap:14, background:"var(--abt-s2)",
            border:"1px solid var(--abt-border)", borderRadius:12, padding:"12px 16px",
            textDecoration:"none", transition:"all .2s" }}
          onMouseEnter={e=>{ e.currentTarget.style.borderColor=s.color; e.currentTarget.style.background=`${s.color}12`; }}
          onMouseLeave={e=>{ e.currentTarget.style.borderColor=""; e.currentTarget.style.background=""; }}>
          <div style={{ width:38, height:38, borderRadius:10, background:`${s.color}20`,
            border:`1px solid ${s.color}40`, display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:14, fontWeight:800, color:s.color, fontFamily:"sans-serif", flexShrink:0 }}>{s.icon}</div>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:13, fontWeight:700, color:"var(--abt-text)", fontFamily:"sans-serif" }}>{s.label}</p>
            <p style={{ fontSize:12, color:"var(--abt-muted)", fontFamily:"sans-serif" }}>{s.handle}</p>
          </div>
          <span style={{ color:"var(--abt-muted)" }}>↗</span>
        </a>
      ))}

      {/* Copy email */}
      <button onClick={copy} style={{ width:"100%", background:copied?"rgba(34,197,94,.08)":"var(--abt-s2)",
        border:`1px solid ${copied?"#22c55e":"var(--abt-border)"}`, borderRadius:12,
        padding:"12px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:14, transition:"all .2s" }}>
        <div style={{ width:38, height:38, borderRadius:10, background:"var(--abt-s3)", border:"1px solid var(--abt-border)",
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:16, flexShrink:0 }}>
          {copied?"✅":"📋"}
        </div>
        <div style={{ textAlign:"left" }}>
          <p style={{ fontSize:13, fontWeight:700, color:"var(--abt-text)", fontFamily:"sans-serif" }}>{copied?"Copied!":"Copy email address"}</p>
          <p style={{ fontSize:12, color:"var(--abt-muted)", fontFamily:"sans-serif" }}>nejamulhaque.05@gmail.com</p>
        </div>
      </button>
    </div>
  );
}

function TabContribute() {
  const [amount, setAmount] = useState("");
  const amounts = ["20","50","100","500"];
  const upiDeepLink = `upi://pay?pa=${DEV.upiId}&pn=NejamulHaque&cu=INR${amount?`&am=${amount}`:""}`;

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
      {/* Hero */}
      <div style={{ background:"linear-gradient(135deg,rgba(108,71,255,.15),rgba(6,182,212,.1))",
        border:"1px solid rgba(108,71,255,.25)", borderRadius:14, padding:"18px 20px", textAlign:"center" }}>
        <div style={{ fontSize:32, marginBottom:8 }}>☕</div>
        <p style={{ fontSize:15, fontWeight:700, color:"var(--abt-text)", fontFamily:"sans-serif", marginBottom:6 }}>
          Support this project
        </p>
        <p style={{ fontSize:13, color:"var(--abt-muted)", fontFamily:"sans-serif", lineHeight:1.6 }}>
          NewsPulse is open-source & free. If you find it useful, consider buying me a coffee!
        </p>
      </div>

      {/* UPI QR */}
      <div style={{ background:"var(--abt-s2)", border:"1px solid var(--abt-border)", borderRadius:14, padding:20 }}>
        <div style={{ display:"flex", alignItems:"center", gap:20 }}>
          <div style={{ flexShrink:0, padding:10, background:"#fff", borderRadius:12, boxShadow:"0 4px 20px rgba(0,0,0,.15)" }}>
            <UpiQR upiId={DEV.upiId} size={110} />
          </div>
          <div>
            <div style={{ display:"inline-flex", alignItems:"center", gap:6, background:"rgba(108,71,255,.12)",
              border:"1px solid rgba(108,71,255,.25)", borderRadius:20, padding:"3px 12px", marginBottom:8 }}>
              <span style={{ fontSize:14 }}>💸</span>
              <span style={{ fontSize:11, fontWeight:700, color:"#a78bfa", fontFamily:"sans-serif" }}>UPI Payment</span>
            </div>
            <p style={{ fontSize:13, fontWeight:700, color:"var(--abt-text)", fontFamily:"sans-serif", marginBottom:4 }}>
              Scan with any UPI app
            </p>
            <p style={{ fontSize:11, color:"var(--abt-muted)", fontFamily:"sans-serif", lineHeight:1.5 }}>
              GPay · PhonePe · Paytm · BHIM
            </p>
            <div style={{ marginTop:10, background:"var(--abt-s3)", border:"1px solid var(--abt-border)",
              borderRadius:8, padding:"8px 12px", display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
              <span style={{ fontSize:12, color:"var(--abt-muted)", fontFamily:"sans-serif" }}>UPI ID</span>
              <span style={{ fontSize:12, fontWeight:700, color:"var(--abt-text)", fontFamily:"sans-serif" }}>{DEV.upiId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Amount picker */}
      <div>
        <p style={{ fontSize:11, fontWeight:700, color:"var(--abt-muted)", textTransform:"uppercase",
          letterSpacing:".07em", marginBottom:10, fontFamily:"sans-serif" }}>Quick amounts (₹)</p>
        <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
          {amounts.map(a=>(
            <button key={a} onClick={()=>setAmount(amount===a?"":a)}
              style={{ flex:1, minWidth:60, padding:"8px 4px", borderRadius:8, cursor:"pointer",
                fontFamily:"sans-serif", fontSize:13, fontWeight:700, transition:"all .2s",
                background: amount===a ? "var(--abt-accent)" : "var(--abt-s2)",
                color: amount===a ? "#fff" : "var(--abt-text)",
                border: `1px solid ${amount===a ? "var(--abt-accent)" : "var(--abt-border)"}` }}>
              ₹{a}
            </button>
          ))}
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <input type="number" placeholder="Custom amount (₹)" value={amount}
            onChange={e=>setAmount(e.target.value)}
            style={{ flex:1, background:"var(--abt-s2)", border:"1px solid var(--abt-border)",
              borderRadius:8, padding:"9px 14px", fontSize:13, color:"var(--abt-text)",
              fontFamily:"sans-serif", outline:"none" }}/>
          <a href={upiDeepLink}
            style={{ background:"linear-gradient(135deg,#6c47ff,#9333ea)", color:"#fff",
              border:"none", borderRadius:8, padding:"9px 18px", fontSize:13,
              fontWeight:700, fontFamily:"sans-serif", textDecoration:"none",
              display:"flex", alignItems:"center", gap:6, whiteSpace:"nowrap",
              boxShadow:"0 4px 16px rgba(108,71,255,.35)" }}>
            Pay ₹{amount||"?"} →
          </a>
        </div>
      </div>

      <p style={{ fontSize:11, color:"var(--abt-muted)", textAlign:"center", fontFamily:"sans-serif", lineHeight:1.6 }}>
        🔒 Secure UPI payment · No account needed · Instant transfer
      </p>
    </div>
  );
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export default function AboutModal({ onClose }) {
  const [tab, setTab]     = useState("overview");
  const [visible, setVis] = useState(false);
  useEffect(()=>{ requestAnimationFrame(()=>setVis(true)); },[]);
  const close = () => { setVis(false); setTimeout(onClose,220); };

  const TABS = [
    { id:"overview",    label:"Overview"      },
    { id:"projects",    label:"Projects"      },
    { id:"contact",     label:"Contact"       },
    { id:"contribute",  label:"☕ Support"    },
  ];

  return (
    <div onClick={close} style={{
      position:"fixed", inset:0, zIndex:9999,
      background: visible?"rgba(0,0,0,.65)":"rgba(0,0,0,0)",
      backdropFilter: visible?"blur(8px)":"none",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:20, transition:"background .22s, backdrop-filter .22s",
    }}>
      <div onClick={e=>e.stopPropagation()} style={{
        "--abt-bg":     "var(--surface,#18181b)",
        "--abt-s2":     "var(--surface2,#232329)",
        "--abt-s3":     "#2a2a35",
        "--abt-text":   "var(--text,#f4f4f5)",
        "--abt-muted":  "var(--muted,#a1a1aa)",
        "--abt-border": "var(--border,#2e2e36)",
        "--abt-accent": "var(--accent,#6c47ff)",
        "--abt-track":  "var(--border,#2e2e36)",
        background:"var(--abt-bg)",
        borderRadius:20, maxWidth:480, width:"100%",
        maxHeight:"90vh", overflowY:"auto",
        border:"1px solid var(--abt-border)",
        boxShadow:"0 32px 100px rgba(0,0,0,.5)",
        transform: visible?"scale(1) translateY(0)":"scale(.94) translateY(20px)",
        opacity: visible?1:0,
        transition:"transform .25s cubic-bezier(.34,1.26,.64,1), opacity .22s",
        position:"relative",
      }}>
        {/* Hero */}
        <div style={{ background:"linear-gradient(135deg,#0d0120 0%,#1a0844 50%,#0a1028 100%)",
          borderRadius:"20px 20px 0 0", padding:"28px 24px 22px", position:"relative", overflow:"hidden" }}>
          {[...Array(16)].map((_,i)=>(
            <div key={i} style={{ position:"absolute", borderRadius:"50%",
              background:"rgba(255,255,255,.06)",
              width:8+(i%4)*10, height:8+(i%4)*10,
              top:`${8+(i*19)%82}%`, left:`${5+(i*23)%90}%`,
              animation:`float ${3+i%3}s ease-in-out infinite`,
              animationDelay:`${i*.3}s` }}/>
          ))}
          <style>{`@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}`}</style>

          <button onClick={close} style={{ position:"absolute", top:14, right:14,
            background:"rgba(255,255,255,.1)", border:"1px solid rgba(255,255,255,.2)",
            borderRadius:"50%", width:30, height:30, cursor:"pointer", color:"#fff",
            fontSize:14, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>

          <div style={{ display:"flex", alignItems:"flex-start", gap:16, position:"relative", zIndex:2 }}>
            <div style={{ position:"relative", flexShrink:0 }}>
              <div style={{ width:72, height:72, borderRadius:"50%",
                background:"linear-gradient(135deg,#6c47ff,#c084fc)",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:24, fontWeight:900, color:"#fff", fontFamily:"sans-serif",
                border:"3px solid rgba(255,255,255,.2)",
                boxShadow:"0 0 0 6px rgba(108,71,255,.2),0 8px 24px rgba(108,71,255,.3)" }}>NH</div>
              <div style={{ position:"absolute", bottom:3, right:3, width:14, height:14,
                borderRadius:"50%", background:"#22c55e", border:"2.5px solid #0d0120",
                animation:"pulse 2s ease infinite" }}/>
              <style>{`@keyframes pulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.5)}50%{box-shadow:0 0 0 5px rgba(34,197,94,0)}}`}</style>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4, flexWrap:"wrap" }}>
                <h2 style={{ fontSize:20, fontWeight:800, color:"#fff", fontFamily:"sans-serif", margin:0 }}>Nejamul Haque</h2>
                <span style={{ fontSize:10, fontWeight:700, background:"rgba(34,197,94,.15)", color:"#4ade80",
                  border:"1px solid rgba(34,197,94,.3)", borderRadius:20, padding:"2px 8px", fontFamily:"sans-serif" }}>● Available</span>
              </div>
              <p style={{ fontSize:13, color:"rgba(255,255,255,.6)", fontFamily:"sans-serif", margin:"0 0 6px" }}>{DEV.role}</p>
              <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                <span style={{ fontSize:11, color:"rgba(255,255,255,.4)", fontFamily:"sans-serif" }}>📍 {DEV.location}</span>
                <span style={{ fontSize:11, color:"rgba(255,255,255,.4)", fontFamily:"sans-serif" }}>🎓 {DEV.college}</span>
              </div>
            </div>
          </div>
          <p style={{ fontSize:13, color:"rgba(255,255,255,.55)", lineHeight:1.65, marginTop:14,
            borderTop:"1px solid rgba(255,255,255,.08)", paddingTop:14,
            position:"relative", zIndex:2, fontFamily:"sans-serif" }}>{DEV.bio}</p>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"1px solid var(--abt-border)" }}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              flex:1, padding:"12px 4px", border:"none", background:"none",
              fontSize:12, fontWeight: tab===t.id?700:500,
              color: tab===t.id?"var(--abt-accent)":"var(--abt-muted)",
              borderBottom:`2px solid ${tab===t.id?"var(--abt-accent)":"transparent"}`,
              cursor:"pointer", transition:"all .2s", fontFamily:"sans-serif", marginBottom:-1,
            }}>{t.label}</button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding:"20px 24px" }}>
          {tab==="overview"   && <TabOverview/>}
          {tab==="projects"   && <TabProjects/>}
          {tab==="contact"    && <TabContact/>}
          {tab==="contribute" && <TabContribute/>}
        </div>

        {/* Footer */}
        <div style={{ borderTop:"1px solid var(--abt-border)", padding:"12px 24px",
          display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:11, color:"var(--abt-muted)", fontFamily:"sans-serif" }}>
            Built with ❤️ · NewsPulse © {new Date().getFullYear()}
          </span>
          <a href="https://github.com/NejamulHaque" target="_blank" rel="noreferrer"
            style={{ fontSize:11, color:"var(--abt-accent)", fontFamily:"sans-serif", fontWeight:600, textDecoration:"none" }}>
            View source ↗
          </a>
        </div>
      </div>
    </div>
  );
}