import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { UserMenu } from "./user-menu";

export async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username = "";
  let avatarConfig = null;
  let avatarUrl: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_config, avatar_url")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? "";
    avatarConfig = profile?.avatar_config ?? null;
    avatarUrl = profile?.avatar_url ?? null;
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

        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            约球广场
          </Link>
          <Link
            href="/forum"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            论坛
          </Link>

          {user ? (
            <UserMenu username={username} avatarConfig={avatarConfig} avatarUrl={avatarUrl} />
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
