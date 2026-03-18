"""
NewsPulse API  ─  v3 (Fixed + Enhanced)

Fixes:
  • Python 3.9 compat: replaced `str | None` with Optional[str]
  • Updated Claude model to claude-sonnet-4-5 (latest)
  • Fixed _all_cached_articles() to return dicts not raw cache values
  • Fixed CORS to not use wildcard with credentials

New professional endpoints:
  POST /compare      → Compare sentiment across multiple categories
  GET  /trending     → Global trending topics from cache
  POST /quiz         → AI-generated news quiz
  GET  /pulse        → Live mood dashboard stats
  POST /tldr         → Ultra-short article summary (Twitter-length)
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import requests, os, time, re
from dotenv import load_dotenv

# ── Optional Claude integration ───────────────────────────────────────────────
try:
    import anthropic as _anthropic
    _ANTHROPIC_AVAILABLE = True
except ImportError:
    _ANTHROPIC_AVAILABLE = False
    print("⚠️  anthropic package not found. AI features will use rule-based fallback.")

load_dotenv()

app = FastAPI(title="NewsPulse API v3", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

NEWS_API_KEY      = os.getenv("NEWS_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
NEWS_API_URL      = "https://newsapi.org/v2/top-headlines"

# ── Lazy NLP models ───────────────────────────────────────────────────────────
_models = {"summariser": None, "sentiment": None}

def get_summariser():
    if _models["summariser"] is None:
        print("Loading summarisation model…")
        from transformers import pipeline
        _models["summariser"] = pipeline(
            "text2text-generation", model="sshleifer/distilbart-cnn-12-6"
        )
    return _models["summariser"]

def get_sentiment_analyser():
    if _models["sentiment"] is None:
        print("Loading sentiment model…")
        from transformers import pipeline
        _models["sentiment"] = pipeline(
            "text-classification",
            model="distilbert-base-uncased-finetuned-sst-2-english",
        )
    return _models["sentiment"]

print("✅ NewsPulse v3 Backend ready (models load on first request)")

# ── Cache ─────────────────────────────────────────────────────────────────────
_cache: dict = {}
CACHE_TTL = 300  # 5 minutes

def get_cached(key: str):
    if key in _cache:
        ts, data = _cache[key]
        if time.time() - ts < CACHE_TTL:
            return data
    return None

def set_cache(key: str, data):
    _cache[key] = (time.time(), data)

def _all_cached_articles() -> list:
    """Return all article lists from cache, flattened."""
    out = []
    for ts, data in _cache.values():
        if isinstance(data, list):
            for item in data:
                if isinstance(item, dict) and "title" in item:
                    out.append(item)
    return out

# ── NLP helpers ───────────────────────────────────────────────────────────────
STOP_WORDS = {
    "about","which","their","would","could","there","these","those","after",
    "being","where","since","while","under","other","first","should","still",
    "have","that","with","from","this","will","were","been","more","also",
    "than","into","when","they","what","some","news","says","said","just",
    "your","such","even","like","much","well","very","many","most","over",
    "before","between","through","during","against","without","within",
}

def extract_tags(text: str) -> List[str]:
    words = re.sub(r"[^a-z\s]", "", text.lower()).split()
    freq: dict = {}
    for w in words:
        if len(w) > 4 and w not in STOP_WORDS:
            freq[w] = freq.get(w, 0) + 1
    return [w for w, _ in sorted(freq.items(), key=lambda x: -x[1])[:6]]

def summarise(text: str) -> str:
    words = text.split()
    if len(words) < 20:
        return text
    trimmed = " ".join(words[:400])
    try:
        result = get_summariser()(trimmed, max_length=80, min_length=25, do_sample=False)
        return result[0].get("generated_text") or result[0].get("summary_text", trimmed)
    except Exception:
        return " ".join(words[:50]) + "…"

def analyse_sentiment(text: str) -> dict:
    try:
        result = get_sentiment_analyser()(text[:512])[0]
        label, score = result["label"], round(result["score"], 3)
        if label == "POSITIVE":
            mood = "positive" if score > 0.85 else "neutral"
        else:
            mood = "negative" if score > 0.80 else "neutral"
        return {"mood": mood, "score": score}
    except Exception:
        return {"mood": "neutral", "score": 0.5}

def _claude_client():
    if not _ANTHROPIC_AVAILABLE or not ANTHROPIC_API_KEY:
        return None
    return _anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)

def _build_articles(raw: list) -> list:
    """Process raw NewsAPI articles into enriched dicts."""
    processed = []
    for a in raw:
        content     = a.get("content") or a.get("description") or ""
        description = a.get("description") or ""
        full_text   = description + " " + content

        try:    summary = summarise(content or description)
        except: summary = description[:200]

        sentiment = analyse_sentiment(full_text)
        tags      = extract_tags(full_text)

        processed.append({
            "title":        a.get("title", "").replace(" [+...]", "").strip(),
            "source":       a.get("source", {}).get("name", "Unknown"),
            "url":          a.get("url", ""),
            "image":        a.get("urlToImage"),
            "published_at": a.get("publishedAt", ""),
            "summary":      summary,
            "sentiment":    sentiment,
            "tags":         tags,
            "category":     a.get("_category", "general"),
        })
    return processed

# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "status":       "ok",
        "version":      "3.0.0",
        "message":      "NewsPulse API v3",
        "ai_enabled":   bool(ANTHROPIC_API_KEY and _ANTHROPIC_AVAILABLE),
        "cached_articles": len(_all_cached_articles()),
    }

@app.get("/news")
def get_news(
    category: str = Query(
        default="general",
        enum=["general","technology","business","sports","health","science","entertainment"],
    ),
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=15, ge=1, le=20),
):
    if not NEWS_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="NEWS_API_KEY not configured. Add it to your .env file."
        )

    cache_key = f"news:{category}:{q}:{limit}"
    cached = get_cached(cache_key)
    if cached:
        return {"source": "cache", "articles": cached}

    params: dict = {"apiKey": NEWS_API_KEY, "language": "en", "pageSize": limit}
    if q:
        params["q"] = q
        resp = requests.get(
            "https://newsapi.org/v2/everything", params=params, timeout=10
        )
    else:
        params["category"] = category
        resp = requests.get(NEWS_API_URL, params=params, timeout=10)

    if resp.status_code == 401:
        raise HTTPException(status_code=401, detail="Invalid NEWS_API_KEY.")
    if resp.status_code == 429:
        raise HTTPException(status_code=429, detail="NewsAPI rate limit reached.")
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail=f"NewsAPI error {resp.status_code}")

    raw = [a for a in resp.json().get("articles", []) if a.get("description")]
    for a in raw:
        a["_category"] = category

    processed = _build_articles(raw)
    set_cache(cache_key, processed)
    return {"source": "live", "articles": processed}

@app.get("/categories")
def get_categories():
    return {"categories": [
        "general","technology","business","sports","health","science","entertainment"
    ]}

# ── NEW: Global Trending ──────────────────────────────────────────────────────
@app.get("/trending")
def get_trending():
    articles = _all_cached_articles()
    tag_counts: dict = {}
    source_counts: dict = {}
    for a in articles:
        for t in (a.get("tags") or []):
            tag_counts[t] = tag_counts.get(t, 0) + 1
        src = a.get("source", "Unknown")
        source_counts[src] = source_counts.get(src, 0) + 1

    top_tags    = [t for t, _ in sorted(tag_counts.items(), key=lambda x: -x[1])[:12]]
    top_sources = [s for s, _ in sorted(source_counts.items(), key=lambda x: -x[1])[:5]]
    return {
        "trending_tags":    top_tags,
        "top_sources":      top_sources,
        "total_articles":   len(articles),
    }

# ── NEW: Pulse (mood dashboard) ───────────────────────────────────────────────
@app.get("/pulse")
def get_pulse():
    articles = _all_cached_articles()
    if not articles:
        return {"message": "No articles cached yet.", "counts": {}, "overall": "neutral"}
    counts = {"positive": 0, "neutral": 0, "negative": 0}
    by_category: dict = {}
    for a in articles:
        mood = a.get("sentiment", {}).get("mood", "neutral")
        counts[mood] = counts.get(mood, 0) + 1
        cat = a.get("category", "general")
        if cat not in by_category:
            by_category[cat] = {"positive": 0, "neutral": 0, "negative": 0}
        by_category[cat][mood] = by_category[cat].get(mood, 0) + 1

    total = len(articles)
    overall = max(counts, key=lambda k: counts[k])
    return {
        "total":        total,
        "counts":       counts,
        "percentages":  {k: round(v / total * 100, 1) for k, v in counts.items()},
        "overall_mood": overall,
        "by_category":  by_category,
    }

# ── NEW: Compare categories ───────────────────────────────────────────────────
class CompareRequest(BaseModel):
    categories: List[str] = ["technology", "business"]

@app.post("/compare")
async def compare_categories(req: CompareRequest):
    result = {}
    for cat in req.categories[:4]:  # max 4
        cached = get_cached(f"news:{cat}:None:15")
        if cached:
            counts = {"positive": 0, "neutral": 0, "negative": 0}
            for a in cached:
                mood = a.get("sentiment", {}).get("mood", "neutral")
                counts[mood] += 1
            result[cat] = {"articles": len(cached), "sentiment": counts}
        else:
            result[cat] = {"articles": 0, "sentiment": {}, "note": "not cached — browse this category first"}
    return {"comparison": result}

# ── NEW: TLDR endpoint ────────────────────────────────────────────────────────
class TLDRRequest(BaseModel):
    title:   str
    summary: str

@app.post("/tldr")
async def tldr(req: TLDRRequest):
    client = _claude_client()
    if not client:
        words = req.summary.split()
        short = " ".join(words[:20]) + ("…" if len(words) > 20 else "")
        return {"tldr": short}
    try:
        msg = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=80,
            system="Summarise news in ONE punchy sentence under 20 words. No fluff.",
            messages=[{"role":"user","content":f"Title: {req.title}\nSummary: {req.summary}"}],
        )
        return {"tldr": msg.content[0].text.strip()}
    except Exception as e:
        return {"tldr": req.summary[:120] + "…"}

# ── NEW: News Quiz ────────────────────────────────────────────────────────────
class QuizRequest(BaseModel):
    num_questions: int = 3

@app.post("/quiz")
async def generate_quiz(req: QuizRequest):
    client = _claude_client()
    articles = _all_cached_articles()[:8]
    if not articles or not client:
        return {"quiz": [], "message": "Browse some news first & ensure Claude is configured."}

    articles_str = "\n".join([
        f"• {a['title']} — {a['source']}"
        for a in articles[:8]
    ])
    prompt = (
        f"Based on these news headlines, generate exactly {min(req.num_questions,5)} multiple-choice quiz questions.\n\n"
        f"Headlines:\n{articles_str}\n\n"
        "Return ONLY a JSON array with this exact structure:\n"
        '[{"question":"...","options":["A)...","B)...","C)...","D)..."],"answer":"A","explanation":"..."}]\n'
        "No markdown, no commentary, only the JSON array."
    )
    try:
        msg = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1000,
            system="You are a news quiz generator. Return only valid JSON.",
            messages=[{"role":"user","content":prompt}],
        )
        import json
        text = msg.content[0].text.strip()
        # Strip markdown fences if present
        text = re.sub(r"```json|```", "", text).strip()
        quiz = json.loads(text)
        return {"quiz": quiz}
    except Exception as e:
        return {"quiz": [], "error": str(e)[:100]}

# ── AI Chat ───────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []  # [{role, content}]

def _rule_based_chat(msg: str) -> str:
    msg = msg.lower().strip()
    articles = _all_cached_articles()

    if any(k in msg for k in ["summarise","summarize","summary","today","headlines"]):
        if not articles:
            return "No articles cached yet — browse a category first, then ask me!"
        top = articles[:5]
        lines = [f"• {a['title']} ({a['source']}) — {a['sentiment']['mood']}" for a in top]
        return "Latest headlines:\n\n" + "\n".join(lines)

    if any(k in msg for k in ["positive","good news","happy","upbeat"]):
        pos = [a for a in articles if a.get("sentiment",{}).get("mood")=="positive"][:4]
        if pos:
            return "Positive stories:\n\n" + "\n".join(f"• {a['title']}" for a in pos)
        return "No positive stories cached yet."

    if any(k in msg for k in ["negative","bad news","crisis","concerning"]):
        neg = [a for a in articles if a.get("sentiment",{}).get("mood")=="negative"][:4]
        if neg:
            return "Concerning stories:\n\n" + "\n".join(f"• {a['title']}" for a in neg)
        return "No negative articles cached yet."

    if any(k in msg for k in ["trend","trending","popular","hot"]):
        if articles:
            tag_counts: dict = {}
            for a in articles:
                for t in (a.get("tags") or []):
                    tag_counts[t] = tag_counts.get(t, 0) + 1
            top_tags = sorted(tag_counts.items(), key=lambda x: -x[1])[:8]
            return "🔥 Trending: " + "  ".join(f"#{t}" for t, _ in top_tags)
        return "Browse some news first!"

    if any(k in msg for k in ["hello","hi","hey","help"]):
        return ("Hi! I'm your AI news assistant 👋\n\nTry:\n"
                "• \"Summarise today's news\"\n• \"Show positive stories\"\n"
                "• \"What's trending?\"\n• \"Any tech news?\"\n\n"
                "⚠️ Set ANTHROPIC_API_KEY for full Claude AI responses.")

    keywords = [w for w in msg.split() if len(w) > 3]
    matches = [a for a in articles if any(
        k in (a.get("title","") + " " + a.get("summary","")).lower()
        for k in keywords
    )][:4]
    if matches:
        return "Related:\n\n" + "\n".join(f"• {a['title']} ({a['source']})" for a in matches)
    return "I couldn't find matching articles. Browse a category first!\n\n💡 Set ANTHROPIC_API_KEY for full AI."

@app.post("/chat")
async def chat(req: ChatRequest):
    client = _claude_client()
    if not client:
        return {"reply": _rule_based_chat(req.message)}

    articles = _all_cached_articles()
    context_str = ""
    if articles:
        lines = [
            f"• {a['title']} | {a['source']} | {a['sentiment']['mood']} "
            f"(score:{a['sentiment']['score']}) | tags:{','.join(a.get('tags',[]))}"
            for a in articles[:20]
        ]
        context_str = "\n\nLoaded articles:\n" + "\n".join(lines)

    system = (
        "You are an intelligent AI news assistant for NewsPulse. "
        "Help users understand current events, find articles, analyse sentiment trends, "
        "and get insights. Be concise, insightful, and accurate. "
        "Use bullet points for lists. Max 250 words per response."
        + context_str
    )

    # Build messages with history
    messages = []
    for h in (req.history or [])[-6:]:  # last 6 turns
        if h.get("role") in ("user","assistant") and h.get("content"):
            messages.append({"role": h["role"], "content": h["content"]})
    messages.append({"role": "user", "content": req.message})

    try:
        msg = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=600,
            system=system,
            messages=messages,
        )
        return {"reply": msg.content[0].text}
    except Exception as e:
        return {"reply": f"⚠️ Claude error: {str(e)[:100]}\n\n{_rule_based_chat(req.message)}"}

# ── Daily Digest ──────────────────────────────────────────────────────────────
class DigestRequest(BaseModel):
    interests: List[str] = ["general", "technology"]

@app.post("/digest")
async def digest(req: DigestRequest):
    client = _claude_client()
    articles = _all_cached_articles()

    if not articles:
        return {"digest": "No articles cached. Browse a few categories first, then generate!"}

    relevant = [
        a for a in articles
        if any(
            interest.lower() in (
                a.get("title","") + " " + a.get("summary","") +
                " " + " ".join(a.get("tags",[])) + " " + a.get("source","")
            ).lower()
            for interest in req.interests
        )
    ] or articles[:12]

    articles_str = "\n".join([
        f"[{a['sentiment']['mood'].upper()}] {a['title']} — {a['source']}\n  {a.get('summary','')[:120]}"
        for a in relevant[:12]
    ])

    if not client:
        pos = sum(1 for a in relevant if a.get("sentiment",{}).get("mood")=="positive")
        neg = sum(1 for a in relevant if a.get("sentiment",{}).get("mood")=="negative")
        lines = [f"• {a['title']} ({a['source']})" for a in relevant[:5]]
        return {"digest": (
            f"📰 Daily Briefing\n\nInterests: {', '.join(req.interests)}\n\n"
            + "\n".join(lines)
            + f"\n\nSentiment: {pos} positive, {neg} negative.\n\n"
            "💡 Set ANTHROPIC_API_KEY for AI-written digests."
        )}

    try:
        msg = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=900,
            system=(
                "You are a professional news digest writer. Write a concise engaging daily "
                "briefing in 3 paragraphs. Start with the most impactful story, then analyse "
                "overall sentiment/themes, then give a forward-looking conclusion. "
                "Be factual and objective. Use clear, flowing prose."
            ),
            messages=[{"role":"user","content":(
                f"Write a personalised daily digest for someone interested in: {', '.join(req.interests)}.\n\n"
                f"Today's articles:\n{articles_str}"
            )}],
        )
        return {"digest": msg.content[0].text}
    except Exception as e:
        return {"digest": f"⚠️ Claude error: {str(e)[:80]}. Check your ANTHROPIC_API_KEY."}

# ── Article Deep Analysis ─────────────────────────────────────────────────────
class AnalyzeRequest(BaseModel):
    title:     str
    summary:   str
    sentiment: dict
    tags:      List[str] = []
    source:    str = "Unknown"

@app.post("/analyze")
async def analyze_article(req: AnalyzeRequest):
    client = _claude_client()

    if not client:
        mood  = req.sentiment.get("mood","neutral")
        score = req.sentiment.get("score",0.5)
        return {"analysis": (
            f"📊 Quick Analysis (Claude not configured)\n\n"
            f"Sentiment: {mood} ({round(score*100)}% confidence)\n"
            f"Source: {req.source}\n"
            f"Key topics: {', '.join(req.tags[:4]) or 'N/A'}\n\n"
            "💡 Add ANTHROPIC_API_KEY to .env for deep AI analysis."
        )}

    prompt = (
        f"Analyse this news article:\n\n"
        f"Title: {req.title}\nSource: {req.source}\n"
        f"Summary: {req.summary}\n"
        f"AI Sentiment: {req.sentiment.get('mood')} ({round(req.sentiment.get('score',0.5)*100)}%)\n"
        f"Tags: {', '.join(req.tags)}\n\n"
        "Respond in this exact format:\n"
        "**Key Takeaway:** (1 sentence)\n\n"
        "**Why It Matters:** (2-3 sentences)\n\n"
        "**Sentiment Context:** (why this sentiment rating)\n\n"
        "**Watch For:** (1 follow-up angle to monitor)\n\n"
        "Under 200 words total."
    )

    try:
        msg = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=400,
            system="You are a senior news analyst. Be precise, objective, and insightful.",
            messages=[{"role":"user","content":prompt}],
        )
        return {"analysis": msg.content[0].text}
    except Exception as e:
        return {"analysis": f"⚠️ Analysis failed: {str(e)[:100]}"}

# ── Translation ───────────────────────────────────────────────────────────────
SUPPORTED_LANGS = [
    "Spanish","French","German","Hindi","Chinese","Japanese",
    "Arabic","Portuguese","Russian","Italian","Korean","Bengali","Urdu",
]

class TranslateRequest(BaseModel):
    text:        str
    target_lang: str = "Spanish"

@app.post("/translate")
async def translate_text(req: TranslateRequest):
    if req.target_lang not in SUPPORTED_LANGS:
        raise HTTPException(status_code=400, detail=f"Unsupported language: {req.target_lang}")

    client = _claude_client()
    if not client:
        return {"translated": f"[Claude not configured — original text]: {req.text}"}

    try:
        msg = client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1000,
            system=(
                f"You are a professional translator. Translate the provided text into {req.target_lang}. "
                "Maintain the same tone and journalistic accuracy. Return ONLY the translated text, "
                "with no preamble or explanation."
            ),
            messages=[{"role":"user","content":req.text}],
        )
        return {"translated": msg.content[0].text}
    except Exception as e:
        return {"translated": f"⚠️ Translation failed: {str(e)[:100]}"}

@app.get("/health")
def health():
    return {
        "status": "healthy",
        "cached_articles": len(_all_cached_articles()),
        "news_api": bool(NEWS_API_KEY),
        "claude":   bool(ANTHROPIC_API_KEY and _ANTHROPIC_AVAILABLE),
    }