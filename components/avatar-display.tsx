import { getAvatarImageUrl } from "@/lib/avatars";

export function AvatarDisplay({
  avatarConfig,
  avatarUrl,
  size = "md",
}: {
  avatarConfig?: unknown;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass =
    size === "sm"
      ? "size-8"
      : size === "lg"
        ? "size-14"
        : "size-10";

  const src = avatarUrl ?? getAvatarImageUrl(avatarConfig);

  if (!src) {
    return (
      <div
        className={`${sizeClass} flex items-center justify-center rounded-full bg-[#2D5A27] text-white`}
      >
        <span className="text-xs">🎾</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt="头像"
      className={`${sizeClass} rounded-full object-cover ring-1 ring-foreground/10`}
    />
  );
}
