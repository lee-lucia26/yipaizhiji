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
  user_id: string;
  profiles: { username: string; avatar_config: unknown; avatar_url: string | null } | null;
  participants: { user_id: string }[];
}

export default async function Home() {
  const supabase = await createClient();

  // Query 1: Fetch ALL posts — no joins, no filters
  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (postsError) {
    console.error("posts query error:", postsError);
  }

  const rawPosts = (posts ?? []) as unknown as any[];

  if (rawPosts.length > 0) {
    // Query 2: Fetch profiles for all unique user_ids (separate, no join)
    const userIds = [...new Set(rawPosts.map((p: any) => p.user_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username, avatar_config, avatar_url")
      .in("id", userIds);

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

    // Query 3: Fetch participants for all post_ids
    const postIds = rawPosts.map((p: any) => p.id);
    const { data: participants } = await supabase
      .from("post_participants")
      .select("post_id, user_id")
      .in("post_id", postIds);

    // Group participants by post_id
    const participantMap = new Map<number, { user_id: string }[]>();
    (participants ?? []).forEach((p: any) => {
      if (!participantMap.has(p.post_id)) participantMap.set(p.post_id, []);
      participantMap.get(p.post_id)!.push({ user_id: p.user_id });
    });

    // Merge: profiles + participants into posts
    rawPosts.forEach((post: any) => {
      post.profiles = profileMap.get(post.user_id) ?? null;
      post.participants = participantMap.get(post.id) ?? [];
    });
  }

  const postList: Post[] = rawPosts as unknown as Post[];

  // Regions for filter dropdown
  const regions = Array.from(new Set(postList.map((p) => p.region))).sort();

  // Current user profile for match %
  let userProfile: { tennis_level: string; region: string } | null = null;
  const { data: { user } } = await supabase.auth.getUser();
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
            <div className="flex size-14 items-center justify-center rounded-full text-2xl" style={{ backgroundColor: "#DFFF4F" }}>
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
            <div className="flex size-14 items-center justify-center rounded-full text-2xl" style={{ backgroundColor: "#2D5A27" }}>
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
