"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ImageIcon, Mic, Upload, X, ArrowRight, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import Image from "next/image"
import type { GalleryItem } from "@/components/wedding-gallery"
import { PhotoFilters, photoFilters } from "@/components/photo-filters"
import type { FilterType } from "@/components/photo-filters"
import { toast } from "@/components/ui/use-toast"

interface UploadFormProps {
  onUpload: (item: Omit<GalleryItem, "id">) => void
  isUploading?: boolean
}

export function UploadForm({ onUpload, isUploading = false }: UploadFormProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [uploadType, setUploadType] = useState<"image" | "audio">("image")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [audioURL, setAudioURL] = useState<string | null>(null)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [uploadStep, setUploadStep] = useState<"info" | "filter" | "preview">("info")
  const [selectedFilter, setSelectedFilter] = useState<FilterType>("normal")
  const [skipFilter, setSkipFilter] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Kullanıcı adını localStorage'dan yükle
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("uploaderName")
      if (storedName) {
        setName(storedName)
      }
    }
  }, [])

  // Handle image selection
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Dosya boyutu kontrolü (10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Dosya boyutu çok büyük. Maksimum 10MB yükleyebilirsiniz.")
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        return
      }

      // Dosya türü kontrolü
      if (!file.type.startsWith("image/")) {
        setError("Lütfen geçerli bir resim dosyası seçin.")
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
        return
      }

      // Dosyayı sakla
      setSelectedFile(file)

      // Önizleme için URL oluştur
      const imageUrl = URL.createObjectURL(file)
      setSelectedImage(imageUrl)
      setError(null)
    }
  }

  // Start audio recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        setAudioBlob(audioBlob)
        const audioUrl = URL.createObjectURL(audioBlob)
        setAudioURL(audioUrl)

        // Stop all tracks to release the microphone
        stream.getTracks().forEach((track) => track.stop())
      }

      // Start recording
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      setError(null)

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error("Error accessing microphone:", err)
      setError("Mikrofona erişim sağlanamadı. Lütfen izinleri kontrol edin.")
    }
  }

  // Stop audio recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  // Format seconds to MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // Reset the form
  const resetForm = () => {
    setName("")
    setDescription("")
    setSelectedImage(null)
    setSelectedFile(null)
    setAudioURL(null)
    setAudioBlob(null)
    setError(null)
    setUploadStep("info")
    setSelectedFilter("normal")
    setSkipFilter(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name) {
      setError("Lütfen adınızı girin.")
      return
    }

    if (uploadType === "image" && !selectedFile) {
      setError("Lütfen bir fotoğraf seçin.")
      return
    }

    if (uploadType === "audio" && !audioBlob) {
      setError("Lütfen bir sesli mesaj kaydedin.")
      return
    }

    try {
      // Save uploader name to localStorage only in browser
      if (typeof window !== "undefined") {
        localStorage.setItem("uploaderName", name)
      }

      // FormData oluştur
      const formData = new FormData()

      // Dosya ekle
      if (uploadType === "image" && selectedFile) {
        formData.append("file", selectedFile)
      } else if (uploadType === "audio" && audioBlob) {
        const audioFile = new File([audioBlob], `audio-${Date.now()}.wav`, { type: "audio/wav" })
        formData.append("file", audioFile)
      } else {
        throw new Error("Dosya bulunamadı")
      }

      // Diğer bilgileri ekle
      formData.append("uploaderName", name)
      formData.append("type", uploadType)

      if (description) {
        formData.append("description", description)
      }

      if (uploadType === "image" && !skipFilter) {
        formData.append("filter", selectedFilter)
      }

      // API'ye gönder
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Yükleme sırasında bir hata oluştu")
      }

      // Başarılı yanıt
      console.log("Yükleme başarılı:", result)

      // Formu sıfırla
      resetForm()

      // Bildirim göster
      toast({
        title: "Başarılı!",
        description: "İçeriğiniz başarıyla yüklendi.",
      })

      // Üst bileşene bildir
      onUpload(result.item)
    } catch (err: any) {
      console.error("Form gönderme hatası:", err)
      setError(`Yükleme hatası: ${err.message}`)
    }
  }

  // Handle next step in image upload process
  const handleNextStep = () => {
    if (uploadStep === "info" && selectedImage) {
      if (skipFilter) {
        setUploadStep("preview")
      } else {
        setUploadStep("filter")
      }
    } else if (uploadStep === "filter") {
      setUploadStep("preview")
    }
  }

  // Handle back step in image upload process
  const handleBackStep = () => {
    if (uploadStep === "filter") {
      setUploadStep("info")
    } else if (uploadStep === "preview") {
      if (skipFilter) {
        setUploadStep("info")
      } else {
        setUploadStep("filter")
      }
    }
  }

  // Skip filter selection
  const handleSkipFilter = () => {
    setSkipFilter(true)
    setSelectedFilter("normal")
    setUploadStep("preview")
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="pt-6">
        <Tabs value={uploadType} onValueChange={(value) => setUploadType(value as "image" | "audio")}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="image" className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              Fotoğraf Yükle
            </TabsTrigger>
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Mic className="h-4 w-4" />
              Sesli Mesaj
            </TabsTrigger>
          </TabsList>

          <form onSubmit={handleSubmit} className="space-y-4">
            <TabsContent value="image" className="space-y-4 mt-0">
              {uploadStep === "info" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Adınız</Label>
                    <Input
                      id="name"
                      placeholder="Adınız ve soyadınız"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Açıklama (İsteğe Bağlı)</Label>
                    <Textarea
                      id="description"
                      placeholder="Fotoğraf hakkında kısa bir açıklama..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="photo">Fotoğraf</Label>
                    <div className="grid gap-4">
                      <Input
                        id="photo"
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleImageChange}
                        className="cursor-pointer"
                      />

                      {selectedImage && (
                        <div className="relative">
                          <div className="aspect-video w-full max-h-[300px] relative rounded-md overflow-hidden">
                            <Image
                              src={selectedImage || "/placeholder.svg"}
                              alt="Preview"
                              fill
                              className="object-contain"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 rounded-full"
                            onClick={() => {
                              setSelectedImage(null)
                              setSelectedFile(null)
                              if (fileInputRef.current) {
                                fileInputRef.current.value = ""
                              }
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {error && <div className="text-sm text-red-500 font-medium">{error}</div>}

                  {selectedImage && (
                    <div className="flex justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setSkipFilter(true)
                          setUploadStep("preview")
                        }}
                      >
                        Filtresiz Devam Et
                      </Button>
                      <Button type="button" onClick={handleNextStep} className="flex items-center gap-2">
                        Filtre Seç <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              )}

              {uploadStep === "filter" && selectedImage && !skipFilter && (
                <>
                  <PhotoFilters
                    imageUrl={selectedImage}
                    selectedFilter={selectedFilter}
                    onSelectFilter={setSelectedFilter}
                  />

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={handleBackStep}>
                      Geri
                    </Button>
                    <Button type="button" onClick={handleSkipFilter} variant="outline">
                      Filtresiz Devam Et
                    </Button>
                    <Button type="button" onClick={handleNextStep} className="flex items-center gap-2">
                      Önizleme <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}

              {uploadStep === "preview" && selectedImage && (
                <>
                  <div className="space-y-4">
                    <h3 className="font-medium">Önizleme</h3>
                    <div className="aspect-video w-full max-h-[400px] relative rounded-md overflow-hidden">
                      <Image
                        src={selectedImage || "/placeholder.svg"}
                        alt="Preview with filter"
                        fill
                        className="object-contain"
                        style={{ filter: !skipFilter ? photoFilters[selectedFilter].style : "" }}
                      />
                    </div>

                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium">Yükleyen</p>
                          <p className="text-sm">{name}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium">Filtre</p>
                          <p className="text-sm">{skipFilter ? "Filtresiz" : photoFilters[selectedFilter].name}</p>
                        </div>
                        {description && (
                          <div className="col-span-2">
                            <p className="text-sm font-medium">Açıklama</p>
                            <p className="text-sm">{description}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <Button type="button" variant="outline" onClick={handleBackStep}>
                        Geri
                      </Button>
                      <Button type="submit" className="flex items-center gap-2" disabled={isUploading}>
                        {isUploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Yükleniyor...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Yükle
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="audio" className="space-y-4 mt-0">
              <div className="space-y-2">
                <Label htmlFor="name">Adınız</Label>
                <Input
                  id="name"
                  placeholder="Adınız ve soyadınız"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Açıklama (İsteğe Bağlı)</Label>
                <Textarea
                  id="description"
                  placeholder="Sesli mesaj hakkında kısa bir açıklama..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Sesli Mesaj</Label>
                <div className="flex flex-col items-center gap-4 p-4 border rounded-md bg-gray-50">
                  {!audioURL ? (
                    <div className="w-full flex justify-center">
                      <Button
                        type="button"
                        variant={isRecording ? "destructive" : "default"}
                        className={`w-full max-w-xs ${isRecording ? "animate-pulse" : ""}`}
                        onClick={isRecording ? stopRecording : startRecording}
                      >
                        {isRecording ? (
                          <>
                            <span className="mr-2">Kaydı Durdur</span>
                            <span>{formatTime(recordingTime)}</span>
                          </>
                        ) : (
                          <>
                            <Mic className="mr-2 h-4 w-4" />
                            Kayda Başla
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="w-full space-y-2">
                      <audio src={audioURL} controls className="w-full" />
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setAudioURL(null)
                          setAudioBlob(null)
                        }}
                      >
                        Yeni Kayıt
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {error && <div className="text-sm text-red-500 font-medium">{error}</div>}

              {audioURL && (
                <Button type="submit" className="w-full" disabled={isUploading}>
                  {isUploading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Yükleniyor...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Yükle
                    </>
                  )}
                </Button>
              )}
            </TabsContent>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  )
}
