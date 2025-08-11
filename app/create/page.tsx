import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import CreatePost from "@/components/posts/create-post"

export default async function CreatePage() {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return <CreatePost userId={user.id} />
}
