export interface AvatarConfig {
  label: string;
  imageUrl: string;
}

const BASE = "https://yfdctuguotineehefvht.supabase.co/storage/v1/object/public/avatars/default";

export const DEFAULT_AVATARS: AvatarConfig[] = [
  { label: "草地绿·微笑", imageUrl: `${BASE}/green.png` },
  { label: "网球黄·酷", imageUrl: `${BASE}/yellow.jpeg` },
  { label: "天空蓝·开心", imageUrl: `${BASE}/blue.jpeg` },
  { label: "珊瑚粉·眨眼", imageUrl: `${BASE}/pink.png` },
  { label: "紫色·爱心", imageUrl: `${BASE}/purple.png` },
  { label: "橙色·惊讶", imageUrl: `${BASE}/orange.png` },
  { label: "红色·愤怒", imageUrl: `${BASE}/red.png` },
  { label: "灰色·墨镜", imageUrl: `${BASE}/gold.png` },
];

export function getAvatarImageUrl(avatarConfig: unknown): string | null {
  const config = avatarConfig as { imageUrl?: string } | null;
  return config?.imageUrl ?? null;
}
