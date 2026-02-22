# HN Chatroom

A Next.js app that syncs Hacker News data and lets you chat with an AI assistant about what's trending. Two tabs: **AI Chat** (persistent chatrooms) and **Story Feed** (browsable stories with comments). Fully mobile responsive.

## Prerequisites

- [Bun](https://bun.sh) v1.3+ — this project **only** works with Bun (npm/yarn/pnpm are blocked)
- An [OpenAI API key](https://platform.openai.com/api-keys)

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Required — powers the AI chat
OPENAI_API_KEY=sk-your-key-here

# Optional — leave empty for local dev.
# In production, set this to secure the /api/cron/sync endpoint.
# IMPORTANT: do NOT set a placeholder value like "your-secret-here" —
# any truthy value will enable auth and block manual/auto sync.
CRON_SECRET=
```

### 3. Initialize the database

The SQLite database is created automatically at `data/hn.db` on first run. To push the schema manually:

```bash
bun run db:push
```

## Running

### Development

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000). On first load the app checks if HN data is stale (>1 hour old) or empty and automatically syncs the top 50 stories + comments. An orange "Syncing HN data..." banner shows while this is in progress.

### Production build

```bash
bun run build
bun run start
```

## Available Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run check` | Lint + format with Biome (auto-fix) |
| `bun run lint` | Lint only |
| `bun run format` | Format only |
| `bun run db:push` | Push schema to SQLite |
| `bun run db:generate` | Generate Drizzle migrations |
| `bun run db:studio` | Open Drizzle Studio (DB browser) |

## Features

- **AI Chat** — ask the AI about current HN trends; it has full context of today's and this week's top stories and comments
- **Persistent chatrooms** — create multiple named chats, switch between them freely; history survives page refreshes (stored in localStorage)
- **Story Feed** — browse top HN stories filtered by today / this week / all time, with inline comment previews
- **Auto-sync** — data freshness is checked on every page load; a background sync fires automatically when data is older than 1 hour
- **Skeleton loading** — chat rooms show a skeleton placeholder while switching to avoid layout shift
- **Mobile responsive** — fully usable on small screens; the chat sidebar becomes a slide-in drawer on mobile

## How It Works

- **Auto-sync**: On page load, the app checks data freshness via `GET /api/sync/status`. If data is older than 1 hour or the database is empty, it triggers a sync automatically.
- **Cron sync**: On Vercel, a cron job hits `GET /api/cron/sync` every 2 hours (configured in `vercel.json`). Secured by `CRON_SECRET` in production.
- **Chat history**: Conversations are stored in localStorage as persistent chatrooms. Create multiple chats, switch between them, and they survive page refreshes.
- **AI context**: The chat API injects today's and this week's top HN stories (with comments) into the system prompt so the AI can answer questions about current trends.

## Deploying to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Set environment variables:
   - `OPENAI_API_KEY` — your OpenAI key
   - `CRON_SECRET` — a random secret string (e.g. `openssl rand -hex 32`)
4. Deploy — the cron job in `vercel.json` will auto-sync every 2 hours
