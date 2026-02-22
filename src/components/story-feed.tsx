"use client";

import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  LuArrowUpFromDot,
  LuClock,
  LuExternalLink,
  LuLoader,
  LuMessageCircle,
  LuUser,
} from "react-icons/lu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type StoryWithComments, useStories } from "@/lib/hooks/use-hn-data";
import { useAppStore } from "@/lib/stores/app-store";

dayjs.extend(relativeTime);

function timeAgo(unixTime: number): string {
  return dayjs.unix(unixTime).fromNow();
}

function StoryCard({ story }: { story: StoryWithComments }) {
  const t = useTranslations("feed");
  const [showComments, setShowComments] = useState(false);

  return (
    <Card className="p-4 hover:bg-accent/50 transition-colors">
      <div className="flex gap-3">
        {/* Score */}
        <div className="flex flex-col items-center justify-start min-w-[40px]">
          <LuArrowUpFromDot className="h-4 w-4 text-orange-500" />
          <span className="text-lg font-bold text-orange-500">{story.score}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <a
              href={story.url || `https://news.ycombinator.com/item?id=${story.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline line-clamp-2 flex-1"
            >
              {story.title}
            </a>
            {story.url && (
              <LuExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground mt-0.5" />
            )}
          </div>

          {story.url && (
            <p className="text-xs text-muted-foreground mt-1 truncate">
              {new URL(story.url).hostname}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <LuUser className="h-3 w-3" />
              {story.by}
            </span>
            <span className="flex items-center gap-1">
              <LuClock className="h-3 w-3" />
              {timeAgo(story.time)}
            </span>
            <a
              href={`https://news.ycombinator.com/item?id=${story.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:underline"
            >
              <LuMessageCircle className="h-3 w-3" />
              {t("commentsCount", { count: story.descendants || 0 })}
            </a>
            <Badge variant="secondary" className="text-xs">
              {story.type}
            </Badge>
          </div>

          {story.text && (
            <p
              className="text-sm text-muted-foreground mt-2 line-clamp-2"
              dangerouslySetInnerHTML={{ __html: story.text }}
            />
          )}

          {/* Comments toggle */}
          {story.comments.length > 0 && (
            <div className="mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowComments(!showComments)}
                className="text-xs h-7 px-2"
              >
                {showComments
                  ? t("hideComments", { count: story.comments.length })
                  : t("showComments", { count: story.comments.length })}
              </Button>

              {showComments && (
                <div className="mt-2 space-y-2 pl-3 border-l-2 border-border">
                  {story.comments.map((comment) => (
                    <div key={comment.id} className="text-xs">
                      <span className="font-medium text-orange-500">{comment.by}</span>
                      {comment.time && (
                        <span className="text-muted-foreground ml-2">{timeAgo(comment.time)}</span>
                      )}
                      {comment.text && (
                        <div
                          className="text-muted-foreground mt-1 prose prose-xs max-w-none"
                          dangerouslySetInnerHTML={{ __html: comment.text }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

export function StoryFeed() {
  const t = useTranslations("feed");
  const { feedPeriod, setFeedPeriod } = useAppStore();
  const { data, isLoading, error } = useStories(feedPeriod);

  return (
    <div className="flex h-full flex-col">
      {/* Period filter */}
      <div className="flex items-center gap-2 p-4 border-b">
        <span className="text-sm font-medium">{t("period")}</span>
        {(["today", "week", "all"] as const).map((period) => (
          <Button
            key={period}
            variant={feedPeriod === period ? "default" : "outline"}
            size="sm"
            onClick={() => setFeedPeriod(period)}
          >
            {period === "today" ? t("today") : period === "week" ? t("thisWeek") : t("all")}
          </Button>
        ))}
        {data && (
          <span className="text-xs text-muted-foreground ml-auto">
            {t("storiesCount", { count: data.total })}
          </span>
        )}
      </div>

      {/* Stories list */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-4 space-y-3">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <LuLoader className="h-8 w-8 animate-spin text-orange-500 mx-auto" />
                <p className="text-sm text-muted-foreground">{t("loading")}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
              {t("loadError")}
            </div>
          )}

          {data?.stories.length === 0 && !isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">{t("emptyTitle")}</p>
                <p className="text-xs text-muted-foreground">{t("emptyHint")}</p>
              </div>
            </div>
          )}

          {data?.stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      </div>
    </div>
  );
}
