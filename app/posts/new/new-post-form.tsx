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

const tennisLevels = [
  "1.0", "1.5", "2.0", "2.5", "3.0", "3.5",
  "4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0",
];

const postSchema = z
  .object({
    title: z.string().min(1, "请输入标题"),
    content: z.string().min(1, "请输入内容"),
    region: z.string().min(1, "请输入区域"),
    min_level: z.string().min(1, "请选择最低等级"),
    max_level: z.string().min(1, "请选择最高等级"),
    play_time: z.string().min(1, "请选择约球时间"),
    location: z.string().min(1, "请输入场地位置"),
  })
  .refine(
    (data) => parseFloat(data.max_level) >= parseFloat(data.min_level),
    { message: "最高等级不能低于最低等级", path: ["max_level"] }
  )
  .refine((data) => new Date(data.play_time) > new Date(), {
    message: "约球时间必须在当前时间之后",
    path: ["play_time"],
  });

type PostForm = z.infer<typeof postSchema>;

export function NewPostForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
  });

  const onSubmit = async (data: PostForm) => {
    setServerError("");
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setServerError("请先登录");
      return;
    }

    const { error } = await supabase.from("posts").insert({
      title: data.title,
      content: data.content,
      region: data.region,
      min_level: parseFloat(data.min_level),
      max_level: parseFloat(data.max_level),
      play_time: data.play_time,
      location: data.location,
      user_id: user.id,
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    router.push("/");
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">标题</Label>
            <Input id="title" placeholder="例如：周末朝阳公园约球" {...register("title")} />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="content">内容</Label>
            <textarea
              id="content"
              rows={4}
              placeholder="描述你的约球需求，如人数、性别偏好等"
              className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
              {...register("content")}
            />
            {errors.content && (
              <p className="text-sm text-destructive">{errors.content.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="region">区域</Label>
            <Input id="region" placeholder="例如：北京-朝阳区" {...register("region")} />
            {errors.region && (
              <p className="text-sm text-destructive">{errors.region.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="min_level">最低等级</Label>
              <select
                id="min_level"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                {...register("min_level")}
              >
                <option value="">选择</option>
                {tennisLevels.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              {errors.min_level && (
                <p className="text-sm text-destructive">{errors.min_level.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="max_level">最高等级</Label>
              <select
                id="max_level"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                {...register("max_level")}
              >
                <option value="">选择</option>
                {tennisLevels.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
              {errors.max_level && (
                <p className="text-sm text-destructive">{errors.max_level.message}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="play_time">约球时间</Label>
            <Input id="play_time" type="datetime-local" {...register("play_time")} />
            {errors.play_time && (
              <p className="text-sm text-destructive">{errors.play_time.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="location">场地位置</Label>
            <Input id="location" placeholder="例如：朝阳公园网球场 3号场" {...register("location")} />
            {errors.location && (
              <p className="text-sm text-destructive">{errors.location.message}</p>
            )}
          </div>

          {serverError && (
            <p className="text-sm text-destructive">{serverError}</p>
          )}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "发布中..." : "发布约球帖"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
