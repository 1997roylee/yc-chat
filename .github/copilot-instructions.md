# GitHub Copilot Instructions

## Project Overview

HN Chatroom — a Next.js app that syncs Hacker News data and lets users chat with an AI bot about trending stories. Two tabs: AI Chat and Story Feed.

## Tech Stack

- **Framework**: Next.js (App Router), TypeScript
- **UI**: shadcn/ui, Tailwind CSS v4
- **State**: Zustand (with `persist` middleware for chat history in localStorage)
- **Data fetching**: React Query (TanStack Query)
- **AI**: Vercel AI SDK v6 (`useChat` with `TextStreamChatTransport`, `sendMessage` + `parts` API)
- **Database**: SQLite via Drizzle ORM (better-sqlite3), WAL mode, singleton connection
- **Package manager**: bun (enforced — no npm/yarn/pnpm)
- **Linter**: Biome (not ESLint)
- **Git hooks**: Husky pre-commit runs `bunx biome check --staged`

## Code Style Rules

### React Hooks

- **Never put functions in `useEffect` dependency arrays.** Use refs, `useCallback` outside the effect, or restructure to avoid it. Biome's `useExhaustiveDependencies` will flag function deps — suppress with `biome-ignore` comments and an explanation if truly needed, but prefer restructuring first.
- Prefer `useState(() => computeInitial())` (lazy initializer) over `useMemo` for values that only need to be computed once on mount.
- Use `useRef` for values that should not trigger re-renders (timers, flags, previous values).

### Imports

- Use `node:` protocol for Node.js built-in imports (e.g., `import fs from "node:fs"`).
- Use `import type` for type-only imports.

### Components

- All `<button>` elements must have an explicit `type` attribute (`type="button"` or `type="submit"`).
- Avoid `flex-1` on Radix `<ScrollArea>` — use `<div className="flex-1 min-h-0 overflow-y-auto">` instead for scrollable areas.

### Formatting

- Biome handles formatting: double quotes, semicolons, 2-space indent, 100-char line width.
- Run `bunx biome check --write ./src` to auto-fix.

### AI SDK v6

- `useChat` returns `{ messages, sendMessage, status }` — no `input`/`handleSubmit`/`content`.
- Messages use `parts` array (not `content` string). Extract text via `parts.filter(p => p.type === "text")`.
- Server route: use `convertToModelMessages()` (async) and `result.toTextStreamResponse()`.

### Database

- Use the singleton `db` export from `@/lib/db` — never create new connections.
- SQLite `busy_timeout = 5000` is set to handle concurrent access during builds.
