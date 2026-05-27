"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";
import { AvatarDisplay } from "@/components/avatar-display";

export function UserMenu({
  username,
  avatarConfig,
  avatarUrl,
}: {
  username: string;
  avatarConfig: unknown;
  avatarUrl?: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-zinc-100"
      >
        <AvatarDisplay avatarConfig={avatarConfig} avatarUrl={avatarUrl} size="sm" />
        <span className="hidden sm:inline text-sm font-medium text-zinc-700">
          {username}
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-foreground/10 z-50">
          <div className="px-3 py-2 text-sm font-medium text-zinc-900 border-b mb-1">
            {username}
          </div>
          <Link
            href="/profile/edit"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            编辑资料
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="block rounded-lg px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 transition-colors"
          >
            我的主页
          </Link>
          <hr className="my-1" />
          <button
            onClick={handleSignOut}
            className="w-full text-left rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
