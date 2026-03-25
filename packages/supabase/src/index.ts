import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types/database";

export type { Database };
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

/**
 * Creates a typed Supabase client for browser/mobile usage (anon key).
 * Detects env var prefix automatically (Next.js vs Expo).
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

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

export { createClient } from "@supabase/supabase-js";
