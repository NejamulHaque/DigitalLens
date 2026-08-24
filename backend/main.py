# ─────────────────────────────────────────────────────────────
# DigitalLens API v4.1 — FastAPI Backend
# ✅ Free real-time news (Google RSS) + NewsAPI fallback
# ✅ Router registration fixed (no more NameError crash)
# ✅ Claude AI / OpenRouter integration
# ─────────────────────────────────────────────────────────────
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
from urllib.parse import quote
from dotenv import load_dotenv
import requests, os, time, re, json
import html as _html
import feedparser
from routers import admin  # ✅ imports at top are fine

from routers import irus, free_news   # ✅ imports at top are fine

load_dotenv()

try:
    import anthropic as _anthropic
    _ANTHROPIC_AVAILABLE = True
except ImportError:
    _ANTHROPIC_AVAILABLE = False

app = FastAPI(title="DigitalLens API", version="4.1.0")   # ✅ app created FIRST

NEWS_API_KEY      = os.getenv("NEWS_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── In-memory cache (5-min TTL) ──────────────────────────────
_cache: dict = {}
CACHE_TTL = 300

def cache_get(key):
    e = _cache.get(key)
    if e and time.time() - e[0] < CACHE_TTL:
        return e[1]
    return None

def cache_set(key, data):
    _cache[key] = (time.time(), data)

def all_articles():
    out = []
    for _, data in _cache.values():
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict) and "title" in item:
                    out.append(item)
    return out

# ── NLP helpers ──────────────────────────────────────────────
STOP = {"about", "which", "their", "would", "could", "there", "these", "those",
        "after", "being", "where", "since", "while", "under", "other", "first",
        "should", "still", "have", "that", "with", "from", "this", "will",
        "were", "been", "more", "also", "than", "into", "when", "they",
        "what", "some", "news", "says", "said", "just", "your","nbsp", "amp", "quot", "html", "https", "http"}

def extract_tags(text):
    words = re.sub(r"[^a-z\u0900-\u097F\s]", "", text.lower()).split()
    freq = {}
    for w in words:
        if len(w) > 4 and w not in STOP:
            freq[w] = freq.get(w, 0) + 1
    return [w for w, _ in sorted(freq.items(), key=lambda x: -x[1])[:6]]

POS = {"growth", "rises", "record", "gains", "success", "win", "wins", "boost",
       "boosts", "advance", "improve", "improves", "launch", "recovery", "strong",
       "rally", "soars", "surge", "surges", "breakthrough", "hope", "peace",
       "deal", "approves", "aid", "support", "investment", "innovation", "celebrates", "जीत", "विकास", "उपलब्धि", "बढ़ोतरी", "सफल", "खुशखबरी", "रिकॉर्ड", "लॉन्च", "शांति"}

NEG = {"crisis", "crash", "falls", "drops", "death", "dies", "killed", "kills",
       "war", "attack", "attacks", "fail", "collapse", "flood", "fire", "kill",
       "threat", "threats", "decline", "missile", "missiles", "strike", "strikes",
       "conflict", "sanctions", "fears", "warning", "layoffs", "sues", "guilty",
       "arrested", "explosion", "हमला", "हत्या", "दुर्घटना", "संकट", "मौत", "युद्ध", "गिरावट", "आरोप", "हिंसा"}

def analyse_sentiment(text):
    words = set(text.lower().split())
    pos = len(words & POS)
    neg = len(words & NEG)
    if pos > neg:
        return {"mood": "positive", "score": round(0.65 + min(pos, 4) * 0.06, 3)}
    if neg > pos:
        return {"mood": "negative", "score": round(0.65 + min(neg, 4) * 0.06, 3)}
    return {"mood": "neutral", "score": 0.55}

def summarise(text):
    words = text.split()
    if len(words) < 20:
        return text
    sentences = re.split(r'(?<=[.!?])\s+', text)
    short = " ".join(sentences[:2]) if sentences else " ".join(words[:50])
    return short[:280] + ("..." if len(short) > 280 else "")

# ── Claude / OpenRouter client ───────────────────────────────
def _claude():
    if not _ANTHROPIC_AVAILABLE or not ANTHROPIC_API_KEY:
        return None
    is_openrouter = ANTHROPIC_API_KEY.startswith("sk-or-")
    if is_openrouter:
        return _anthropic.Anthropic(
            api_key=ANTHROPIC_API_KEY,
            base_url="https://openrouter.ai/api/v1",
            default_headers={
                "HTTP-Referer": "https://digital-lens.vercel.app",
                "X-Title": "DigitalLens",
            }
        )
    return _anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

