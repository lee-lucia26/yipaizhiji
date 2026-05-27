import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { AvatarDisplay } from "@/components/avatar-display";
import { Users } from "lucide-react";
import { JoinButton } from "./join-button";
import { CommentSection } from "@/app/forum/[id]/comment-section";

interface PostDetailProps {
  params: Promise<{ id: string }>;
}

export default async function PostDetailPage({ params }: PostDetailProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*, profiles(username, avatar_config, avatar_url, tennis_level, region)")
    .eq("id", id)
    .single();

  if (!post) {
    redirect("/");
  }

  // Fetch participants with profiles
  const { data: participants } = await supabase
    .from("post_participants")
    .select("*, profiles(username, avatar_config, avatar_url, tennis_level)")
    .eq("post_id", id);

  // Comments
  const { data: comments } = await supabase
    .from("comments")
    .select("*, profiles(username, avatar_url, avatar_config)")
    .eq("post_id", id)
    .order("created_at", { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isJoined = user
    ? participants?.some((p) => p.user_id === user.id) ?? false
    : false;

  return (
    <div className="min-h-full px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Post detail card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-xl font-bold text-zinc-900">{post.title}</h1>
              <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: "#2D5A27" }}>
                {post.region}
              </span>
            </div>

            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap mb-6">{post.content}</p>

            <div className="mb-4 flex flex-wrap gap-2">
              <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold" style={{ backgroundColor: "#DFFF4F", color: "#1a1a1a" }}>
                适合等级 {post.min_level} - {post.max_level}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mb-6">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">约球时间</span>
                <span className="font-medium text-zinc-700">
                  {new Date(post.play_time).toLocaleString("zh-CN", {
                    month: "long", day: "numeric", weekday: "long",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">场地</span>
                <span className="font-medium text-zinc-700">{post.location}</span>
              </div>
            </div>

            {/* Poster */}
            <div className="flex items-center gap-2 border-t pt-4 mb-4">
              <AvatarDisplay avatarConfig={post.profiles?.avatar_config} avatarUrl={post.profiles?.avatar_url} size="sm" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-zinc-700">{post.profiles?.username ?? "未知用户"}</span>
                <span className="text-xs text-muted-foreground">{post.profiles?.tennis_level} · {post.profiles?.region}</span>
              </div>
            </div>

            {/* Participants + Join */}
            <div className="flex items-center justify-between border-t pt-4">
              <div className="flex items-center gap-3">
                <Users className="size-4 text-muted-foreground" />
                <div className="flex -space-x-2">
                  {(participants ?? []).slice(0, 5).map((p) => (
                    <AvatarDisplay key={p.id} avatarConfig={p.profiles?.avatar_config} avatarUrl={p.profiles?.avatar_url} size="sm" />
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">
                  {(participants ?? []).length} 人已加入
                </span>
              </div>
              <JoinButton postId={id} isJoined={isJoined} isLoggedIn={!!user} isOwner={user?.id === post.user_id} />
            </div>
          </CardContent>
        </Card>

        {/* Comments */}
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            评论 {comments && comments.length > 0 ? `(${comments.length})` : ""}
          </h2>
          <CommentSection
            postId={id}
            comments={(comments ?? []) as unknown as { id: string; content: string; created_at: string; profiles: { username: string } | null }[]}
            isLoggedIn={!!user}
          />
        </div>
      </div>
    </div>
  );
}
