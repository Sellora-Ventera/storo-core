import { createBrowserClient } from "@supabase/ssr";

/**
 * Resolve cookie domain so PKCE verifier + session cookie ke-share antara
 * `storo.id` ⇄ `www.storo.id` ⇄ subdomain lain (mis. `preview.storo.id`).
 * Tanpa ini: OAuth yang dimulai di www → callback ke apex (atau sebaliknya
 * via Vercel/Cloudflare redirect) → cookie nggak ikut karena scoped ke host
 * yang set-nya. Hasilnya error `PKCE code verifier not found in storage`.
 *
 * Di dev (localhost) return undefined biar browser pakai default (host yg
 * sedang aktif). Di env Vercel set `NEXT_PUBLIC_COOKIE_DOMAIN=.storo.id`.
 */
function resolveCookieDomain(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const envDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;
  if (envDomain) return envDomain;
  const host = window.location.hostname;
  if (host === "localhost" || host.startsWith("127.") || host.endsWith(".local")) {
    return undefined;
  }
  // Auto: kalau host pakai *.storo.id, fall back ke `.storo.id` supaya
  // cookie ke-share antar subdomain.
  const parts = host.split(".");
  if (parts.length >= 2) {
    return `.${parts.slice(-2).join(".")}`;
  }
  return undefined;
}

// Browser-side Supabase client — safe to use in Client Components.
// For Server Components and API routes, use @/lib/supabase/server.ts instead.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain: resolveCookieDomain(),
        sameSite: "lax",
        secure: typeof window !== "undefined" && window.location.protocol === "https:",
        path: "/",
      },
    }
  );
}

// Singleton for use in client components
let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createSupabaseBrowserClient();
  }
  return browserClient;
}

// Alias for files that import createClient()
export const createClient = createSupabaseBrowserClient;
