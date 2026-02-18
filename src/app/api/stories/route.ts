import { desc, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comments, stories } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "30", 10);
  const period = searchParams.get("period") || "today"; // today | week | all

  // Calculate time filter
  let timeFilter: number | undefined;
  const now = Math.floor(Date.now() / 1000);
  if (period === "today") {
    timeFilter = now - 24 * 60 * 60;
  } else if (period === "week") {
    timeFilter = now - 7 * 24 * 60 * 60;
  }

  const storyRows = timeFilter
    ? db
        .select()
        .from(stories)
        .where(gte(stories.time, timeFilter))
        .orderBy(desc(stories.score))
        .limit(limit)
        .all()
    : db.select().from(stories).orderBy(desc(stories.score)).limit(limit).all();

  // Fetch comment counts per story
  const storiesWithComments = await Promise.all(
    storyRows.map(async (story) => {
      const storyComments = db
        .select()
        .from(comments)
        .where(sql`${comments.storyId} = ${story.id}`)
        .all();
      return {
        ...story,
        comments: storyComments,
      };
    }),
  );

  return NextResponse.json({
    stories: storiesWithComments,
    total: storyRows.length,
    period,
  });
}
