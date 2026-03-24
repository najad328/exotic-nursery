import { createClient } from "@supabase/supabase-js";

// Database types will be generated from Supabase CLI in Phase 1
// import type { Database } from "./types/database";

/**
 * Creates a Supabase client for browser/mobile usage (anon key).
 * Uses different env var prefixes for Next.js vs Expo:
 * - Next.js: NEXT_PUBLIC_SUPABASE_URL
 * - Expo: EXPO_PUBLIC_SUPABASE_URL
 */
export function createSupabaseClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.EXPO_PUBLIC_SUPABASE_URL;

  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Check .env file."
    );
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export { createClient } from "@supabase/supabase-js";
