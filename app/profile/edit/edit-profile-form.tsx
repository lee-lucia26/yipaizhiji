"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { createClient } from "@/lib/supabase/client";
import { DEFAULT_AVATARS, getAvatarImageUrl } from "@/lib/avatars";
import { CITIES, CITY_DISTRICTS } from "@/lib/cities";
import { autoLocate } from "@/lib/geolocate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AvatarSelector } from "@/components/avatar-selector";
import { AvatarDisplay } from "@/components/avatar-display";
import { cn } from "@/lib/utils";

const tennisLevels = [
  "1.0", "1.5", "2.0", "2.5", "3.0", "3.5",
  "4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0",
];

const PLAY_FREQUENCIES = ["每周1次", "每周2-3次", "每周4次以上", "不定期"];

const profileSchema = z.object({
  username: z.string().min(1, "请输入昵称").max(20, "昵称最多 20 字"),
  bio: z.string().max(200, "个人简介最多 200 字").optional().or(z.literal("")),
  tennisLevel: z.string().min(1, "请选择网球等级"),
  yearsPlaying: z.number().min(0).max(50).optional(),
  monthsPlaying: z.number().min(0).max(11).optional(),
  playFrequency: z.string().optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

export function EditProfileForm({ profile }: { profile: any }) {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [serverSuccess, setServerSuccess] = useState("");
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [locating, setLocating] = useState(false);

  // Parse existing region "北京-朝阳区" → city/dstr
  const regionParts = (profile?.region ?? "").split("-");
  const initialCity = regionParts[0] || "";
  const initialDstr = regionParts[1] || "";
  const [selectedCity, setSelectedCity] = useState(initialCity);
  const [selectedDstr, setSelectedDstr] = useState(initialDstr);
  const [citySearch, setCitySearch] = useState("");
  const [dstrSearch, setDstrSearch] = useState("");
  const [showCityList, setShowCityList] = useState(false);
  const [showDstrList, setShowDstrList] = useState(false);

  const currentImageUrl = getAvatarImageUrl(profile?.avatar_config);
  const currentAvatarIndex = DEFAULT_AVATARS.findIndex(
    (a) => a.imageUrl === currentImageUrl
  );
  const [selectedAvatar, setSelectedAvatar] = useState(currentAvatarIndex >= 0 ? currentAvatarIndex : 0);

  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return CITIES;
    return CITIES.filter((c) => c.includes(citySearch.trim()));
  }, [citySearch]);

  const districts = selectedCity ? CITY_DISTRICTS[selectedCity] ?? [] : [];
  const filteredDistricts = useMemo(() => {
    if (!dstrSearch.trim()) return districts;
    return districts.filter((d) => d.includes(dstrSearch.trim()));
  }, [districts, dstrSearch]);

  const yearsPlayed = profile?.years_playing ?? 0;
  const monthsPlayed = profile?.months_playing ?? 0;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile?.username ?? "",
      bio: profile?.bio ?? "",
      tennisLevel: profile?.tennis_level ?? "",
      yearsPlaying: yearsPlayed || undefined,
      monthsPlaying: monthsPlayed || undefined,
      playFrequency: profile?.play_frequency ?? "",
    },
  });

  const selectCity = (city: string) => {
    setSelectedCity(city);
    setCitySearch("");
    setShowCityList(false);
    setSelectedDstr("");
    setDstrSearch("");
  };

  const selectDstr = (dstr: string) => {
    setSelectedDstr(dstr);
    setDstrSearch("");
    setShowDstrList(false);
  };

  const handleGeolocate = async () => {
    setLocating(true);
    setServerError("");
    setServerSuccess("");

    const result = await autoLocate();

    if (result) {
      if (result.city) {
        setSelectedCity(result.city);
        setCitySearch("");
      }
      if (result.district) {
        setSelectedDstr(result.district);
        setDstrSearch("");
      }
      setServerSuccess("定位成功");
      setTimeout(() => setServerSuccess(""), 3000);
    } else {
      setServerError("定位失败，请手动选择城市");
    }

    setLocating(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setServerError("");
    const supabase = createClient();

    const ext = file.name.split(".").pop();
    const path = `${profile.id}/avatar.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) {
      setServerError(`上传失败：${error.message}`);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = urlData?.publicUrl;
    if (publicUrl) {
      setAvatarUrl(publicUrl);
      await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", profile.id);
    }

    setUploading(false);
  };

  const onSubmit = async (data: ProfileForm) => {
    setServerError("");
    setServerSuccess("");

    const region = selectedDstr ? `${selectedCity}-${selectedDstr}` : selectedCity;

    if (!region) {
      setServerError("请选择城市和区域");
      return;
    }

    const supabase = createClient();
    const avatar = DEFAULT_AVATARS[selectedAvatar];

    const { error } = await supabase
      .from("profiles")
      .update({
        username: data.username,
        bio: data.bio || null,
        tennis_level: data.tennisLevel,
        region,
        years_playing: data.yearsPlaying ?? 0,
        months_playing: data.monthsPlaying ?? 0,
        play_frequency: data.playFrequency || null,
        avatar_config: { imageUrl: avatar.imageUrl },
      })
      .eq("id", profile.id);

    if (error) {
      setServerError(error.message);
      return;
    }

    setServerSuccess("保存成功！");
    router.refresh();
    setTimeout(() => router.push("/dashboard"), 800);
  };

  const playingTimeDisplay =
    yearsPlayed > 0 || monthsPlayed > 0
      ? `${yearsPlayed > 0 ? `${yearsPlayed}年` : ""}${monthsPlayed > 0 ? `${monthsPlayed}个月` : ""}`
      : "未设置";

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4 pt-4">
          {/* Avatar preview + upload */}
          <div className="flex items-center gap-4">
            <AvatarDisplay
              avatarConfig={{ imageUrl: DEFAULT_AVATARS[selectedAvatar].imageUrl }}
              avatarUrl={avatarUrl}
              size="lg"
            />
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">头像</span>
              <label className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                  <span>{uploading ? "上传中..." : "上传照片"}</span>
                </Button>
                <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
              </label>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={async () => {
                    setAvatarUrl(null);
                    const supabase = createClient();
                    await supabase.from("profiles").update({ avatar_url: null }).eq("id", profile.id);
                  }}
                  className="text-xs text-destructive hover:underline text-left"
                >
                  移除照片
                </button>
              )}
            </div>
          </div>

          {/* Default avatars */}
          <div className="flex flex-col gap-2">
            <Label>默认头像</Label>
            <AvatarSelector selectedIndex={selectedAvatar} onSelect={setSelectedAvatar} />
          </div>

          {/* Username */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="username">昵称</Label>
            <Input id="username" placeholder="你的昵称" {...register("username")} />
            {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
          </div>

          {/* Bio */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="bio">个人简介</Label>
            <textarea
              id="bio"
              rows={3}
              placeholder="介绍一下你的打球风格..."
              className="w-full rounded-lg border border-input bg-transparent px-2.5 py-1.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              {...register("bio")}
            />
            {errors.bio && <p className="text-sm text-destructive">{errors.bio.message}</p>}
          </div>

          {/* Level */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="tennisLevel">网球等级</Label>
            <select
              id="tennisLevel"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              {...register("tennisLevel")}
            >
              <option value="">选择</option>
              {tennisLevels.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
            {errors.tennisLevel && <p className="text-sm text-destructive">{errors.tennisLevel.message}</p>}
          </div>

          {/* City + district + locate in one row */}
          <div className="flex flex-col gap-1.5">
            <Label>城市 / 区域</Label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={selectedCity || "搜索城市"}
                  value={citySearch}
                  onChange={(e) => { setCitySearch(e.target.value); setShowCityList(true); }}
                  onFocus={() => setShowCityList(true)}
                  onBlur={() => setTimeout(() => setShowCityList(false), 150)}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
                {selectedCity && !showCityList && (
                  <p className="text-xs text-muted-foreground absolute -bottom-4 left-0">{selectedCity}</p>
                )}
                {showCityList && (
                  <div className="absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
                    {filteredCities.map((c) => (
                      <button key={c} type="button" onMouseDown={() => selectCity(c)}
                        className={cn("w-full px-3 py-1.5 text-left text-sm transition-colors", c === selectedCity ? "bg-[#DFFF4F]/50 font-medium" : "hover:bg-[#DFFF4F]/30")}>{c}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={selectedDstr || (selectedCity ? "搜索区域" : "请先选城市")}
                  value={dstrSearch}
                  onChange={(e) => { setDstrSearch(e.target.value); setShowDstrList(true); }}
                  onFocus={() => setShowDstrList(true)}
                  onBlur={() => setTimeout(() => setShowDstrList(false), 150)}
                  disabled={!selectedCity}
                  className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {selectedDstr && !showDstrList && (
                  <p className="text-xs text-muted-foreground absolute -bottom-4 left-0">{selectedDstr}</p>
                )}
                {showDstrList && selectedCity && (
                  <div className="absolute left-0 top-full z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
                    {filteredDistricts.map((d) => (
                      <button key={d} type="button" onMouseDown={() => selectDstr(d)}
                        className={cn("w-full px-3 py-1.5 text-left text-sm transition-colors", d === selectedDstr ? "bg-[#DFFF4F]/50 font-medium" : "hover:bg-[#DFFF4F]/30")}>{d}</button>
                    ))}
                  </div>
                )}
              </div>
              <Button type="button" size="sm" onClick={handleGeolocate} disabled={locating}
                className="shrink-0 bg-[#2D5A27] hover:bg-[#1E3D1A] text-white text-xs h-8 px-3">
                {locating ? "定位中…" : "定位"}
              </Button>
            </div>
          </div>

          {/* Playing experience */}
          <div className="flex flex-col gap-2">
            <Label>球龄</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Input id="yearsPlaying" type="number" min={0} max={50} placeholder="年" {...register("yearsPlaying", { valueAsNumber: true })} />
                <span className="text-sm text-muted-foreground shrink-0">年</span>
              </div>
              <div className="flex items-center gap-2">
                <Input id="monthsPlaying" type="number" min={0} max={11} placeholder="月" {...register("monthsPlaying", { valueAsNumber: true })} />
                <span className="text-sm text-muted-foreground shrink-0">个月</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">当前：{playingTimeDisplay}</p>
          </div>

          {/* Play frequency */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="playFrequency">打球频率</Label>
            <select
              id="playFrequency"
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
              {...register("playFrequency")}
            >
              <option value="">选择</option>
              {PLAY_FREQUENCIES.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          {serverError && <p className="text-sm text-destructive">{serverError}</p>}
          {serverSuccess && <p className="text-sm text-green-600">{serverSuccess}</p>}

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "保存中..." : "保存资料"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
