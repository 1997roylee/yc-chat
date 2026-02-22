import dayjs from "dayjs";
import { desc, gte, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import type { Story } from "@/lib/db/schema";
import { comments, stories } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "30", 10);
  const period = searchParams.get("period") || "today"; // today | week | all

  // Calculate time filter
  let timeFilter: number | undefined;
  if (period === "today") {
    timeFilter = dayjs().subtract(1, "day").unix();
  } else if (period === "week") {
    timeFilter = dayjs().subtract(7, "day").unix();
  }

  const storyRows: Story[] = timeFilter
    ? await db
        .select()
        .from(stories)
        .where(gte(stories.time, timeFilter))
        .orderBy(desc(stories.score))
        .limit(limit)
    : await db.select().from(stories).orderBy(desc(stories.score)).limit(limit);

  // Fetch comment counts per story
  const storiesWithComments = await Promise.all(
    storyRows.map(async (story: Story) => {
      const storyComments = await db
        .select()
        .from(comments)
        .where(sql`${comments.storyId} = ${story.id}`);
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
