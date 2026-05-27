import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminMatchForm } from "./admin-match-form";

export default async function AdminMatchesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: matches } = await supabase
    .from("matches")
    .select("*")
    .order("match_date", { ascending: false });

  return (
    <div className="min-h-full px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-zinc-900">赛事管理</h1>
        <p className="mb-8 text-sm text-muted-foreground">添加和管理赛事数据</p>

        {/* Add match form */}
        <div className="mb-10 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-foreground/5">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">录入新赛事</h2>
          <AdminMatchForm />
        </div>

        {/* Existing matches */}
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          现有赛事 ({(matches ?? []).length})
        </h2>
        <div className="flex flex-col gap-3">
          {(matches ?? []).map((m) => (
            <div
              key={m.id}
              className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-foreground/5"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-medium text-zinc-900">{m.tournament}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{m.round}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(m.match_date).toLocaleDateString("zh-CN")}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm">
                <span className="font-medium">{m.player1}</span>
                <span className="text-xs text-muted-foreground">VS</span>
                <span className="font-medium">{m.player2}</span>
                {m.score && <span className="font-bold text-zinc-700">{m.score}</span>}
                {m.winner && (
                  <span
                    className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
                    style={{ backgroundColor: "#DFFF4F", color: "#1a1a1a" }}
                  >
                    {m.winner} 胜
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
