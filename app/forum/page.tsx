import { createClient } from "@/lib/supabase/server";
import { ThreadList } from "./thread-list";

interface Thread {
  id: string;
  title: string;
  content: string;
  category: string;
  user_id: string;
  created_at: string;
  profiles: { username: string } | null;
}

export default async function ForumPage() {
  const supabase = await createClient();

  const { data: threads } = await supabase
    .from("threads")
    .select("*, profiles(username)")
    .order("created_at", { ascending: false });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-full px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">论坛</h1>
        </div>
        <ThreadList threads={(threads ?? []) as unknown as Thread[]} isLoggedIn={!!user} />
      </div>
    </div>
  );
}
