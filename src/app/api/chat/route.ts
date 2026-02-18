import { openai } from "@ai-sdk/openai";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { desc, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { comments, stories } from "@/lib/db/schema";

export const maxDuration = 30;

function getHNContext(): string {
  const now = Math.floor(Date.now() / 1000);
  const oneDayAgo = now - 24 * 60 * 60;
  const oneWeekAgo = now - 7 * 24 * 60 * 60;

  // Get today's top stories
  const todayStories = db
    .select()
    .from(stories)
    .where(gte(stories.time, oneDayAgo))
    .orderBy(desc(stories.score))
    .limit(20)
    .all();

  // Get this week's top stories
  const weekStories = db
    .select()
    .from(stories)
    .where(gte(stories.time, oneWeekAgo))
    .orderBy(desc(stories.score))
    .limit(30)
    .all();

  let context = "## Today's Top Hacker News Stories\n\n";

  if (todayStories.length === 0) {
    context += "No stories synced for today yet. The data may need to be synced first.\n\n";
  } else {
    todayStories.forEach((story, i) => {
      const storyComments = db
        .select()
        .from(comments)
        .where(sql`${comments.storyId} = ${story.id}`)
        .limit(5)
        .all();

      context += `${i + 1}. **${story.title}** (Score: ${story.score}, ${story.descendants || 0} comments)\n`;
      context += `   - By: ${story.by} | URL: ${story.url || "text post"}\n`;
      if (story.text) context += `   - Text: ${story.text.slice(0, 300)}\n`;

      if (storyComments.length > 0) {
        context += `   - Top comments:\n`;
        storyComments.forEach((c) => {
          const cleanText = c.text ? c.text.replace(/<[^>]*>/g, "").slice(0, 200) : "";
          context += `     - ${c.by}: ${cleanText}\n`;
        });
      }
      context += "\n";
    });
  }

  context += "\n## This Week's Top Stories\n\n";
  weekStories.forEach((story, i) => {
    context += `${i + 1}. **${story.title}** (Score: ${story.score}, ${story.descendants || 0} comments) by ${story.by}\n`;
    if (story.url) context += `   URL: ${story.url}\n`;
  });

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

  const hnContext = getHNContext();

  // Convert UIMessages to model messages for streamText
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: openai("gpt-4o-mini"),
    system: SYSTEM_PROMPT + hnContext,
    messages: modelMessages,
  });

  return result.toTextStreamResponse();
}
