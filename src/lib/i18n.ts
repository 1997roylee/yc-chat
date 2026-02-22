import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import type { Locale } from "@/lib/stores/locale-store";

export function loadMessages(locale: Locale): Record<string, unknown> {
  const filePath = path.join(process.cwd(), "messages", `${locale}.yaml`);
  const raw = fs.readFileSync(filePath, "utf8");
  return yaml.load(raw) as Record<string, unknown>;
}
