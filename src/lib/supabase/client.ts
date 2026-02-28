import { createBrowserClient } from "@supabase/ssr";


/**
 * Create a Supabase client for use in browser (client) components.
 *
 * Uses the public URL and publishable key so credentials are safe to expose
 * in the frontend. Session data is stored in browser storage according to
 * Supabase defaults.
 */
export function createClient() {
  // Create a supabase client on the browser with project's credentials
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
