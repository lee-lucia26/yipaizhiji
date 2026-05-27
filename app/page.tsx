import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PostFeed } from "./components/post-feed";

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
  profiles: { username: string; avatar_config: unknown; avatar_url: string | null } | null;
  participants: { user_id: string }[];
}

export default async function Home() {
  const supabase = await createClient();

  // No filters — fetch ALL posts. Columns match DB exactly: region (not city), play_time (not play_date)
  const { data: posts } = await supabase
    .from("posts")
    .select("*, profiles(username, avatar_config, avatar_url), participants:post_participants(user_id)")
    .order("created_at", { ascending: false });

  const postList: Post[] = (posts ?? []) as unknown as Post[];

  const regions = Array.from(new Set(postList.map((p) => p.region))).sort();

  let userProfile: { tennis_level: string; region: string } | null = null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("tennis_level, region")
      .eq("id", user.id)
      .single();
    userProfile = profile;
  }

  return (
    <div className="min-h-full px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-zinc-900">约球广场</h1>

        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/posts/new"
            className="group flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-foreground/5 transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <div
              className="flex size-14 items-center justify-center rounded-full text-2xl"
              style={{ backgroundColor: "#DFFF4F" }}
            >
              🎾
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-zinc-900">我要摇人</h2>
              <p className="mt-1 text-xs text-muted-foreground">已订场，快速发布球局</p>
            </div>
          </Link>

          <Link
            href="/shake"
            className="group flex flex-col items-center gap-3 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-foreground/5 transition-all hover:-translate-y-1 hover:shadow-md"
          >
            <div
              className="flex size-14 items-center justify-center rounded-full text-2xl"
              style={{ backgroundColor: "#2D5A27" }}
            >
              🔍
            </div>
            <div className="text-center">
              <h2 className="text-lg font-bold text-zinc-900">摇一摇匹配</h2>
              <p className="mt-1 text-xs text-muted-foreground">随机匹配适合你的球局</p>
            </div>
          </Link>
        </div>

        <PostFeed posts={postList} regions={regions} userProfile={userProfile} />
      </div>
    </div>
  );
}
