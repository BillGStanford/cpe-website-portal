'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError('Invalid email or password.');
      return;
    }
    router.push('/admin');
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0d0808] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm bg-[#1c1414] border border-[#B8860B]/30 rounded-xl p-8 space-y-5">
        <h1 className="text-center text-[#F4E7C1] font-extrabold text-lg mb-2">Admin Login</h1>

        <div>
          <label className="block text-xs font-bold text-[#B8860B] mb-1.5 uppercase tracking-wide">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md bg-[#0d0808] border border-[#3a3a3a] focus:border-[#B8860B] focus:outline-none text-[#e8e2d4] text-sm px-3 py-2.5"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-[#B8860B] mb-1.5 uppercase tracking-wide">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md bg-[#0d0808] border border-[#3a3a3a] focus:border-[#B8860B] focus:outline-none text-[#e8e2d4] text-sm px-3 py-2.5"
          />
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-[#a30000] hover:bg-[#8a0000] disabled:opacity-60 text-white font-bold py-2.5 text-sm transition-colors"
        >
          {loading ? '…' : 'Log In'}
        </button>
      </form>
    </main>
  );
}
