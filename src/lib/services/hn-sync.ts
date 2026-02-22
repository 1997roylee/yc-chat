import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import type { NewComment, NewStory } from "@/lib/db/schema";
import { comments, stories, syncLog } from "@/lib/db/schema";

const HN_API_BASE = "https://hacker-news.firebaseio.com/v0";
const TOP_STORIES_LIMIT = 30; // reduced from 50 for reliability
const COMMENTS_PER_STORY = 5; // reduced from 10 for reliability
const FETCH_CONCURRENCY = 20; // parallel HN API fetches

interface HNItem {
  id: number;
  type?: string;
  by?: string;
  time?: number;
  title?: string;
  url?: string;
  text?: string;
  score?: number;
  descendants?: number;
  kids?: number[];
  parent?: number;
  deleted?: boolean;
  dead?: boolean;
}

async function fetchJSON<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function fetchItem(id: number): Promise<HNItem | null> {
  return fetchJSON<HNItem>(`${HN_API_BASE}/item/${id}.json`);
}

/**
 * Run an array of async tasks with a maximum concurrency limit.
 * Returns results in the same order as the input.
 */
async function withConcurrency<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      results[i] = await tasks[i]();
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, tasks.length) }, worker);
  await Promise.all(workers);
  return results;
}

/** Main sync function: fetches top stories + their comments, fully parallelised */
export async function syncHackerNews(): Promise<{
  storiesCount: number;
  commentsCount: number;
}> {
  // Create sync log entry
  const logEntries = await db.insert(syncLog).values({ status: "running" }).returning();
  const logEntry = logEntries[0];

  try {
    // 1. Fetch top story IDs
    const topStoryIds = await fetchJSON<number[]>(`${HN_API_BASE}/topstories.json`);
    if (!topStoryIds) throw new Error("Failed to fetch top stories");

    const storyIds = topStoryIds.slice(0, TOP_STORIES_LIMIT);

    // 2. Fetch all story details concurrently
    const storyItems = await withConcurrency(
      storyIds.map((id) => () => fetchItem(id)),
      FETCH_CONCURRENCY,
    );

    const validStories = storyItems.filter((item): item is HNItem => !!item && !!item.title);

    // 3. Fetch all comments for all stories concurrently
    const commentTasks = validStories.flatMap((item) =>
      (item.kids ?? []).slice(0, COMMENTS_PER_STORY).map(
        (kidId) => () =>
          fetchItem(kidId).then((comment) =>
            comment && !comment.deleted && !comment.dead && comment.text
              ? ({
                  id: comment.id,
                  storyId: item.id,
                  parentId: comment.parent === item.id ? null : (comment.parent ?? null),
                  by: comment.by ?? null,
                  text: comment.text,
                  time: comment.time ?? null,
                } satisfies NewComment)
              : null,
          ),
      ),
    );

    const commentResults = await withConcurrency(commentTasks, FETCH_CONCURRENCY);
    const validComments = commentResults.filter((c): c is NonNullable<typeof c> => c !== null);

    // 4. Batch-upsert all stories in a single statement
    const now = dayjs().toISOString();

    const storyRows: NewStory[] = validStories.map((item) => ({
      id: item.id,
      title: item.title as string,
      url: item.url ?? null,
      text: item.text ?? null,
      by: item.by ?? "unknown",
      score: item.score ?? 0,
      descendants: item.descendants ?? 0,
      time: item.time ?? dayjs().unix(),
      type: item.type ?? "story",
    }));

    if (storyRows.length > 0) {
      await db
        .insert(stories)
        .values(storyRows)
        .onConflictDoUpdate({
          target: stories.id,
          set: {
            title: stories.title,
            url: stories.url,
            text: stories.text,
            score: stories.score,
            descendants: stories.descendants,
            syncedAt: now,
          },
        });
    }

    // 5. Batch-upsert all comments in a single statement
    if (validComments.length > 0) {
      await db
        .insert(comments)
        .values(validComments)
        .onConflictDoUpdate({
          target: comments.id,
          set: {
            text: comments.text,
            syncedAt: now,
          },
        });
    }

    const storiesCount = storyRows.length;
    const commentsCount = validComments.length;

    // Update sync log
    await db
      .update(syncLog)
      .set({
        completedAt: now,
        storiesCount,
        commentsCount,
        status: "completed",
      })
      .where(eq(syncLog.id, logEntry.id));

    return { storiesCount, commentsCount };
  } catch (error) {
    await db
      .update(syncLog)
      .set({
        completedAt: dayjs().toISOString(),
        status: "failed",
        error: error instanceof Error ? error.message : "Unknown error",
      })
      .where(eq(syncLog.id, logEntry.id));

    throw error;
  }
}
