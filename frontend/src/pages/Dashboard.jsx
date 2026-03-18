// src/pages/Dashboard.jsx  ─  DigitalLens v4 PREMIUM
import { useState, useEffect, useCallback, useRef } from "react";
import { doc, setDoc } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/config";
import "./Dashboard.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CATEGORIES = [
  { id:"for-you",       icon:"✦",  label:"For You"    },
  { id:"general",       icon:"◉",  label:"World"      },
  { id:"technology",    icon:"⬡",  label:"Tech"       },
  { id:"business",      icon:"◈",  label:"Markets"    },
  { id:"sports",        icon:"◎",  label:"Sports"     },
  { id:"health",        icon:"♥",  label:"Health"     },
  { id:"science",       icon:"⬢",  label:"Science"    },
  { id:"entertainment", icon:"◆",  label:"Culture"    },
];

const MOOD = {
  positive:{ label:"Positive", color:"#c8a45a", bg:"rgba(200,164,90,.12)",  icon:"↑", glyph:"◈" },
  neutral: { label:"Neutral",  color:"#7a7a8a", bg:"rgba(122,122,138,.1)", icon:"→", glyph:"◎" },
  negative:{ label:"Negative", color:"#b85550", bg:"rgba(184,85,80,.12)",  icon:"↓", glyph:"◆" },
};

const LANGS = ["Spanish","French","German","Hindi","Chinese","Japanese","Arabic","Portuguese","Russian","Italian","Korean","Bengali","Urdu"];
const STOP  = new Set(["about","which","their","would","could","there","these","those","after","being","where","since","while","under","other","first","should","still","have","that","with","from","this","will","were","been","more","also","than","into","when","they","what","some","news","says","said","just","your"]);

function readingTime(t){ return Math.max(1,Math.round((t||"").split(/\s+/).length/200)); }
function timeAgo(iso){
  if(!iso)return"";
  const s=(Date.now()-new Date(iso))/1000;
  if(s<3600)return`${Math.floor(s/60)}m`;
  if(s<86400)return`${Math.floor(s/3600)}h`;
  return`${Math.floor(s/86400)}d`;
}
function fmtDate(iso){
  if(!iso)return"";
  return new Date(iso).toLocaleDateString("en-US",{month:"short",day:"numeric"});
}

// ── Sentiment Pill ───────────────────────────────────────────────────────────
function SPill({ mood, xs }) {
  const m=mood||"neutral",c=MOOD[m];
  return <span className={`spill spill-${m}${xs?" spill-xs":""}`}>{c.glyph} {c.label}</span>;
}

