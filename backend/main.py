from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import requests, os, time, re, json
from dotenv import load_dotenv

load_dotenv()

try:
    import anthropic as _anthropic
    _ANTHROPIC_AVAILABLE = True
except ImportError:
    _ANTHROPIC_AVAILABLE = False

app = FastAPI(title="DigitalLens API", version="4.0.0")

NEWS_API_KEY      = os.getenv("NEWS_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

STOP = {"about","which","their","would","could","there","these","those","after","being","where","since","while","under","other","first","should","still","have","that","with","from","this","will","were","been","more","also","than","into","when","they","what","some","news","says","said","just","your"}

def extract_tags(text):
    words = re.sub(r"[^a-z\s]", "", text.lower()).split()
    freq = {}
    for w in words:
        if len(w) > 4 and w not in STOP:
            freq[w] = freq.get(w, 0) + 1
    return [w for w, _ in sorted(freq.items(), key=lambda x: -x[1])[:6]]

POS = {"growth","rises","record","gains","success","win","boost","advance","improve","launch","recovery","strong","rally"}
NEG = {"crisis","crash","falls","drops","death","war","attack","fail","collapse","flood","fire","kill","threat","decline"}

def analyse_sentiment(text):
    words = set(text.lower().split())
    pos = len(words & POS)
    neg = len(words & NEG)
    if pos > neg:
        return {"mood": "positive", "score": round(0.65 + min(pos,4)*0.06, 3)}
    if neg > pos:
        return {"mood": "negative", "score": round(0.65 + min(neg,4)*0.06, 3)}
    return {"mood": "neutral", "score": 0.55}

def summarise(text):
    words = text.split()
    if len(words) < 20:
        return text
    sentences = re.split(r'(?<=[.!?])\s+', text)
    short = " ".join(sentences[:2]) if sentences else " ".join(words[:50])
    return short[:280] + ("..." if len(short) > 280 else "")

def _claude():
    if not _ANTHROPIC_AVAILABLE or not ANTHROPIC_API_KEY:
        return None
    # Supports both Anthropic direct keys (sk-ant-...) and OpenRouter keys (sk-or-v1-...)
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
        title = (a.get("title") or "").replace(" [+...]","").strip()
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

@app.get("/")
def root():
    is_openrouter = ANTHROPIC_API_KEY.startswith("sk-or-")
    return {
        "app": "DigitalLens API",
        "version": "4.0.0",
        "status": "ok",
        "ai_enabled": bool(ANTHROPIC_API_KEY and _ANTHROPIC_AVAILABLE),
        "ai_provider": "OpenRouter" if is_openrouter else "Anthropic",
    }

@app.get("/health")
def health():
    return {"status": "healthy", "news_api": bool(NEWS_API_KEY), "claude": bool(ANTHROPIC_API_KEY and _ANTHROPIC_AVAILABLE), "cached_articles": len(all_articles())}

@app.get("/categories")
def get_categories():
    return {"categories": ["general","technology","business","sports","health","science","entertainment"]}

@app.get("/news")
def get_news(
    category: str = Query(default="general", enum=["general","technology","business","sports","health","science","entertainment"]),
    q: Optional[str] = Query(default=None),
    limit: int = Query(default=15, ge=1, le=20),
):
    if not NEWS_API_KEY:
        raise HTTPException(503, "NEWS_API_KEY not configured.")
    key = f"news:{category}:{q}:{limit}"
    cached = cache_get(key)
    if cached:
        return {"source": "cache", "articles": cached}
    params = {"apiKey": NEWS_API_KEY, "language": "en", "pageSize": limit}
    if q:
        params["q"] = q
        url = "https://newsapi.org/v2/everything"
    else:
        params["category"] = category
        url = "https://newsapi.org/v2/top-headlines"
    try:
        resp = requests.get(url, params=params, timeout=12)
    except Exception as e:
        raise HTTPException(502, str(e))
    if resp.status_code == 401:
        raise HTTPException(401, "Invalid NEWS_API_KEY.")
    if resp.status_code != 200:
        raise HTTPException(502, f"NewsAPI error {resp.status_code}")
    raw = [a for a in resp.json().get("articles", []) if a.get("description")]
    processed = build_articles(raw, category)
    cache_set(key, processed)
    return {"source": "live", "articles": processed}

@app.get("/trending")
def get_trending():
    articles = all_articles()
    tags = {}
    for a in articles:
        for t in (a.get("tags") or []):
            tags[t] = tags.get(t, 0) + 1
    return {"trending_tags": [t for t,_ in sorted(tags.items(), key=lambda x:-x[1])[:12]], "total_articles": len(articles)}

@app.get("/pulse")
def get_pulse():
    articles = all_articles()
    if not articles:
        return {"message": "No articles cached yet.", "counts": {}, "overall": "neutral"}
    counts = {"positive":0,"neutral":0,"negative":0}
    for a in articles:
        m = a.get("sentiment",{}).get("mood","neutral")
        counts[m] = counts.get(m,0) + 1
    total = len(articles)
    return {"total": total, "counts": counts, "percentages": {k: round(v/total*100,1) for k,v in counts.items()}, "overall_mood": max(counts, key=lambda k: counts[k])}

class ChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = []

def rule_chat(msg):
    msg_l = msg.lower()
    articles = all_articles()
    if any(k in msg_l for k in ["summarise","summarize","today","headlines"]):
        if not articles:
            return "No articles cached yet. Browse a category first!"
        return "Latest:\n\n" + "\n".join(f"- {a['title']} ({a['source']})" for a in articles[:5])
    if any(k in msg_l for k in ["positive","good news"]):
        pos = [a for a in articles if a.get("sentiment",{}).get("mood")=="positive"][:4]
        return "Positive:\n\n" + "\n".join(f"- {a['title']}" for a in pos) if pos else "None cached."
    if any(k in msg_l for k in ["negative","bad news","crisis"]):
        neg = [a for a in articles if a.get("sentiment",{}).get("mood")=="negative"][:4]
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
        ctx = "\n\nLoaded articles:\n" + "\n".join(f"- {a['title']} | {a['source']} | {a['sentiment']['mood']}" for a in articles[:20])
    messages = []
    for h in (req.history or [])[-6:]:
        if h.get("role") in ("user","assistant") and h.get("content"):
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
    interests: List[str] = ["general","technology"]

@app.post("/digest")
async def digest(req: DigestRequest):
    articles = all_articles()
    if not articles:
        return {"digest": "Browse some categories first, then generate!"}
    relevant = [a for a in articles if any(i.lower() in (a.get("title","")+" "+a.get("summary","")).lower() for i in req.interests)] or articles[:12]
    client = _claude()
    if not client:
        return {"digest": "Daily Briefing:\n\n" + "\n".join(f"- {a['title']} ({a['source']})" for a in relevant[:6])}
    try:
        articles_str = "\n".join(f"[{a['sentiment']['mood'].upper()}] {a['title']} - {a['source']}" for a in relevant[:12])
        resp = client.messages.create(
            model="claude-sonnet-4-5", max_tokens=900,
            system="You are a professional news digest writer. Write a concise 3-paragraph daily briefing.",
            messages=[{"role":"user","content":f"Interests: {', '.join(req.interests)}\n\nArticles:\n{articles_str}"}],
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
        return {"analysis": f"Sentiment: {req.sentiment.get('mood')} ({round(req.sentiment.get('score',0.5)*100)}%)\nSource: {req.source}"}
    try:
        resp = client.messages.create(
            model="claude-sonnet-4-5", max_tokens=400,
            system="You are a senior news analyst. Be precise and insightful.",
            messages=[{"role":"user","content":f"Title: {req.title}\nSource: {req.source}\nSummary: {req.summary}\nSentiment: {req.sentiment.get('mood')} ({round(req.sentiment.get('score',0.5)*100)}%)\nTags: {', '.join(req.tags)}\n\nFormat:\n**Key Takeaway:** (1 sentence)\n**Why It Matters:** (2-3 sentences)\n**Sentiment Context:** (why this rating)\n**Watch For:** (1 follow-up)\nUnder 200 words."}],
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
            messages=[{"role":"user","content":req.text}],
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
        return {"tldr": " ".join(words[:18]) + ("..." if len(words)>18 else "")}
    try:
        resp = client.messages.create(
            model="claude-sonnet-4-5", max_tokens=80,
            system="Summarise news in ONE sentence under 20 words.",
            messages=[{"role":"user","content":f"Title: {req.title}\nSummary: {req.summary}"}],
        )
        return {"tldr": resp.content[0].text.strip()}
    except Exception:
        return {"tldr": req.summary[:120]+"..."}

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
            messages=[{"role":"user","content":f"Generate {min(req.num_questions,5)} MCQ questions from:\n{headlines}\n\nReturn ONLY JSON: [{{\"question\":\"...\",\"options\":[\"A)...\",\"B)...\",\"C)...\",\"D)...\"],\"answer\":\"A\",\"explanation\":\"...\"}}]"}],
        )
        text = re.sub(r"```json|```","",resp.content[0].text).strip()
        return {"quiz": json.loads(text)}
    except Exception as e:
        return {"quiz": [], "error": str(e)[:100]}

class CompareRequest(BaseModel):
    categories: List[str] = ["technology","business"]

@app.post("/compare")
async def compare(req: CompareRequest):
    result = {}
    for cat in req.categories[:4]:
        cached = cache_get(f"news:{cat}:None:15")
        if cached:
            counts = {"positive":0,"neutral":0,"negative":0}
            for a in cached:
                m = a.get("sentiment",{}).get("mood","neutral")
                counts[m] = counts.get(m,0)+1
            result[cat] = {"articles": len(cached), "sentiment": counts}
        else:
            result[cat] = {"articles": 0, "note": "Browse this category first."}
    return {"comparison": result}