// Clerk auth adapter — stub until AUTH_PROVIDER=clerk is needed.
// Install @clerk/nextjs and implement these when switching.

export async function getUser() {
  throw new Error(
    "Clerk auth not configured. Set AUTH_PROVIDER=supabase or install @clerk/nextjs."
  );
}

export async function requireAuth() {
  throw new Error("Clerk auth not configured.");
}

export async function signOut() {
  throw new Error("Clerk auth not configured.");
}
