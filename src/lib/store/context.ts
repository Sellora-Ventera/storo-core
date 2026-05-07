import { notFound, redirect } from "next/navigation";
import {
  createSupabaseServerClient,
  createSupabaseServiceClient,
} from "@/lib/supabase/server";
import type { StoreSummary } from "@/components/dashboard/store/StoreSwitcher";

export type BillingModel = "storo_gateway" | "own_prepaid";

export type StoreRow = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  client_id: string | null;
  user_id: string | null;
  is_active: boolean;
  settings: Record<string, unknown> | null;
  billing_model: BillingModel;
  template_variant: string;
  theme_config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type ClientRow = {
  id: string;
  user_id: string;
  full_name: string | null;
};

export async function requireUserAndClient() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const service = await createSupabaseServiceClient();
  const { data: client } = await service
    .from("clients")
    .select("id, user_id, full_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!client) redirect("/onboarding");
  return { user, client: client as ClientRow };
}

export async function getUserStores(clientId: string): Promise<StoreSummary[]> {
  const service = await createSupabaseServiceClient();
  const { data, error } = await service
    .from("stores")
    .select("id, name, slug, is_active")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data as StoreSummary[];
}

export async function getStoreForUser(storeId: string): Promise<{
  store: StoreRow;
  client: ClientRow;
  stores: StoreSummary[];
}> {
  const { client } = await requireUserAndClient();
  const service = await createSupabaseServiceClient();

  const { data: store } = await service
    .from("stores")
    .select(
      "id, name, slug, description, logo_url, banner_url, client_id, user_id, is_active, settings, billing_model, template_variant, theme_config, created_at, updated_at"
    )
    .eq("id", storeId)
    .eq("client_id", client.id)
    .maybeSingle();

  if (!store) notFound();

  const stores = await getUserStores(client.id);

  return {
    store: store as StoreRow,
    client,
    stores,
  };
}

export function buildStorefrontUrl(slug: string | null | undefined): string | null {
  if (!slug) return null;
  const suffix = process.env.NEXT_PUBLIC_STOREFRONT_DOMAIN_SUFFIX ?? "storo.id";
  return `https://${slug}.${suffix}`;
}

import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

export type StoreApiContext = {
  service: SupabaseClient;
  userId: string;
  clientId: string;
};

/**
 * Authorize an API request scoped to a store. Returns either a NextResponse error
 * (caller should `return` it directly) or a context with a service-role Supabase
 * client + ownership-verified userId/clientId. No redirect/notFound — safe for API routes.
 */
export async function authorizeStoreApi(
  storeId: string
): Promise<NextResponse | StoreApiContext> {
  const auth = await createSupabaseServerClient();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = await createSupabaseServiceClient();
  const { data: client } = await service
    .from("clients")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 403 });
  }

  const { data: store } = await service
    .from("stores")
    .select("id")
    .eq("id", storeId)
    .eq("client_id", client.id)
    .maybeSingle();
  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  return { service, userId: user.id, clientId: client.id as string };
}
