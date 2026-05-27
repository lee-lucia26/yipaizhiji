import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { AvatarDisplay } from "@/components/avatar-display";
import { CommentSection } from "./comment-section";

interface ThreadPageProps {
  params: Promise<{ id: string }>;
}

export default async function ThreadDetailPage({ params }: ThreadPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: thread } = await supabase
    .from("threads")
    .select("*, profiles(username, avatar_url, avatar_config)")
    .eq("id", id)
    .single();

  if (!thread) {
    redirect("/forum");
  }

  const { data: comments } = await supabase
    .from("comments")
    .select("*, profiles(username, avatar_url, avatar_config)")
    .eq("thread_id", id)
    .order("created_at", { ascending: true });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-full px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-xl font-bold text-zinc-900">{thread.title}</h1>
              <span className="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: "#2D5A27" }}>
                {thread.category}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap mb-4">
              {thread.content}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground border-t pt-3">
              <AvatarDisplay
                avatarConfig={thread.profiles?.avatar_config}
                avatarUrl={thread.profiles?.avatar_url}
                size="sm"
              />
              <span>{(thread.profiles as { username: string } | null)?.username ?? "未知用户"}</span>
              <span>·</span>
              <span>{new Date(thread.created_at).toLocaleString("zh-CN")}</span>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            评论 {comments && comments.length > 0 ? `(${comments.length})` : ""}
          </h2>
          <CommentSection
            threadId={id}
            comments={(comments ?? []) as unknown as {
              id: string; content: string; created_at: string; user_id?: string;
              profiles: { username: string; avatar_url?: string | null; avatar_config?: unknown } | null;
            }[]}
            isLoggedIn={!!user}
          />
        </div>
      </div>
    </div>
  );
}
