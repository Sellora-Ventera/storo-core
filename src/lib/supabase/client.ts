import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client — safe to use in Client Components.
// For Server Components and API routes, use @/lib/supabase/server.ts instead.
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
