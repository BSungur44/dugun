"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, User, Calendar, Heart, Trash2, AlertTriangle, MessageSquare } from "lucide-react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import type { GalleryItem } from "@/components/wedding-gallery"
import { CommentsSection } from "@/components/comments-section"
import { getSupabaseClient } from "@/lib/supabase"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface AudioGalleryProps {
  items: GalleryItem[]
  onDelete?: (id: string) => void
  onLike?: (id: string) => void
  isAdmin: boolean
  currentUserName: string
}

export function AudioGallery({ items, onDelete, onLike, isAdmin, currentUserName }: AudioGalleryProps) {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [likedItems, setLikedItems] = useState<string[]>([])
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [duration, setDuration] = useState<Record<string, number>>({})
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null)
  const [expandedItem, setExpandedItem] = useState<string | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})

  const audioRefs = useRef<Record<string, HTMLAudioElement | null>>({})

  // Kullanıcının beğendiği öğeleri localStorage'dan yükle
  useEffect(() => {
    // Only access localStorage in the browser
    if (typeof window !== "undefined") {
      const storedLikes = localStorage.getItem("likedItems")
      if (storedLikes) {
        setLikedItems(JSON.parse(storedLikes))
      }
    }
  }, [])

  // Yorum sayılarını yükle
  useEffect(() => {
    const fetchCommentCounts = async () => {
      if (items.length === 0) return

      try {
        const supabase = getSupabaseClient()
        const itemIds = items.map((item) => item.id)

        // Her ses dosyası için ayrı ayrı yorum sayısını al
        const counts: Record<string, number> = {}

        // Tüm ses dosyaları için tek sorguda yorum sayılarını al
        const { data, error } = await supabase
          .from("comments")
          .select("audio_id, id")
          .in("audio_id", itemIds)
          .is("photo_id", null)

        if (error) {
          console.error("Yorum sayılarını getirme hatası:", error)
          return
        }

        // Yorum sayılarını hesapla
        if (data) {
          data.forEach((comment) => {
            if (comment.audio_id) {
              counts[comment.audio_id] = (counts[comment.audio_id] || 0) + 1
            }
          })
        }

        setCommentCounts(counts)
      } catch (err) {
        console.error("Yorum sayılarını getirme hatası:", err)
      }
    }

    fetchCommentCounts()
  }, [items])

  const togglePlay = (id: string) => {
    const audioElement = audioRefs.current[id]

    if (!audioElement) return

    if (currentlyPlaying === id) {
      if (audioElement.paused) {
        audioElement.play()
      } else {
        audioElement.pause()
      }
    } else {
      // Pause currently playing audio if any
      if (currentlyPlaying && audioRefs.current[currentlyPlaying]) {
        audioRefs.current[currentlyPlaying]?.pause()
      }

      // Play the new audio
      setCurrentlyPlaying(id)
      audioElement.play()
    }
  }

  const toggleLike = (id: string) => {
    // Beğeni durumunu güncelle
    const newLikedItems = likedItems.includes(id) ? likedItems.filter((itemId) => itemId !== id) : [...likedItems, id]

    setLikedItems(newLikedItems)

    // localStorage'a kaydet
    if (typeof window !== "undefined") {
      localStorage.setItem("likedItems", JSON.stringify(newLikedItems))
    }

    // Backend'e bildir
    if (onLike) {
      onLike(id)
    }
  }

  const handleTimeUpdate = (id: string) => {
    const audioElement = audioRefs.current[id]
    if (audioElement) {
      setProgress((prev) => ({
        ...prev,
        [id]: audioElement.currentTime,
      }))
    }
  }

  const handleLoadedMetadata = (id: string) => {
    const audioElement = audioRefs.current[id]
    if (audioElement) {
      setDuration((prev) => ({
        ...prev,
        [id]: audioElement.duration,
      }))
    }
  }

  const handleEnded = (id: string) => {
    if (currentlyPlaying === id) {
      setCurrentlyPlaying(null)
    }
  }

  const handleSliderChange = (id: string, value: number[]) => {
    const audioElement = audioRefs.current[id]
    if (audioElement) {
      audioElement.currentTime = value[0]
      setProgress((prev) => ({
        ...prev,
        [id]: value[0],
      }))
    }
  }

  // Check if user can delete this item
  const canDelete = (item: GalleryItem) => {
    // Admin her zaman silebilir
    if (isAdmin) return true

    // Kullanıcı kendi yüklediği öğeyi silebilir
    return currentUserName && item.uploaderName === currentUserName
  }

  // Handle delete button click
  const handleDeleteClick = (id: string) => {
    setDeleteConfirmation(id)
  }

  // Confirm deletion
  const confirmDelete = () => {
    if (deleteConfirmation && onDelete) {
      onDelete(deleteConfirmation)
      setDeleteConfirmation(null)
    }
  }

  // Format time in MM:SS
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  // Format date to a readable string
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Tarih bilgisi yok"

    try {
      const dateObj = date instanceof Date ? date : new Date(date)

      // Geçerli bir tarih mi kontrol et
      if (isNaN(dateObj.getTime())) {
        return "Geçersiz tarih"
      }

      return new Intl.DateTimeFormat("tr-TR", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(dateObj)
    } catch (error) {
      console.error("Tarih biçimlendirme hatası:", error)
      return "Tarih biçimlendirilemedi"
    }
  }

  // Yorumları göster/gizle
  const toggleComments = (id: string) => {
    setExpandedItem(expandedItem === id ? null : id)
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Henüz sesli mesaj yüklenmemiş. İlk sesli mesajı kaydeden siz olun!</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex flex-col space-y-2">
                {item.description && <p className="font-medium text-gray-800">{item.description}</p>}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 mb-2">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{item.uploaderName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(item.uploadDate)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="icon"
                    className={cn(
                      "h-10 w-10 rounded-full",
                      currentlyPlaying === item.id &&
                        !audioRefs.current[item.id]?.paused &&
                        "bg-rose-100 text-rose-500",
                    )}
                    onClick={() => togglePlay(item.id)}
                  >
                    {currentlyPlaying === item.id && !audioRefs.current[item.id]?.paused ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>

                  <div className="flex-1 flex items-center gap-2">
                    <Slider
                      value={[progress[item.id] || 0]}
                      max={duration[item.id] || 100}
                      step={0.1}
                      onValueChange={(value) => handleSliderChange(item.id, value)}
                      className="flex-1"
                    />
                    <div className="text-xs text-gray-500 w-16 text-right">
                      {formatTime(progress[item.id] || 0)} / {formatTime(duration[item.id] || 0)}
                    </div>
                  </div>

                  <audio
                    ref={(el) => (audioRefs.current[item.id] = el)}
                    src={item.content}
                    onTimeUpdate={() => handleTimeUpdate(item.id)}
                    onLoadedMetadata={() => handleLoadedMetadata(item.id)}
                    onEnded={() => handleEnded(item.id)}
                    className="hidden"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="px-4 py-2 border-t flex justify-between">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("gap-1", likedItems.includes(item.id) && "text-rose-500")}
                  onClick={() => toggleLike(item.id)}
                >
                  <Heart className={cn("h-4 w-4", likedItems.includes(item.id) && "fill-rose-500")} />
                  <span>Beğen ({item.likes || 0})</span>
                </Button>

                <Button variant="ghost" size="sm" className="gap-1" onClick={() => toggleComments(item.id)}>
                  <MessageSquare className="h-4 w-4" />
                  <span>Yorumlar ({commentCounts[item.id] || 0})</span>
                </Button>
              </div>

              {canDelete(item) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 flex items-center gap-1"
                  onClick={() => handleDeleteClick(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Sil</span>
                </Button>
              )}
            </CardFooter>

            {/* Yorumlar Bölümü */}
            {expandedItem === item.id && (
              <div className="px-4 pb-4">
                <CommentsSection itemId={item.id} itemType="audio" commentCount={commentCounts[item.id] || 0} />
              </div>
            )}
          </Card>
        ))}
      </div>

      <AlertDialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Sesli Mesajı Sil
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu sesli mesajı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
