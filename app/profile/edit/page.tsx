import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EditProfileForm } from "./edit-profile-form";

export default async function EditProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-full px-4 py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-zinc-900">编辑资料</h1>
        <EditProfileForm profile={profile} />
      </div>
    </div>
  );
}
