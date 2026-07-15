import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LogoutButton } from '@/components/admin/LogoutButton';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // /admin/login renders its own standalone page; this layout wraps everything else,
  // but middleware already redirects unauthenticated users away from those routes.
  if (!user) {
    return <>{children}</>;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('email, role, status')
    .eq('id', user.id)
    .single();

  // A real query/RLS error (e.g. the infinite-recursion policy bug) is NOT the
  // same as "this user simply has no profile row" — surface it loudly instead
  // of silently bouncing to /admin/login, which just looks like being locked out
  // with no explanation.
  if (profileError && profileError.code !== 'PGRST116') {
    throw new Error(`Failed to load your admin profile: ${profileError.message}`);
  }

  if (!profile || profile.status === 'suspended') {
    redirect('/admin/login');
  }

  const isSuperAdmin = profile.role === 'super-admin';

  return (
    <div className="min-h-screen bg-[#0d0808]">
      <header className="border-b border-[#B8860B]/30 bg-[#120a0a]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="text-[#F4E7C1] font-extrabold text-sm">PC-CPE Dashboard</span>
            <nav className="flex gap-4 text-sm">
              <Link href="/admin" className="text-[#c9c2b2] hover:text-[#B8860B]">Submissions</Link>
              {isSuperAdmin && (
                <Link href="/admin/admins" className="text-[#c9c2b2] hover:text-[#B8860B]">Manage Admins</Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#9a9284]">{profile.email} · {profile.role}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
