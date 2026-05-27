"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AvatarDisplay } from "@/components/avatar-display";

const categoryLabels = ["全部", "技术交流", "装备推荐", "赛事讨论", "找球友"];

const categoryColors: Record<string, { bg: string; text: string }> = {
  "技术交流": { bg: "#2D5A27", text: "#ffffff" },
  "装备推荐": { bg: "#DFFF4F", text: "#1a1a1a" },
  "赛事讨论": { bg: "#2D5A27", text: "#ffffff" },
  "找球友": { bg: "#DFFF4F", text: "#1a1a1a" },
};

interface Thread {
  id: string;
  title: string;
  content: string;
  category: string;
  user_id: string;
  created_at: string;
  profiles: { username: string; avatar_url: string | null; avatar_config: unknown } | null;
}

export function ThreadList({ threads, isLoggedIn }: { threads: Thread[]; isLoggedIn: boolean }) {
  const [activeCategory, setActiveCategory] = useState("全部");

  const filtered = useMemo(() => {
    if (activeCategory === "全部") return threads;
    return threads.filter((t) => t.category === activeCategory);
  }, [threads, activeCategory]);

  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-32 text-center">
        <MessageSquare className="size-16 text-muted-foreground/30" strokeWidth={1} />
        <p className="text-lg text-muted-foreground">论坛暂无讨论，来发起第一个话题吧</p>
        {isLoggedIn && (
          <Button asChild>
            <Link href="/forum/new">发起讨论</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {categoryLabels.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-[#2D5A27] text-white"
                  : "bg-white text-muted-foreground ring-1 ring-foreground/10 hover:bg-zinc-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        {isLoggedIn && (
          <Button asChild size="sm">
            <Link href="/forum/new">发起讨论</Link>
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-sm text-muted-foreground">该分类暂无讨论帖</div>
        ) : (
          filtered.map((thread) => {
            const color = categoryColors[thread.category] ?? { bg: "#2D5A27", text: "#ffffff" };
            return (
              <Link key={thread.id} href={`/forum/${thread.id}`}>
                <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <AvatarDisplay
                        avatarConfig={thread.profiles?.avatar_config}
                        avatarUrl={thread.profiles?.avatar_url}
                        size="sm"
                      />
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-base font-medium text-zinc-900">
                            {thread.title}
                          </h3>
                          <span
                            className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
                            style={{ backgroundColor: color.bg, color: color.text }}
                          >
                            {thread.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{thread.profiles?.username ?? "未知用户"}</span>
                          <span>{new Date(thread.created_at).toLocaleDateString("zh-CN")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
                      <MessageSquare className="size-3.5" />
                      <span>讨论</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
