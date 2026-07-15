import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/admin/create-admin
 * body: { email: string, password: string }
 *
 * Only callable by an authenticated, active 'super-admin'. Creates the auth
 * user directly with the email + password the super-admin chose (the new
 * admin does NOT self-register), and inserts a 'admin' profiles row.
 * The new admin can change their own password after their first login via
 * the standard Supabase updateUser() call — no separate flow needed.
 */
export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password || password.length < 10) {
    return NextResponse.json(
      { error: 'Email and a password of at least 10 characters are required.' },
      { status: 400 }
    );
  }

  // 1. Verify the caller is an authenticated, active super-admin.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', user.id)
    .single();

  if (!callerProfile || callerProfile.role !== 'super-admin' || callerProfile.status !== 'active') {
    return NextResponse.json({ error: 'Only an active super-admin can create admin accounts.' }, { status: 403 });
  }

  // 2. Use the service-role client to create the auth user directly.
  const admin = createAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // no email verification loop — the super-admin is vouching for this account
  });

  if (createError || !created.user) {
    return NextResponse.json({ error: createError?.message ?? 'Failed to create admin.' }, { status: 400 });
  }

  // 3. Ensure the profiles row is role='admin' and created_by is recorded.
  //    (The DB trigger already inserted a default row on auth.users insert —
  //    this just sets created_by and confirms role/status explicitly.)
  const { error: profileError } = await admin
    .from('profiles')
    .update({ role: 'admin', status: 'active', created_by: user.id })
    .eq('id', created.user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: created.user.id, email });
}
