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
  profiles: { username: string } | null;
}

export default async function Home() {
  const supabase = await createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("*, profiles(username)")
    .order("created_at", { ascending: false });

  const postList: Post[] = (posts ?? []) as unknown as Post[];

  const regions = Array.from(new Set(postList.map((p) => p.region))).sort();

  return (
    <div className="min-h-full px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <PostFeed posts={postList} regions={regions} />
      </div>
    </div>
  );
}
