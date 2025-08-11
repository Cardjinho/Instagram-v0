"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ImagePlus, X } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface CreatePostProps {
  userId: string
}

export default function CreatePost({ userId }: CreatePostProps) {
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setImage(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!image) return

    setLoading(true)

    try {
      // Upload image to Supabase Storage
      const fileExt = image.name.split(".").pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `posts/${fileName}`

      const { error: uploadError } = await supabase.storage.from("images").upload(filePath, image)

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(filePath)

      // Create post
      const { error: postError } = await supabase.from("posts").insert({
        user_id: userId,
        image_url: publicUrl,
        caption: caption.trim() || null,
      })

      if (postError) throw postError

      router.push("/")
    } catch (error: any) {
      alert("Erro ao criar post: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Criar novo post</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Image Upload */}
            <div>
              <Label htmlFor="image">Imagem</Label>
              {!imagePreview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <ImagePlus className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <Label htmlFor="image" className="cursor-pointer">
                      <span className="text-blue-500 hover:text-blue-600">Clique para selecionar uma imagem</span>
                      <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </Label>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <div className="aspect-square relative rounded-lg overflow-hidden">
                    <Image src={imagePreview || "/placeholder.svg"} alt="Preview" fill className="object-cover" />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Caption */}
            <div>
              <Label htmlFor="caption">Legenda</Label>
              <Textarea
                id="caption"
                placeholder="Escreva uma legenda..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
              />
            </div>

            {/* Submit */}
            <Button type="submit" className="w-full" disabled={!image || loading}>
              {loading ? "Publicando..." : "Compartilhar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
