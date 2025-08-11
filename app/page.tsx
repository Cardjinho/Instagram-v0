"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Header from "@/components/layout/header"
import StoriesBar from "@/components/stories/stories-bar"
import PostCard from "@/components/posts/post-card"
import { supabase } from "@/lib/supabase"
import type { Post } from "@/types/database"

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    setUser(user)

    // Get or create profile
    let { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

    if (!profile) {
      const { data: newProfile } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          username: user.email?.split("@")[0] || "user",
          full_name: user.user_metadata?.full_name || "",
        })
        .select()
        .single()

      profile = newProfile
    }

    setProfile(profile)
    fetchPosts(user.id)
    setLoading(false)
  }

  const fetchPosts = async (userId: string) => {
    const { data } = await supabase
      .from("posts")
      .select(`
        *,
        profiles (
          username,
          avatar_url,
          full_name
        )
      `)
      .order("created_at", { ascending: false })

    if (data) {
      // Check if user liked each post
      const postsWithLikes = await Promise.all(
        data.map(async (post) => {
          const { data: like } = await supabase
            .from("likes")
            .select("id")
            .eq("user_id", userId)
            .eq("post_id", post.id)
            .single()

          return {
            ...post,
            is_liked: !!like,
          }
        }),
      )

      setPosts(postsWithLikes)
    }
  }

  const handleLike = (postId: string, isLiked: boolean) => {
    setPosts(
      posts.map((post) =>
        post.id === postId
          ? {
              ...post,
              is_liked: isLiked,
              likes_count: isLiked ? post.likes_count + 1 : post.likes_count - 1,
            }
          : post,
      ),
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} profile={profile} />

      <main className="max-w-2xl mx-auto pt-6 px-4">
        <StoriesBar currentUser={profile} />

        <div className="space-y-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Nenhum post encontrado</p>
              <p className="text-sm text-gray-500 mt-2">Siga algumas pessoas ou crie seu primeiro post!</p>
            </div>
          ) : (
            posts.map((post) => <PostCard key={post.id} post={post} currentUserId={user.id} onLike={handleLike} />)
          )}
        </div>
      </main>
    </div>
  )
}
