import dayjs from "dayjs";
import { NextResponse } from "next/server";
import { syncHackerNews } from "@/lib/services/hn-sync";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Manual sync triggered from the UI - no auth required */
export async function POST() {
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
