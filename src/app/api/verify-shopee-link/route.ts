import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Extract meta tag content from HTML */
function getMetaContent(html: string, property: string): string | null {
  const ogMatch = html.match(
    new RegExp(
      `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    )
  );
  if (ogMatch) return ogMatch[1];

  const nameMatch = html.match(
    new RegExp(
      `<meta[^>]+name=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    )
  );
  if (nameMatch) return nameMatch[1];

  const reversedMatch = html.match(
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
      "i"
    )
  );
  if (reversedMatch) return reversedMatch[1];

  return null;
}

function getTitle(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match ? match[1].trim() : null;
}

function extractShopeeStoreId(url: string): string | null {
  const shopMatch = url.match(/shopee\.co\.id\/shop\/(\d+)/i);
  if (shopMatch) return shopMatch[1];

  const usernameMatch = url.match(/shopee\.co\.id\/([a-zA-Z0-9._-]+)\/?$/i);
  if (
    usernameMatch &&
    !["m", "search", "cart", "user", "buyer"].includes(
      usernameMatch[1].toLowerCase()
    )
  ) {
    return usernameMatch[1];
  }
  return null;
}

function cleanStoreName(rawName: string): string {
  let name = rawName.trim();
  name = name.replace(
    /\s*\|\s*Shopee\s*(Indonesia|Malaysia|Singapore|Thailand|Philippines|Vietnam|Taiwan|Brazil)?/gi,
    ""
  );
  name = name.replace(/\s*-\s*Shopee\s*(Indonesia)?/gi, "");
  name = name.replace(/^Toko\s+/i, "");
  return name.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const rawUrl = (body.url as string)?.trim();

    if (!rawUrl) {
      return NextResponse.json(
        { error: "URL toko Shopee wajib diisi" },
        { status: 400 }
      );
    }

    // Normalize URL
    let url = rawUrl;
    if (!url.startsWith("http")) url = `https://${url}`;

    // Must be Shopee
    if (!/shopee\.co\.id/i.test(url)) {
      return NextResponse.json(
        {
          error:
            "Gunakan link toko Shopee yang valid. Contoh: https://shopee.co.id/namatoko",
        },
        { status: 400 }
      );
    }

    // Extract store ID from URL before fetching (faster duplicate check)
    const storeId = extractShopeeStoreId(url);
    if (!storeId) {
      return NextResponse.json(
        {
          error:
            "Link tidak mengarah ke halaman toko. Contoh: https://shopee.co.id/namatoko",
        },
        { status: 400 }
      );
    }

    // Check duplicate in DB (before doing the expensive page fetch)
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: existing } = await supabase
      .from("clients")
      .select("clerk_user_id")
      .eq("shopee_store_id", storeId)
      .maybeSingle();

    if (existing && existing.clerk_user_id !== user?.id) {
      return NextResponse.json(
        {
          error:
            "Link toko ini sudah terdaftar di akun lain. Setiap toko Shopee hanya bisa didaftarkan di satu akun.",
          duplicate: true,
        },
        { status: 409 }
      );
    }

    // Fetch the Shopee store page
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let response: Response;
    try {
      response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
        },
        signal: controller.signal,
        redirect: "follow",
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return NextResponse.json(
          { error: "Halaman toko tidak merespons dalam 10 detik. Coba lagi." },
          { status: 408 }
        );
      }
      throw err;
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Gagal mengakses link toko (HTTP ${response.status}). Pastikan link toko benar dan toko masih aktif.`,
        },
        { status: 400 }
      );
    }

    const html = await response.text();
    const ogTitle = getMetaContent(html, "og:title");
    const ogImage = getMetaContent(html, "og:image");
    const pageTitle = getTitle(html);

    const rawStoreName = ogTitle || pageTitle || "";
    const storeName = cleanStoreName(rawStoreName);

    if (!storeName) {
      return NextResponse.json(
        {
          error:
            "Tidak bisa membaca nama toko dari halaman ini. Pastikan link mengarah langsung ke halaman toko Shopee Anda.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      verified: true,
      store_name: storeName,
      store_id: storeId,
      logo_url: ogImage || null,
      source_url: url,
    });
  } catch (err) {
    console.error("[verify-shopee-link]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Coba lagi." },
      { status: 500 }
    );
  }
}
