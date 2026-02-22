CREATE TABLE IF NOT EXISTS "stories" (
  "id" integer PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "url" text,
  "text" text,
  "by" text NOT NULL,
  "score" integer DEFAULT 0 NOT NULL,
  "descendants" integer DEFAULT 0,
  "time" integer NOT NULL,
  "type" text DEFAULT 'story' NOT NULL,
  "synced_at" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "comments" (
  "id" integer PRIMARY KEY NOT NULL,
  "story_id" integer NOT NULL REFERENCES "stories"("id"),
  "parent_id" integer,
  "by" text,
  "text" text,
  "time" integer,
  "synced_at" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" serial PRIMARY KEY NOT NULL,
  "role" text NOT NULL,
  "content" text NOT NULL,
  "created_at" text NOT NULL
);

CREATE TABLE IF NOT EXISTS "sync_log" (
  "id" serial PRIMARY KEY NOT NULL,
  "started_at" text NOT NULL,
  "completed_at" text,
  "stories_count" integer DEFAULT 0,
  "comments_count" integer DEFAULT 0,
  "status" text DEFAULT 'running' NOT NULL,
  "error" text
);

CREATE INDEX IF NOT EXISTS "stories_time_idx" ON "stories" ("time");
CREATE INDEX IF NOT EXISTS "stories_score_idx" ON "stories" ("score");
CREATE INDEX IF NOT EXISTS "comments_story_id_idx" ON "comments" ("story_id");
CREATE INDEX IF NOT EXISTS "sync_log_status_idx" ON "sync_log" ("status");
