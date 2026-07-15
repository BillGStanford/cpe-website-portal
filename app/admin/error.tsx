'use client';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-[#0d0808] flex items-center justify-center px-4">
      <div className="max-w-lg text-center space-y-4">
        <h1 className="text-[#F4E7C1] font-bold text-lg">Admin dashboard error</h1>
        <p className="text-[#9a9284] text-xs font-mono break-words">{error.message}</p>
        <p className="text-[#9a9284] text-xs">
          If this mentions "infinite recursion detected in policy for relation profiles", re-run
          the latest <code>supabase/schema.sql</code> in your Supabase SQL Editor — it fixes a
          recursive RLS policy and is safe to run again on an existing project.
        </p>
        <button
          onClick={reset}
          className="rounded-md bg-[#a30000] hover:bg-[#8a0000] text-white text-sm font-semibold px-5 py-2"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
