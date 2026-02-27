import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url) {
  console.error('SUPABASE URL is not configured');
}

export const adminClient =
  url && serviceKey
    ? createSupabaseClient(url, serviceKey, {
        auth: { persistSession: false },
      })
    : null;

