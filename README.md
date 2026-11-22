# PowerInvest

A premium, frontend-focused AI Power Investor Intelligence Platform built with React, Vite, JavaScript, React Router, Context API, Recharts, Lucide icons, Framer Motion, and LocalStorage.

PowerInvest is an educational frontend demonstration. Market prices and investor signals are simulated sample data; the product does not claim to connect to a live market feed or a cloud database. The **AI Insights** page is rule-based (no model). The **AI Assistant** page is the one real LLM feature: a RAG pipeline backed by the Google Gemini API (see below).

## Run locally

```bash
npm install
npm run dev          # frontend -> http://localhost:3000
```

To use the AI Financial Assistant, also run the backend in a second terminal (see [AI Financial Assistant](#ai-financial-assistant-rag)):

```bash
npm run server       # backend  -> http://127.0.0.1:8787
```

## Phase 1 architecture

The app shell is organized around a grouped product navigation model: Overview, Intelligence, Operations, and Workspace. `src/components/layout/AppShell.jsx` owns the sidebar, top bar, responsive mobile behavior, grouped navigation, notification preview, profile preview, theme switcher, and page transitions. Existing page components continue to import shared primitives from `src/components/shared.jsx`, which now acts as a small compatibility layer for reusable UI elements.

The design system remains centralized in `src/index.css`, using shared variables for midnight navy surfaces, emerald actions, electric blue secondary accents, typography, borders, shadows, responsive breakpoints, and light mode overrides. Framer Motion is used only for page transitions, mobile shell movement, and popover entrance/exit states so the interface feels responsive without constant animation.

## Project structure

- `src/components/layout/` — application shell and product navigation
- `src/components/` — reusable stats, tables, charts, and shared UI helpers
- `src/context/` — theme context
- `src/data/` — simulated stocks and activity data
- `src/hooks/` — reusable LocalStorage hook
- `src/pages/` — routed product pages
- `src/utils/` — portfolio calculations and formatting helpers
- `INTERVIEW_NOTES.md` — beginner-friendly explanation of the React concepts in use
- `TODO.md` — approved product outcomes and implementation status

## Current product areas

The working demo includes the dashboard, portfolio, market explorer, watchlist, rule-based investor insights, and settings. Later upgrade phases can add frontend demo authentication, advanced analytics, richer data management, and notification preferences without replacing the current shell.

## Demo authentication

The app includes a frontend-only login and signup flow (`/login`, `/signup`). It is a demo and is **not** secure authentication:

- `src/context/AuthContext.jsx` stores accounts and the session in browser storage. Passwords are saved as plain text, and no data is sent to a server.
- `src/components/ProtectedRoute.jsx` redirects signed-out visitors to `/login`.
- "Remember me" keeps the session in `localStorage`; otherwise it lives in `sessionStorage` and ends with the tab.
- Demo account: `demo@powerinvest.com` / `Demo@1234`, or create your own on the signup page.

Company logos for Markets, Portfolio, Watchlist and Insights live in `public/logos/` and are mapped to stock symbols in `src/components/CompanyLogo.jsx`. Stocks without a supplied logo show their ticker badge.

## AI Financial Assistant (RAG)

A chat page (`/assistant`) that answers finance questions using **Retrieval-Augmented Generation (RAG)**. Instead of letting an LLM answer from memory, the app first *retrieves* relevant passages from a small knowledge base and then asks the LLM to answer **using only those passages**. Every answer shows the passages it came from.

### Architecture

```
 ONE-TIME INDEXING (npm run ingest, or automatically on the first question)
 server/knowledge/*.md -> chunk by section -> Gemini embeddings -> server/data/vector-index.json

 EVERY QUESTION
 React chat UI  --POST /api/chat-->  Express backend (server/)
                                        1. embed the question (Gemini embedding model)
                                        2. cosine similarity vs. all chunk vectors -> top 4
                                        3. none relevant enough? -> "not enough information" (no LLM call)
                                        4. prompt = rules + numbered passages + question
                                        5. Gemini generates the answer, citing [1], [2]...
 React chat UI  <-- answer + sources --
```

The Gemini API key lives only in the backend's `.env`; the browser only talks to `/api/*` (Vite proxies it to the backend in development).

### How it works

- **Knowledge base** — 8 short Markdown documents in `server/knowledge/` (stock market fundamentals, investing basics, risk management, diversification, fundamental analysis, technical analysis, a company-evaluation checklist, and a glossary). They are original educational text written for this project.
- **Chunking** (`server/rag/chunker.js`) — each document is split at its `##` headings so a chunk is usually one idea. A section longer than 800 characters is split by sentences, and the next chunk repeats the previous last sentence ("overlap") so ideas are not cut in half. The current documents have 59 chunks, all under 800 characters, so the overlap path is only exercised by the unit tests. Each chunk keeps its document title and section name for source display.
- **Embeddings** (`server/rag/gemini.js`) — each chunk is converted by `gemini-embedding-001` into a vector of numbers where similar meanings point in similar directions. The vectors are stored in `server/data/vector-index.json`. This is a plain in-memory index with cosine similarity, not a vector database: with ~60 chunks it is instant and has no extra service to run. For a large corpus you would swap `vectorStore.js` for a real vector database.
- **Retrieval** (`server/rag/vectorStore.js`) — the question is embedded with the same model, compared to every chunk by cosine similarity, and the top 4 chunks are kept. Chunks below `RAG_MIN_SIMILARITY` are treated as irrelevant.
- **Generation** (`server/rag/prompt.js`, `pipeline.js`) — the prompt tells the LLM to use only the numbered passages, to cite them, and to reply `INSUFFICIENT_CONTEXT` if they do not contain the answer. The backend turns that reply (or an empty retrieval) into an honest "I don't have enough information" message instead of an invented answer.
- **Sources** — the UI lists the retrieved passages (document, section, similarity score, full text on click) and marks which ones the answer cited.

### Setup

1. `npm install`
2. Get a Gemini API key at <https://aistudio.google.com/apikey>.
3. `cp .env.example .env` and set `GEMINI_API_KEY=...` (`.env` is git-ignored; never commit it).
4. Run both processes in separate terminals:
   ```bash
   npm run server   # backend on http://127.0.0.1:8787
   npm run dev      # frontend on http://localhost:3000
   ```
5. Open **AI Assistant** in the sidebar. The first question builds the vector index (a few seconds); later questions reuse it.

Useful commands:

| Command | What it does |
| --- | --- |
| `npm run ingest` | Rebuild the vector index (after editing `server/knowledge/`) |
| `npm run retrieve -- "What is the P/E ratio?"` | Show only the retrieval step (chunks + similarity scores, no LLM). Use it to tune `RAG_MIN_SIMILARITY` |
| `npm test` | Backend tests (chunking, vector search, API, error handling) |

Settings are in `.env.example`. The default chat model is `gemini-3.7-flash`; if Google retires a model name, set `GEMINI_CHAT_MODEL` to a current one.

### Error handling

The assistant never fakes an answer. A missing or placeholder key, an invalid key, a rate limit, an unreachable or slow API, an empty or blocked response, a backend that is not running, and invalid input each produce a specific message in the UI.

### Testing notes and limitations

- `npm test` runs the real backend code against a **local stub of the Gemini API** (`server/tests/mockGemini.js`), so it checks the pipeline logic and error handling but **not** the quality of real Gemini embeddings or answers.
- The default `RAG_MIN_SIMILARITY=0.4` is a starting guess. Check it against your key with `npm run retrieve`.
- Questions are answered independently (no chat memory).
- The backend has no user authentication, is bound to localhost, and has only a basic per-IP rate limit. It is meant for local demos, not public deployment.
- Answers are educational, based only on the small knowledge base, and are not financial advice.
