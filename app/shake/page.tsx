import { createClient } from "@/lib/supabase/server";
import { ShakeMatcher } from "./shake-matcher";

export default async function ShakePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userProfile: {
    tennis_level: string;
    region: string;
    id: string;
  } | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("tennis_level, region, id")
      .eq("id", user.id)
      .single();
    userProfile = profile;
  }

  // Fetch open posts from the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data: posts } = await supabase
    .from("posts")
    .select("*, profiles(username, avatar_config), participants:post_participants(user_id)")
    .gte("play_time", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  return (
    <div className="min-h-full px-4 py-12">
      <div className="mx-auto max-w-lg text-center">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-zinc-900">
          摇一摇，找到你的球友
        </h1>
        <ShakeMatcher
          posts={(posts ?? []) as unknown as any[]}
          userProfile={userProfile}
          isLoggedIn={!!user}
        />
      </div>
    </div>
  );
}
