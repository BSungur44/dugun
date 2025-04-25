"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Send, Loader2 } from "lucide-react"

interface CommentFormProps {
  itemId: string
  itemType: "photo" | "audio"
  onCommentAdded: () => void
}

export function CommentForm({ itemId, itemType, onCommentAdded }: CommentFormProps) {
  const [comment, setComment] = useState("")
  const [username, setUsername] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Kullanıcı adını localStorage'dan yükle
  useState(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("commentUsername") || localStorage.getItem("uploaderName") || ""
      setUsername(storedName)
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!comment.trim()) {
      setError("Yorum alanı boş olamaz")
      return
    }

    if (!username.trim()) {
      setError("İsim alanı boş olamaz")
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: comment,
          username,
          itemId,
          itemType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Yorum gönderilirken bir hata oluştu")
      }

      // Başarılı
      setComment("")

      // Kullanıcı adını localStorage'a kaydet
      if (typeof window !== "undefined") {
        localStorage.setItem("commentUsername", username)
      }

      // Yorum eklendiğini bildir
      onCommentAdded()
    } catch (err) {
      console.error("Yorum gönderme hatası:", err)
      setError(err instanceof Error ? err.message : "Yorum gönderilirken bir hata oluştu")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Input
          placeholder="Adınız"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mb-2"
          disabled={isSubmitting}
        />
        <Textarea
          placeholder="Yorumunuzu yazın..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          disabled={isSubmitting}
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={isSubmitting} className="flex items-center gap-1">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Gönderiliyor...</span>
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              <span>Gönder</span>
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
