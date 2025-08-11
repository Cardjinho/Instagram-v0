"use client"

import { useEffect, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Plus } from "lucide-react"
import { supabase } from "@/lib/supabase"
import type { Story } from "@/types/database"

interface StoriesBarProps {
  currentUser: any
}

export default function StoriesBar({ currentUser }: StoriesBarProps) {
  const [stories, setStories] = useState<Story[]>([])

  useEffect(() => {
    fetchStories()
  }, [])

  const fetchStories = async () => {
    const { data } = await supabase
      .from("stories")
      .select(`
        *,
        profiles (
          username,
          avatar_url
        )
      `)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })

    if (data) {
      setStories(data)
    }
  }

  // Group stories by user
  const groupedStories = stories.reduce((acc, story) => {
    const userId = story.user_id
    if (!acc[userId]) {
      acc[userId] = {
        user: story.profiles,
        stories: [],
      }
    }
    acc[userId].stories.push(story)
    return acc
  }, {} as any)

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-4">
          {/* Add Story Button */}
          <div className="flex flex-col items-center space-y-1 flex-shrink-0">
            <div className="relative">
              <Avatar className="h-16 w-16 border-2 border-gray-200">
                <AvatarImage src={currentUser?.avatar_url || "/placeholder.svg"} />
                <AvatarFallback>Eu</AvatarFallback>
              </Avatar>
              <Button
                size="icon"
                className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-blue-500 hover:bg-blue-600"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <span className="text-xs text-gray-600 max-w-[64px] truncate">Seu story</span>
          </div>

          {/* Stories */}
          {Object.entries(groupedStories).map(([userId, data]: [string, any]) => (
            <div key={userId} className="flex flex-col items-center space-y-1 flex-shrink-0">
              <Avatar className="h-16 w-16 border-2 border-pink-500 p-0.5">
                <AvatarImage src={data.user?.avatar_url || "/placeholder.svg"} className="rounded-full" />
                <AvatarFallback>{data.user?.username?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-600 max-w-[64px] truncate">{data.user?.username}</span>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
