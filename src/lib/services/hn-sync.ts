import dayjs from "dayjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import type { NewComment, NewStory } from "@/lib/db/schema";
import { comments, stories, syncLog } from "@/lib/db/schema";

const HN_API_BASE = "https://hacker-news.firebaseio.com/v0";
const TOP_STORIES_LIMIT = 50;
const COMMENTS_PER_STORY = 10; // top N comments per story
const FETCH_CONCURRENCY = 10; // parallel fetches

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

/** Fetch items in batches with concurrency limit */
async function fetchItemsBatch(
  ids: number[],
  concurrency = FETCH_CONCURRENCY,
): Promise<(HNItem | null)[]> {
  const results: (HNItem | null)[] = [];
  for (let i = 0; i < ids.length; i += concurrency) {
    const batch = ids.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fetchItem));
    results.push(...batchResults);
  }
  return results;
}

/** Fetch top-level comments for a story */
async function fetchStoryComments(storyId: number, kidIds: number[]): Promise<NewComment[]> {
  const topKids = kidIds.slice(0, COMMENTS_PER_STORY);
  const items = await fetchItemsBatch(topKids);

  const result: NewComment[] = [];

  for (const item of items) {
    if (!item || item.deleted || item.dead || !item.text) continue;
    result.push({
      id: item.id,
      storyId,
      parentId: item.parent === storyId ? null : (item.parent ?? null),
      by: item.by ?? null,
      text: item.text,
      time: item.time ?? null,
    });
  }

  return result;
}

/** Main sync function: fetches top stories + their comments */
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

    // 2. Fetch story details
    const storyItems = await fetchItemsBatch(storyIds);

    let storiesCount = 0;
    let commentsCount = 0;

    for (const item of storyItems) {
      if (!item || !item.title) continue;

      // Upsert story
      const storyData: NewStory = {
        id: item.id,
        title: item.title,
        url: item.url ?? null,
        text: item.text ?? null,
        by: item.by ?? "unknown",
        score: item.score ?? 0,
        descendants: item.descendants ?? 0,
        time: item.time ?? dayjs().unix(),
        type: item.type ?? "story",
      };

      await db
        .insert(stories)
        .values(storyData)
        .onConflictDoUpdate({
          target: stories.id,
          set: {
            title: storyData.title,
            url: storyData.url,
            text: storyData.text,
            score: storyData.score,
            descendants: storyData.descendants,
            syncedAt: dayjs().toISOString(),
          },
        });

      storiesCount++;

      // 3. Fetch comments for this story
      if (item.kids && item.kids.length > 0) {
        const storyComments = await fetchStoryComments(item.id, item.kids);
        for (const comment of storyComments) {
          await db
            .insert(comments)
            .values(comment)
            .onConflictDoUpdate({
              target: comments.id,
              set: {
                text: comment.text,
                syncedAt: dayjs().toISOString(),
              },
            });
          commentsCount++;
        }
      }
    }

    // Update sync log
    await db
      .update(syncLog)
      .set({
        completedAt: dayjs().toISOString(),
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
