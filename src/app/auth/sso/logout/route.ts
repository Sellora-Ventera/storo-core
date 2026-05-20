import { type NextRequest, NextResponse } from "next/server";
import * as client from "openid-client";
import {
  getOidcConfig,
  SSO_POST_LOGOUT_URI,
  isSsoConfigured,
} from "@/lib/sso/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function handleLogout(req: NextRequest): Promise<NextResponse> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  if (!isSsoConfigured()) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  try {
    const config = await getOidcConfig();
    const endUrl = client.buildEndSessionUrl(config, {
      post_logout_redirect_uri: SSO_POST_LOGOUT_URI,
    });
    return NextResponse.redirect(endUrl.href);
  } catch {
    return NextResponse.redirect(new URL("/", req.url));
  }
}

export async function GET(req: NextRequest) {
  return handleLogout(req);
}

export async function POST(req: NextRequest) {
  return handleLogout(req);
}
