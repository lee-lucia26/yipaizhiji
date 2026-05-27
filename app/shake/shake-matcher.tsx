"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users } from "lucide-react";

interface Post {
  id: number;
  title: string;
  content: string;
  region: string;
  min_level: number;
  max_level: number;
  play_time: string;
  location: string;
  profiles: { username: string; avatar_config: unknown } | null;
  participants: { user_id: string }[];
}

interface UserProfile {
  tennis_level: string;
  region: string;
  id: string;
}

function calcMatch(post: Post, userProfile: UserProfile): number {
  const userLevel = parseFloat(userProfile.tennis_level);
  if (isNaN(userLevel)) return 0;

  let score = 0;
  if (post.min_level <= userLevel && userLevel <= post.max_level) {
    score += 60;
  } else {
    const dist = Math.min(
      Math.abs(userLevel - post.min_level),
      Math.abs(userLevel - post.max_level)
    );
    score += Math.max(0, 60 - dist * 15);
  }

  if (post.region.includes(userProfile.region.split("-")[0] ?? "")) {
    score += 40;
  }

  return Math.min(100, Math.round(score));
}

export function ShakeMatcher({
  posts,
  userProfile,
  isLoggedIn,
}: {
  posts: Post[];
  userProfile: UserProfile | null;
  isLoggedIn: boolean;
}) {
  const [shaking, setShaking] = useState(false);
  const [result, setResult] = useState<Post | null>(null);
  const [matchScore, setMatchScore] = useState<number>(0);
  const [noMatch, setNoMatch] = useState(false);

  const doShake = useCallback(() => {
    setShaking(true);
    setResult(null);
    setNoMatch(false);

    // Simulate shake animation delay
    setTimeout(() => {
      setShaking(false);

      if (!userProfile) {
        setNoMatch(true);
        return;
      }

      // Filter matching posts
      const userLevel = parseFloat(userProfile.tennis_level);
      const candidates = posts.filter((post) => {
        // Not own post
        if (post.profiles?.username === userProfile.region) return false; // weak filter
        // Not joined already
        const joinedIds = post.participants?.map((p) => p.user_id) ?? [];
        if (joinedIds.includes(userProfile.id)) return false;
        // Same city
        if (!post.region.includes(userProfile.region.split("-")[0] ?? "")) return false;
        // Level match
        if (!(post.min_level <= userLevel && userLevel <= post.max_level)) return false;
        return true;
      });

      if (candidates.length === 0) {
        setNoMatch(true);
        return;
      }

      // Score and pick the best
      const scored = candidates.map((p) => ({ post: p, score: calcMatch(p, userProfile) }));
      scored.sort((a, b) => b.score - a.score);

      // Pick randomly from top 3
      const topN = scored.slice(0, Math.min(3, scored.length));
      const pick = topN[Math.floor(Math.random() * topN.length)];

      setResult(pick.post);
      setMatchScore(pick.score);
    }, 1000);
  }, [posts, userProfile]);

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="text-6xl">🎾</div>
        <p className="text-muted-foreground">登录后开启摇一摇匹配</p>
        <Button asChild>
          <Link href="/login">去登录</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">
      {/* Shake Area */}
      <button
        onClick={doShake}
        disabled={shaking}
        className="group relative flex size-36 items-center justify-center rounded-full bg-[#DFFF4F] shadow-lg transition-all hover:shadow-xl active:scale-95 disabled:opacity-50"
      >
        <span
          className={`text-5xl transition-all ${
            shaking ? "animate-bounce" : "group-hover:rotate-12"
          }`}
          style={
            shaking
              ? { animation: "shake 0.1s infinite" }
              : { animation: "none" }
          }
        >
          🎾
        </span>
      </button>

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: rotate(0deg) scale(1); }
          25% { transform: rotate(-15deg) scale(1.1); }
          50% { transform: rotate(0deg) scale(0.95); }
          75% { transform: rotate(15deg) scale(1.1); }
        }
      `}</style>

      <Button
        onClick={doShake}
        disabled={shaking}
        size="lg"
        className="text-lg px-8 py-6 rounded-full"
      >
        {shaking ? "匹配中..." : "🎾 摇一摇匹配"}
      </Button>

      {/* No Match */}
      {noMatch && (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className="text-5xl">😢</div>
          <p className="text-muted-foreground">附近暂时没有合适的球局</p>
          <Button asChild variant="outline">
            <Link href="/posts/new">发布一个球局，让更多人看到你！</Link>
          </Button>
          <button
            onClick={doShake}
            className="text-sm text-[#2D5A27] hover:underline"
          >
            再试一次
          </button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="w-full">
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="text-2xl">🎉</span>
            <span className="text-lg font-semibold text-zinc-900">为你匹配到一个球局！</span>
          </div>

          <Card className="transition-all">
            <CardContent className="pt-6 text-left">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">{result.title}</h3>
                  <span className="inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: "#2D5A27" }}>
                    {result.region}
                  </span>
                </div>
                <span
                  className="shrink-0 rounded-full px-3 py-1 text-sm font-bold"
                  style={{
                    backgroundColor: matchScore >= 80 ? "#DFFF4F" : "#fef3c7",
                    color: "#1a1a1a",
                  }}
                >
                  {matchScore}% 匹配
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div>
                  <span className="text-xs text-muted-foreground">约球时间</span>
                  <p className="font-medium text-zinc-700">
                    {new Date(result.play_time).toLocaleString("zh-CN", {
                      month: "numeric", day: "numeric", weekday: "short",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">场地</span>
                  <p className="font-medium text-zinc-700">{result.location}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">等级</span>
                  <p className="font-medium text-zinc-700">{result.min_level} - {result.max_level}</p>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground">参与</span>
                  <p className="font-medium text-zinc-700 flex items-center gap-1">
                    <Users className="size-3.5" />
                    {(result.participants ?? []).length} 人
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button asChild className="flex-1">
                  <Link href={`/posts/${result.id}`}>查看详情</Link>
                </Button>
                <Button variant="outline" onClick={doShake} className="flex-1">
                  再摇一次
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
