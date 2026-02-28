import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Supabase admin client.
 *
 * Uses the service-role key to perform privileged operations (e.g. reading all
 * push subscriptions for notification fan-out). This client must only ever run
 * on the server and never be exposed to the browser.
 *
 * When either URL or service key is missing, `adminClient` is set to `null`,
 * and callers are expected to handle that case gracefully.
 */
if (!url) {
  console.error('SUPABASE URL is not configured');
}

export const adminClient =
  url && serviceKey
    ? createSupabaseClient(url, serviceKey, {
        auth: { persistSession: false },
      })
    : null;

