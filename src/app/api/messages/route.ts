import { NextResponse } from "next/server";
import { loadMessages } from "@/lib/i18n";
import type { Locale } from "@/lib/stores/locale-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const locale = (searchParams.get("locale") ?? "en") as Locale;

  if (locale !== "en" && locale !== "zh") {
    return NextResponse.json({ error: "Unsupported locale" }, { status: 400 });
  }

  const messages = loadMessages(locale);
  return NextResponse.json(messages);
}
