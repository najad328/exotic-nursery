/**
 * Supabase client with service_role key ΓÇö bypasses RLS.
 * Use ONLY in server-side code (API routes, Server Components).
 * NEVER expose to the browser.
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@exotic-nursery/supabase";

let serviceClient: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseServiceClient() {
  if (serviceClient) return serviceClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
    );
  }

  serviceClient = createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serviceClient;
}
