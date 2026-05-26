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

  return (
    <div className="min-h-full px-4 py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-8 text-3xl font-bold tracking-tight">发布约球帖</h1>
        <NewPostForm />
      </div>
    </div>
  );
}
