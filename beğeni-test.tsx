"use client"

import { useState, useEffect } from "react"
import { createClient } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Heart, Loader2 } from "lucide-react"

// Supabase istemcisi
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(supabaseUrl, supabaseAnonKey)
}

interface GalleryItem {
  id: string
  type: "image" | "audio"
  content: string
  uploaderName: string
  description?: string
  likes: number
}

export default function BeğeniTest() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [likedItems, setLikedItems] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Galeri öğelerini yükle
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setIsLoading(true)
        const supabase = getSupabaseClient()

        const { data, error } = await supabase
          .from("gallery_items")
          .select("*")
          .order("upload_date", { ascending: false })

        if (error) throw error

        setItems(
          data.map((item) => ({
            id: item.id,
            type: item.type,
            content: item.content,
            uploaderName: item.uploader_name,
            description: item.description,
            likes: item.likes || 0,
          })),
        )

        // Kullanıcının beğendiği öğeleri yükle
        if (typeof window !== "undefined") {
          const browserId =
            localStorage.getItem("browserId") || `browser_${Math.random().toString(36).substring(2, 15)}`
          localStorage.setItem("browserId", browserId)

          const { data: likedData } = await supabase.from("likes").select("item_id").eq("browser_id", browserId)

          if (likedData) {
            setLikedItems(likedData.map((like) => like.item_id))
          }
        }
      } catch (err) {
        console.error("Veri yükleme hatası:", err)
        setError("Galeri öğeleri yüklenirken bir hata oluştu.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchItems()
  }, [])

  // Beğeni işlemi
  const handleLike = async (id: string, type: "image" | "audio") => {
    try {
      setIsProcessing(id)
      setError(null)

      // Tarayıcı tanımlayıcısı
      let browserId: string
      if (typeof window !== "undefined") {
        browserId = localStorage.getItem("browserId") || `browser_${Math.random().toString(36).substring(2, 15)}`
        localStorage.setItem("browserId", browserId)
      } else {
        browserId = `browser_${Math.random().toString(36).substring(2, 15)}`
      }

      const supabase = getSupabaseClient()

      // Beğeni durumunu kontrol et
      const isLiked = likedItems.includes(id)

      if (isLiked) {
        // Beğeniyi kaldır
        const { error } = await supabase.from("likes").delete().eq("item_id", id).eq("browser_id", browserId)

        if (error) throw error

        // Beğeni sayısını azalt
        await supabase.rpc("decrement_likes", { item_id: id })

        // State'i güncelle
        setLikedItems((prev) => prev.filter((itemId) => itemId !== id))
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, likes: Math.max(0, item.likes - 1) } : item)),
        )
      } else {
        // Beğeni ekle
        const { error } = await supabase.from("likes").insert({
          item_id: id,
          browser_id: browserId,
          created_at: new Date().toISOString(),
        })

        if (error) throw error

        // Beğeni sayısını artır
        await supabase.rpc("increment_likes", { item_id: id })

        // State'i güncelle
        setLikedItems((prev) => [...prev, id])
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, likes: item.likes + 1 } : item)))
      }
    } catch (err: any) {
      console.error("Beğeni hatası:", err)
      setError(`Beğeni işlemi sırasında bir hata oluştu: ${err.message}`)
    } finally {
      setIsProcessing(null)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
        <span className="ml-2">Yükleniyor...</span>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Beğeni Sistemi Test</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6" role="alert">
          <strong className="font-bold">Hata: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardHeader>
              <CardTitle className="text-lg">{item.uploaderName} tarafından yüklendi</CardTitle>
            </CardHeader>
            <CardContent>
              {item.type === "image" ? (
                <div className="aspect-square relative rounded-md overflow-hidden bg-gray-100">
                  <img
                    src={item.content || "/placeholder.svg"}
                    alt={item.description || "Fotoğraf"}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <div className="bg-gray-100 p-4 rounded-md">
                  <audio src={item.content} controls className="w-full" />
                </div>
              )}
              {item.description && <p className="mt-2 text-gray-600">{item.description}</p>}
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="flex items-center gap-2">
                <Heart
                  className={`h-5 w-5 ${likedItems.includes(item.id) ? "fill-rose-500 text-rose-500" : "text-gray-500"}`}
                />
                <span>{item.likes} beğeni</span>
              </div>
              <Button
                variant={likedItems.includes(item.id) ? "destructive" : "default"}
                size="sm"
                onClick={() => handleLike(item.id, item.type)}
                disabled={isProcessing === item.id}
                className="flex items-center gap-2"
              >
                {isProcessing === item.id ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>İşleniyor...</span>
                  </>
                ) : likedItems.includes(item.id) ? (
                  <>
                    <Heart className="h-4 w-4" />
                    <span>Beğeniyi Kaldır</span>
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4" />
                    <span>Beğen</span>
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
