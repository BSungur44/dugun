"use client"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

// Define filter types with their CSS properties
export const photoFilters = {
  normal: { name: "Normal", style: "" },
  clarendon: { name: "Clarendon", style: "brightness(1.1) contrast(1.2) saturate(1.35)" },
  gingham: { name: "Gingham", style: "brightness(1.05) sepia(0.11) contrast(0.9)" },
  moon: { name: "Moon", style: "grayscale(1) brightness(1.1) contrast(1.1)" },
  lark: { name: "Lark", style: "brightness(1.1) contrast(0.85) saturate(0.75) sepia(0.1)" },
  reyes: { name: "Reyes", style: "brightness(0.9) contrast(0.8) saturate(0.75) sepia(0.22)" },
  juno: { name: "Juno", style: "brightness(1.1) contrast(1.1) saturate(1.4)" },
  slumber: { name: "Slumber", style: "brightness(0.9) saturate(0.85) sepia(0.2)" },
  crema: { name: "Crema", style: "brightness(1.05) contrast(0.9) saturate(0.7) sepia(0.1)" },
  ludwig: { name: "Ludwig", style: "brightness(1.05) contrast(1.05) saturate(0.8) sepia(0.08)" },
  aden: { name: "Aden", style: "brightness(1.1) contrast(0.9) saturate(0.85) hue-rotate(20deg)" },
  perpetua: { name: "Perpetua", style: "brightness(1.05) contrast(1.1) saturate(1.1)" },
  amaro: { name: "Amaro", style: "brightness(1.1) contrast(0.9) saturate(1.5) hue-rotate(-10deg)" },
  mayfair: { name: "Mayfair", style: "brightness(1.05) contrast(1.1) saturate(1.1) sepia(0.05)" },
  rise: { name: "Rise", style: "brightness(1.05) contrast(0.9) saturate(0.9) sepia(0.2)" },
  hudson: { name: "Hudson", style: "brightness(1.1) contrast(1.2) saturate(1.1) sepia(0.15) hue-rotate(-10deg)" },
  valencia: { name: "Valencia", style: "brightness(1.1) contrast(1.1) saturate(1.25) sepia(0.1)" },
  xpro2: { name: "X-Pro II", style: "brightness(1.1) contrast(1.2) saturate(1.3) sepia(0.3)" },
  sierra: { name: "Sierra", style: "brightness(0.9) contrast(0.9) saturate(0.8) sepia(0.1)" },
  willow: { name: "Willow", style: "brightness(1.1) contrast(0.95) saturate(0.5) sepia(0.3)" },
}

export type FilterType = keyof typeof photoFilters

interface PhotoFiltersProps {
  imageUrl: string
  selectedFilter: FilterType
  onSelectFilter: (filter: FilterType) => void
}

export function PhotoFilters({ imageUrl, selectedFilter, onSelectFilter }: PhotoFiltersProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm">Filtre Seçin</h3>

      <ScrollArea className="w-full whitespace-nowrap pb-4">
        <div className="flex gap-4">
          {Object.entries(photoFilters).map(([filterId, filter]) => (
            <div
              key={filterId}
              className={cn(
                "flex flex-col items-center cursor-pointer transition-all",
                selectedFilter === filterId ? "scale-110" : "hover:scale-105",
              )}
              onClick={() => onSelectFilter(filterId as FilterType)}
            >
              <div
                className={cn(
                  "w-20 h-20 rounded-md overflow-hidden border-2 transition-all",
                  selectedFilter === filterId ? "border-rose-500" : "border-transparent",
                )}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={imageUrl || "/placeholder.svg"}
                    alt={`${filter.name} filter preview`}
                    fill
                    className="object-cover"
                    style={{ filter: filter.style }}
                    sizes="80px"
                  />
                </div>
              </div>
              <span className="text-xs mt-1 text-center">{filter.name}</span>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
