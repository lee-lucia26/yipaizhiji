import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

export async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username = "";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? "";
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-[#2D5A27]"
        >
          一拍知己
        </Link>

        <nav className="flex items-center gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            首页
          </Link>
          <Link
            href="/matches"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            赛事追踪
          </Link>
          <Link
            href="/forum"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            论坛
          </Link>

          {user ? (
            <>
              <Button asChild size="sm">
                <Link href="/posts/new">发布约球帖</Link>
              </Button>
              <span className="text-sm text-muted-foreground">
                {username || user.email}
              </span>
            </>
          ) : (
            <Button asChild size="sm">
              <Link href="/login">登录 / 注册</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
