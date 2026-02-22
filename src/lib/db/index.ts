// We export `db` as `any` here to allow the same call sites to work
// with both the SQLite driver (dev) and the postgres-js driver (prod).
// Schema type exports (Story, NewStory, etc.) remain fully typed.

import * as schema from "./schema";

export { schema };
export type { ChatMessage, Comment, NewComment, NewStory, Story, SyncLogEntry } from "./schema";

function createSqliteDb() {
  // Dynamic requires so postgres is never imported in dev and better-sqlite3 never in prod
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const fs = require("node:fs") as typeof import("node:fs");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const path = require("node:path") as typeof import("node:path");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Database = require("better-sqlite3") as typeof import("better-sqlite3");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } =
    require("drizzle-orm/better-sqlite3") as typeof import("drizzle-orm/better-sqlite3");

  const DB_PATH = path.join(process.cwd(), "data", "hn.db");
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const sqlite = new Database(DB_PATH);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("busy_timeout = 5000");

  return drizzle(sqlite, { schema });
}

function createPgDb() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const postgres = require("postgres") as typeof import("postgres");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { drizzle } =
    require("drizzle-orm/postgres-js") as typeof import("drizzle-orm/postgres-js");

  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_URL environment variable is required in production");
  }

  const client = postgres(connectionString, { ssl: "require" });
  return drizzle(client, { schema });
}

const isProduction = process.env.NODE_ENV === "production";

// Use a global singleton to avoid multiple connections during hot reload.
// Typed as `any` so the same query syntax works against both drivers without
// TypeScript complaining about union-type incompatibilities.
// biome-ignore lint/suspicious/noExplicitAny: dual-driver singleton
const globalForDb = globalThis as unknown as { db: any };

// biome-ignore lint/suspicious/noExplicitAny: dual-driver singleton
export const db: any = globalForDb.db ?? (isProduction ? createPgDb() : createSqliteDb());

if (!isProduction) {
  globalForDb.db = db;
}
