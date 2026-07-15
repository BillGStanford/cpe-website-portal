'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body className="bg-[#0d0808] min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-[#F4E7C1] font-bold text-lg">Something went wrong.</h1>
          <p className="text-[#9a9284] text-xs font-mono break-words">{error.message}</p>
          <button
            onClick={reset}
            className="rounded-md bg-[#a30000] hover:bg-[#8a0000] text-white text-sm font-semibold px-5 py-2"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
