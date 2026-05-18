import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseJsClient } from "@supabase/supabase-js";
import { cookies, headers } from "next/headers";

/**
 * Server-side cookie domain — harus match dengan browser client
 * ([@/lib/supabase/client.ts]) supaya cookie yang di-set/refresh oleh server
 * masih kebaca oleh client (dan sebaliknya). Set
 * `NEXT_PUBLIC_COOKIE_DOMAIN=.storo.id` di env Vercel.
 *
 * Otomatis fallback ke `.<eTLD+1>` (mis. `.storo.id`) kalau host bukan
 * localhost, jadi PKCE verifier + session bisa shared antara apex dan www.
 */
async function resolveServerCookieDomain(): Promise<string | undefined> {
  const envDomain = process.env.NEXT_PUBLIC_COOKIE_DOMAIN;
  if (envDomain) return envDomain;
  try {
    const h = await headers();
    const host =
      h.get("x-forwarded-host")?.split(",")[0].trim() ||
      h.get("host") ||
      "";
    if (!host || host.startsWith("localhost") || host.startsWith("127.")) {
      return undefined;
    }
    const bareHost = host.split(":")[0];
    const parts = bareHost.split(".");
    if (parts.length >= 2) {
      return `.${parts.slice(-2).join(".")}`;
    }
  } catch {
    /* not in a request context */
  }
  return undefined;
}

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const cookieDomain = await resolveServerCookieDomain();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        domain: cookieDomain,
        sameSite: "lax",
        secure: !!cookieDomain, // prod (cookieDomain set) → secure; dev (undefined) → not
        path: "/",
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from Server Component — safe to ignore
          }
        },
      },
    }
  );
}

// Alias for server action files that import createClient()
export const createClient = createSupabaseServerClient;

// Service client harus pakai plain @supabase/supabase-js (bukan @supabase/ssr)
// supaya tidak ikut baca cookies user. Kalau pakai createServerClient dengan
// cookies, JWT user di-attach ke Authorization header → RLS tetap evaluate
// sebagai user, service role key cuma jadi apikey dan tidak bypass apa-apa.
export async function createSupabaseServiceClient() {
  return createSupabaseJsClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
