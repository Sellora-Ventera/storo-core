"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signOut() {
  // Route through /auth/sso/logout so we both clear the local Supabase
  // session AND fire RP-initiated logout at Ventera SSO. The route handles
  // the case where SSO is not configured by falling back to "/".
  redirect("/auth/sso/logout");
}

export async function getUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
