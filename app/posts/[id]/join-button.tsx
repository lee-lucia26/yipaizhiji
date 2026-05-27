"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function JoinButton({
  postId,
  isJoined,
  isLoggedIn,
}: {
  postId: string;
  isJoined: boolean;
  isLoggedIn: boolean;
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
      // Leave
      await supabase
        .from("post_participants")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id);
      setJoined(false);
    } else {
      // Join
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
