"use client"

import { useState } from "react"
import { ImageIcon } from "lucide-react"
import { Gallery } from "@/components/gallery"
import { GalleryFilter } from "@/components/gallery-filter"
import { ImageModal } from "@/components/image-modal"

// Gallery categories
const categories = [
  { id: "all", label: "Tüm Fotoğraflar" },
  { id: "ceremony", label: "Tören" },
  { id: "reception", label: "Resepsiyon" },
  { id: "couple", label: "Çift" },
  { id: "family", label: "Aile" },
]

// Sample gallery items
const galleryItems = [
  {
    id: 1,
    src: "/placeholder.svg?height=600&width=800",
    alt: "Düğün töreni",
    category: "ceremony",
    title: "Düğün Töreni",
    description: "Nikah töreni anı",
  },
  {
    id: 2,
    src: "/placeholder.svg?height=600&width=800",
    alt: "Gelin ve damat",
    category: "couple",
    title: "Gelin ve Damat",
    description: "Özel çift fotoğrafı",
  },
  {
    id: 3,
    src: "/placeholder.svg?height=600&width=800",
    alt: "Aile fotoğrafı",
    category: "family",
    title: "Aile Fotoğrafı",
    description: "Tüm aile bir arada",
  },
  {
    id: 4,
    src: "/placeholder.svg?height=600&width=800",
    alt: "Resepsiyon",
    category: "reception",
    title: "Resepsiyon",
    description: "Düğün yemeği",
  },
  {
    id: 5,
    src: "/placeholder.svg?height=600&width=800",
    alt: "İlk dans",
    category: "reception",
    title: "İlk Dans",
    description: "Çiftin ilk dansı",
  },
  {
    id: 6,
    src: "/placeholder.svg?height=600&width=800",
    alt: "Gelin buketi",
    category: "ceremony",
    title: "Gelin Buketi",
    description: "Buket atma anı",
  },
  {
    id: 7,
    src: "/placeholder.svg?height=600&width=800",
    alt: "Damat ve sağdıçları",
    category: "family",
    title: "Damat ve Sağdıçları",
    description: "Damat ve arkadaşları",
  },
  {
    id: 8,
    src: "/placeholder.svg?height=600&width=800",
    alt: "Gelin ve nedimeler",
    category: "family",
    title: "Gelin ve Nedimeler",
    description: "Gelin ve arkadaşları",
  },
  {
    id: 9,
    src: "/placeholder.svg?height=600&width=800",
    alt: "Düğün pastası",
    category: "reception",
    title: "Düğün Pastası",
    description: "Pasta kesimi",
  },
  {
    id: 10,
    src: "/placeholder.svg?height=600&width=800",
    alt: "Romantik an",
    category: "couple",
    title: "Romantik An",
    description: "Gün batımında çift",
  },
  {
    id: 11,
    src: "/placeholder.svg?height=600&width=800",
    alt: "Düğün yüzükleri",
    category: "ceremony",
    title: "Düğün Yüzükleri",
    description: "Yüzük takma anı",
  },
  {
    id: 12,
    src: "/placeholder.svg?height=600&width=800",
    alt: "Konuklar",
    category: "reception",
    title: "Konuklar",
    description: "Eğlenen misafirler",
  },
]

export function GalleryPage() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedImage, setSelectedImage] = useState<(typeof galleryItems)[0] | null>(null)

  // Filter gallery items based on selected category
  const filteredItems =
    selectedCategory === "all" ? galleryItems : galleryItems.filter((item) => item.category === selectedCategory)

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <header className="container mx-auto py-8 px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Düğün Galerisi</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Ayşe & Mehmet'in unutulmaz düğün anılarını keşfedin. Bu özel günün en güzel karelerini sizlerle paylaşmaktan
            mutluluk duyuyoruz.
          </p>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex items-center gap-2 text-gray-600">
            <ImageIcon className="h-5 w-5" />
            <span>{filteredItems.length} fotoğraf</span>
          </div>

          <GalleryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
      </header>

      <main className="container mx-auto px-4 pb-16">
        <Gallery items={filteredItems} onSelectImage={setSelectedImage} />
      </main>

      {selectedImage && (
        <ImageModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          galleryItems={galleryItems}
          setSelectedImage={setSelectedImage}
        />
      )}
    </div>
  )
}
