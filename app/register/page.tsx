"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { createClient } from "@/lib/supabase/client";
import { CITIES, CITY_DISTRICTS } from "@/lib/cities";
import { DEFAULT_AVATARS } from "@/lib/avatars";
import { autoLocate } from "@/lib/geolocate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { AvatarSelector } from "@/components/avatar-selector";
import { AvatarDisplay } from "@/components/avatar-display";

const tennisLevels = [
  "1.0", "1.5", "2.0", "2.5", "3.0", "3.5",
  "4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0",
];

const registerSchema = z
  .object({
    email: z.string().min(1, "请输入邮箱").email("邮箱格式不正确"),
    password: z.string().min(6, "密码至少 6 位"),
    confirmPassword: z.string().min(1, "请确认密码"),
    username: z.string().min(1, "请输入昵称").max(20, "昵称最多 20 个字"),
    tennisLevel: z.string().min(1, "请选择网球等级"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次密码不一致",
    path: ["confirmPassword"],
  });

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState(0);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDstr, setSelectedDstr] = useState("");
  const [citySearch, setCitySearch] = useState("");
  const [dstrSearch, setDstrSearch] = useState("");
  const [showCityList, setShowCityList] = useState(false);
  const [showDstrList, setShowDstrList] = useState(false);
  const [locating, setLocating] = useState(false);

  const filteredCities = useMemo(() => {
    if (!citySearch.trim()) return CITIES;
    return CITIES.filter((c) => c.includes(citySearch.trim()));
  }, [citySearch]);

  const districts = selectedCity ? CITY_DISTRICTS[selectedCity] ?? [] : [];
  const filteredDistricts = useMemo(() => {
    if (!dstrSearch.trim()) return districts;
    return districts.filter((d) => d.includes(dstrSearch.trim()));
  }, [districts, dstrSearch]);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadFile(file);
    setUploadPreview(URL.createObjectURL(file));
  };

  const handleGeolocate = async () => {
    setLocating(true);
    setServerError("");
    setSuccessMsg("");

    const result = await autoLocate();

    if (result && result.city) {
      setSelectedCity(result.city);
      setCitySearch("");
      setSuccessMsg("定位成功");
      setTimeout(() => setSuccessMsg(""), 2000);
    } else {
      setServerError("定位失败，请手动选择城市");
    }

    setLocating(false);
  };

  const onSubmit = async (data: RegisterForm) => {
    setServerError("");
    setSuccessMsg("");

    const region = selectedDstr ? `${selectedCity}-${selectedDstr}` : selectedCity;
    if (!region) { setServerError("请选择城市和区域"); return; }

    const supabase = createClient();
    const avatar = DEFAULT_AVATARS[selectedAvatar];

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    });
    if (authError) { setServerError(authError.message); return; }
    if (!authData.user) { setSuccessMsg("注册成功！请检查邮箱完成验证后再登录。"); return; }

    const userId = authData.user.id;
    let finalAvatarUrl: string | null = null;

    if (uploadFile) {
      const ext = uploadFile.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, uploadFile, { upsert: true, contentType: uploadFile.type });
      if (!uploadError) {
        const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
        finalAvatarUrl = urlData?.publicUrl ?? null;
      }
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: userId,
      username: data.username,
      tennis_level: parseFloat(data.tennisLevel),
      region,
      avatar_type: finalAvatarUrl ? "upload" : "default",
      avatar_url: finalAvatarUrl,
      avatar_config: { imageUrl: avatar.imageUrl },
    });
    if (profileError) { setServerError(`资料创建失败：${profileError.message}`); return; }

    router.push("/dashboard");
  };

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">注册</CardTitle>
          <CardDescription>创建你的"一拍知己"账号</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">邮箱</Label>
              <Input id="email" type="email" placeholder="you@example.com" autoComplete="email" {...register("email")} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">密码</Label>
              <Input id="password" type="password" placeholder="至少 6 位" autoComplete="new-password" {...register("password")} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input id="confirmPassword" type="password" placeholder="再次输入密码" autoComplete="new-password" {...register("confirmPassword")} />
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="username">昵称</Label>
              <Input id="username" placeholder="你的昵称" {...register("username")} />
              {errors.username && <p className="text-sm text-destructive">{errors.username.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tennisLevel">网球等级</Label>
              <select
                id="tennisLevel"
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                {...register("tennisLevel")}
              >
                <option value="">请选择等级</option>
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
                    type="text" placeholder={selectedCity || "搜索城市"} value={citySearch}
                    onChange={(e) => { setCitySearch(e.target.value); setShowCityList(true); }}
                    onFocus={() => setShowCityList(true)}
                    onBlur={() => setTimeout(() => setShowCityList(false), 150)}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                  />
                  {selectedCity && !showCityList && <p className="text-xs text-muted-foreground absolute -bottom-4 left-0">{selectedCity}</p>}
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
                    type="text" placeholder={selectedDstr || (selectedCity ? "搜索区域" : "请先选城市")} value={dstrSearch}
                    onChange={(e) => { setDstrSearch(e.target.value); setShowDstrList(true); }}
                    onFocus={() => setShowDstrList(true)}
                    onBlur={() => setTimeout(() => setShowDstrList(false), 150)}
                    disabled={!selectedCity}
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {selectedDstr && !showDstrList && <p className="text-xs text-muted-foreground absolute -bottom-4 left-0">{selectedDstr}</p>}
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

            {/* Avatar */}
            <div className="flex flex-col gap-3">
              <Label>头像</Label>
              <div className="flex items-center gap-4">
                <AvatarDisplay
                  avatarConfig={{ imageUrl: DEFAULT_AVATARS[selectedAvatar].imageUrl }}
                  avatarUrl={uploadPreview}
                  size="lg"
                />
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <span>上传照片</span>
                    </Button>
                    <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                  </label>
                  {uploadFile && (
                    <button type="button"
                      onClick={() => { setUploadFile(null); setUploadPreview(null); if (fileRef.current) fileRef.current.value = ""; }}
                      className="text-xs text-destructive hover:underline text-left">移除照片</button>
                  )}
                </div>
              </div>
              <AvatarSelector selectedIndex={selectedAvatar} onSelect={setSelectedAvatar} />
            </div>

            {serverError && <p className="text-sm text-destructive">{serverError}</p>}
            {successMsg && <p className="text-sm text-green-600 dark:text-green-400">{successMsg}</p>}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? "注册中..." : "注册"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            已有账号？ <Link href="/login" className="text-primary hover:underline">去登录</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
