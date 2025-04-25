"use client"

import type React from "react"

import Image from "next/image"
import { Heart } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

interface GalleryItem {
  id: number
  src: string
  alt: string
  category: string
  title: string
  description: string
}

interface GalleryProps {
  items: GalleryItem[]
  onSelectImage: (image: GalleryItem) => void
}

export function Gallery({ items, onSelectImage }: GalleryProps) {
  const [likedItems, setLikedItems] = useState<number[]>([])

  const toggleLike = (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setLikedItems((prev) => (prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]))
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div
          key={item.id}
          className="group relative overflow-hidden rounded-lg shadow-md transition-all duration-300 hover:shadow-xl cursor-pointer"
          onClick={() => onSelectImage(item)}
        >
          <div className="aspect-square relative overflow-hidden">
            <Image
              src={item.src || "/placeholder.svg"}
              alt={item.alt}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity duration-300" />

            <button
              className={cn(
                "absolute top-2 right-2 p-2 rounded-full transition-all duration-300",
                likedItems.includes(item.id)
                  ? "bg-rose-500 text-white"
                  : "bg-white/80 text-gray-600 opacity-0 group-hover:opacity-100",
              )}
              onClick={(e) => toggleLike(item.id, e)}
              aria-label={likedItems.includes(item.id) ? "Unlike photo" : "Like photo"}
            >
              <Heart className={cn("h-4 w-4", likedItems.includes(item.id) && "fill-white")} />
            </button>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <h3 className="font-medium text-sm">{item.title}</h3>
            <p className="text-xs text-gray-200">{item.description}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
