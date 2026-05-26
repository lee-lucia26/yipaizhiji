import { createClient } from "@/lib/supabase/server";
import { MatchList } from "./match-list";

export default async function MatchesPage() {
  const supabase = await createClient();

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .order("match_date", { ascending: false });

  return (
    <div className="min-h-full px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-zinc-900">
          赛事追踪
        </h1>
        <MatchList matches={matches ?? []} />
      </div>
    </div>
  );
}
