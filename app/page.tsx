import { createClient as createServerComponentClient } from '@supabase/supabase-js';
import { SiteHeader } from '@/components/SiteHeader';
import { HomeClient } from '@/components/HomeClient';

// This page is public and reads only the single active poll's id + schema.
// Using the anon key here is safe: RLS on `polls` only exposes rows where is_active = true.
async function getActivePoll(): Promise<
  { poll: { id: string } | null; error: string | null }
> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return {
      poll: null,
      error:
        'NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set in this deployment\'s environment variables.',
    };
  }

  try {
    const supabase = createServerComponentClient(url, key);
    const { data, error } = await supabase
      .from('polls')
      .select('id, slug, title_en, title_am')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      return { poll: null, error: error.message };
    }
    return { poll: data, error: null };
  } catch (err) {
    return { poll: null, error: err instanceof Error ? err.message : 'Unknown error contacting Supabase.' };
  }
}

export default async function HomePage() {
  const { poll, error } = await getActivePoll();

  return (
    <>
      <SiteHeader />
      {error ? (
        <main className="min-h-[calc(100vh-57px)] flex items-center justify-center px-4">
          <div className="max-w-md text-center space-y-3">
            <p className="text-red-400 font-bold text-sm">Could not load the active poll.</p>
            <p className="text-[#9a9284] text-xs font-mono break-words">{error}</p>
            <p className="text-[#9a9284] text-xs">
              Check that your Supabase environment variables are set in this deployment and that{' '}
              <code>supabase/schema.sql</code> has been run against your project.
            </p>
          </div>
        </main>
      ) : (
        <HomeClient pollId={poll?.id ?? null} />
      )}
    </>
  );
}
