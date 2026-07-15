import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/admin/manage-admin
 * body: { targetId: string, action: 'suspend' | 'reactivate' | 'remove' | 'reset-password', newPassword?: string }
 *
 * Only callable by an authenticated, active 'super-admin'. A super-admin can never
 * suspend/remove/reset their own account through this route (guardrail against
 * accidental lockout), and can never demote/remove the last remaining super-admin.
 */
export async function POST(request: Request) {
  const { targetId, action, newPassword } = await request.json();

  if (!targetId || !action) {
    return NextResponse.json({ error: 'targetId and action are required.' }, { status: 400 });
  }

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
    return NextResponse.json({ error: 'Only an active super-admin can manage admin accounts.' }, { status: 403 });
  }

  if (targetId === user.id) {
    return NextResponse.json({ error: 'You cannot modify your own account through this panel.' }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: targetProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', targetId)
    .single();

  if (!targetProfile) {
    return NextResponse.json({ error: 'Admin not found.' }, { status: 404 });
  }

  if (targetProfile.role === 'super-admin' && (action === 'remove' || action === 'suspend')) {
    return NextResponse.json({ error: 'Cannot suspend or remove a super-admin from this panel.' }, { status: 400 });
  }

  switch (action) {
    case 'suspend': {
      const { error } = await admin.from('profiles').update({ status: 'suspended' }).eq('id', targetId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      break;
    }
    case 'reactivate': {
      const { error } = await admin.from('profiles').update({ status: 'active' }).eq('id', targetId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      break;
    }
    case 'remove': {
      // Deletes the auth user entirely; profiles row cascades via FK.
      const { error } = await admin.auth.admin.deleteUser(targetId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      break;
    }
    case 'reset-password': {
      if (!newPassword || newPassword.length < 10) {
        return NextResponse.json({ error: 'newPassword must be at least 10 characters.' }, { status: 400 });
      }
      const { error } = await admin.auth.admin.updateUserById(targetId, { password: newPassword });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      break;
    }
    default:
      return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
