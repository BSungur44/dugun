"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { tr } from "date-fns/locale"
import { User, Loader2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface Comment {
  id: string
  content: string
  username: string
  created_at: string
}

interface CommentsListProps {
  itemId: string
  itemType: "photo" | "audio"
  refreshTrigger: number
}

export function CommentsList({ itemId, itemType, refreshTrigger }: CommentsListProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchComments = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/comments?itemId=${itemId}&itemType=${itemType}`)

        if (!response.ok) {
          throw new Error("Yorumlar yüklenirken bir hata oluştu")
        }

        const data = await response.json()
        setComments(data.comments)
      } catch (err) {
        console.error("Yorumları yükleme hatası:", err)
        setError("Yorumlar yüklenirken bir hata oluştu")
      } finally {
        setIsLoading(false)
      }
    }

    fetchComments()
  }, [itemId, itemType, refreshTrigger])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        <span className="ml-2 text-sm text-gray-500">Yorumlar yükleniyor...</span>
      </div>
    )
  }

  if (error) {
    return <p className="text-sm text-red-500 py-2">{error}</p>
  }

  if (comments.length === 0) {
    return <p className="text-sm text-gray-500 py-2">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
  }

  return (
    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
      {comments.map((comment, index) => (
        <div key={comment.id}>
          {index > 0 && <Separator className="my-3" />}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="bg-gray-100 rounded-full p-1">
                <User className="h-4 w-4 text-gray-500" />
              </div>
              <span className="font-medium text-sm">{comment.username}</span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: tr })}
              </span>
            </div>
            <p className="text-sm text-gray-700 pl-7">{comment.content}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
