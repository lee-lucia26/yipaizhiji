"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function JoinButton({
  postId,
  isJoined,
  isLoggedIn,
  isOwner,
}: {
  postId: string;
  isJoined: boolean;
  isLoggedIn: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [joined, setJoined] = useState(isJoined);

  if (!isLoggedIn) {
    return (
      <Button asChild size="sm" variant="outline">
        <a href="/login">登录后加入</a>
      </Button>
    );
  }

  if (isOwner) {
    return (
      <span
        className="inline-block rounded-full px-3 py-1 text-xs font-medium"
        style={{ backgroundColor: "#DFFF4F", color: "#1a1a1a" }}
      >
        你发起的
      </span>
    );
  }

  const handleClick = async () => {
    setLoading(true);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    if (joined) {
      await supabase
        .from("post_participants")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
      setJoined(false);
    } else {
      await supabase.from("post_participants").insert({
        post_id: postId,
        user_id: user.id,
        status: "joined",
      });
      setJoined(true);
    }

    setLoading(false);
    router.refresh();
  };

  return (
    <Button
      size="sm"
      variant={joined ? "outline" : "default"}
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? "处理中..." : joined ? "退出球局" : "加入球局"}
    </Button>
  );
}
