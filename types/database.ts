export interface Profile {
  id: string
  username: string
  full_name?: string
  bio?: string
  avatar_url?: string
  website?: string
  followers_count: number
  following_count: number
  posts_count: number
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  user_id: string
  image_url: string
  caption?: string
  likes_count: number
  comments_count: number
  created_at: string
  profiles?: Profile
  is_liked?: boolean
}

export interface Comment {
  id: string
  user_id: string
  post_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export interface Story {
  id: string
  user_id: string
  image_url: string
  created_at: string
  expires_at: string
  profiles?: Profile
}
