import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "template-thumbnails";

const DEFAULT_WIDTH = 1200;
const DEFAULT_CROP_HEIGHT = 800;
const DEFAULT_WAIT_SECONDS = 5;

/**
 * Build the screenshot service URL.
 *
 * Uses `SCREENSHOT_URL_TEMPLATE` env var if set (e.g. paid services like
 * screenshotone / apiflash). The template must contain `{url}` which will be
 * replaced with the URL-encoded target URL.
 *
 * Fallback: thum.io free tier — no API key, returns PNG directly, carries a
 * small watermark. Good enough for template preview thumbnails.
 */
function buildScreenshotRequestUrl(targetUrl: string): string {
  const template = process.env.SCREENSHOT_URL_TEMPLATE;
  if (template && template.includes("{url}")) {
    return template.replace("{url}", encodeURIComponent(targetUrl));
  }
  // thum.io expects raw URL appended to path (no percent-encoding).
  // `wait/N` gives client-side JS time to render before capture — without it,
  // SPAs return a blank/skeleton screenshot.
  // Cache-bust query: thum.io caches by full URL for ~1h. If an earlier attempt
  // captured a blank render (site not ready), we'd be stuck serving blank until
  // cache expires. Appending a unique timestamp forces a fresh capture every call.
  const cacheBuster = `_screenshot=${Date.now()}`;
  const separator = targetUrl.includes("?") ? "&" : "?";
  const freshUrl = `${targetUrl}${separator}${cacheBuster}`;
  return `https://image.thum.io/get/width/${DEFAULT_WIDTH}/crop/${DEFAULT_CROP_HEIGHT}/wait/${DEFAULT_WAIT_SECONDS}/noanimate/${freshUrl}`;
}

export async function fetchScreenshotBuffer(
  targetUrl: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const requestUrl = buildScreenshotRequestUrl(targetUrl);
  const res = await fetch(requestUrl, {
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new Error(`Screenshot service responded ${res.status}`);
  }
  const contentType = res.headers.get("content-type") ?? "image/png";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Screenshot service returned non-image content-type: ${contentType}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.byteLength < 1024) {
    throw new Error(`Screenshot too small (${buffer.byteLength} bytes) — likely an error page`);
  }
  return { buffer, contentType };
}

export async function uploadTemplateScreenshot(
  supabase: SupabaseClient,
  slug: string,
  targetUrl: string,
): Promise<string> {
  const { buffer, contentType } = await fetchScreenshotBuffer(targetUrl);
  const ext = contentType.includes("jpeg") ? "jpg" : "png";
  const path = `${slug}/auto-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: true });
  if (error) {
    throw new Error(`Upload screenshot failed: ${error.message}`);
  }

  const { data: pub } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return pub.publicUrl;
}