def build_articles(raw, category="general"):
    out = []
    for a in raw:
        content = a.get("content") or a.get("description") or ""
        description = a.get("description") or ""
        full = description + " " + content
        summary = summarise(content or description)
        sentiment = analyse_sentiment(full)
        tags = extract_tags(full)
        title = (a.get("title") or "").replace("[...]", "").strip()
        if not title or title == "[Removed]":
            continue
        out.append({
            "title": title,
            "source": a.get("source", {}).get("name", "Unknown"),
            "url": a.get("url", ""),
            "image": a.get("urlToImage"),
            "published_at": a.get("publishedAt", ""),
            "summary": summary,
            "sentiment": sentiment,
            "tags": tags,
            "category": category,
        })
    return out

# ── 🚀 FREE UNLIMITED NEWS: Google News RSS ──────────────────
RSS_TOPICS = {
    "general": None,
    "technology": "TECHNOLOGY",
    "business": "BUSINESS",
    "sports": "SPORTS",
    "health": "HEALTH",
    "science": "SCIENCE",
    "entertainment": "ENTERTAINMENT",
}
LANGS = {
    "en": ("en", "US", "US:en"),
    "hi": ("hi", "IN", "IN:hi"),      # हिन्दी
    "bn": ("bn", "IN", "IN:bn"),      # বাংলা
    "ur": ("ur", "PK", "PK:ur"),      # اردو
    "es": ("es", "ES", "ES:es"),
    "fr": ("fr", "FR", "FR:fr"),
    "ar": ("ar", "AE", "AE:ar"),
    "zh": ("zh-CN", "CN", "CN:zh-Hans"),
    "ja": ("ja", "JP", "JP:ja"),
}

def strip_html(text):
    t = re.sub(r"<[^>]+>", " ", text or "")   # strip HTML tags
    t = _html.unescape(t)                     # &amp;→&  &quot;→"  &nbsp;→\xa0
    t = t.replace("\xa0", " ")                # non-breaking space → space
    return re.sub(r"\s+", " ", t).strip()

def fetch_rss(category, q, limit, lang="en"):
    """Real-time news from Google News RSS — native language editions."""
    hl, gl, ceid = LANGS.get(lang, LANGS["en"])
    if q:
        url = f"https://news.google.com/rss/search?q={quote(q)}+when:2d&hl={hl}&gl={gl}&ceid={ceid}"
    elif RSS_TOPICS.get(category):
        url = f"https://news.google.com/rss/headlines/section/topic/{RSS_TOPICS[category]}?hl={hl}&gl={gl}&ceid={ceid}"
    else:
        url = f"https://news.google.com/rss?hl={hl}&gl={gl}&ceid={ceid}"

    feed = feedparser.parse(url)
    raw = []
    for entry in feed.entries[:limit]:
        parts = entry.title.split(" - ")
        title = parts[0].strip()
        source_name = parts[-1].strip() if len(parts) > 1 else "Google News"
        clean_summary = strip_html(entry.get("summary", ""))
        raw.append({
            "title": title,
            "description": clean_summary,
            "content": clean_summary,
            "url": entry.link,
            "urlToImage": None,
            "publishedAt": entry.get("published", ""),
            "source": {"name": source_name},
        })
    return raw

# ── Core endpoints ───────────────────────────────────────────
@app.get("/")
def root():
    is_openrouter = ANTHROPIC_API_KEY.startswith("sk-or-")
    return {
        "app": "DigitalLens API",
        "version": "4.1.0",
        "status": "ok",
        "news_source": "google-rss (free) + newsapi fallback",
        "ai_enabled": bool(ANTHROPIC_API_KEY and _ANTHROPIC_AVAILABLE),
        "ai_provider": "OpenRouter" if is_openrouter else "Anthropic",
    }

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "news_rss": True,
        "news_api": bool(NEWS_API_KEY),
        "claude": bool(ANTHROPIC_API_KEY and _ANTHROPIC_AVAILABLE),
        "cached_articles": len(all_articles()),
    }

@app.get("/categories")
def get_categories():
    return {"categories": ["general", "technology", "business", "sports", "health", "science", "entertainment"]}

