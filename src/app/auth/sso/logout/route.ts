import { type NextRequest, NextResponse } from "next/server";
import * as client from "openid-client";
import {
  APP_ORIGIN,
  getOidcConfig,
  SSO_POST_LOGOUT_URI,
  isSsoConfigured,
} from "@/lib/sso/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function handleLogout(): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  if (!isSsoConfigured()) {
    return NextResponse.redirect(new URL("/", APP_ORIGIN));
  }

  try {
    const config = await getOidcConfig();
    const endUrl = client.buildEndSessionUrl(config, {
      post_logout_redirect_uri: SSO_POST_LOGOUT_URI,
    });
    return NextResponse.redirect(endUrl.href);
  } catch {
    return NextResponse.redirect(new URL("/", APP_ORIGIN));
  }
}

export async function GET() {
  return handleLogout();
}

export async function POST() {
  return handleLogout();
}
