# 🧠 NeuroWiki — Your Personal Memory Agent

> *"The goal isn't to remember everything. It's to never lose what matters."*

NeuroWiki is an AI-powered, private knowledge base that transforms anything you read into structured, searchable, interconnected wiki pages — all scoped exclusively to your account.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔐 **Private-by-design** | Every user's data lives in a completely isolated tenant. User A cannot see User B's data — ever. |
| 🤖 **AI ingestion** | Paste a URL, upload a PDF/DOCX/TXT, or type raw text. The AI extracts key knowledge and writes structured wiki pages automatically. |
| 🕸 **Knowledge graph** | Pages link to each other via `[[wikilinks]]`. Explore your knowledge visually in the Graph view. |
| 🔍 **Semantic search** | Ask natural-language questions across your entire knowledge base. Answers are grounded only in your own content. |
| 📓 **Diary** | Write and store personal diary entries, separate from wiki pages. |
| 🗑 **Delete your data** | Hover any wiki card → red trash icon appears → confirm → permanently deleted. |
| 📤 **Export** | Download a full export of your wiki at any time. |

---

## 🚀 Getting Started

### 1. Prerequisites

- [Node.js 20+](https://nodejs.org/)
- [Google Cloud CLI](https://cloud.google.com/sdk) *(for deployment only)*

### 2. Clone the repository

```bash
git clone https://github.com/SyedArmanAli2003/NeuroWiKi.git
cd NeuroWiKi
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# HydraDB — knowledge storage & semantic search
HYDRADB_API_KEY=sk_live_...

# Google Gemini — AI ingestion
GOOGLE_GENERATIVE_AI_API_KEY=AIza...

# NVIDIA LLaMA (fallback LLM)
NVIDIA_API_KEY=nvapi-...
NVIDIA_MODEL=meta/llama-3.3-70b-instruct

# NextAuth — session encryption
NEXTAUTH_SECRET=your-32-char-random-secret
NEXTAUTH_URL=http://localhost:3000

# Set to 0 to disable AI enrichment on ingest (faster, cheaper)
INGEST_ENRICH=0
```

> ⚠️ **Never commit `.env.local`** — it is gitignored by default.

### 5. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). You'll be shown the landing page. After 5 seconds, a sign-in prompt will appear.

---

## 🏗 Architecture

```
NeuroWiki
├── app/                     # Next.js App Router pages
│   ├── page.tsx             # Landing page (public, 5s auth prompt)
│   ├── auth/signin          # Sign-in page
│   ├── auth/signup          # Sign-up page
│   ├── wiki/                # Wiki browser + [slug] detail
│   ├── search/              # Semantic search
│   ├── graph/               # Knowledge graph visualisation
│   ├── diary/               # Diary entries
│   ├── ingest/              # Add sources (URL / file / text)
│   └── api/                 # REST API routes
│       ├── auth/            # NextAuth sign-in / sign-up
│       ├── wiki/            # List & delete wiki pages
│       ├── ingest/          # AI ingestion pipeline
│       ├── query/           # Semantic Q&A
│       └── ...
├── lib/
│   ├── auth-options.ts      # Shared NextAuth config
│   ├── user-db.ts           # SQLite users table (bcrypt passwords)
│   ├── db.ts                # SQLite singleton (sources, logs, pages)
│   ├── hydra.ts             # HydraDB client
│   └── hydra-fetch.ts       # HydraDB list/fetch helpers
├── components/
│   └── layout/Topbar.tsx    # Navbar with auth pill
├── middleware.ts            # Route protection (public: /, /auth/*)
└── Dockerfile               # Production container
```

---

## 🔐 Authentication

NeuroWiki uses **NextAuth.js** with a `CredentialsProvider` backed by a local **SQLite** database.

- Passwords are hashed with **bcrypt** (cost factor 12) — never stored in plain text.
- Sessions use **JWT** stored in an HTTP-only cookie.
- All protected routes are guarded by `middleware.ts` — unauthenticated requests are redirected to `/auth/signin`.

### Sign Up

1. Go to `/auth/signup`
2. Enter your name, email, and a password (min 8 characters)
3. A password strength meter gives live feedback
4. On success you're automatically signed in and redirected to the dashboard

### Sign In

1. Go to `/auth/signin`
2. Enter your registered email and password
3. On success you're redirected to the homepage

---

## 🛡 Data Isolation

Each user gets their own **HydraDB tenant** (`user-{userId}`). This means:

- ✅ User A's ingested sources, wiki pages, and diary entries are invisible to User B
- ✅ AI search only queries the current user's knowledge base
- ✅ The delete endpoint validates the requesting user's ID before deleting
- ✅ The wiki list API returns only the current user's pages

---

## 🗑 Deleting Wiki Entries

On the `/wiki` page, hover over any knowledge card — a **red trash icon** appears in the top-right corner of the card. Click it, confirm the prompt, and the entry is permanently deleted from both HydraDB and the local SQLite metadata store.

---

## 📦 Deployment (Google Cloud Run)

```bash
gcloud run deploy neurowiki \
  --source . \
  --project YOUR_PROJECT_ID \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="NEXTAUTH_URL=https://YOUR_URL,NEXTAUTH_SECRET=...,HYDRADB_API_KEY=...,GOOGLE_GENERATIVE_AI_API_KEY=...,NVIDIA_API_KEY=...,NVIDIA_MODEL=meta/llama-3.3-70b-instruct,INGEST_ENRICH=0"
```

> ⚠️ **Cloud Run ephemeral disk warning**: SQLite files are wiped when a container restarts. This affects the local `users` table. For a persistent production deployment, migrate the user store to a managed database (e.g., Supabase PostgreSQL, Google Cloud SQL, or Firebase Auth).

---

## 🌐 Live Demo

[https://neurowiki-483008448755.us-central1.run.app](https://neurowiki-483008448755.us-central1.run.app)

---

## 📋 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `NEXTAUTH_SECRET` | ✅ | 32+ char random string for JWT signing |
| `NEXTAUTH_URL` | ✅ | Full URL of your deployment |
| `HYDRADB_API_KEY` | ✅ | HydraDB API key for knowledge storage |
| `GOOGLE_GENERATIVE_AI_API_KEY` | ✅ | Google Gemini API key for AI ingestion |
| `NVIDIA_API_KEY` | ✅ | NVIDIA API key (fallback LLM) |
| `NVIDIA_MODEL` | ✅ | NVIDIA model name |
| `INGEST_ENRICH` | ❌ | Set to `0` to skip enrichment (recommended) |

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes
4. Push and open a Pull Request against `main`

---

## 📄 License

MIT © 2024 NeuroWiki. Your knowledge. Your control.
