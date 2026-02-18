import dayjs from "dayjs";
import { desc, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { stories, syncLog } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

/**
 * Returns sync freshness info:
 * - lastSyncedAt: ISO timestamp of last successful sync (or null)
 * - storyCount: total stories in DB
 * - isStale: true if data is older than 1 hour or empty
 */
export async function GET() {
  const STALE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour

  // Last successful sync
  const lastSync = db
    .select()
    .from(syncLog)
    .where(sql`${syncLog.status} = 'completed'`)
    .orderBy(desc(syncLog.completedAt))
    .limit(1)
    .all();

  const lastSyncedAt = lastSync[0]?.completedAt ?? null;

  // Story count
  const countResult = db.select({ count: sql<number>`count(*)` }).from(stories).all();
  const storyCount = countResult[0]?.count ?? 0;

  // Determine staleness
  let isStale = true;
  if (lastSyncedAt) {
    const age = dayjs().diff(dayjs(lastSyncedAt));
    isStale = age > STALE_THRESHOLD_MS;
  }

  // Empty data is always stale
  if (storyCount === 0) {
    isStale = true;
  }

  return NextResponse.json({
    lastSyncedAt,
    storyCount,
    isStale,
  });
}
