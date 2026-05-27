"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { AvatarDisplay } from "@/components/avatar-display";

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id?: string;
  profiles: {
    username: string;
    avatar_url?: string | null;
    avatar_config?: unknown;
  } | null;
}

export function CommentSection({
  threadId,
  postId,
  comments: initialComments,
  isLoggedIn,
}: {
  threadId?: string;
  postId?: string;
  comments: Comment[];
  isLoggedIn: boolean;
}) {
  const router = useRouter();
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSubmitting(true);
    setError("");

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("请先登录");
      setSubmitting(false);
      return;
    }

    const insertData: Record<string, any> = {
      content: text.trim(),
      user_id: user.id,
    };

    if (postId) insertData.post_id = postId;
    else if (threadId) insertData.thread_id = threadId;

    const { data: newComment, error: insertError } = await supabase
      .from("comments")
      .insert(insertData)
      .select("*, profiles(username, avatar_url, avatar_config)")
      .single();

    if (insertError) {
      setError(insertError.message);
      setSubmitting(false);
      return;
    }

    setComments((prev) => [...prev, newComment as unknown as Comment]);
    setText("");
    setSubmitting(false);
    router.refresh();
  };

  return (
    <div>
      {comments.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          暂无评论，来做第一个回复的人吧
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((c) => (
            <div
              key={c.id}
              className="flex gap-3 rounded-xl bg-white p-4 shadow-sm ring-1 ring-foreground/5"
            >
              <Link href={`/users/${c.user_id ?? ""}`} className="shrink-0">
                <AvatarDisplay
                  avatarConfig={c.profiles?.avatar_config}
                  avatarUrl={c.profiles?.avatar_url}
                  size="sm"
                />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/users/${c.user_id ?? ""}`}
                    className="text-sm font-medium text-zinc-700 hover:text-[#2D5A27] transition-colors"
                  >
                    {c.profiles?.username ?? "未知用户"}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {new Date(c.created_at).toLocaleString("zh-CN")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {c.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3">
          <textarea
            rows={3}
            placeholder="写下你的评论..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full rounded-xl border border-input bg-white px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex justify-end">
            <Button type="submit" size="sm" disabled={submitting || !text.trim()}>
              {submitting ? "提交中..." : "发表评论"}
            </Button>
          </div>
        </form>
      ) : (
        <div className="mt-6 rounded-xl bg-white p-6 text-center text-sm text-muted-foreground shadow-sm ring-1 ring-foreground/5">
          请先登录后发表评论
        </div>
      )}
    </div>
  );
}
