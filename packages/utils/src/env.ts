/** Validate required environment variables at startup.
 * Throws a clear error if any are missing, preventing silent runtime failures.
 */
export function validateEnv(
  required: string[],
  env: Record<string, string | undefined>
): void {
  const missing = required.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join("\n")}\n\nCheck your .env file.`
    );
  }
}

/** Required env vars for the mobile app */
export const MOBILE_REQUIRED_ENV = [
  "EXPO_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY",
] as const;

/** Required env vars for the admin app */
export const ADMIN_REQUIRED_ENV = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;
