import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewPostForm } from "./new-post-form";

export default async function NewPostPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tennis_level, region")
    .eq("id", user.id)
    .single();

  // Get distinct locations for autocomplete
  const { data: locations } = await supabase
    .from("posts")
    .select("location");

  const uniqueLocations = Array.from(
    new Set((locations ?? []).map((l) => l.location))
  ).sort();

  return (
    <div className="min-h-full px-4 py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-zinc-900">发布约球帖</h1>
        <NewPostForm
          userLevel={profile?.tennis_level ?? ""}
          userRegion={profile?.region ?? ""}
          locationHistory={uniqueLocations}
        />
      </div>
    </div>
  );
}
