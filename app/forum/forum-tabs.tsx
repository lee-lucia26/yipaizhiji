"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ThreadList } from "./thread-list";
import { MatchList } from "@/app/matches/match-list";

interface Thread {
  id: string;
  title: string;
  content: string;
  category: string;
  user_id: string;
  created_at: string;
  profiles: { username: string } | null;
}

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

const TABS = ["讨论区", "赛事追踪"];

export function ForumTabs({
  threads,
  matches,
  isLoggedIn,
}: {
  threads: Thread[];
  matches: Match[];
  isLoggedIn: boolean;
}) {
  const [activeTab, setActiveTab] = useState("讨论区");

  return (
    <div>
      {/* Tab switcher */}
      <div className="mb-6 flex gap-1 rounded-xl bg-zinc-100 p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition-all",
              activeTab === tab
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-muted-foreground hover:text-zinc-700"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "讨论区" ? (
        <ThreadList threads={threads} isLoggedIn={isLoggedIn} />
      ) : (
        <MatchList matches={matches} />
      )}
    </div>
  );
}
