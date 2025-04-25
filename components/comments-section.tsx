"use client"

import { useState } from "react"
import { CommentForm } from "@/components/comment-form"
import { CommentsList } from "@/components/comments-list"
import { MessageSquare } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"

interface CommentsSectionProps {
  itemId: string
  itemType: "photo" | "audio"
  commentCount?: number
}

export function CommentsSection({ itemId, itemType, commentCount = 0 }: CommentsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [showForm, setShowForm] = useState(false)

  const handleCommentAdded = () => {
    // Yorumlar listesini yenile
    setRefreshTrigger((prev) => prev + 1)
    // Yorum formunu gizle
    setShowForm(false)
  }

  return (
    <div className="mt-4 pt-3 border-t">
      <Button
        variant="ghost"
        size="sm"
        className="mb-3 text-gray-600 hover:text-gray-900 flex items-center gap-1 p-0"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <MessageSquare className="h-4 w-4" />
        <span>{isExpanded ? "Yorumları Gizle" : `Yorumlar (${commentCount})`}</span>
      </Button>

      {isExpanded && (
        <div className="space-y-4">
          <CommentsList itemId={itemId} itemType={itemType} refreshTrigger={refreshTrigger} />

          {!showForm ? (
            <Button variant="outline" size="sm" className="w-full" onClick={() => setShowForm(true)}>
              Yorum Ekle
            </Button>
          ) : (
            <>
              <Separator />
              <CommentForm itemId={itemId} itemType={itemType} onCommentAdded={handleCommentAdded} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