@app.get("/news")
def get_news(
    category: str = Query(default="general", enum=["general", "technology", "business", "sports", "health", "science", "entertainment"]),
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=12, ge=1, le=50),
    offset: int = Query(default=0, ge=0),
    lang: str = Query(default="en"),
):
    key = f"news:{category}:{q}:{lang}"
    processed = cache_get(key)
    source = "cache"

    if not processed:
        raw = []
        try:
            raw = fetch_rss(category, q, 100, lang)   # fetch full feed once
        except Exception:
            raw = []

        if not raw and NEWS_API_KEY and lang == "en":
            params = {"apiKey": NEWS_API_KEY, "language": "en", "pageSize": 100}
            if q:
                params["q"] = q
                url = "https://newsapi.org/v2/everything"
            else:
                params["category"] = category
                url = "https://newsapi.org/v2/top-headlines"
            try:
                resp = requests.get(url, params=params, timeout=12)
                if resp.status_code == 200:
                    raw = [a for a in resp.json().get("articles", []) if a.get("description")]
            except Exception:
                pass

        if not raw:
            raise HTTPException(502, "Could not fetch news from any source.")

        processed = build_articles(raw, category)
        cache_set(key, processed)
        source = "live"

    page = processed[offset:offset + limit]
    return {
        "source": source,
        "articles": page,
        "total": len(processed),
        "has_more": offset + limit < len(processed),
    }

@app.get("/trending")
def get_trending():
    articles = all_articles()
    tags = {}
    for a in articles:
        for t in (a.get("tags") or []):
            tags[t] = tags.get(t, 0) + 1
    return {
        "trending_tags": [t for t, _ in sorted(tags.items(), key=lambda x: -x[1])[:12]],
        "total_articles": len(articles),
    }

@app.get("/pulse")
def get_pulse():
    articles = all_articles()
    if not articles:
        return {"message": "No articles cached yet.", "counts": {}, "overall": "neutral"}
    counts = {"positive": 0, "neutral": 0, "negative": 0}
    for a in articles:
        m = a.get("sentiment", {}).get("mood", "neutral")
        counts[m] = counts.get(m, 0) + 1
    total = len(articles)
    return {
        "total": total,
        "counts": counts,
        "percentages": {k: round(v / total * 100, 1) for k, v in counts.items()},
        "overall_mood": max(counts, key=lambda k: counts[k]),
    }

# ── AI endpoints ─────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []

def rule_chat(msg):
    msg_l = msg.lower()
    articles = all_articles()
    if any(k in msg_l for k in ["summarise", "summarize", "today", "headlines"]):
        if not articles:
            return "No articles cached yet. Browse a category first!"
        return "Latest:\n\n" + "\n".join(f"- {a['title']} ({a['source']})" for a in articles[:5])
    if any(k in msg_l for k in ["positive", "good news"]):
        pos = [a for a in articles if a.get("sentiment", {}).get("mood") == "positive"][:4]
        return "Positive:\n\n" + "\n".join(f"- {a['title']}" for a in pos) if pos else "None cached."
    if any(k in msg_l for k in ["negative", "bad news", "crisis"]):
        neg = [a for a in articles if a.get("sentiment", {}).get("mood") == "negative"][:4]
        return "Concerning:\n\n" + "\n".join(f"- {a['title']}" for a in neg) if neg else "None cached."
    return "Browse a category first, then ask me about the news!"

@app.post("/chat")
async def chat(req: ChatRequest):
    client = _claude()
    if not client:
        return {"reply": rule_chat(req.message)}
    articles = all_articles()
    ctx = ""
    if articles:
        ctx = "\n\nLoaded articles:\n" + "\n".join(
            f"- {a['title']} | {a['source']} | {a['sentiment']['mood']}" for a in articles[:20])
    messages = []
    for h in (req.history or [])[-6:]:
        if h.get("role") in ("user", "assistant") and h.get("content"):
            messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": req.message})
    try:
        resp = client.messages.create(
            model="claude-sonnet-4-5", max_tokens=600,
            system="You are an AI news assistant for DigitalLens. Be concise. Max 250 words." + ctx,
            messages=messages,
        )
        return {"reply": resp.content[0].text}
    except Exception as e:
        return {"reply": f"Error: {str(e)[:80]}"}

class DigestRequest(BaseModel):
    interests: List[str] = ["general", "technology"]

@app.post("/digest")
async def digest(req: DigestRequest):
    articles = all_articles()
    if not articles:
        return {"digest": "Browse some categories first, then generate!"}
    relevant = [a for a in articles if any(
        i.lower() in (a.get("title", "") + " " + a.get("summary", "")).lower() for i in req.interests)] or articles[:12]
    client = _claude()
    if not client:
        return {"digest": "Daily Briefing:\n\n" + "\n".join(f"- {a['title']} ({a['source']})" for a in relevant[:6])}
    try:
        articles_str = "\n".join(f"[{a['sentiment']['mood'].upper()}] {a['title']} - {a['source']}" for a in relevant[:12])
        resp = client.messages.create(
            model="claude-sonnet-4-5", max_tokens=900,
            system="You are a professional news digest writer. Write a concise 3-paragraph daily briefing.",
            messages=[{"role": "user", "content": f"Interests: {', '.join(req.interests)}\n\nArticles:\n{articles_str}"}],
        )
        return {"digest": resp.content[0].text}
    except Exception as e:
        return {"digest": f"Error: {str(e)[:80]}"}

