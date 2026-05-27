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

const matchSchema = z.object({
  tournament: z.string().min(1, "请输入赛事名"),
  round: z.string().min(1, "请输入轮次（如：第一轮）"),
  player1: z.string().min(1, "请输入选手名"),
  player2: z.string().min(1, "请输入选手名"),
  score: z.string().optional().or(z.literal("")),
  winner: z.string().optional().or(z.literal("")),
  matchDate: z.string().min(1, "请选择日期"),
});

type MatchForm = z.infer<typeof matchSchema>;

export function AdminMatchForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [serverSuccess, setServerSuccess] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MatchForm>({
    resolver: zodResolver(matchSchema),
  });

  const onSubmit = async (data: MatchForm) => {
    setServerError("");
    setServerSuccess("");
    const supabase = createClient();

    const { error } = await supabase.from("matches").insert({
      tournament: data.tournament,
      round: data.round,
      player1: data.player1,
      player2: data.player2,
      score: data.score || null,
      winner: data.winner || null,
      match_date: data.matchDate,
    });

    if (error) {
      setServerError(error.message);
      return;
    }

    setServerSuccess("赛事添加成功！");
    reset();
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tournament">赛事名称</Label>
          <Input id="tournament" placeholder="例如：2026法网" {...register("tournament")} />
          {errors.tournament && <p className="text-sm text-destructive">{errors.tournament.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="round">轮次</Label>
          <Input id="round" placeholder="例如：第一轮" {...register("round")} />
          {errors.round && <p className="text-sm text-destructive">{errors.round.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="player1">选手 1</Label>
          <Input id="player1" placeholder="选手姓名" {...register("player1")} />
          {errors.player1 && <p className="text-sm text-destructive">{errors.player1.message}</p>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="player2">选手 2</Label>
          <Input id="player2" placeholder="选手姓名" {...register("player2")} />
          {errors.player2 && <p className="text-sm text-destructive">{errors.player2.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="score">比分</Label>
          <Input id="score" placeholder="例如：6-4, 6-3" {...register("score")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="winner">胜者</Label>
          <Input id="winner" placeholder="选手姓名" {...register("winner")} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="matchDate">日期</Label>
          <Input id="matchDate" type="date" {...register("matchDate")} />
          {errors.matchDate && <p className="text-sm text-destructive">{errors.matchDate.message}</p>}
        </div>
      </div>

      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      {serverSuccess && <p className="text-sm text-green-600">{serverSuccess}</p>}

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "添加中..." : "添加赛事"}
      </Button>
    </form>
  );
}
