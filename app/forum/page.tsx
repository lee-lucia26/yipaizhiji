import { createClient } from "@/lib/supabase/server";
import { ForumTabs } from "./forum-tabs";

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

export default async function ForumPage() {
  const supabase = await createClient();

  const { data: threads } = await supabase
    .from("threads")
    .select("*, profiles(username)")
    .order("created_at", { ascending: false });

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .order("match_date", { ascending: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-full px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-zinc-900">论坛</h1>
        <ForumTabs
          threads={(threads ?? []) as unknown as Thread[]}
          matches={(matches ?? []) as unknown as Match[]}
          isLoggedIn={!!user}
        />
      </div>
    </div>
  );
}