class AnalyzeRequest(BaseModel):
    title: str
    summary: str
    sentiment: dict
    tags: List[str] = []
    source: str = "Unknown"

@app.post("/analyze")
async def analyze(req: AnalyzeRequest):
    client = _claude()
    if not client:
        return {"analysis": f"Sentiment: {req.sentiment.get('mood')} ({round(req.sentiment.get('score', 0.5) * 100)}%)\nSource: {req.source}"}
    try:
        resp = client.messages.create(
            model="claude-sonnet-4-5", max_tokens=400,
            system="You are a senior news analyst. Be precise and insightful.",
            messages=[{"role": "user", "content": f"Title: {req.title}\nSource: {req.source}\nSummary: {req.summary}\nSentiment: {req.sentiment.get('mood')} ({round(req.sentiment.get('score', 0.5) * 100)}%)\nTags: {', '.join(req.tags)}\n\nFormat:\nKey Takeaway: (1 sentence)\nWhy It Matters: (2-3 sentences)\nSentiment Context: (why this rating)\nWatch For: (1 follow-up)\nUnder 200 words."}],
        )
        return {"analysis": resp.content[0].text}
    except Exception as e:
        return {"analysis": f"Error: {str(e)[:100]}"}

class TranslateRequest(BaseModel):
    text: str
    target_lang: str = "Spanish"

@app.post("/translate")
async def translate(req: TranslateRequest):
    client = _claude()
    if not client:
        return {"translated": req.text}
    try:
        resp = client.messages.create(
            model="claude-sonnet-4-5", max_tokens=1000,
            system=f"Translate to {req.target_lang}. Return ONLY the translation.",
            messages=[{"role": "user", "content": req.text}],
        )
        return {"translated": resp.content[0].text}
    except Exception as e:
        return {"translated": f"Error: {str(e)[:100]}"}

class TLDRRequest(BaseModel):
    title: str
    summary: str

@app.post("/tldr")
async def tldr(req: TLDRRequest):
    client = _claude()
    if not client:
        words = req.summary.split()
        return {"tldr": " ".join(words[:18]) + ("..." if len(words) > 18 else "")}
    try:
        resp = client.messages.create(
            model="claude-sonnet-4-5", max_tokens=80,
            system="Summarise news in ONE sentence under 20 words.",
            messages=[{"role": "user", "content": f"Title: {req.title}\nSummary: {req.summary}"}],
        )
        return {"tldr": resp.content[0].text.strip()}
    except Exception:
        return {"tldr": req.summary[:120] + "..."}

class QuizRequest(BaseModel):
    num_questions: int = 4

@app.post("/quiz")
async def quiz(req: QuizRequest):
    client = _claude()
    articles = all_articles()[:8]
    if not articles or not client:
        return {"quiz": [], "message": "Browse news first and ensure Claude is configured."}
    headlines = "\n".join(f"- {a['title']} ({a['source']})" for a in articles[:8])
    try:
        resp = client.messages.create(
            model="claude-sonnet-4-5", max_tokens=1200,
            system="You are a news quiz generator. Return only valid JSON arrays, no markdown.",
            messages=[{"role": "user", "content": f"Generate {min(req.num_questions, 5)} MCQ questions from:\n{headlines}\n\nReturn ONLY JSON: [{{\"question\": \"...\", \"options\": [\"A) ...\", \"B) ...\", \"C) ...\", \"D) ...\"], \"answer\": \"A\", \"explanation\": \"...\"}}]"}],
        )
        text = re.sub(r"```json|```", "", resp.content[0].text).strip()
        return {"quiz": json.loads(text)}
    except Exception as e:
        return {"quiz": [], "error": str(e)[:100]}

class CompareRequest(BaseModel):
    categories: List[str] = ["technology", "business"]

@app.post("/compare")
async def compare(req: CompareRequest):
    result = {}
    for cat in req.categories[:4]:
        counts = {"positive": 0, "neutral": 0, "negative": 0}
        total = 0
        for key, entry in _cache.items():
            if not key.startswith(f"news:{cat}:"):
                continue
            for a in (entry[1] or []):
                m = a.get("sentiment", {}).get("mood", "neutral")
                counts[m] = counts.get(m, 0) + 1
                total += 1
        result[cat] = {"articles": total, "sentiment": counts} if total else {"articles": 0, "note": "Browse this category first."}
    return {"comparison": result}

# ── ✅ Routers registered AFTER app creation (fixes the crash) ──
app.include_router(irus.router)
app.include_router(free_news.router)
app.include_router(admin.router)