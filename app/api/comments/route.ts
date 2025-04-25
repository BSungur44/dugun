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

// Yorum eklemek için POST endpoint'i
export async function POST(request: Request) {
  try {
    const { content, username, itemId, itemType } = await request.json()

    if (!content || !username || !itemId || !itemType) {
      return NextResponse.json(
        { error: "Eksik bilgi: içerik, kullanıcı adı, öğe ID ve öğe tipi gereklidir" },
        { status: 400 },
      )
    }

    const supabase = getSupabaseAdmin()

    // Yorum ekle
    const { data, error } = await supabase
      .from("comments")
      .insert({
        content,
        username,
        [itemType === "photo" ? "photo_id" : "audio_id"]: itemId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Yorum ekleme hatası:", error)
      return NextResponse.json({ error: `Yorum eklenirken bir hata oluştu: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, comment: data[0] })
  } catch (error: any) {
    console.error("Sunucu hatası:", error)
    return NextResponse.json({ error: `Sunucu hatası: ${error.message}` }, { status: 500 })
  }
}

// Yorumları getirmek için GET endpoint'i
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const itemId = searchParams.get("itemId")
    const itemType = searchParams.get("itemType")

    if (!itemId || !itemType) {
      return NextResponse.json({ error: "Eksik bilgi: öğe ID ve öğe tipi gereklidir" }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Yorumları getir
    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq(itemType === "photo" ? "photo_id" : "audio_id", itemId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Yorumları getirme hatası:", error)
      return NextResponse.json({ error: `Yorumlar getirilirken bir hata oluştu: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ success: true, comments: data })
  } catch (error: any) {
    console.error("Sunucu hatası:", error)
    return NextResponse.json({ error: `Sunucu hatası: ${error.message}` }, { status: 500 })
  }
}
