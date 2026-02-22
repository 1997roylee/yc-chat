import { createOpenAI } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import dayjs from "dayjs";
import { desc, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import type { Story } from "@/lib/db/schema";
import { comments, stories } from "@/lib/db/schema";

export const maxDuration = 30;

async function getHNContext(): Promise<string> {
  const oneDayAgo = dayjs().subtract(1, "day").unix();
  const oneWeekAgo = dayjs().subtract(7, "day").unix();

  // Get today's top stories
  const todayStories: Story[] = await db
    .select()
    .from(stories)
    .where(gte(stories.time, oneDayAgo))
    .orderBy(desc(stories.score))
    .limit(20);

  // Get this week's top stories
  const weekStories: Story[] = await db
    .select()
    .from(stories)
    .where(gte(stories.time, oneWeekAgo))
    .orderBy(desc(stories.score))
    .limit(30);

  let context = "## Today's Top Hacker News Stories\n\n";

  if (todayStories.length === 0) {
    context += "No stories synced for today yet. The data may need to be synced first.\n\n";
  } else {
    for (const [i, story] of todayStories.entries()) {
      const storyComments = await db
        .select()
        .from(comments)
        .where(sql`${comments.storyId} = ${story.id}`)
        .limit(5);

      context += `${i + 1}. **${story.title}** (Score: ${story.score}, ${story.descendants || 0} comments)\n`;
      context += `   - By: ${story.by} | URL: ${story.url || "text post"}\n`;
      if (story.text) context += `   - Text: ${story.text.slice(0, 300)}\n`;

      if (storyComments.length > 0) {
        context += `   - Top comments:\n`;
        for (const c of storyComments) {
          const cleanText = c.text ? c.text.replace(/<[^>]*>/g, "").slice(0, 200) : "";
          context += `     - ${c.by}: ${cleanText}\n`;
        }
      }
      context += "\n";
    }
  }

  context += "\n## This Week's Top Stories\n\n";
  for (const [i, story] of weekStories.entries()) {
    context += `${i + 1}. **${story.title}** (Score: ${story.score}, ${story.descendants || 0} comments) by ${story.by}\n`;
    if (story.url) context += `   URL: ${story.url}\n`;
  }

  return context;
}

const SYSTEM_PROMPT = `You are a helpful Hacker News assistant. You have access to the latest synced data from Hacker News (news.ycombinator.com).

Your role is to:
- Summarize what's trending on HN today and this week
- Answer questions about specific stories, discussions, or topics
- Provide insights about tech trends based on the HN data
- Help users find interesting stories on specific topics

When referencing stories, include the title, score, and URL when available.
If the user asks about something not in the data, let them know the data might not be synced yet and suggest they trigger a sync.

Be concise but informative. Use markdown formatting for readability.

Here is the current Hacker News data:

`;

export async function POST(req: Request) {
  const { messages } = (await req.json()) as { messages: UIMessage[] };

  // Allow clients to supply their own API key via a request header
  const clientApiKey = req.headers.get("x-openai-api-key");
  const openai = createOpenAI({
    apiKey: clientApiKey ?? process.env.OPENAI_API_KEY,
  });

  const hnContext = await getHNContext();

  // Convert UIMessages to model messages for streamText
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: SYSTEM_PROMPT + hnContext,
    messages: modelMessages,
  });

  return result.toTextStreamResponse();
}
