"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Grid, Settings, User, Heart, MessageCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Profile, Post } from "@/types/database"

export default function ProfilePage() {
  const params = useParams()
  const username = params.username as string
  const [profile, setProfile] = useState<Profile | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (username) {
      fetchProfile()
      checkCurrentUser()
    }
  }, [username])

  const checkCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const fetchProfile = async () => {
    const { data: profile } = await supabase.from("profiles").select("*").eq("username", username).single()

    if (profile) {
      setProfile(profile)
      fetchPosts(profile.id)

      // Check if current user follows this profile
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user && user.id !== profile.id) {
        const { data: follow } = await supabase
          .from("follows")
          .select("id")
          .eq("follower_id", user.id)
          .eq("following_id", profile.id)
          .single()

        setIsFollowing(!!follow)
      }
    }
    setLoading(false)
  }

  const fetchPosts = async (userId: string) => {
    const { data } = await supabase
      .from("posts")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (data) {
      setPosts(data)
    }
  }

  const handleFollow = async () => {
    if (!currentUser || !profile) return

    if (isFollowing) {
      await supabase.from("follows").delete().eq("follower_id", currentUser.id).eq("following_id", profile.id)
    } else {
      await supabase.from("follows").insert({
        follower_id: currentUser.id,
        following_id: profile.id,
      })
    }

    setIsFollowing(!isFollowing)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Usuário não encontrado</h1>
          <p className="text-gray-600 mt-2">Este perfil não existe ou foi removido.</p>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === profile.id

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-8 mb-8">
        <Avatar className="h-32 w-32 md:h-40 md:w-40">
          <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
          <AvatarFallback className="text-2xl">
            <User className="h-16 w-16" />
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-4 mb-4">
            <h1 className="text-2xl font-light">{profile.username}</h1>

            {isOwnProfile ? (
              <div className="flex space-x-2">
                <Button variant="outline">Editar perfil</Button>
                <Button variant="outline" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button onClick={handleFollow} variant={isFollowing ? "outline" : "default"}>
                {isFollowing ? "Seguindo" : "Seguir"}
              </Button>
            )}
          </div>

          <div className="flex justify-center md:justify-start space-x-8 mb-4">
            <div className="text-center">
              <div className="font-semibold">{profile.posts_count}</div>
              <div className="text-gray-600 text-sm">publicações</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{profile.followers_count}</div>
              <div className="text-gray-600 text-sm">seguidores</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{profile.following_count}</div>
              <div className="text-gray-600 text-sm">seguindo</div>
            </div>
          </div>

          {profile.full_name && <div className="font-semibold mb-1">{profile.full_name}</div>}
          {profile.bio && <div className="text-gray-700 mb-2">{profile.bio}</div>}
          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {profile.website}
            </a>
          )}
        </div>
      </div>

      {/* Posts Grid */}
      <Tabs defaultValue="posts" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="posts" className="flex items-center space-x-2">
            <Grid className="h-4 w-4" />
            <span>PUBLICAÇÕES</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="posts" className="mt-6">
          {posts.length === 0 ? (
            <div className="text-center py-12">
              <div className="border-2 border-gray-300 rounded-full p-6 w-24 h-24 mx-auto mb-4 flex items-center justify-center">
                <Grid className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-light mb-2">Nenhuma publicação ainda</h3>
              {isOwnProfile && (
                <p className="text-gray-600">Quando você compartilhar fotos, elas aparecerão no seu perfil.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1 md:gap-4">
              {posts.map((post) => (
                <div key={post.id} className="aspect-square relative group cursor-pointer">
                  <Image
                    src={post.image_url || "/placeholder.svg"}
                    alt="Post"
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 33vw, (max-width: 1200px) 25vw, 20vw"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                    <div className="text-white opacity-0 group-hover:opacity-100 flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Heart className="h-5 w-5 fill-current" />
                        <span className="font-semibold">{post.likes_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-5 w-5 fill-current" />
                        <span className="font-semibold">{post.comments_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
