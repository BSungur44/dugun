"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PhotoGallery } from "@/components/photo-gallery"
import { AudioGallery } from "@/components/audio-gallery"
import { Heart, ShieldCheck } from "lucide-react"
import type { FilterType } from "@/components/photo-filters"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Types for our gallery items
export type GalleryItem = {
  id: string
  type: "image" | "audio"
  content: string
  uploaderName: string
  uploadDate: Date
  description?: string
  filter?: FilterType
  likes?: number
}

interface WeddingGalleryProps {
  items: GalleryItem[]
  onLike?: (id: string, type: "image" | "audio") => void
  onDelete?: (id: string) => void
}

export function WeddingGallery({ items, onLike, onDelete }: WeddingGalleryProps) {
  // State for admin mode
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAdminLogin, setShowAdminLogin] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [adminError, setAdminError] = useState("")
  const [currentUserName, setCurrentUserName] = useState<string>("")

  // Admin password check - in a real app, this would be server-side
  const ADMIN_PASSWORD = "dugun2023" // This would be stored securely in a real app

  // Function to handle admin login
  const handleAdminLogin = () => {
    if (adminPassword === ADMIN_PASSWORD) {
      setIsAdmin(true)
      setShowAdminLogin(false)
      setAdminPassword("")
      setAdminError("")

      // Only access localStorage in the browser
      if (typeof window !== "undefined") {
        localStorage.setItem("isAdmin", "true") // Store admin status
      }
    } else {
      setAdminError("Hatalı şifre!")
    }
  }

  // Function to handle admin logout
  const handleAdminLogout = () => {
    setIsAdmin(false)

    // Only access localStorage in the browser
    if (typeof window !== "undefined") {
      localStorage.removeItem("isAdmin")
    }
  }

  // Check if user is admin on component mount
  useEffect(() => {
    // Only access localStorage in the browser
    if (typeof window !== "undefined") {
      const storedAdminStatus = localStorage.getItem("isAdmin")
      if (storedAdminStatus === "true") {
        setIsAdmin(true)
      }

      const storedName = localStorage.getItem("uploaderName")
      if (storedName) {
        setCurrentUserName(storedName)
      }
    }
  }, [])

  // Filter items by type
  const photoItems = items.filter((item) => item.type === "image")
  const audioItems = items.filter((item) => item.type === "audio")

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <header className="container mx-auto py-8 px-4 text-center">
        <div className="inline-flex items-center gap-2 mb-2">
          <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Düğün Anı Galerisi</h1>
          <Heart className="h-6 w-6 text-rose-500 fill-rose-500" />
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto mb-6">
          Sevgili Bahattin & Naciye'nin mutlu günlerini ölümsüzleştirmek için fotoğraf ve sesli mesajlarınızı paylaşın.
          Herkes kendi anılarını yükleyebilir!
        </p>

        <div className="flex justify-end mb-4">
          {isAdmin ? (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 text-rose-500 border-rose-200"
              onClick={handleAdminLogout}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Yönetici Modundan Çık</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={() => setShowAdminLogin(true)}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Yönetici Girişi</span>
            </Button>
          )}
        </div>
      </header>

      <main className="container mx-auto px-4 pb-16">
        <Tabs defaultValue="photos" className="w-full max-w-4xl mx-auto">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="photos">Fotoğraflar ({photoItems.length})</TabsTrigger>
            <TabsTrigger value="audio">Sesli Mesajlar ({audioItems.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="photos">
            <PhotoGallery
              items={photoItems}
              onDelete={onDelete}
              onLike={(id) => onLike && onLike(id, "image")}
              isAdmin={isAdmin}
              currentUserName={currentUserName}
            />
          </TabsContent>
          <TabsContent value="audio">
            <AudioGallery
              items={audioItems}
              onDelete={onDelete}
              onLike={(id) => onLike && onLike(id, "audio")}
              isAdmin={isAdmin}
              currentUserName={currentUserName}
            />
          </TabsContent>
        </Tabs>
      </main>

      <footer className="bg-gray-50 py-6 border-t border-gray-200">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          <p>© 2023 Bahattin & Naciye Düğün Anı Galerisi</p>
          <p className="mt-2">Tüm misafirlerimize katkıları için teşekkür ederiz.</p>
        </div>
      </footer>

      {/* Admin Login Dialog */}
      <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yönetici Girişi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="admin-password">Yönetici Şifresi</Label>
              <Input
                id="admin-password"
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Şifre girin"
              />
              {adminError && <p className="text-sm text-red-500">{adminError}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdminLogin(false)}>
              İptal
            </Button>
            <Button onClick={handleAdminLogin}>Giriş Yap</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
