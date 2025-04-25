"use client"

import { Button } from "@/components/ui/button"

interface Category {
  id: string
  label: string
}

interface GalleryFilterProps {
  categories: Category[]
  selectedCategory: string
  onSelectCategory: (category: string) => void
}

export function GalleryFilter({ categories, selectedCategory, onSelectCategory }: GalleryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectCategory(category.id)}
          className={
            selectedCategory === category.id
              ? "bg-rose-500 hover:bg-rose-600 text-white"
              : "text-gray-700 hover:text-rose-500"
          }
        >
          {category.label}
        </Button>
      ))}
    </div>
  )
}
