import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser client — uses ONLY the public anon key.
 * RLS policies (see supabase/schema.sql) are what actually enforce that
 * anonymous visitors can INSERT submissions but never SELECT/UPDATE/DELETE them.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
