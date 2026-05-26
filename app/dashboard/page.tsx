import { redirect } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { SignOutButton } from "./sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, tennis_level, region")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-8 px-4">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          欢迎回到一拍知己，{profile?.username ?? "球友"}
        </h1>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>我的资料</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">等级</span>
            <span className="font-medium">{profile?.tennis_level ?? "未设置"}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">区域</span>
            <span className="font-medium">{profile?.region ?? "未设置"}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button asChild variant="outline">
          <Link href="/matches">赛事追踪</Link>
        </Button>
        <SignOutButton />
      </div>
    </div>
  );
}
