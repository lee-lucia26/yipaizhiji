"use client";

import { useState, useMemo } from "react";
import { Trophy } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Match {
  id: number;
  tournament: string;
  round: string;
  player1: string;
  player2: string;
  score: string | null;
  winner: string | null;
  match_date: string;
}

export function MatchList({ matches }: { matches: Match[] }) {
  const [filter, setFilter] = useState("全部");

  const tournaments = useMemo(() => {
    const names = Array.from(new Set(matches.map((m) => m.tournament)));
    return ["全部", ...names];
  }, [matches]);

  const filtered = useMemo(() => {
    if (filter === "全部") return matches;
    return matches.filter((m) => m.tournament === filter);
  }, [matches, filter]);

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-32 text-center">
        <Trophy className="size-16 text-muted-foreground/30" strokeWidth={1} />
        <p className="text-lg text-muted-foreground">暂无赛事数据，敬请期待</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-foreground/5">
        <label className="text-xs font-medium text-muted-foreground">筛选赛事</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {tournaments.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground">
          共 {filtered.length} 场
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {filtered.map((match) => (
          <Card
            key={match.id}
            className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <CardTitle className="text-lg text-zinc-900">
                    {match.tournament}
                  </CardTitle>
                  <span className="text-xs font-medium text-muted-foreground">
                    {match.round}
                  </span>
                </div>
                <span
                  className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: "#2D5A27" }}
                >
                  {new Date(match.match_date).toLocaleDateString("zh-CN", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center justify-center gap-6 rounded-lg bg-zinc-50 py-4">
                <span className="text-xl font-bold text-zinc-900">{match.player1}</span>
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-xs font-semibold uppercase text-muted-foreground">VS</span>
                  {match.score && (
                    <span className="text-sm font-bold text-zinc-800">{match.score}</span>
                  )}
                </div>
                <span className="text-xl font-bold text-zinc-900">{match.player2}</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">胜者</span>
                {match.winner ? (
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: "#DFFF4F", color: "#1a1a1a" }}
                  >
                    {match.winner}
                  </span>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
