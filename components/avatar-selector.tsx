"use client";

import { DEFAULT_AVATARS } from "@/lib/avatars";
import { cn } from "@/lib/utils";

export function AvatarSelector({
  selectedIndex,
  onSelect,
}: {
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {DEFAULT_AVATARS.map((avatar, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          className="flex justify-center"
        >
          <img
            src={avatar.imageUrl}
            alt={avatar.label}
            className={cn(
              "size-16 rounded-full object-cover transition-all",
              selectedIndex === i
                ? "ring-2 ring-[#2D5A27] ring-offset-2 scale-105"
                : "ring-1 ring-zinc-200 hover:ring-zinc-300 hover:scale-105"
            )}
          />
        </button>
      ))}
    </div>
  );
}
