import dayjs from "dayjs";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const stories = sqliteTable("stories", {
  id: integer("id").primaryKey(), // HN story ID
  title: text("title").notNull(),
  url: text("url"),
  text: text("text"), // For Ask HN / text posts
  by: text("by").notNull(),
  score: integer("score").notNull().default(0),
  descendants: integer("descendants").default(0), // comment count
  time: integer("time").notNull(), // unix timestamp from HN
  type: text("type").notNull().default("story"), // story, job, poll
  syncedAt: text("synced_at")
    .notNull()
    .$defaultFn(() => dayjs().toISOString()),
});

export const comments = sqliteTable("comments", {
  id: integer("id").primaryKey(), // HN comment ID
  storyId: integer("story_id")
    .notNull()
    .references(() => stories.id),
  parentId: integer("parent_id"), // parent comment ID (null = top-level)
  by: text("by"),
  text: text("text"),
  time: integer("time"), // unix timestamp
  syncedAt: text("synced_at")
    .notNull()
    .$defaultFn(() => dayjs().toISOString()),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  role: text("role").notNull(), // "user" | "assistant"
  content: text("content").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => dayjs().toISOString()),
});

export const syncLog = sqliteTable("sync_log", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  startedAt: text("started_at")
    .notNull()
    .$defaultFn(() => dayjs().toISOString()),
  completedAt: text("completed_at"),
  storiesCount: integer("stories_count").default(0),
  commentsCount: integer("comments_count").default(0),
  status: text("status").notNull().default("running"), // running, completed, failed
  error: text("error"),
});

// Type exports
export type Story = typeof stories.$inferSelect;
export type NewStory = typeof stories.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type SyncLogEntry = typeof syncLog.$inferSelect;
