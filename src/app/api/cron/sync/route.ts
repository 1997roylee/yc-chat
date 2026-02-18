import dayjs from "dayjs";
import { type NextRequest, NextResponse } from "next/server";
import { syncHackerNews } from "@/lib/services/hn-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60s for sync

export async function GET(request: NextRequest) {
  // Verify cron secret in production
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await syncHackerNews();
    return NextResponse.json({
      success: true,
      ...result,
      syncedAt: dayjs().toISOString(),
    });
  } catch (error) {
    console.error("Sync failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
