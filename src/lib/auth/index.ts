// Auth abstraction layer.
// To switch providers: change the import below + install the provider package.
// AUTH_PROVIDER=supabase (default) | clerk

// Currently: Supabase Auth
export { getUser, requireAuth, signOut } from "./supabase";

// To switch to Clerk: comment out the line above, uncomment below:
// export { getUser, requireAuth, signOut } from "./clerk";
