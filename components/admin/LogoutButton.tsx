'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="text-xs font-semibold text-[#c9c2b2] hover:text-red-400 border border-[#3a3a3a] rounded-md px-3 py-1.5 transition-colors"
    >
      Log Out
    </button>
  );
}
