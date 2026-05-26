"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const categories = ["技术交流", "装备推荐", "赛事讨论", "找球友"];

const threadSchema = z.object({
  title: z.string().min(1, "请输入标题").max(50, "标题最多 50 字"),
  content: z.string().min(1, "请输入内容"),
  category: z.string().min(1, "请选择分类"),
});

type ThreadForm = z.infer<typeof threadSchema>;

export function NewThreadForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ThreadForm>({
    resolver: zodResolver(threadSchema),
  });

  const onSubmit = async (data: ThreadForm) => {
    setServerError("");
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setServerError("请先登录");
      return;
    }

    const { error } = await supabase.from("threads").insert({
      title: data.title,
      content: data.content,
      category: data.category,
      user_id: user.id,
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    router.push("/forum");
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">标题</Label>
            <Input id="title" placeholder="讨论标题" {...register("title")} />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category">分类</Label>
            <select
              id="category"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              {...register("category")}
            >
              <option value="">选择分类</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {errors.category && (
              <p className="text-sm text-destructive">{errors.category.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="content">内容</Label>
            <textarea
              id="content"
              rows={5}
              placeholder="写下你想讨论的内容..."
              className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
              {...register("content")}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content.message}</p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "发布中..." : "发起讨论"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
