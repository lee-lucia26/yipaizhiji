"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AvatarDisplay } from "@/components/avatar-display";

const levelRanges = [
  { label: "1.0 - 2.0", min: 1.0, max: 2.0 },
  { label: "2.0 - 3.0", min: 2.0, max: 3.0 },
  { label: "3.0 - 4.0", min: 3.0, max: 4.0 },
  { label: "4.0 - 5.0", min: 4.0, max: 5.0 },
  { label: "5.0 - 6.0", min: 5.0, max: 6.0 },
  { label: "6.0 - 7.0", min: 6.0, max: 7.0 },
];

interface Post {
  id: number;
  title: string;
  content: string;
  region: string;
  min_level: number;
  max_level: number;
  play_time: string;
  location: string;
  created_at: string;
  user_id?: string;
  profiles: { username: string; avatar_config: unknown; avatar_url: string | null } | null;
  participants: { user_id: string }[];
}

function calcMatch(post: Post, userProfile: { tennis_level: string; region: string } | null): number | null {
  if (!userProfile) return null;
  const userLevel = parseFloat(userProfile.tennis_level);
  if (isNaN(userLevel)) return null;

  let score = 0;

  // Level match (60%)
  if (post.min_level <= userLevel && userLevel <= post.max_level) {
    score += 60;
  } else {
    const dist = Math.min(
      Math.abs(userLevel - post.min_level),
      Math.abs(userLevel - post.max_level)
    );
    score += Math.max(0, 60 - dist * 15);
  }

  // Region match (40%)
  if (userProfile.region && post.region.includes(userProfile.region.split("-")[0])) {
    score += 40;
  }

  return Math.min(100, Math.round(score));
}

export function PostFeed({
  posts,
  regions,
  userProfile,
}: {
  posts: Post[];
  regions: string[];
  userProfile: { tennis_level: string; region: string } | null;
}) {
  const [regionFilter, setRegionFilter] = useState("");
  const [levelRange, setLevelRange] = useState("");

  const filtered = useMemo(() => {
    let result = posts;
    if (regionFilter) result = result.filter((p) => p.region === regionFilter);
    if (levelRange) {
      const [min, max] = levelRange.split("-").map(Number);
      result = result.filter((p) => p.min_level <= max && p.max_level >= min);
    }
    return result;
  }, [posts, regionFilter, levelRange]);

  const handleReset = () => {
    setRegionFilter("");
    setLevelRange("");
  };

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-32 text-center">
        <div className="text-6xl">🎾</div>
        <p className="text-lg text-muted-foreground">还没有人发起约球，做第一个一拍的人吧</p>
        <Button asChild>
          <Link href="/posts/new">发布约球帖</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* 筛选栏 */}
      <div className="mb-6 flex flex-wrap items-end gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-foreground/5">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">区域</label>
          <select
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="h-8 min-w-[160px] rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">全部区域</option>
            {regions.map((r) => (<option key={r} value={r}>{r}</option>))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-muted-foreground">等级范围</label>
          <select
            value={levelRange}
            onChange={(e) => setLevelRange(e.target.value)}
            className="h-8 min-w-[140px] rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">全部等级</option>
            {levelRanges.map((lr) => (<option key={lr.label} value={`${lr.min}-${lr.max}`}>{lr.label}</option>))}
          </select>
        </div>

        <Button variant="outline" size="sm" onClick={handleReset}>重置筛选</Button>
        <span className="text-xs text-muted-foreground">共 {filtered.length} 条</span>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <p className="text-sm text-muted-foreground">该区域/等级暂无约球帖，做第一个发起者吧</p>
          <Button asChild size="sm"><Link href="/posts/new">发布约球帖</Link></Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filtered.map((post) => {
            const match = calcMatch(post, userProfile);
            const participantCount = post.participants?.length ?? 0;

            return (
              <Link key={post.id} href={`/posts/${post.id}`}>
                <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        {match !== null && (
                          <span
                            className="inline-flex items-center gap-1 self-start rounded-full px-2 py-0.5 text-[11px] font-bold"
                            style={{
                              backgroundColor: match >= 80 ? "#DFFF4F" : match >= 50 ? "#fef3c7" : "#f3f4f6",
                              color: "#1a1a1a",
                            }}
                          >
                            {match}% 匹配
                          </span>
                        )}
                        <CardTitle className="text-lg text-zinc-900">{post.title}</CardTitle>
                      </div>
                      <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: "#2D5A27" }}>
                        {post.region}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="mb-4 text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {post.content}
                    </p>

                    <div className="mb-4">
                      <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: "#DFFF4F", color: "#1a1a1a" }}>
                        适合等级 {post.min_level} - {post.max_level}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">约球时间</span>
                        <span className="font-medium text-zinc-700">
                          {new Date(post.play_time).toLocaleString("zh-CN", {
                            month: "numeric", day: "numeric", weekday: "short",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs text-muted-foreground">场地</span>
                        <span className="font-medium text-zinc-700">{post.location}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t pt-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AvatarDisplay avatarConfig={post.profiles?.avatar_config} avatarUrl={post.profiles?.avatar_url} size="sm" />
                        <span>{post.profiles?.username ?? "未知用户"}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="size-3.5" />
                        <span>{participantCount} 人已加入</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