// ── Ticker ───────────────────────────────────────────────────────────────────
function Ticker({ articles }) {
  if(!articles.length)return null;
  const items=articles.slice(0,10);
  return (
    <div className="ticker">
      <div className="ticker-live">LIVE</div>
      <div className="ticker-track">
        <div className="ticker-reel">
          {[...items,...items].map((a,i)=>(
            <span key={i} className="ticker-item">
              <span style={{color:MOOD[a.sentiment?.mood||"neutral"].color,fontSize:8}}>◆</span>
              <a href={a.url} target="_blank" rel="noreferrer" className="ticker-link">{a.title}</a>
              <span className="ticker-src">— {a.source}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Breaking ─────────────────────────────────────────────────────────────────
function Breaking({ articles, onDismiss }) {
  const worst=articles.filter(a=>a.sentiment?.mood==="negative"&&(a.sentiment?.score||0)>0.85)
    .sort((a,b)=>(b.sentiment?.score||0)-(a.sentiment?.score||0))[0];
  if(!worst)return null;
  return (
    <div className="breaking">
      <span className="breaking-pulse"/>
      <span className="breaking-tag">BREAKING</span>
      <span className="breaking-text">{worst.title}</span>
      <a href={worst.url} target="_blank" rel="noreferrer" className="breaking-link">Read →</a>
      <button className="icon-x" onClick={onDismiss}>✕</button>
    </div>
  );
}

// ── Mood Ring ─────────────────────────────────────────────────────────────────
function MoodRing({ articles }) {
  const counts={positive:0,neutral:0,negative:0};
  articles.forEach(a=>{counts[a.sentiment?.mood||"neutral"]++;});
  const total=articles.length||1,r=26,cx=36,cy=36,circ=2*Math.PI*r;
  let off=0;
  const slices=Object.entries(counts).map(([mood,n])=>{
    const len=(n/total)*circ,s={mood,n,len,off};off+=len;return s;
  });
  const dom=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0][0];
  return (
    <div className="mood-ring">
      <svg width="72" height="72" viewBox="0 0 72 72">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth="7"/>
        {slices.map(s=>(
          <circle key={s.mood} cx={cx} cy={cy} r={r} fill="none"
            stroke={MOOD[s.mood].color} strokeWidth="7"
            strokeDasharray={`${s.len} ${circ-s.len}`}
            strokeDashoffset={-s.off}
            style={{transform:"rotate(-90deg)",transformOrigin:"36px 36px"}}/>
        ))}
        <text x="36" y="33" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.4)" fontFamily="sans-serif">{Math.round((counts[dom]/total)*100)}%</text>
        <text x="36" y="46" textAnchor="middle" fontSize="8.5" fill={MOOD[dom].color} fontFamily="sans-serif" fontWeight="600">{dom}</text>
      </svg>
      <div className="mrl">
        {Object.entries(counts).map(([m,n])=>(
          <div key={m} className="mrl-row">
            <span className="mrl-dot" style={{background:MOOD[m].color}}/>
            <span className="mrl-lbl">{m}</span>
            <span className="mrl-n">{n}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Trend Cloud ───────────────────────────────────────────────────────────────
function TrendCloud({ articles, onTag }) {
  const map={};
  articles.forEach(a=>(a.title+" "+(a.summary||"")).toLowerCase().replace(/[^a-z\s]/g,"").split(/\s+/)
    .filter(w=>w.length>4&&!STOP.has(w)).forEach(w=>{map[w]=(map[w]||0)+1;}));
  const top=Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const max=top[0]?.[1]||1;
  if(!top.length)return null;
  return (
    <div className="trend-cloud">
      <span className="trend-cloud-label">Trending</span>
      {top.map(([w,n])=>(
        <button key={w} className="trend-word" onClick={()=>onTag(w)}
          style={{fontSize:`${Math.max(11,Math.min(17,11+(n/max)*6))}px`,opacity:Math.max(0.45,n/max)}}>
          #{w}
        </button>
      ))}
    </div>
  );
}

// ── Pulse Stats ───────────────────────────────────────────────────────────────
function PulseStats({ articles, source }) {
  if(!articles.length)return null;
  const c={positive:0,neutral:0,negative:0};
  articles.forEach(a=>{c[a.sentiment?.mood||"neutral"]++;});
  const t=articles.length;
  return (
    <div className="pulse-stats">
      <div className="ps-stat"><span className="ps-n">{t}</span><span className="ps-l">Stories</span></div>
      <div className="ps-sep"/>
      {Object.entries(c).map(([m,n])=>(
        <div key={m} className="ps-stat">
          <span className="ps-n" style={{color:MOOD[m].color}}>{Math.round(n/t*100)}%</span>
          <span className="ps-l">{MOOD[m].icon} {m}</span>
        </div>
      ))}
      <div className="ps-sep"/>
      <span className={`ps-status ${source==="live"?"ps-live":"ps-cache"}`}>
        {source==="live"?"● Live":"⟳ Cache"}
      </span>
    </div>
  );
}

// ── Hero Card ─────────────────────────────────────────────────────────────────
function HeroCard({ article, bookmarked, onBookmark, onShare, onOpen }) {
  const ago=timeAgo(article.published_at);
  return (
    <div className="hero-card" onClick={()=>onOpen(article)}>
      {article.image&&<div className="hero-img" style={{backgroundImage:`url(${article.image})`}}>
        <div className="hero-img-vignette"/>
      </div>}
      <div className="hero-body">
        <div className="hero-top">
          <span className="hero-source">{article.source}</span>
          <SPill mood={article.sentiment?.mood}/>
          {ago&&<span className="meta-dim">{ago} ago</span>}
        </div>
        <h2 className="hero-title">{article.title}</h2>
        <p className="hero-sum">{article.summary}</p>
        {article.tags?.length>0&&<div className="tag-row">{article.tags.slice(0,4).map(t=><span key={t} className="tag">#{t}</span>)}</div>}
        <div className="hero-foot" onClick={e=>e.stopPropagation()}>
          <a href={article.url} target="_blank" rel="noreferrer" className="hero-read">Read full story ↗</a>
          <div style={{display:"flex",gap:6}}>
            <button className={`act-sm${bookmarked?" bm-active":""}`} onClick={()=>onBookmark(article)}>◇</button>
            <button className="act-sm" onClick={()=>onShare(article)}>↗</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Article Card ──────────────────────────────────────────────────────────────
function ArticleCard({ article, bookmarked, onBookmark, onShare, onOpen, list }) {
  const rt=readingTime((article.summary||"")+" "+(article.title||""));
  const ago=timeAgo(article.published_at);
  const [tldr,setTLDR]=useState(""); const [ltldr,setLtldr]=useState(false);

  const getTLDR=async e=>{
    e.stopPropagation();if(tldr){setTLDR("");return;}
    setLtldr(true);
    try{const r=await fetch(`${API}/tldr`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:article.title,summary:article.summary})});const d=await r.json();setTLDR(d.tldr||"");}
    catch{setTLDR("Unavailable.");}
    setLtldr(false);
  };

  if(list) return (
    <div className="list-card" onClick={()=>onOpen(article)}>
      {article.image&&<img src={article.image} alt="" className="list-img" onError={e=>e.target.style.display="none"}/>}
      <div className="list-body">
        <div className="list-meta">
          <span className="src-chip">{article.source}</span>
          <SPill mood={article.sentiment?.mood} xs/>
          {ago&&<span className="meta-dim">{ago}</span>}
          <span className="meta-dim">{rt}m</span>
        </div>
        <h3 className="list-title">{article.title}</h3>
        {tldr?<p className="card-tldr">⚡ {tldr}</p>:<p className="list-sum">{article.summary}</p>}
      </div>
      <div className="list-actions" onClick={e=>e.stopPropagation()}>
        <button className="act-xs" onClick={getTLDR} disabled={ltldr}>{ltldr?"…":tldr?"↺":"⚡"}</button>
        <button className={`act-xs${bookmarked?" bm-active":""}`} onClick={()=>onBookmark(article)}>◇</button>
        <button className="act-xs" onClick={()=>onShare(article)}>↗</button>
      </div>
    </div>
  );

  return (
    <div className="card" onClick={()=>onOpen(article)}>
      {article.image&&(
        <div className="card-img-wrap">
          <img src={article.image} alt="" className="card-img" onError={e=>e.target.closest(".card-img-wrap").style.display="none"}/>
          <div className="card-img-tint"/>
          <div className="card-pill-pos"><SPill mood={article.sentiment?.mood}/></div>
        </div>
      )}
      <div className="card-body">
        <div className="card-meta">
          <span className="src-chip">{article.source}</span>
          {!article.image&&<SPill mood={article.sentiment?.mood}/>}
          {ago&&<span className="meta-dim">· {ago}</span>}
          <span className="meta-dim">· {rt}m</span>
        </div>
        <h3 className="card-title">{article.title}</h3>
        {tldr?<p className="card-tldr">⚡ {tldr}</p>:<p className="card-sum">{article.summary}</p>}
        {article.tags?.length>0&&<div className="tag-row">{article.tags.slice(0,3).map(t=><span key={t} className="tag">#{t}</span>)}</div>}
        <div className="card-foot" onClick={e=>e.stopPropagation()}>
          <a href={article.url} target="_blank" rel="noreferrer" className="card-read">Full story →</a>
          <div style={{display:"flex",gap:5}}>
            <button className="act-xs" onClick={getTLDR} disabled={ltldr}>{ltldr?"…":tldr?"↺":"⚡"}</button>
            <button className={`act-xs${bookmarked?" bm-active":""}`} onClick={()=>onBookmark(article)}>◇</button>
            <button className="act-xs" onClick={()=>onShare(article)}>↗</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Article Modal ─────────────────────────────────────────────────────────────
function ArticleModal({ article, bookmarked, onBookmark, onShare, onClose, targetLang, setTargetLang }) {
  const [analysis,setAnalysis]=useState(""); const [analyzing,setAnalyzing]=useState(false);
  const [translated,setTranslated]=useState(""); const [translating,setTranslating]=useState(false);
  const [focus,setFocus]=useState(false);
  const score=article.sentiment?.score||0.5, mood=article.sentiment?.mood||"neutral";

  useEffect(()=>{
    const h=e=>{if(e.key==="Escape")onClose();};
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[onClose]);

  const analyze=async()=>{
    setAnalyzing(true);
    try{const r=await fetch(`${API}/analyze`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:article.title,summary:article.summary,sentiment:article.sentiment,tags:article.tags||[],source:article.source})});const d=await r.json();setAnalysis(d.analysis||"No analysis.");}
    catch{setAnalysis("⚠️ Backend unreachable.");}
    setAnalyzing(false);
  };
  const translate=async()=>{
    setTranslating(true);
    try{const r=await fetch(`${API}/translate`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({text:article.summary,target_lang:targetLang})});const d=await r.json();setTranslated(d.translated||"Failed.");}
    catch{setTranslated("⚠️ Unavailable.");}
    setTranslating(false);
  };
  const exportTxt=()=>{
    const txt=`${article.title}\n${"─".repeat(60)}\nSource: ${article.source}\nDate: ${fmtDate(article.published_at)}\nSentiment: ${mood} (${Math.round(score*100)}%)\n\nSummary:\n${translated||article.summary}\n\nTags: ${article.tags?.join(", ")||"N/A"}\n${"─".repeat(60)}\nGenerated by DigitalLens`;
    const b=new Blob([txt],{type:"text/plain"}),u=URL.createObjectURL(b),a=document.createElement("a");
    a.href=u;a.download=`DigitalLens_${article.title.slice(0,25).replace(/\s+/g,"_")}.txt`;a.click();URL.revokeObjectURL(u);
  };

  return (
    <div className="modal-bd" onClick={onClose}>
      <div className={`am${focus?" am-focus":""}`} onClick={e=>e.stopPropagation()}>
        <div className="am-topbar">
          <div className="am-topbar-left">
            <span className="src-chip">{article.source}</span>
            <SPill mood={mood}/>
            <span className="meta-dim">{fmtDate(article.published_at)}</span>
          </div>
          <div className="am-topbar-right">
            <button className={`modal-ctrl${focus?" modal-ctrl-on":""}`} onClick={()=>setFocus(f=>!f)}>
              {focus?"◎ Normal":"◉ Focus"}
            </button>
            <button className="modal-ctrl" onClick={exportTxt}>↓ Export</button>
            <button className={`act-xs${bookmarked?" bm-active":""}`} onClick={()=>onBookmark(article)}>◇</button>
            <button className="act-xs" onClick={()=>onShare(article)}>↗</button>
            <button className="am-close" onClick={onClose}>✕</button>
          </div>
        </div>
        {article.image&&<div className="am-hero" style={{backgroundImage:`url(${article.image})`}}/>}
        <div className="am-body">
          <h1 className="am-title">{article.title}</h1>
          <div className="am-sentiment">
            <div className="am-sent-row"><span>Sentiment Analysis</span>
              <span style={{color:MOOD[mood].color,fontWeight:600}}>{Math.round(score*100)}% {mood}</span></div>
            <div className="am-sent-bar"><div className="am-sent-fill" style={{width:`${score*100}%`,background:MOOD[mood].color,boxShadow:`0 0 10px ${MOOD[mood].color}44`}}/></div>
          </div>
          <div className="am-summary-box">
            <p className="am-summary">{translated||article.summary}</p>
            {translated&&<button className="ghost-btn" onClick={()=>setTranslated("")}>↺ Original</button>}
          </div>
          <div className="am-translate">
            <select className="lang-sel" value={targetLang} onChange={e=>setTargetLang(e.target.value)}>
              {LANGS.map(l=><option key={l} value={l}>{l}</option>)}
            </select>
            <button className="trans-btn" onClick={translate} disabled={translating}>
              {translating?"Translating…":"🌐 Translate"}
            </button>
          </div>
          {article.tags?.length>0&&<div className="tag-row am-tag-row">{article.tags.map(t=><span key={t} className="tag">#{t}</span>)}</div>}
          <div className="am-ai-zone">
            {!analysis&&!analyzing&&<button className="ai-cta" onClick={analyze}><span className="ai-cta-icon">⬡</span>Deep AI Analysis<span className="ai-badge">Claude</span></button>}
            {analyzing&&<div className="ai-loading"><div className="spin-ring"/><span>Analyzing with Claude…</span></div>}
            {analysis&&(
              <div className="ai-result">
                <div className="ai-result-header"><span>⬡ AI Analysis</span><span className="ai-model-tag">claude-sonnet-4-5</span>
                  <button className="ghost-btn" onClick={()=>setAnalysis("")}>↺</button></div>
                <div className="ai-result-body">{analysis}</div>
              </div>
            )}
          </div>
        </div>
        <div className="am-footer">
          <a href={article.url} target="_blank" rel="noreferrer" className="am-read-cta">Read Full Article ↗</a>
        </div>
      </div>
    </div>
  );
}

// ── Chat Panel ────────────────────────────────────────────────────────────────
const QP=["◆ Today's digest","↑ Positive stories","↓ Concerning news","⬢ Tech headlines","◎ What's trending"];
function ChatPanel({ onClose }) {
  const [msgs,setMsgs]=useState([{role:"assistant",text:"Good day. I'm your AI news assistant, powered by Claude.\n\nAsk me anything about today's news."}]);
  const [inp,setInp]=useState(""); const [busy,setBusy]=useState(false);
  const endRef=useRef();
  useEffect(()=>{endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs]);
  const hist=ms=>ms.slice(-7,-1).map(m=>({role:m.role==="assistant"?"assistant":"user",content:m.text}));
  const send=async text=>{
    const t=(text||inp).trim();if(!t||busy)return;
    const nm=[...msgs,{role:"user",text:t}];setMsgs(nm);setInp("");setBusy(true);
    try{const r=await fetch(`${API}/chat`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:t,history:hist(nm)})});const d=await r.json();setMsgs(m=>[...m,{role:"assistant",text:d.reply||"No response."}]);}
    catch{setMsgs(m=>[...m,{role:"assistant",text:"⚠️ Backend unavailable."}]);}
    setBusy(false);
  };
  return (
    <div className="chat-panel">
      <div className="chat-hdr">
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span className="chat-icon">⬡</span>
          <div><p className="chat-title">AI Assistant</p><p className="chat-sub">Powered by Claude</p></div>
        </div>
        <div style={{display:"flex",gap:6}}>
          <button className="act-xs" onClick={()=>setMsgs([{role:"assistant",text:"Cleared. What would you like to know?"}])}>⊘</button>
          <button className="am-close" onClick={onClose}>✕</button>
        </div>
      </div>
      <div className="chat-msgs">
        {msgs.map((m,i)=>(
          <div key={i} className={`cmsg cmsg-${m.role}`}>
            {m.role==="assistant"&&<span className="cmsg-icon">⬡</span>}
            <div className="cmsg-bubble" style={{whiteSpace:"pre-wrap"}}>{m.text}</div>
          </div>
        ))}
        {busy&&<div className="cmsg cmsg-assistant"><span className="cmsg-icon">⬡</span><div className="cmsg-bubble typing"><i/><i/><i/></div></div>}
        <div ref={endRef}/>
      </div>
      {msgs.length<3&&<div className="chat-quick">{QP.map(p=><button key={p} className="chat-qp" onClick={()=>send(p)}>{p}</button>)}</div>}
      <div className="chat-inp-row">
        <input className="chat-inp" value={inp} onChange={e=>setInp(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&send()}
          placeholder="Ask about the news…" disabled={busy}/>
        <button className="chat-send" onClick={()=>send()} disabled={busy||!inp.trim()}>↑</button>
      </div>
    </div>
  );
}

// ── Side Panel Shell ──────────────────────────────────────────────────────────
function SidePanel({ title, onClose, children }) {
  return (
    <div className="modal-bd" onClick={onClose}>
      <div className="sp" onClick={e=>e.stopPropagation()}>
        <div className="sp-hdr"><h3 className="sp-title">{title}</h3><button className="am-close" onClick={onClose}>✕</button></div>
        <div className="sp-body">{children}</div>
      </div>
    </div>
  );
}

// ── Quiz Panel ────────────────────────────────────────────────────────────────
function QuizPanel({ onClose }) {
  const [quiz,setQuiz]=useState([]); const [loading,setLoading]=useState(false);
  const [answers,setAnswers]=useState({}); const [submitted,setSubmitted]=useState(false);
  const generate=async()=>{
    setLoading(true);setQuiz([]);setAnswers({});setSubmitted(false);
    try{const r=await fetch(`${API}/quiz`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({num_questions:4})});const d=await r.json();setQuiz(d.quiz||[]);}
    catch{alert("⚠️ Backend unreachable.");}
    setLoading(false);
  };
  const score=quiz.filter((q,i)=>answers[i]===q.answer).length;
  return (
    <SidePanel title="⬡ News Quiz" onClose={onClose}>
      {quiz.length===0&&!loading&&(<div className="sp-empty"><span className="sp-empty-icon">◎</span><p>Test your knowledge of today's headlines.</p><button className="cta-btn" onClick={generate}>Generate Quiz</button></div>)}
      {loading&&<div className="sp-loading"><div className="spin-ring"/><span>Generating questions…</span></div>}
      {quiz.length>0&&(
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          {quiz.map((q,i)=>(
            <div key={i} className="quiz-q">
              <p className="quiz-q-text"><span className="quiz-num">{i+1}</span>{q.question}</p>
              <div className="quiz-opts">
                {q.options.map((opt,j)=>{
                  const L=["A","B","C","D"][j],sel=answers[i]===L;
                  let cls="quiz-opt";
                  if(submitted)cls+=q.answer===L?" qo-right":sel?" qo-wrong":"";
                  else if(sel)cls+=" qo-sel";
                  return <button key={j} className={cls} onClick={()=>!submitted&&setAnswers(a=>({...a,[i]:L}))}>{opt}</button>;
                })}
              </div>
              {submitted&&q.explanation&&<p className="quiz-exp">◆ {q.explanation}</p>}
            </div>
          ))}
          {!submitted
            ?<button className="cta-btn" onClick={()=>setSubmitted(true)} disabled={Object.keys(answers).length<quiz.length}>Submit ({Object.keys(answers).length}/{quiz.length})</button>
            :<div className="quiz-score"><span className="quiz-score-n">{score}/{quiz.length}</span><p>Correct</p><button className="cta-btn" style={{marginTop:12}} onClick={generate}>New Quiz</button></div>
          }
        </div>
      )}
    </SidePanel>
  );
}

// ── Digest Panel ──────────────────────────────────────────────────────────────
function DigestPanel({ profile, onClose }) {
  const [digest,setDigest]=useState(""); const [loading,setLoading]=useState(false);
  const interests=profile?.interests||["general","technology"];
  const generate=async()=>{
    setLoading(true);setDigest("");
    try{const r=await fetch(`${API}/digest`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({interests})});const d=await r.json();setDigest(d.digest||"No digest.");}
    catch{setDigest("⚠️ Backend unreachable.");}
    setLoading(false);
  };
  return (
    <SidePanel title="◉ Daily Digest" onClose={onClose}>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
        {interests.map(i=><span key={i} className="int-tag">{i}</span>)}
      </div>
      {!digest&&!loading&&(<div className="sp-empty"><span className="sp-empty-icon">◉</span><p>AI-generated briefing tailored to your interests.</p><button className="cta-btn" onClick={generate}>✦ Generate</button></div>)}
      {loading&&<div className="sp-loading"><div className="spin-ring"/><span>Claude is reading the news…</span></div>}
      {digest&&(<div><div className="ai-badge-row">⬡ Claude AI</div><p className="digest-txt">{digest}</p><button className="ghost-btn" onClick={generate} style={{marginTop:14}}>↺ Regenerate</button></div>)}
    </SidePanel>
  );
}

// ── Saved Panel ───────────────────────────────────────────────────────────────
function SavedPanel({ bookmarks, onRemove, onClose }) {
  return (
    <SidePanel title={`◇ Saved (${bookmarks.length})`} onClose={onClose}>
      {bookmarks.length===0
        ?<div className="sp-empty"><span className="sp-empty-icon">◇</span><p>Nothing saved yet.</p></div>
        :<div className="sp-list">{bookmarks.map((a,i)=>(
          <div key={i} className="sp-item">
            <div className="sp-item-main"><p className="sp-item-title">{a.title}</p><p className="sp-item-src">{a.source} · <SPill mood={a.sentiment?.mood} xs/></p></div>
            <div style={{display:"flex",gap:5,flexShrink:0}}>
              <a href={a.url} target="_blank" rel="noreferrer" className="act-xs">↗</a>
              <button className="act-xs" onClick={()=>onRemove(a)}>✕</button>
            </div>
          </div>
        ))}</div>
      }
    </SidePanel>
  );
}

// ── History Panel ─────────────────────────────────────────────────────────────
function HistPanel({ history, onClose }) {
  return (
    <SidePanel title={`◎ History (${history.length})`} onClose={onClose}>
      {history.length===0
        ?<div className="sp-empty"><span className="sp-empty-icon">◎</span><p>No history yet.</p></div>
        :<div className="sp-list">{history.slice(0,40).map((a,i)=>(
          <div key={i} className="sp-item">
            <div className="sp-item-main"><p className="sp-item-title">{a.title}</p><p className="sp-item-src">{a.source} · {fmtDate(a.published_at)}</p></div>
            <a href={a.url} target="_blank" rel="noreferrer" className="act-xs">↗</a>
          </div>
        ))}</div>
      }
    </SidePanel>
  );
}

// ── Prefs Panel ───────────────────────────────────────────────────────────────
function PrefsPanel({ user, profile, history, bookmarks, onUpdate, onClose }) {
  const [interests,setInterests]=useState(profile?.interests||["general"]);
  const [saving,setSaving]=useState(false);
  const toggle=cat=>setInterests(i=>i.includes(cat)?i.filter(x=>x!==cat):[...i,cat]);
  const save=async()=>{setSaving(true);await onUpdate(user.uid,{interests});setSaving(false);onClose();};
  return (
    <SidePanel title="◈ Preferences" onClose={onClose}>
      <div className="prefs-avatar-row">
        <div className="prefs-avi">
          {profile?.photoURL
            ?<img src={profile.photoURL} alt="" style={{width:"100%",height:"100%",borderRadius:"50%",objectFit:"cover"}}/>
            :<span>{(profile?.displayName||"?")[0].toUpperCase()}</span>}
        </div>
        <div>
          <p className="prefs-name">{profile?.displayName||"Reader"}</p>
          <p className="prefs-email">{user.email}</p>
          <div style={{display:"flex",gap:5,marginTop:7,flexWrap:"wrap"}}>
            {[["◉","Reader"],["◈",`${history.length} read`],["◇",`${bookmarks.length} saved`]].map(([g,l])=>(
              <span key={l} className="prefs-badge">{g} {l}</span>
            ))}
          </div>
        </div>
      </div>
      <p className="prefs-section-label">Personalised Feed</p>
      <div className="prefs-cats">
        {CATEGORIES.filter(c=>c.id!=="for-you").map(c=>(
          <button key={c.id} className={`pref-cat${interests.includes(c.id)?" pref-on":""}`} onClick={()=>toggle(c.id)}>
            <span>{c.icon}</span> {c.label}
          </button>
        ))}
      </div>
      <button className="cta-btn" onClick={save} disabled={saving} style={{width:"100%",marginTop:20}}>
        {saving?"Saving…":"Save Preferences"}
      </button>
    </SidePanel>
  );
}

// ── Developer Panel ───────────────────────────────────────────────────────────
function UPIQRCode({ upiId }) {
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    if (!upiId || !canvasRef.current) return;
    setStatus("loading");

    // UPI deep-link scannable by GPay, PhonePe, Paytm, BHIM
    const upiString = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=Nejamul%20Haque&cu=INR`;

    // Dynamically import qrcode from esm.sh — pure JS, no CDN restrictions
    import("https://esm.sh/qrcode@1.5.3")
      .then(mod => {
        const QR = mod.default || mod;
        return QR.toCanvas(canvasRef.current, upiString, {
          width: 152,
          margin: 1,
          color: { dark: "#1a1814", light: "#ffffff" },
          errorCorrectionLevel: "M",
        });
      })
      .then(() => setStatus("ready"))
      .catch(() => setStatus("error"));
  }, [upiId]);

  return (
    <div className="dev-qr-canvas-wrap">
      {status === "loading" && (
        <div className="dev-qr-loading">
          <div className="spin-ring" style={{width:22,height:22,borderTopColor:"#c8a45a",borderColor:"rgba(200,164,90,.2)"}}/>
        </div>
      )}
      {status === "error" && (
        <div className="dev-qr-fallback">
          <p style={{fontFamily:"var(--font-mono)",fontSize:9,color:"#666",textAlign:"center",padding:"8px"}}>
            UPI:<br/><strong style={{color:"#333",fontSize:10}}>{upiId}</strong>
          </p>
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{
          display: status === "ready" ? "block" : "none",
          borderRadius: 6,
          maxWidth: "100%",
        }}
      />
    </div>
  );
}

function DeveloperPanel({ onClose }) {
  const [copied, setCopied] = useState(false);
  const upi = "nejamulhaque@freecharge";

  const copyUPI = () => {
    navigator.clipboard.writeText(upi)
      .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2200); })
      .catch(() => {});
  };

  const skills = [
    { icon:"⬡", label:"React",           level:95 },
    { icon:"◈", label:"Python / FastAPI", level:90 },
    { icon:"◉", label:"Claude AI / LLMs", level:88 },
    { icon:"⬢", label:"Firebase",         level:82 },
    { icon:"◆", label:"Node.js",          level:78 },
  ];
  const socials = [
    { icon:"⬡", label:"GitHub", url:"https://github.com/NejamulHaque", sub:"@NejamulHaque" },
    { icon:"✉",  label:"Email",  url:"mailto:nejamulhaque05@gmail.com",  sub:"nejamulhaque05@gmail.com" },
  ];

  return (
    <SidePanel title="</> Developer" onClose={onClose}>

      {/* ── Profile hero ── */}
      <div className="dev-hero">
        <div className="dev-avi-wrap">
          <div className="dev-avi">NH</div>
          <div className="dev-avi-ring"/>
        </div>
        <div className="dev-hero-text">
          <p className="dev-name">Nejamul Haque</p>
          <p className="dev-role-lbl">Full Stack AI Developer &amp; Researcher</p>
          <div className="dev-badges">
            <span className="dev-badge">◉ 5+ Years</span>
            <span className="dev-badge">⬡ AI Specialist</span>
          </div>
        </div>
      </div>

      {/* Bio */}
      <p className="dev-bio">
        Passionate about building intelligent systems that bridge complex AI and user-friendly interfaces. Creator of DigitalLens.
      </p>

      {/* Skills */}
      <p className="dev-sec-lbl">Skills</p>
      <div className="dev-skills">
        {skills.map(s => (
          <div key={s.label} className="dev-skill-row">
            <span className="dev-sk-icon">{s.icon}</span>
            <span className="dev-sk-lbl">{s.label}</span>
            <div className="dev-sk-bar-bg">
              <div className="dev-sk-bar-fill" style={{width:`${s.level}%`}}/>
            </div>
            <span className="dev-sk-pct">{s.level}%</span>
          </div>
        ))}
      </div>

      {/* Socials */}
      <p className="dev-sec-lbl">Connect</p>
      <div className="dev-socials">
        {socials.map(s => (
          <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="dev-social-card">
            <span className="dev-sc-icon">{s.icon}</span>
            <div className="dev-sc-text">
              <p className="dev-sc-label">{s.label}</p>
              <p className="dev-sc-sub">{s.sub}</p>
            </div>
            <span className="dev-sc-arr">↗</span>
          </a>
        ))}
      </div>

      {/* Support / QR */}
      <p className="dev-sec-lbl">Support the Project</p>
      <div className="dev-support-card">
        {/* QR side */}
        <div className="dev-qr-side">
          <UPIQRCode upiId={upi} />
          <p className="dev-qr-caption">Scan with any UPI app</p>
        </div>
        {/* Info side */}
        <div className="dev-upi-side">
          <p className="dev-coffee-title">Buy me a coffee ☕</p>
          <p className="dev-coffee-desc">
            Your support keeps DigitalLens independent, ad-free, and actively developed.
          </p>
          <div className="dev-upi-pill">
            <span className="dev-upi-text">{upi}</span>
            <button
              className={`dev-copy-btn${copied ? " dev-copy-ok" : ""}`}
              onClick={copyUPI}
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
          </div>
          <div className="dev-app-tags">
            {["GPay","PhonePe","Paytm","BHIM"].map(a => (
              <span key={a} className="dev-app-tag">{a}</span>
            ))}
          </div>
        </div>
      </div>

      <p className="dev-footer-note">
        Thank you for supporting open-source AI development ◈
      </p>
    </SidePanel>
  );
}

// ── About Modal ───────────────────────────────────────────────────────────────
function AboutModal({ onClose }) {
  return (
    <SidePanel title="◉ About" onClose={onClose}>
      <div style={{textAlign:"center",padding:"24px 0 20px"}}>
        <div className="about-mark">◉</div>
        <h2 className="about-logo">DigitalLens</h2>
        <p className="about-tag">Next-Generation AI News Intelligence</p>
      </div>
      {[
        {t:"Vision",b:"Cut through media noise. Real-time aggregation with sentiment analysis and AI-powered summarisation keeps you informed, not overwhelmed."},
        {t:"Stack",b:"React · FastAPI · Claude Sonnet AI · HuggingFace NLP · Firebase · NewsAPI"},
        {t:"v4.0 Premium",b:"Editorial layout · News quiz · Daily digest · Multi-language · Mood analytics · AI TL;DR · Focus mode"},
      ].map(s=>(
        <div key={s.t} className="about-sec">
          <p className="about-sec-title">{s.t}</p>
          <p className="about-sec-body">{s.b}</p>
        </div>
      ))}
      <button className="cta-btn" onClick={onClose} style={{width:"100%",marginTop:20}}>Close</button>
    </SidePanel>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, profile, logout, updateUserProfile } = useAuth();
  const interests = profile?.interests||["general","technology"];

  const [articles,setArticles]=useState([]);
  const [source,setSource]=useState("live");
  const [category,setCategory]=useState(profile?.interests?.[0]||"general");
  const [query,setQuery]=useState(""); const [searchInput,setSearch]=useState("");
  const [loading,setLoading]=useState(false); const [error,setError]=useState(null);
  const [filterMood,setFilter]=useState("all"); const [sortBy,setSortBy]=useState("latest");
  const [layout,setLayout]=useState("grid");
  const [bookmarks,setBookmarks]=useState(()=>{try{return JSON.parse(localStorage.getItem("np_bm4")||"[]");}catch{return[];}});
  const [history,setHistory]=useState(()=>{try{return JSON.parse(localStorage.getItem("np_hist4")||"[]");}catch{return[];}});
  const [toast,setToast]=useState(null); const [dismissBrk,setDismissBrk]=useState(false);

  const [dark,setDark]=useState(()=>{try{return localStorage.getItem("dl_theme")==="light"?false:true;}catch{return true;}});
  const [showChat,setShowChat]=useState(false);
  const [showAbout,setShowAbout]=useState(false);
  const [showSaved,setShowSaved]=useState(false);
  const [showHist,setShowHist]=useState(false);
  const [showPrefs,setShowPrefs]=useState(false);
  const [showDigest,setShowDigest]=useState(false);
  const [showQuiz,setShowQuiz]=useState(false);
  const [showDev,setShowDev]=useState(false);
  const [userMenu,setUserMenu]=useState(false);
  const [selected,setSelected]=useState(null);
  const [targetLang,setTargetLang]=useState("Spanish");
  const searchRef=useRef();

  const toast_=msg=>{setToast(msg);setTimeout(()=>setToast(null),2600);};

  const fetchNews=useCallback(async()=>{
    setLoading(true);setError(null);setDismissBrk(false);
    try{
      const p=new URLSearchParams({limit:16});
      p.set("category",category==="for-you"?"general":category);
      if(query)p.set("q",query);
      const r=await fetch(`${API}/news?${p}`);
      if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error(e.detail||`Error ${r.status}`);}
      const d=await r.json();setArticles(d.articles||[]);setSource(d.source||"live");
    }catch(e){setError(e.message||"Could not fetch news.");}
    finally{setLoading(false);}
  },[category,query]);

  useEffect(()=>{fetchNews();},[fetchNews]);
  useEffect(()=>{try{localStorage.setItem("np_bm4",JSON.stringify(bookmarks));}catch{}},[bookmarks]);
  useEffect(()=>{try{localStorage.setItem("np_hist4",JSON.stringify(history));}catch{}},[history]);
  useEffect(()=>{
    try{localStorage.setItem("dl_theme",dark?"dark":"light");}catch{}
    document.documentElement.setAttribute("data-dl-theme",dark?"dark":"light");
  },[dark]);

  useEffect(()=>{
    const h=e=>{
      if(e.key==="/"&&document.activeElement!==searchRef.current){e.preventDefault();searchRef.current?.focus();}
    };
    window.addEventListener("keydown",h);return()=>window.removeEventListener("keydown",h);
  },[]);
  useEffect(()=>{
    if(!userMenu)return;
    const h=()=>setUserMenu(false);
    setTimeout(()=>document.addEventListener("click",h),0);
    return()=>document.removeEventListener("click",h);
  },[userMenu]);

  const handleBM=a=>{const has=bookmarks.find(b=>b.url===a.url);setBookmarks(has?bookmarks.filter(b=>b.url!==a.url):[a,...bookmarks]);toast_(has?"Removed from saved":"Saved ◈");};
  const handleShare=async a=>{if(navigator.share){try{await navigator.share({title:a.title,url:a.url});}catch{}}else{navigator.clipboard.writeText(a.url);toast_("Link copied ↗");}};
  const handleOpen=a=>{setSelected(a);setHistory(h=>[a,...h.filter(x=>x.url!==a.url)].slice(0,50));if(user)setDoc(doc(db,"users",user.uid),{history:[a,...history.slice(0,49)]},{merge:true}).catch(()=>{});};
  const handleTag=t=>{setSearch(t);setQuery(t);};

  const filtered=(()=>{
    let list=category==="for-you"
      ?articles.filter(a=>{const t=(a.title+" "+(a.summary||"")+" "+(a.tags||[]).join(" ")).toLowerCase();return interests.some(i=>t.includes(i));})
      :articles;
    if(filterMood!=="all")list=list.filter(a=>a.sentiment?.mood===filterMood);
    return[...list].sort((a,b)=>{
      if(sortBy==="latest")return new Date(b.published_at)-new Date(a.published_at);
      if(sortBy==="oldest")return new Date(a.published_at)-new Date(b.published_at);
      if(sortBy==="positive")return(b.sentiment?.score||0)-(a.sentiment?.score||0);
      if(sortBy==="negative")return(a.sentiment?.score||0)-(b.sentiment?.score||0);
      return 0;
    });
  })();

  const [hero,...rest]=filtered;
  const greet=()=>{const h=new Date().getHours(),n=(profile?.displayName||user?.displayName||"there").split(" ")[0];if(h<12)return`Good morning, ${n}`;if(h<17)return`Good afternoon, ${n}`;return`Good evening, ${n}`;};

  return (
    <div className={`np${dark?"":" np-light"}`}>
      {toast&&<div className="toast">{toast}</div>}
      {articles.length>0&&<Ticker articles={articles}/>}

      {/* ── Header ── */}
      <header className="npnav">
        <div className="npnav-inner">
          <div className="brand">
            <span className="brand-glyph">◉</span>
            <div><h1 className="brand-name">DigitalLens</h1><p className="brand-sub">AI · Sentiment · Live</p></div>
          </div>

          <div className="search-wrap">
            <span className="search-glyph">⌕</span>
            <input ref={searchRef} className="search-inp" value={searchInput}
              onChange={e=>setSearch(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();setQuery(searchInput.trim());}}}
              placeholder="Search topics… (/)"/>
            {searchInput&&<button className="search-clear" onClick={()=>{setSearch("");setQuery("");}}>✕</button>}
            <button className="search-go" onClick={()=>setQuery(searchInput.trim())}>Search</button>
          </div>

          <div className="npnav-right">
            <button className="nav-pill" onClick={()=>setShowDigest(true)}>◉ Digest</button>
            <button className="nav-pill" onClick={()=>setShowQuiz(true)}>⬡ Quiz</button>
            <button className="nav-icon" title="History" onClick={()=>setShowHist(true)}>
              ◎{history.length>0&&<span className="nav-badge">{Math.min(history.length,9)}</span>}
            </button>
            <button className="nav-icon" title="Saved" onClick={()=>setShowSaved(true)}>
              ◇{bookmarks.length>0&&<span className="nav-badge">{bookmarks.length}</span>}
            </button>
            <button className="nav-icon theme-toggle" title={dark?"Switch to Day mode":"Switch to Night mode"}
              onClick={()=>setDark(d=>!d)}>
              {dark?"☀":"☽"}
            </button>
            <button className="nav-icon dev-trigger" title="Developer" onClick={()=>setShowDev(true)}>
              {"</>"}
            </button>
            <button className="nav-icon" title="About" onClick={()=>setShowAbout(true)}>◈</button>

            <div className="user-wrap">
              <button className="user-btn" onClick={e=>{e.stopPropagation();setUserMenu(o=>!o);}}>
                <div className="user-avi">
                  {profile?.photoURL
                    ?<img src={profile.photoURL} alt="" style={{width:"100%",height:"100%",borderRadius:"50%",objectFit:"cover"}}/>
                    :<span>{(profile?.displayName||user?.email||"?")[0].toUpperCase()}</span>}
                </div>
                <span className="user-name-label">{(profile?.displayName||"Me").split(" ")[0]}</span>
                <span style={{fontSize:10,opacity:.6}}>▾</span>
              </button>
              {userMenu&&(
                <div className="user-dd" onClick={e=>e.stopPropagation()}>
                  <div className="udd-hdr"><p className="udd-name">{profile?.displayName||"Reader"}</p><p className="udd-email">{user?.email}</p></div>
                  {[["◈","Preferences",()=>{setShowPrefs(true);setUserMenu(false);}],
                    ["◎","History",()=>{setShowHist(true);setUserMenu(false);}],
                    ["◇","Saved",()=>{setShowSaved(true);setUserMenu(false);}],
                    ["◉","Digest",()=>{setShowDigest(true);setUserMenu(false);}],
                    ["⬡","Quiz",()=>{setShowQuiz(true);setUserMenu(false);}],
                  ].map(([g,l,f])=><button key={l} className="udd-item" onClick={f}>{g} {l}</button>)}
                  <div className="udd-sep"/>
                  <button className="udd-item udd-danger" onClick={logout}>◉ Sign Out</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="np-main">
        {/* Category rail */}
        <div className="cat-rail">
          {CATEGORIES.map(c=>(
            <button key={c.id}
              className={`cat-btn${category===c.id&&!query?" cat-on":""}${c.id==="for-you"?" cat-special":""}`}
              onClick={()=>{setCategory(c.id);setQuery("");setSearch("");}}>
              <span className="cat-glyph">{c.icon}</span>
              <span className="cat-label">{c.label}</span>
              {c.id!=="for-you"&&interests.includes(c.id)&&<span className="cat-dot"/>}
            </button>
          ))}
        </div>

        {/* Page header */}
        <div className="pg-hdr">
          <div>
            <p className="pg-greet">{greet()}</p>
            <p className="pg-sub">{query?`Results for "${query}"`:`${category==="for-you"?"Your personalised":"Today's"} news`}</p>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {articles.length>0&&<MoodRing articles={articles}/>}
            <div className="view-switch">
              <button className={`view-btn${layout==="grid"?" view-on":""}`} onClick={()=>setLayout("grid")} title="Grid view">⊞</button>
              <button className={`view-btn${layout==="list"?" view-on":""}`} onClick={()=>setLayout("list")} title="List view">≡</button>
            </div>
            <button className="refresh-btn" onClick={fetchNews} disabled={loading}>{loading?"⏳":"↺"} Refresh</button>
          </div>
        </div>

        {!dismissBrk&&articles.length>0&&<Breaking articles={articles} onDismiss={()=>setDismissBrk(true)}/>}
        {!loading&&articles.length>0&&<PulseStats articles={articles} source={source}/>}

        {/* Filter row */}
        {!loading&&articles.length>0&&(
          <div className="filter-row">
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {["all","positive","neutral","negative"].map(m=>(
                <button key={m} className={`mood-btn${filterMood===m?" mood-on":""}`}
                  onClick={()=>setFilter(m)}
                  style={filterMood===m&&m!=="all"?{borderColor:MOOD[m]?.color,color:MOOD[m]?.color}:{}}>
                  {m==="all"?"All News":MOOD[m].icon+" "+MOOD[m].label}
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <select className="sort-sel" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="positive">Most Positive</option>
                <option value="negative">Most Negative</option>
              </select>
              <span className="art-count">{filtered.length} articles</span>
            </div>
          </div>
        )}

        {!loading&&articles.length>0&&<TrendCloud articles={articles} onTag={handleTag}/>}

        {/* Content area */}
        {loading?(
          <div className={layout==="list"?"list-view":"editorial"}>
            {Array.from({length:6}).map((_,i)=>(
              <div key={i} className={layout==="list"?"skel-list":"skel-card"}>
                {layout==="grid"&&<div className="skel-img"/>}
                <div style={{padding:14}}>{[40,90,75,55].map((w,j)=><div key={j} className="skel-line" style={{width:`${w}%`,marginBottom:8}}/>)}</div>
              </div>
            ))}
          </div>
        ):error?(
          <div className="state-box"><span className="state-icon">◆</span><p className="state-msg">{error}</p><button className="cta-btn" onClick={fetchNews}>Retry</button></div>
        ):filtered.length===0?(
          <div className="state-box">
            <span className="state-icon">{category==="for-you"?"✦":"◎"}</span>
            <p className="state-msg">{category==="for-you"?"No personalised articles yet. Browse categories to build your feed.":"No articles match your filter."}</p>
            <button className="cta-btn" onClick={()=>{setFilter("all");if(category==="for-you")setCategory("general");}}>
              {category==="for-you"?"Browse News":"Clear Filter"}
            </button>
          </div>
        ):layout==="list"?(
          <div className="list-view">
            {filtered.map((a,i)=><ArticleCard key={i} article={a} list bookmarked={!!bookmarks.find(b=>b.url===a.url)} onBookmark={handleBM} onShare={handleShare} onOpen={handleOpen}/>)}
          </div>
        ):(
          <div className="editorial">
            {hero&&<div className="e-hero"><HeroCard article={hero} bookmarked={!!bookmarks.find(b=>b.url===hero.url)} onBookmark={handleBM} onShare={handleShare} onOpen={handleOpen}/></div>}
            {rest.slice(0,2).map((a,i)=><div key={i} className="e-stack"><ArticleCard article={a} bookmarked={!!bookmarks.find(b=>b.url===a.url)} onBookmark={handleBM} onShare={handleShare} onOpen={handleOpen}/></div>)}
            {rest.slice(2).map((a,i)=><div key={i} className="e-grid"><ArticleCard article={a} bookmarked={!!bookmarks.find(b=>b.url===a.url)} onBookmark={handleBM} onShare={handleShare} onOpen={handleOpen}/></div>)}
          </div>
        )}
      </main>

      {/* Chat FAB */}
      <button className={`chat-fab${showChat?" fab-on":""}`} onClick={()=>setShowChat(s=>!s)}>
        <span className="fab-glyph">{showChat?"✕":"⬡"}</span>
        {!showChat&&<span className="fab-text">AI</span>}
      </button>
      {showChat&&<ChatPanel onClose={()=>setShowChat(false)}/>}

      {selected&&<ArticleModal article={selected} bookmarked={!!bookmarks.find(b=>b.url===selected.url)} onBookmark={handleBM} onShare={handleShare} onClose={()=>setSelected(null)} targetLang={targetLang} setTargetLang={setTargetLang}/>}
      {showDigest&&<DigestPanel profile={profile} onClose={()=>setShowDigest(false)}/>}
      {showQuiz&&<QuizPanel onClose={()=>setShowQuiz(false)}/>}
      {showAbout&&<AboutModal onClose={()=>setShowAbout(false)}/>}
      {showDev&&<DeveloperPanel onClose={()=>setShowDev(false)}/>}
      {showSaved&&<SavedPanel bookmarks={bookmarks} onRemove={handleBM} onClose={()=>setShowSaved(false)}/>}
      {showHist&&<HistPanel history={history} onClose={()=>setShowHist(false)}/>}
      {showPrefs&&<PrefsPanel user={user} profile={profile} history={history} bookmarks={bookmarks} onUpdate={updateUserProfile} onClose={()=>setShowPrefs(false)}/>}
    </div>
  );
}Z