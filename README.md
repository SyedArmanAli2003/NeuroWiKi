# NeuroWiki

> Your personal AI-powered Wikipedia. Add any source — URL, PDF, or text — 
> and an AI agent automatically builds, maintains, and interlinks a 
> living knowledge base that gets smarter with everything you add.

---

## What It Does

NeuroWiki solves the core problem Andrej Karpathy identified: normal RAG 
re-derives knowledge from scratch every query. NeuroWiki compiles your 
sources into a persistent, interlinked wiki once — then answers from it 
cheaply, forever.

Every time you add a source:
1. Gemini reads and extracts verified, cited knowledge
2. HydraDB builds a context graph automatically
3. A consistency agent checks for contradictions with existing pages
4. Pages are interlinked with [[wikilinks]] and connected in a graph
5. The wiki gets smarter — it never forgets, and it knows when it's wrong

---

## Tech Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Framework | Next.js 15 (App Router) | Full-stack — frontend + API routes in one |
| Language | TypeScript | End-to-end type safety |
| Styling | Tailwind CSS + shadcn/ui | Utility-first + pre-built components |
| Design System | Almarai + Instrument Serif | Cinematic dark UI inspired by Prisma Studio |
| Animation | Framer Motion | WordsPullUp, FadeUp, card stagger entrances |
| AI Model | Google Gemini 2.0 Flash | Page generation, consistency checking, Q&A |
| AI SDK | Vercel AI SDK (@ai-sdk/google) | Streaming, generateObject, structured outputs |
| Knowledge Store | HydraDB (@hydra_db/node) | Entity graph, hybrid recall, context memory |
| Local DB | SQLite (better-sqlite3) | Sources, logs, health metadata, query logs |
| Graph View | react-force-graph-2d | Interactive knowledge graph visualization |
| Markdown | react-markdown + remark-gfm | Wiki page rendering with [[wikilink]] support |
| Schema | Zod | AI response validation, hallucination prevention |
| Deployment | Google Cloud Run | Serverless, scales to zero, $0 at hackathon scale |

---

## Architecture
