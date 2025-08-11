"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Bookmark, Heart, MessageCircle, MoreHorizontal, Send } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Post, Comment } from "@/types/database"

interface PostCardProps {
  post: Post
  currentUserId: string
  onLike: (postId: string, isLiked: boolean) => void
}

export default function PostCard({ post, currentUserId, onLike }: PostCardProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState("")
  const [showComments, setShowComments] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLike = async () => {
    if (post.is_liked) {
      await supabase.from("likes").delete().eq("user_id", currentUserId).eq("post_id", post.id)
    } else {
      await supabase.from("likes").insert({ user_id: currentUserId, post_id: post.id })
    }

    onLike(post.id, !post.is_liked)
  }

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setLoading(true)
    const { error } = await supabase.from("comments").insert({
      user_id: currentUserId,
      post_id: post.id,
      content: newComment.trim(),
    })

    if (!error) {
      setNewComment("")
      fetchComments()
    }
    setLoading(false)
  }

  const fetchComments = async () => {
    const { data } = await supabase
      .from("comments")
      .select(`
        *,
        profiles (
          username,
          avatar_url
        )
      `)
      .eq("post_id", post.id)
      .order("created_at", { ascending: true })

    if (data) {
      setComments(data)
    }
  }

  const toggleComments = () => {
    if (!showComments) {
      fetchComments()
    }
    setShowComments(!showComments)
  }

  return (
    <Card className="w-full max-w-lg mx-auto mb-6">
      {/* Header */}
      <CardHeader className="flex flex-row items-center p-4">
        <Link href={`/profile/${post.profiles?.username}`} className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={post.profiles?.avatar_url || "/placeholder.svg"} />
            <AvatarFallback>{post.profiles?.username?.[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm">{post.profiles?.username}</span>
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Salvar</DropdownMenuItem>
            <DropdownMenuItem>Compartilhar</DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">Denunciar</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      {/* Image */}
      <CardContent className="p-0">
        <div className="aspect-square relative">
          <Image
            src={post.image_url || "/placeholder.svg"}
            alt="Post"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      </CardContent>

      {/* Actions */}
      <CardFooter className="flex flex-col items-start p-4 space-y-3">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={handleLike}>
              <Heart className={`h-6 w-6 ${post.is_liked ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button variant="ghost" size="icon" onClick={toggleComments}>
              <MessageCircle className="h-6 w-6" />
            </Button>
            <Button variant="ghost" size="icon">
              <Send className="h-6 w-6" />
            </Button>
          </div>
          <Button variant="ghost" size="icon">
            <Bookmark className="h-6 w-6" />
          </Button>
        </div>

        {/* Likes */}
        {post.likes_count > 0 && (
          <div className="font-semibold text-sm">
            {post.likes_count} {post.likes_count === 1 ? "curtida" : "curtidas"}
          </div>
        )}

        {/* Caption */}
        {post.caption && (
          <div className="text-sm">
            <Link href={`/profile/${post.profiles?.username}`} className="font-semibold mr-2">
              {post.profiles?.username}
            </Link>
            {post.caption}
          </div>
        )}

        {/* Comments */}
        {post.comments_count > 0 && !showComments && (
          <Button variant="link" className="p-0 h-auto text-gray-500 text-sm" onClick={toggleComments}>
            Ver todos os {post.comments_count} comentários
          </Button>
        )}

        {showComments && (
          <div className="w-full space-y-2">
            {comments.map((comment) => (
              <div key={comment.id} className="text-sm">
                <Link href={`/profile/${comment.profiles?.username}`} className="font-semibold mr-2">
                  {comment.profiles?.username}
                </Link>
                {comment.content}
              </div>
            ))}
          </div>
        )}

        {/* Add Comment */}
        <form onSubmit={handleComment} className="flex w-full space-x-2">
          <Input
            placeholder="Adicione um comentário..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="border-0 p-0 focus-visible:ring-0"
          />
          <Button
            type="submit"
            variant="link"
            className="p-0 text-blue-500 font-semibold"
            disabled={!newComment.trim() || loading}
          >
            Publicar
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
