import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * ⚠️ SERVER-ONLY. Never import this file from a Client Component or expose
 * SUPABASE_SERVICE_ROLE_KEY to the browser bundle.
 *
 * This client bypasses RLS entirely, which is required to:
 *  - create auth users directly with an email + password set by the super-admin
 *    (rather than the admin signing themselves up), and
 *  - update/suspend/delete those accounts.
 *
 * Every route that uses this client MUST first verify (via lib/supabase/server.ts,
 * bound to the caller's session) that the caller is an active 'super-admin'.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
