from fastapi import APIRouter
import feedparser
import time
from datetime import datetime

router = APIRouter(prefix="/api/free-news", tags=["Free Real-Time News"])

# 🧠 IN-MEMORY CACHE (Makes dashboard refresh INSTANT)
CACHE = {}
CACHE_DURATION = 300  # Update every 5 minutes (300 seconds)

def fetch_google_news(query: str = "", category: str = "top"):
    """Fetches real-time news from Google News RSS"""
    
    # 1. Build the Google News RSS URL
    if category == "top":
        url = "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en"
    else:
        # Search query (e.g., "technology", "AI", "sports")
        url = f"https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en"

    # 2. Parse the RSS feed
    feed = feedparser.parse(url)
    articles = []
    
    # 3. Format the data to match your DigitalLens frontend
    for entry in feed.entries[:20]: # Get top 20 articles
        articles.append({
            "title": entry.title.split(" - ")[0], # Google appends source to title, we split it
            "source": entry.title.split(" - ")[-1] if " - " in entry.title else "Google News",
            "url": entry.link,
            "publishedAt": entry.published,
            "description": entry.get("summary", ""),
            "sentiment": "neutral" # You can pass this to your Irus AI later!
        })
        
    return articles

@router.get("/feed")
def get_realtime_news(category: str = "top", query: str = ""):
    """
    Returns cached news instantly. If cache is old, it fetches fresh news.
    """
    cache_key = f"{category}_{query}"
    current_time = time.time()
    
    # Check if we have fresh data in cache
    if cache_key in CACHE:
        data, timestamp = CACHE[cache_key]
        if current_time - timestamp < CACHE_DURATION:
            return {"status": "success", "source": "cache", "articles": data}
    
    # If cache is empty or old, fetch fresh data from Google
    fresh_articles = fetch_google_news(query, category)
    
    # Save to cache
    CACHE[cache_key] = (fresh_articles, current_time)
    
    return {"status": "success", "source": "live-google", "articles": fresh_articles}