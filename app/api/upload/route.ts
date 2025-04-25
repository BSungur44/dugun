import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Servis rolü anahtarı ile Supabase istemcisi oluştur (RLS politikalarını atlar)
const getSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Supabase URL veya Service Role Key tanımlanmamış!")
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File
    const uploaderName = formData.get("uploaderName") as string
    const description = formData.get("description") as string | null
    const filter = formData.get("filter") as string | null
    const type = formData.get("type") as "image" | "audio"

    if (!file || !uploaderName) {
      return NextResponse.json({ error: "Dosya ve yükleyici adı gereklidir" }, { status: 400 })
    }

    // Dosya içeriğini kontrol et
    if (file.size === 0) {
      return NextResponse.json({ error: "Dosya içeriği boş" }, { status: 400 })
    }

    console.log("Dosya bilgileri:", {
      name: file.name,
      type: file.type,
      size: file.size,
    })

    const supabaseAdmin = getSupabaseAdmin()

    // Bucket adını belirle
    const bucketName = "fotolar"

    // Bucket'ın varlığını kontrol et, yoksa oluştur
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    const bucketExists = buckets?.some((bucket) => bucket.name === bucketName)

    if (!bucketExists) {
      console.log("Bucket bulunamadı, oluşturuluyor:", bucketName)
      const { error: bucketError } = await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
      })

      if (bucketError) {
        console.error("Bucket oluşturma hatası:", bucketError)
        return NextResponse.json({ error: `Bucket oluşturma hatası: ${bucketError.message}` }, { status: 500 })
      }
      console.log("Bucket başarıyla oluşturuldu:", bucketName)
    } else {
      console.log("Bucket zaten mevcut:", bucketName)
    }

    // Benzersiz bir dosya adı oluştur
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`

    console.log("Dosya yükleniyor:", fileName)

    // Dosyayı Supabase Storage'a yükle
    const { data: storageData, error: storageError } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(fileName, file, {
        contentType: file.type,
        upsert: true,
      })

    if (storageError) {
      console.error("Storage yükleme hatası:", storageError)
      return NextResponse.json({ error: `Dosya yükleme hatası: ${storageError.message}` }, { status: 500 })
    }

    console.log("Dosya başarıyla yüklendi:", storageData?.path)

    // Yüklenen dosyanın genel URL'sini al
    const { data: publicUrlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(fileName)

    console.log("Dosya URL'si:", publicUrlData.publicUrl)

    // Veritabanına kayıt ekle
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from("gallery_items")
      .insert({
        type,
        content: publicUrlData.publicUrl,
        uploader_name: uploaderName,
        description: description || null,
        filter: filter || null,
        upload_date: new Date().toISOString(),
        likes: 0,
      })
      .select()

    if (dbError) {
      console.error("Veritabanı kayıt hatası:", dbError)
      return NextResponse.json({ error: `Veritabanı kayıt hatası: ${dbError.message}` }, { status: 500 })
    }

    console.log("Veritabanı kaydı başarılı:", dbData[0].id)

    // Başarılı yanıt döndür
    return NextResponse.json({
      success: true,
      item: {
        id: dbData[0].id,
        type,
        content: publicUrlData.publicUrl,
        uploaderName,
        uploadDate: new Date(),
        description: description || undefined,
        filter: filter || undefined,
        likes: 0,
      },
    })
  } catch (error: any) {
    console.error("Sunucu hatası:", error)
    return NextResponse.json({ error: `Sunucu hatası: ${error.message}` }, { status: 500 })
  }
}
