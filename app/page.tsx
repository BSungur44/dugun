"use client"

import { useState, useEffect } from "react"
import { UploadForm } from "@/components/upload-form"
import { type GalleryItem, WeddingGallery } from "@/components/wedding-gallery"
import { getSupabaseClient } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export default function HomePage() {
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Veritabanından galeri öğelerini yükle
  useEffect(() => {
    const fetchGalleryItems = async () => {
      try {
        setIsLoading(true)
        const supabase = getSupabaseClient()

        const { data, error } = await supabase
          .from("gallery_items")
          .select("*")
          .order("upload_date", { ascending: false })

        if (error) {
          console.error("Veri yükleme hatası:", error)
          setError("Galeri öğeleri yüklenirken bir hata oluştu.")
          return
        }

        // Veritabanından gelen tarih değerlerini daha güvenli bir şekilde işleyelim
        const items: GalleryItem[] = data.map((item) => {
          let uploadDate: Date

          try {
            uploadDate = new Date(item.upload_date)

            // Geçerli bir tarih değilse varsayılan tarih kullan
            if (isNaN(uploadDate.getTime())) {
              console.warn(`Geçersiz tarih değeri: ${item.upload_date}, varsayılan tarih kullanılıyor.`)
              uploadDate = new Date() // Şu anki tarihi kullan
            }
          } catch (error) {
            console.error(`Tarih dönüştürme hatası: ${error}`)
            uploadDate = new Date() // Hata durumunda şu anki tarihi kullan
          }

          return {
            id: item.id,
            type: item.type as "image" | "audio",
            content: item.content,
            uploaderName: item.uploader_name,
            uploadDate: uploadDate,
            description: item.description || undefined,
            filter: item.filter || undefined,
            likes: item.likes || 0,
          }
        })

        setGalleryItems(items)
      } catch (err) {
        console.error("Veri yükleme hatası:", err)
        setError("Galeri öğeleri yüklenirken bir hata oluştu.")
      } finally {
        setIsLoading(false)
      }
    }

    fetchGalleryItems()
  }, [])

  // Yeni öğe yükleme işlemi
  const handleUpload = async (formData: FormData) => {
    try {
      setIsUploading(true)
      setError(null)

      // API'ye gönder
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Yükleme sırasında bir hata oluştu")
      }

      // Başarılı yanıt - yeni öğeyi listeye ekle
      setGalleryItems((prev) => [result.item, ...prev])

      toast({
        title: "Başarılı!",
        description: "İçeriğiniz başarıyla yüklendi.",
      })

      return result.item
    } catch (err: any) {
      console.error("Yükleme hatası:", err)
      setError(`Yükleme hatası: ${err.message}`)
      toast({
        title: "Hata!",
        description: err.message,
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  // Beğeni işlemi - veritabanı şemasına göre güncellendi
  const handleLike = async (id: string, type: "image" | "audio") => {
    try {
      // Tarayıcı tanımlayıcısı oluştur
      let browserId: string

      if (typeof window !== "undefined") {
        browserId = localStorage.getItem("browserId") || `browser_${Math.random().toString(36).substring(2, 15)}`
        localStorage.setItem("browserId", browserId)
      } else {
        // Server-side için fallback (normalde çalışmaz)
        browserId = `browser_${Math.random().toString(36).substring(2, 15)}`
      }

      const supabase = getSupabaseClient()

      // Önce bu tarayıcının bu öğeyi beğenip beğenmediğini kontrol et
      const { data: existingLike, error: checkError } = await supabase
        .from("likes")
        .select("id")
        .eq("item_id", id)
        .eq("browser_id", browserId)
        .maybeSingle()

      if (checkError) {
        console.error("Beğeni kontrolü hatası:", checkError)
        throw checkError
      }

      if (existingLike) {
        // Beğeni zaten var, kaldır
        const { error: deleteError } = await supabase.from("likes").delete().eq("id", existingLike.id)

        if (deleteError) throw deleteError

        // Beğeni sayısını güncelle
        setGalleryItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, likes: Math.max(0, (item.likes || 0) - 1) } : item)),
        )

        // Gallery_items tablosundaki likes sayısını da güncelle
        await supabase.rpc("decrement_likes", { item_id: id })
      } else {
        // Yeni beğeni ekle
        const { error: insertError } = await supabase.from("likes").insert({
          item_id: id,
          browser_id: browserId,
          created_at: new Date().toISOString(),
        })

        if (insertError) throw insertError

        // Beğeni sayısını güncelle
        setGalleryItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, likes: (item.likes || 0) + 1 } : item)),
        )

        // Gallery_items tablosundaki likes sayısını da güncelle
        await supabase.rpc("increment_likes", { item_id: id })
      }
    } catch (err) {
      console.error("Beğeni hatası:", err)
    }
  }

  // Silme işlemi
  const handleDelete = async (id: string) => {
    try {
      const supabase = getSupabaseClient()

      // Önce öğeyi veritabanından al
      const { data: item, error: fetchError } = await supabase.from("gallery_items").select("*").eq("id", id).single()

      if (fetchError) throw fetchError

      // Storage'dan dosyayı sil
      if (item && item.content) {
        try {
          // URL'den dosya adını çıkar
          const url = new URL(item.content)
          const pathParts = url.pathname.split("/")
          const fileName = pathParts[pathParts.length - 1]

          // Dosyayı sil
          const { error: storageError } = await supabase.storage.from("fotolar").remove([fileName])

          if (storageError) {
            console.error("Storage silme hatası:", storageError)
          }
        } catch (storageErr) {
          console.error("Dosya silme hatası:", storageErr)
        }
      }

      // Öğeyi veritabanından sil
      const { error } = await supabase.from("gallery_items").delete().eq("id", id)

      if (error) throw error

      // Başarılı silme - öğeyi listeden kaldır
      setGalleryItems((prev) => prev.filter((item) => item.id !== id))

      toast({
        title: "Başarılı!",
        description: "İçerik başarıyla silindi.",
      })
    } catch (err) {
      console.error("Silme hatası:", err)
      setError("Öğe silinirken bir hata oluştu.")
      toast({
        title: "Hata!",
        description: "İçerik silinirken bir hata oluştu.",
        variant: "destructive",
      })
    }
  }

  return (
    <main className="py-10 px-4 max-w-5xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-center">Düğün Galerisi</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Hata: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <UploadForm onUpload={handleUpload} isUploading={isUploading} />

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
          <span className="ml-2 text-gray-600">Galeri yükleniyor...</span>
        </div>
      ) : (
        <WeddingGallery items={galleryItems} onLike={handleLike} onDelete={handleDelete} />
      )}
    </main>
  )
}
