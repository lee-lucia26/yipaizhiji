"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { cn } from "@/lib/utils";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

const CITIES = [
  "北京", "上海", "广州", "深圳", "杭州", "成都", "武汉", "南京",
  "西安", "重庆", "天津", "苏州", "长沙", "郑州", "青岛", "大连",
  "宁波", "厦门", "无锡", "佛山", "东莞", "石家庄", "太原", "沈阳",
  "长春", "哈尔滨", "合肥", "福州", "南昌", "济南", "南宁", "海口",
  "贵阳", "昆明", "拉萨", "兰州", "西宁", "银川", "乌鲁木齐", "呼和浩特",
];

const TIME_SLOTS = [
  { label: "早晨 6-9点", value: "06:00" },
  { label: "上午 9-12点", value: "09:00" },
  { label: "下午 12-18点", value: "12:00" },
  { label: "晚上 18-22点", value: "18:00" },
];

const LEVEL_OPTIONS = [
  { label: "同等级 ±0.5", value: "0.5" },
  { label: "同等级 ±1.0", value: "1.0" },
  { label: "不限", value: "all" },
];

const PLAY_TAGS = [
  "底线对拉", "网前截击", "发球上网", "单打", "双打", "混双", "练习", "比赛",
];

const postSchema = z
  .object({
    title: z.string().min(1, "请输入标题"),
    content: z.string().optional().or(z.literal("")),
    city: z.string().min(1, "请选择城市"),
    location: z.string().min(1, "请输入场地位置"),
    date: z.string().min(1, "请选择日期"),
    timeSlot: z.string().min(1, "请选择时段"),
    levelRange: z.string().min(1, "请选择等级范围"),
    courtFee: z.string().optional().or(z.literal("")),
    maxParticipants: z.string().optional().or(z.literal("")),
  })
  .refine((data) => {
    if (!data.date) return true;
    const dt = new Date(`${data.date}T${data.timeSlot || "00:00"}:00`);
    return dt > new Date();
  }, { message: "约球时间必须在当前时间之后", path: ["date"] });

type PostForm = z.infer<typeof postSchema>;

export function NewPostForm({
  userLevel,
  userRegion,
  locationHistory,
}: {
  userLevel: string;
  userRegion: string;
  locationHistory: string[];
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [citySearch, setCitySearch] = useState(userRegion?.split("-")[0] ?? "");
  const [showCityList, setShowCityList] = useState(false);

  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return CITIES;
    return CITIES.filter((c) => c.includes(citySearch.trim()));
  }, [citySearch]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<PostForm>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      levelRange: userLevel ? "0.5" : "all",
      city: userRegion?.split("-")[0] ?? "",
    },
  });

  const onSubmit = async (data: PostForm) => {
    setServerError("");
    const supabase = createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setServerError("请先登录"); return; }

    let minLevel = 1.0;
    let maxLevel = 7.0;
    if (data.levelRange !== "all" && userLevel) {
      const base = parseFloat(userLevel);
      const range = parseFloat(data.levelRange);
      minLevel = Math.max(1.0, base - range);
      maxLevel = Math.min(7.0, base + range);
    }

    let content = data.content || "";
    if (tags.length > 0) content += `\n【标签】${tags.join("、")}`;
    if (data.courtFee) content += `\n【场地费】人均 ¥${data.courtFee} 元`;

    const { error } = await supabase.from("posts").insert({
      title: data.title,
      content: content || "暂无补充说明",
      region: data.city,
      min_level: minLevel,
      max_level: maxLevel,
      play_time: `${data.date}T${data.timeSlot}:00`,
      location: data.location,
      user_id: user.id,
      max_participants: data.maxParticipants ? parseInt(data.maxParticipants) : 4,
    });

    if (error) { setServerError(error.message); return; }
    router.push("/");
  };

  const selectCity = (city: string) => {
    setCitySearch(city);
    setValue("city", city);
    setShowCityList(false);
  };

  const toggleTag = (tag: string) => {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 pt-4">
          {/* 标题 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="title">球局标题</Label>
            <Input id="title" placeholder="例如：周末朝阳公园双打局" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          {/* 日期 + 时段 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="date">日期</Label>
              <Input id="date" type="date" {...register("date")} />
              {errors.date && <p className="text-sm text-destructive">{errors.date.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="timeSlot">时段</Label>
              <select
                id="timeSlot"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                {...register("timeSlot")}
              >
                <option value="">选择时段</option>
                {TIME_SLOTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              {errors.timeSlot && <p className="text-sm text-destructive">{errors.timeSlot.message}</p>}
            </div>
          </div>

          {/* 城市 + 场地 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="relative flex flex-col gap-1.5">
              <Label htmlFor="city">城市</Label>
              <input type="hidden" {...register("city")} />
              <input
                id="city"
                type="text"
                placeholder="搜索城市"
                value={citySearch}
                onChange={(e) => { setCitySearch(e.target.value); setShowCityList(true); }}
                onFocus={() => setShowCityList(true)}
                onBlur={() => setTimeout(() => setShowCityList(false), 150)}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              {showCityList && (
                <div className="absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
                  {filteredCities.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onMouseDown={() => selectCity(c)}
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-[#DFFF4F]/30 transition-colors"
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
              {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="location">场地位置</Label>
              <Input
                id="location"
                list="venue-list"
                placeholder="例如：朝阳公园 3号场"
                {...register("location")}
              />
              {locationHistory.length > 0 && (
                <datalist id="venue-list">
                  {locationHistory.map((l) => <option key={l} value={l} />)}
                </datalist>
              )}
              {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
            </div>
          </div>

          {/* 等级范围 */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="levelRange">
              找球友范围
              {userLevel && <span className="ml-1 text-xs text-muted-foreground">（我的等级：{userLevel}）</span>}
            </Label>
            <select
              id="levelRange"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              {...register("levelRange")}
            >
              {LEVEL_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* 打球玩法 */}
          <div className="flex flex-col gap-1.5">
            <Label>打球玩法</Label>
            <div className="flex flex-wrap gap-1.5">
              {PLAY_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors",
                    tags.includes(tag)
                      ? "bg-[#2D5A27] text-white border-[#2D5A27]"
                      : "bg-white text-muted-foreground border-zinc-200 hover:border-zinc-300"
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 人数 + 场地费 */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="maxParticipants">需要几人</Label>
              <select
                id="maxParticipants"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                {...register("maxParticipants")}
              >
                {[2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>{n}人</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="courtFee">场地费（人均 ¥）</Label>
              <Input id="courtFee" type="number" min={0} placeholder="50" {...register("courtFee")} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="content">补充说明</Label>
              <Input id="content" placeholder="选填" {...register("content")} />
            </div>
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}

          <Button type="submit" disabled={isSubmitting} size="lg" className="w-full mt-2">
            {isSubmitting ? "发布中..." : "🚀 发布球局"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
