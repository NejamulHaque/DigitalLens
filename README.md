<div align="center">

# ◉ DigitalLens

### Next-Generation AI News Intelligence Platform

*Real-time news aggregation · Sentiment analysis · Claude AI powered · Multi-language*

[![Live Demo](https://img.shields.io/badge/Live_Demo-digital--lens.vercel.app-gold?style=for-the-badge&logo=vercel)](https://digital-lens.vercel.app)
[![Backend](https://img.shields.io/badge/API-digitallens.onrender.com-green?style=for-the-badge&logo=render)](https://digitallens.onrender.com/health)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com)
[![Claude AI](https://img.shields.io/badge/Claude-Sonnet_4.5-CC785C?style=for-the-badge)](https://anthropic.com)
[![Firebase](https://img.shields.io/badge/Firebase-Auth_+_Firestore-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

</div>

---

## 📸 Preview

> Premium dark editorial design with gold accents, Cormorant Garamond typography, and a luxury broadsheet aesthetic.

```
◉ DigitalLens  —  AI · Sentiment · Live
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔴 LIVE  Fed holds rates · SpaceX Starship · Markets rally · Climate summit opens
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✦ For You  ◉ World  ⬡ Tech  ◈ Markets  ◎ Sports  ♥ Health  ⬢ Science  ◆ Culture
```

---

## ✨ Features

### 🤖 AI-Powered Intelligence
| Feature | Description |
|---|---|
| **Deep AI Analysis** | Key takeaway, why it matters, sentiment context — powered by Claude |
| **AI TL;DR** | One-line article summary on every card with a single click |
| **Daily Digest** | Personalised AI-written news briefing based on your interests |
| **News Quiz** | AI-generated 4-question quiz from today's headlines |
| **AI Chat Assistant** | Multi-turn news Q&A with full conversation history |
| **Smart Summarisation** | Every article auto-summarised on fetch |

### 📊 Sentiment & Analytics
| Feature | Description |
|---|---|
| **Real-time Sentiment** | Every article scored positive / neutral / negative |
| **Mood Ring** | Live circular donut chart showing today's news mood |
| **Pulse Stats** | Article count + sentiment breakdown in the toolbar |
| **Trend Cloud** | Auto-extracted trending topics from cached articles |
| **Breaking Alert** | Auto-detected high-confidence negative stories |
| **Sentiment Filter** | Filter entire feed by mood |

### 🌐 Content & Discovery
| Feature | Description |
|---|---|
| **8 Categories** | For You · World · Tech · Markets · Sports · Health · Science · Culture |
| **Live News Ticker** | Scrolling breaking news bar at the top |
| **Smart Search** | Search any topic with keyboard shortcut `/` |
| **Personalised Feed** | "For You" tab based on your saved interests |
| **13-Language Translation** | Translate any article to Spanish, French, Hindi, Arabic, and 9 more |
| **Tag Filtering** | Click any trending tag to search it |
| **Sort Options** | Latest · Oldest · Most Positive · Most Negative |

### 🎨 Premium UI/UX
| Feature | Description |
|---|---|
| **Day / Night Theme** | Full light and dark mode with localStorage persistence |
| **Editorial Grid Layout** | Magazine-style with featured hero card |
| **List View** | Compact newspaper-style layout toggle |
| **Focus / Reading Mode** | Distraction-free article reading in modal |
| **Skeleton Loading** | Animated placeholders while articles load |
| **Responsive Design** | Full mobile, tablet, and desktop support |
| **Keyboard Shortcuts** | `/` to search, `Esc` to close modals |

### 👤 User Features
| Feature | Description |
|---|---|
| **Auth** | Google OAuth + Email/Password via Firebase |
| **Bookmarks** | Save articles with one click, persisted to localStorage |
| **Reading History** | Last 50 articles tracked automatically |
| **Preferences** | Choose your interest categories for personalised feed |
| **Export** | Download any article as a `.txt` report |
| **Share** | Native share API or copy link to clipboard |
| **Developer Panel** | `</>` button — skills, social links, UPI QR payment |

---

## 🛠 Tech Stack

### Frontend
```
React 19          — UI framework
Vite 8            — Build tool and dev server
Firebase 12       — Authentication + Firestore database
Cormorant Garamond — Display/headline typography (serif)
DM Mono           — Metadata, badges, labels (monospace)
Manrope           — Body copy (sans-serif)
Vanilla CSS       — No UI framework, pure CSS variables
```

### Backend
```
FastAPI 0.115     — High-performance async Python API
Anthropic SDK     — Claude Sonnet 4.5 AI integration
OpenRouter        — Alternative AI provider (auto-detected)
NewsAPI           — Real-time news aggregation
python-dotenv     — Environment variable management
In-memory cache   — 5-minute TTL to minimise API calls
```

### Infrastructure
```
Vercel            — Frontend hosting (auto-deploy from GitHub)
Render            — Backend hosting (free tier)
Firebase Auth     — Google OAuth + Email/Password
Firestore         — User profiles and preferences
GitHub            — Source control
```

---

## 🚀 Live Demo

| Service | URL | Status |
|---|---|---|
| **Frontend** | https://digital-lens.vercel.app | ✅ Live |
| **Backend API** | https://digitallens.onrender.com | ✅ Live |
| **Health Check** | https://digitallens.onrender.com/health | ✅ Live |

> ⚠️ Render free tier sleeps after 15 mins inactivity. First request may take ~30 seconds to wake up.

---

## 📁 Project Structure

```
DigitalLens/
│
├── frontend/                          # React + Vite application
│   ├── public/
│   │   ├── favicon.svg
│   │   └── upi_qr.png                 # UPI payment QR code
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx        # Firebase auth provider + Firestore sync
│   │   ├── firebase/
│   │   │   └── config.js              # Firebase project configuration
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx          # Main app — all components in one file
│   │   │   ├── Dashboard.css          # Premium dark/light theme (CSS variables)
│   │   │   ├── AuthPage.jsx           # Login + Register page
│   │   │   ├── AuthPage.css           # Auth page styles
│   │   │   └── AboutModal.jsx         # About DigitalLens modal
│   │   ├── App.jsx                    # Auth router (Dashboard vs AuthPage)
│   │   ├── main.jsx                   # React entry point
│   │   └── index.css                  # Global reset
│   ├── .env.local                     # Local env (VITE_API_URL) — not committed
│   ├── package.json
│   └── vite.config.js
│
├── backend/                           # FastAPI Python API
│   ├── main.py                        # All endpoints + business logic
│   ├── requirements.txt               # Python dependencies
│   ├── render.yaml                    # Render deployment config
│   ├── .env.example                   # Environment variable template
│   └── .gitignore
│
└── README.md
```

---

## 🔌 API Reference

### Base URL
```
Production:  https://digitallens.onrender.com
Development: http://localhost:8000
```

### Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/` | App info, version, AI provider | No |
| `GET` | `/health` | Health check + status | No |
| `GET` | `/categories` | List all categories | No |
| `GET` | `/news` | Fetch + analyse articles | No |
| `GET` | `/trending` | Trending topics from cache | No |
| `GET` | `/pulse` | Live mood stats | No |
| `POST` | `/chat` | Multi-turn AI assistant | No |
| `POST` | `/digest` | Personalised daily briefing | No |
| `POST` | `/analyze` | Deep AI article analysis | No |
| `POST` | `/translate` | Translate to 13 languages | No |
| `POST` | `/tldr` | One-line AI summary | No |
| `POST` | `/quiz` | AI news quiz generator | No |
| `POST` | `/compare` | Compare sentiment across categories | No |

### Example Requests

```bash
# Get news
curl "https://digitallens.onrender.com/news?category=technology&limit=10"

# AI chat
curl -X POST "https://digitallens.onrender.com/chat" \
  -H "Content-Type: application/json" \
  -d '{"message": "What are todays top stories?", "history": []}'

# Translate article
curl -X POST "https://digitallens.onrender.com/translate" \
  -H "Content-Type: application/json" \
  -d '{"text": "Markets rallied today...", "target_lang": "Hindi"}'

# Generate quiz
curl -X POST "https://digitallens.onrender.com/quiz" \
  -H "Content-Type: application/json" \
  -d '{"num_questions": 4}'
```

---

## ⚙️ Local Development

### Prerequisites
- Node.js 18+
- Python 3.10+
- NewsAPI key → [newsapi.org](https://newsapi.org/register) (free)
- Anthropic or OpenRouter key
- Firebase project

### 1. Clone the repo
```bash
git clone https://github.com/NejamulHaque/DigitalLens.git
cd DigitalLens
```

### 2. Backend setup
```bash
cd backend

# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate        # Mac/Linux
# venv\Scripts\activate         # Windows

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
nano .env                        # Add your real keys

# Start the server
uvicorn main:app --reload
# API running at http://localhost:8000
```

### 3. Frontend setup
```bash
cd frontend

# Install dependencies
npm install

# Set API URL
echo "VITE_API_URL=http://localhost:8000" > .env.local

# Start dev server
npm run dev
# App running at http://localhost:5173
```

### 4. Open the app
```
http://localhost:5173
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)
| Variable | Description | Where to get |
|---|---|---|
| `NEWS_API_KEY` | NewsAPI access key | [newsapi.org](https://newsapi.org/register) |
| `ANTHROPIC_API_KEY` | Anthropic or OpenRouter key | [console.anthropic.com](https://console.anthropic.com) or [openrouter.ai](https://openrouter.ai) |
| `FRONTEND_URL` | Your Vercel URL (for CORS) | After Vercel deploy |

### Frontend (`frontend/.env.local`)
| Variable | Description |
|---|---|
| `VITE_API_URL` | Your Render backend URL |

> ⚠️ **Never commit `.env` files.** Use `.env.example` as a template only.

### AI Provider Auto-Detection
The backend automatically detects which AI provider to use based on your key format:
```
sk-ant-...    →  Anthropic direct
sk-or-v1-...  →  OpenRouter (with HTTP-Referer headers)
```
No code changes needed to switch — just update the env var.

---

## 🌍 Deployment

### Backend → Render

| Setting | Value |
|---|---|
| **Root Directory** | `backend` |
| **Runtime** | Python 3 |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | Free |

**Environment Variables on Render:**
```
NEWS_API_KEY       = your_key
ANTHROPIC_API_KEY  = your_key (Anthropic or OpenRouter)
FRONTEND_URL       = https://your-app.vercel.app
```

### Frontend → Vercel

| Setting | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Framework** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

**Environment Variables on Vercel:**
```
VITE_API_URL = https://your-api.onrender.com
```

### Firebase Auth
Add your domain in **Firebase Console → Authentication → Settings → Authorized Domains:**
```
your-app.vercel.app
```

### Firestore Rules
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null
                         && request.auth.uid == userId;
    }
  }
}
```

---

## 🗺 Roadmap

- [ ] Push notifications for breaking news
- [ ] RSS feed support
- [ ] Article comparison (side-by-side)
- [ ] Social sharing with AI-generated captions
- [ ] Weekly email digest
- [ ] Browser extension
- [ ] Mobile app (React Native)
- [ ] Self-hostable Docker image

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---

## 👨‍💻 Developer

<table>
  <tr>
    <td align="center">
      <strong>Nejamul Haque</strong><br/>
      Full Stack AI Developer & Researcher<br/>
      <a href="https://github.com/NejamulHaque">GitHub</a> ·
      <a href="mailto:nejamulhaque05@gmail.com">Email</a>
    </td>
  </tr>
</table>

### Support the Project ☕

DigitalLens is free and open-source. If it saved you time or inspired you, consider buying me a coffee!

```
UPI ID: nejamulhaque@freecharge
Apps:   GPay · PhonePe · Paytm · BHIM
```

---

## 📄 License

```
MIT License — Copyright (c) 2026 Nejamul Haque

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software to use, copy, modify, merge, publish, distribute, sublicense,
and/or sell copies of the Software.
```

---

<div align="center">

**Built with ◉ by [Nejamul Haque](https://github.com/NejamulHaque)**

*DigitalLens v4.0 — AI · Sentiment · Live*

⭐ Star this repo if you found it useful!

</div>
