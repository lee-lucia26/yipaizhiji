import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AvatarDisplay } from "@/components/avatar-display";
import { Clock, MapPin } from "lucide-react";

interface UserPageProps {
  params: Promise<{ id: string }>;
}

export default async function UserPage({ params }: UserPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (!profile) {
    return (
      <div className="flex min-h-full items-center justify-center">
        <p className="text-muted-foreground">用户不存在</p>
      </div>
    );
  }

  // Posts created by this user
  const { data: createdPosts } = await supabase
    .from("posts")
    .select("*")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  // Posts joined by this user
  const { data: joined } = await supabase
    .from("post_participants")
    .select("post_id")
    .eq("user_id", id);

  const isOwnProfile = (await supabase.auth.getUser()).data.user?.id === id;

  const playingTime =
    (profile.years_playing > 0 || profile.months_playing > 0)
      ? `${profile.years_playing > 0 ? `${profile.years_playing}年` : ""}${profile.months_playing > 0 ? `${profile.months_playing}个月` : ""}`
      : "未设置";

  return (
    <div className="min-h-full px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Profile header */}
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <AvatarDisplay
            avatarConfig={profile.avatar_config}
            avatarUrl={profile.avatar_url}
            size="lg"
          />
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">{profile.username}</h1>
            <div className="mt-1 flex items-center justify-center gap-2">
              <span className="rounded-full bg-[#2D5A27] px-2.5 py-0.5 text-xs font-medium text-white">
                {profile.tennis_level}
              </span>
              <span className="text-sm text-muted-foreground">{profile.region}</span>
            </div>
          </div>
          {isOwnProfile && (
            <Button asChild size="sm" variant="outline">
              <Link href="/profile/edit">编辑资料</Link>
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-foreground/5">
            <div className="text-2xl font-bold text-[#2D5A27]">{createdPosts?.length ?? 0}</div>
            <div className="text-xs text-muted-foreground">发起约球</div>
          </div>
          <div className="rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-foreground/5">
            <div className="text-2xl font-bold text-[#2D5A27]">{joined?.length ?? 0}</div>
            <div className="text-xs text-muted-foreground">加入约球</div>
          </div>
          <div className="rounded-xl bg-white p-4 text-center shadow-sm ring-1 ring-foreground/5">
            <div className="text-2xl font-bold text-[#2D5A27]">{playingTime}</div>
            <div className="text-xs text-muted-foreground">球龄</div>
          </div>
        </div>

        {/* Bio + details */}
        <Card className="mb-8">
          <CardContent className="pt-5">
            {profile.bio ? (
              <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">暂无个人简介</p>
            )}
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">打球频率：</span>
                <span className="font-medium">{profile.play_frequency || "未设置"}</span>
              </div>
              <div>
                <span className="text-muted-foreground">区域：</span>
                <span className="font-medium">{profile.region}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent posts */}
        <h2 className="mb-4 text-lg font-semibold text-zinc-900">
          {isOwnProfile ? "我" : "TA"}发起的约球帖
        </h2>
        {(createdPosts ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">暂无约球帖</p>
        ) : (
          <div className="flex flex-col gap-3">
            {(createdPosts ?? []).map((post: any) => (
              <Link key={post.id} href={`/posts/${post.id}`}>
                <Card className="transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <CardContent className="flex items-center justify-between py-4">
                    <div>
                      <h3 className="font-medium text-zinc-900">{post.title}</h3>
                      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" />
                          {new Date(post.play_time).toLocaleDateString("zh-CN")}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3" />
                          {post.location}
                        </span>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: "#2D5A27" }}>
                      {post.region}
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
