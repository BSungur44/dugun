"use client"

import type React from "react"

import { useEffect, useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Heart, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface GalleryItem {
  id: number
  src: string
  alt: string
  category: string
  title: string
  description: string
}

interface ImageModalProps {
  image: GalleryItem
  onClose: () => void
  galleryItems: GalleryItem[]
  setSelectedImage: (image: GalleryItem) => void
}

export function ImageModal({ image, onClose, galleryItems, setSelectedImage }: ImageModalProps) {
  const [liked, setLiked] = useState(false)

  // Find current image index
  const currentIndex = galleryItems.findIndex((item) => item.id === image.id)

  // Navigate to previous image
  const goToPrevious = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentIndex > 0) {
      setSelectedImage(galleryItems[currentIndex - 1])
    }
  }

  // Navigate to next image
  const goToNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentIndex < galleryItems.length - 1) {
      setSelectedImage(galleryItems[currentIndex + 1])
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        setSelectedImage(galleryItems[currentIndex - 1])
      }
      if (e.key === "ArrowRight" && currentIndex < galleryItems.length - 1) {
        setSelectedImage(galleryItems[currentIndex + 1])
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentIndex, galleryItems, onClose, setSelectedImage])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <div className="relative w-full max-w-5xl max-h-[90vh] p-4" onClick={(e) => e.stopPropagation()}>
        <button
          className="absolute top-2 right-2 z-10 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          onClick={onClose}
        >
          <X className="h-6 w-6" />
        </button>

        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg">
          <Image
            src={image.src || "/placeholder.svg"}
            alt={image.alt}
            fill
            className="object-contain"
            sizes="(max-width: 1280px) 100vw, 1280px"
          />
        </div>

        <div className="mt-4 flex justify-between items-center text-white">
          <div>
            <h2 className="text-xl font-medium">{image.title}</h2>
            <p className="text-gray-300">{image.description}</p>
          </div>

          <button
            className={cn(
              "p-2 rounded-full transition-colors",
              liked ? "bg-rose-500 text-white" : "bg-white/10 hover:bg-white/20",
            )}
            onClick={() => setLiked(!liked)}
            aria-label={liked ? "Unlike photo" : "Like photo"}
          >
            <Heart className={cn("h-5 w-5", liked && "fill-white")} />
          </button>
        </div>

        {/* Navigation buttons */}
        {currentIndex > 0 && (
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            onClick={goToPrevious}
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
        )}

        {currentIndex < galleryItems.length - 1 && (
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
            onClick={goToNext}
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        )}

        {/* Image counter */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/50 text-white text-sm">
          {currentIndex + 1} / {galleryItems.length}
        </div>
      </div>
    </div>
  )
}
