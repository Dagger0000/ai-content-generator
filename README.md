# ContentAI — Trend-Aware AI Content Generator

An MVP application that enables marketing teams to generate AI-powered content (blogs, ad copy, captions, emails) using real-time trending topics and market signals.

## 🔗 Live Demo
- **Frontend:** [https://your-app.vercel.app](https://your-app.vercel.app)
- **Backend API:** [https://your-backend.railway.app](https://your-backend.railway.app)
- **Demo video:** [Link to demo video]

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                      │
│         Vercel — contentai.vercel.app                   │
│  ┌──────────┐ ┌───────────┐ ┌──────────┐               │
│  │ Generator│ │ Dashboard │ │ Trends   │               │
│  │   Page   │ │   Page    │ │   Page   │               │
│  └────┬─────┘ └─────┬─────┘ └────┬─────┘               │
└───────┼─────────────┼────────────┼─────────────────────┘
        │             │            │
        ▼             ▼            ▼
┌─────────────────────────────────────────────────────────┐
│               BACKEND API (Node.js/Express)             │
│              Railway — api.railway.app                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │  /auth   │ │/content  │ │/projects │ │ /trends  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
└───────┼────────────┼────────────┼─────────────┼────────┘
        │            │            │             │
        ▼            ▼            ▼             ▼
┌──────────────┐ ┌─────────┐ ┌──────────┐ ┌──────────────┐
│   Supabase   │ │  Groq   │ │ Supabase │ │ Trends Svc   │
│  (Auth/DB)   │ │  API    │ │(Projects)│ │  (FastAPI +  │
│  PostgreSQL  │ │Llama-3  │ │          │ │  Pytrends)   │
└──────────────┘ └─────────┘ └──────────┘ └──────────────┘
```

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6 |
| Backend | Node.js, Express |
| AI/LLM | Groq API (Llama-3 70B) — Free tier |
| Database | Supabase (PostgreSQL) — Free tier |
| Auth | JWT + bcrypt |
| Trends | Python FastAPI + Pytrends |
| Deployment | Vercel (frontend) + Railway (backend + trends) |
| Logging | Winston |

---

## ✨ Features

- **Content Generation** — Blog posts, Ad Copy, Social Captions, Marketing Emails
- **6 Tone Modes** — Professional, Casual, Persuasive, Friendly, Luxury, Humorous
- **15 Industry Niches** with tailored prompting
- **Real-time Google Trends** via Pytrends integration
- **SEO Scoring** — Automated keyword density and structure scoring
- **Rewrite Tools** — Rewrite / Expand / Shorten / SEO Optimize
- **Multiple Variations** — Generate 3 variations at once
- **Saved Projects** — Full CRUD with search and filter
- **Trends Dashboard** — Trending keywords, rising queries, geo-based interest
- **Scheduled Generation** — Set future dates for content
- **User Auth** — Signup, login, JWT session

---
## 🛠️ Local Setup

### Prerequisites
- Node.js 18+
- Python 3.10+
- A free [Groq API key](https://console.groq.com)
- A free [Supabase project](https://supabase.com)

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/ai-content-generator.git
cd ai-content-generator
```

### 2. Set up the database
1. Go to [supabase.com](https://supabase.com) → New Project
2. Open **SQL Editor** and paste the contents of `supabase-schema.sql`
3. Click **Run**
4. Go to **Settings → API** and copy your Project URL and service_role key

### 3. Start the Trends microservice
```bash
cd trends-service
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 4. Start the Backend
```bash
cd backend
npm install

# Create .env from example
cp .env.example .env
# Edit .env with your keys

npm run dev
# Runs on http://localhost:3001
```

### 5. Start the Frontend
```bash
cd frontend
npm install

# Create .env
echo "REACT_APP_API_URL=http://localhost:3001" > .env

npm start
# Runs on http://localhost:3000
```

---

## ☁️ Deployment

### Frontend → Vercel
```bash
cd frontend
npx vercel --prod
# Set env var: REACT_APP_API_URL = your Railway backend URL
```

### Backend → Railway
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select the `backend` folder (or set root directory to `/backend`)
3. Add all environment variables from `.env.example`

### Trends Service → Railway
1. New service in same Railway project → deploy from `trends-service` folder
2. Railway auto-detects the `Procfile`

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |

### Content
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/content/generate` | Generate AI content |
| POST | `/api/content/rewrite` | Rewrite/expand/shorten/SEO |
| POST | `/api/content/variations` | Generate multiple variations |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Save a project |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |

### Trends
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/trends?niche=&geo=` | Get trending keywords |
| GET | `/api/trends/dashboard?niche=` | Get trend chart data |

---

## 🔑 Getting API Keys

1. **Groq API (FREE)** → [console.groq.com](https://console.groq.com) → API Keys → Create
2. **Supabase (FREE)** → [supabase.com](https://supabase.com) → New Project → Settings → API
3. **JWT Secret** → Run: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## 📁 Project Structure

```
ai-content-generator/
├── frontend/               # React app
│   ├── public/
│   ├── src/
│   │   ├── components/     # Layout, shared components
│   │   ├── pages/          # GeneratorPage, DashboardPage, TrendsPage
│   │   ├── hooks/          # useAuth
│   │   ├── lib/            # api.js (axios instance)
│   │   ├── App.js
│   │   ├── index.js
│   │   └── styles.css
│   ├── vercel.json
│   └── package.json
│
├── backend/                # Express API
│   ├── routes/
│   │   ├── auth.js         # Signup, login
│   │   ├── content.js      # AI generation, rewrite, variations
│   │   ├── projects.js     # CRUD for projects
│   │   └── trends.js       # Trends proxy
│   ├── middleware/
│   │   └── auth.js         # JWT middleware
│   ├── utils/
│   │   ├── logger.js       # Winston logger
│   │   └── supabase.js     # DB client
│   ├── server.js
│   ├── railway.toml
│   └── package.json
│
├── trends-service/         # Python FastAPI + Pytrends
│   ├── main.py
│   ├── requirements.txt
│   └── Procfile
│
├── supabase-schema.sql     # DB setup script
└── README.md
```

---

## 👤 Author
Shashank Vashisht — Built for Growth Vector AI Engineer Intern assignment.
