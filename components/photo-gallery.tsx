"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Heart, Calendar, User, Filter, Trash2, AlertTriangle, MessageSquare } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { GalleryItem } from "@/components/wedding-gallery"
import { photoFilters } from "@/components/photo-filters"
import { Button } from "@/components/ui/button"
import { CommentsSection } from "@/components/comments-section"
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
import { getSupabaseClient } from "@/lib/supabase"

interface PhotoGalleryProps {
  items: GalleryItem[]
  onDelete?: (id: string) => void
  onLike?: (id: string) => void
  isAdmin: boolean
  currentUserName: string
}

export function PhotoGallery({ items, onDelete, onLike, isAdmin, currentUserName }: PhotoGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null)
  const [likedItems, setLikedItems] = useState<string[]>([])
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null)
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})

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

        // Her fotoğraf için ayrı ayrı yorum sayısını al
        const counts: Record<string, number> = {}

        // Tüm fotoğraflar için tek sorguda yorum sayılarını al
        const { data, error } = await supabase
          .from("comments")
          .select("photo_id, id")
          .in("photo_id", itemIds)
          .is("audio_id", null)

        if (error) {
          console.error("Yorum sayılarını getirme hatası:", error)
          return
        }

        // Yorum sayılarını hesapla
        if (data) {
          data.forEach((comment) => {
            if (comment.photo_id) {
              counts[comment.photo_id] = (counts[comment.photo_id] || 0) + 1
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

  // Beğeni işlemi
  const toggleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()

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

  // Get filter style for an item
  const getFilterStyle = (item: GalleryItem) => {
    if (item.filter && photoFilters[item.filter]) {
      return photoFilters[item.filter].style
    }
    return ""
  }

  // Check if user can delete this item
  const canDelete = (item: GalleryItem) => {
    // Admin her zaman silebilir
    if (isAdmin) return true

    // Kullanıcı kendi yüklediği öğeyi silebilir
    return currentUserName && item.uploaderName === currentUserName
  }

  // Handle delete button click
  const handleDeleteClick = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeleteConfirmation(id)
  }

  // Confirm deletion
  const confirmDelete = () => {
    if (deleteConfirmation && onDelete) {
      onDelete(deleteConfirmation)
      setDeleteConfirmation(null)
      // If the deleted item is currently selected, close the modal
      if (selectedImage && selectedImage.id === deleteConfirmation) {
        setSelectedImage(null)
      }
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>Henüz fotoğraf yüklenmemiş. İlk fotoğrafı yükleyen siz olun!</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {items.map((item) => (
          <div
            key={item.id}
            className="group relative overflow-hidden rounded-lg shadow-md transition-all duration-300 hover:shadow-xl cursor-pointer"
            onClick={() => setSelectedImage(item)}
          >
            <div className="aspect-square relative overflow-hidden">
              <Image
                src={item.content || "/placeholder.svg"}
                alt={item.description || "Düğün fotoğrafı"}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                style={{ filter: getFilterStyle(item) }}
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
              <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-300" />

              {item.filter && item.filter !== "normal" && (
                <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Filter className="h-3 w-3" />
                  {photoFilters[item.filter].name}
                </div>
              )}

              <div className="absolute top-2 right-2 flex items-center gap-2">
                <button
                  className={cn(
                    "p-2 rounded-full transition-all duration-300 flex items-center gap-1",
                    likedItems.includes(item.id)
                      ? "bg-rose-500 text-white"
                      : "bg-white/80 text-gray-600 opacity-0 group-hover:opacity-100",
                  )}
                  onClick={(e) => toggleLike(item.id, e)}
                  aria-label={likedItems.includes(item.id) ? "Beğeniyi kaldır" : "Beğen"}
                >
                  <Heart className={cn("h-4 w-4", likedItems.includes(item.id) && "fill-white")} />
                  <span className="text-xs font-medium">{item.likes || 0}</span>
                </button>

                {canDelete(item) && (
                  <button
                    className="p-2 rounded-full bg-white/80 text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-300"
                    onClick={(e) => handleDeleteClick(item.id, e)}
                    aria-label="Fotoğrafı sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              {item.description && <p className="text-sm font-medium mb-1">{item.description}</p>}
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center text-xs gap-1">
                    <User className="h-3 w-3" />
                    <span>{item.uploaderName}</span>
                  </div>
                  <div className="flex items-center text-xs gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(item.uploadDate)}</span>
                  </div>
                </div>
                {commentCounts[item.id] > 0 && (
                  <div className="flex items-center gap-1 bg-white/20 rounded-full px-2 py-1">
                    <MessageSquare className="h-3 w-3" />
                    <span className="text-xs">{commentCounts[item.id]}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl w-[90vw]">
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                <Image
                  src={selectedImage.content || "/placeholder.svg"}
                  alt={selectedImage.description || "Düğün fotoğrafı"}
                  fill
                  className="object-contain"
                  style={{ filter: getFilterStyle(selectedImage) }}
                  sizes="(max-width: 1280px) 100vw, 1280px"
                />
              </div>

              <div className="space-y-2">
                {selectedImage.description && <p className="text-lg font-medium">{selectedImage.description}</p>}

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span>{selectedImage.uploaderName}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(selectedImage.uploadDate)}</span>
                  </div>
                  {selectedImage.filter && selectedImage.filter !== "normal" && (
                    <div className="flex items-center gap-1">
                      <Filter className="h-4 w-4" />
                      <span>{photoFilters[selectedImage.filter].name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Heart
                      className={cn("h-4 w-4", likedItems.includes(selectedImage.id) && "fill-rose-500 text-rose-500")}
                    />
                    <span>{selectedImage.likes || 0} beğeni</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between mt-2">
                <button
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-md transition-colors",
                    likedItems.includes(selectedImage.id)
                      ? "bg-rose-100 text-rose-500"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200",
                  )}
                  onClick={() => toggleLike(selectedImage.id, new MouseEvent("click") as any)}
                >
                  <Heart className={cn("h-5 w-5", likedItems.includes(selectedImage.id) && "fill-rose-500")} />
                  <span>{likedItems.includes(selectedImage.id) ? "Beğenildi" : "Beğen"}</span>
                </button>

                {canDelete(selectedImage) && (
                  <Button
                    variant="destructive"
                    size="sm"
                    className="flex items-center gap-1"
                    onClick={() => handleDeleteClick(selectedImage.id, new MouseEvent("click") as any)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Sil</span>
                  </Button>
                )}
              </div>

              {/* Yorumlar Bölümü */}
              <CommentsSection
                itemId={selectedImage.id}
                itemType="photo"
                commentCount={commentCounts[selectedImage.id] || 0}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmation} onOpenChange={(open) => !open && setDeleteConfirmation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Fotoğrafı Sil
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bu fotoğrafı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
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
