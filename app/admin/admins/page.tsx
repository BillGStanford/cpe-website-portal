'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  id: string;
  email: string;
  role: 'super-admin' | 'admin';
  status: 'active' | 'suspended';
  created_at: string;
}

export default function ManageAdminsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<string | null>(null);
  const [resetValue, setResetValue] = useState('');

  async function loadProfiles() {
    const supabase = createClient();
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: true });
    if (data) setProfiles(data as Profile[]);
    setLoading(false);
  }

  useEffect(() => {
    loadProfiles();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setFormError(null);
    setFormSuccess(null);
    const res = await fetch('/api/admin/create-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail, password: newPassword }),
    });
    const json = await res.json();
    setCreating(false);
    if (!res.ok) {
      setFormError(json.error ?? 'Failed to create admin.');
      return;
    }
    setFormSuccess(`Admin account created for ${newEmail}. Share the password with them securely.`);
    setNewEmail('');
    setNewPassword('');
    loadProfiles();
  }

  async function handleAction(targetId: string, action: 'suspend' | 'reactivate' | 'remove') {
    if (action === 'remove' && !confirm('Permanently remove this admin account? This cannot be undone.')) return;
    const res = await fetch('/api/admin/manage-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId, action }),
    });
    if (res.ok) loadProfiles();
  }

  async function handleResetPassword(targetId: string) {
    if (resetValue.length < 10) return;
    const res = await fetch('/api/admin/manage-admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId, action: 'reset-password', newPassword: resetValue }),
    });
    if (res.ok) {
      setResetTarget(null);
      setResetValue('');
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-lg font-bold text-[#F4E7C1] mb-4">Create Admin</h1>
        <p className="text-xs text-[#9a9284] mb-4 max-w-lg">
          Set the email and a temporary password for the new admin yourself — they do not
          self-register. Share the password with them through a secure channel; they can
          change it after logging in.
        </p>
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end max-w-2xl">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-bold text-[#B8860B] mb-1 uppercase">Email</label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full rounded-md bg-[#1c1414] border border-[#3a3a3a] focus:border-[#B8860B] focus:outline-none text-sm text-[#e8e2d4] px-3 py-2"
            />
          </div>
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-bold text-[#B8860B] mb-1 uppercase">Temporary Password</label>
            <input
              type="text"
              required
              minLength={10}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md bg-[#1c1414] border border-[#3a3a3a] focus:border-[#B8860B] focus:outline-none text-sm text-[#e8e2d4] px-3 py-2"
              placeholder="At least 10 characters"
            />
          </div>
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-[#a30000] hover:bg-[#8a0000] disabled:opacity-60 text-white font-semibold px-5 py-2 text-sm"
          >
            {creating ? '…' : 'Create Admin'}
          </button>
        </form>
        {formError && <p className="text-red-400 text-xs mt-2">{formError}</p>}
        {formSuccess && <p className="text-green-400 text-xs mt-2">{formSuccess}</p>}
      </section>

      <section>
        <h2 className="text-sm font-bold text-[#F4E7C1] mb-3">All Admin Accounts</h2>
        {loading ? (
          <p className="text-[#9a9284] text-sm">Loading…</p>
        ) : (
          <div className="border border-[#3a3a3a] rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#1c1414] text-[#B8860B] text-xs uppercase tracking-wide">
                <tr>
                  <th className="text-left px-4 py-2.5">Email</th>
                  <th className="text-left px-4 py-2.5">Role</th>
                  <th className="text-left px-4 py-2.5">Status</th>
                  <th className="text-right px-4 py-2.5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {profiles.map((p) => (
                  <tr key={p.id} className="border-t border-[#2a2a2a] text-[#e8e2d4]">
                    <td className="px-4 py-2.5">{p.email}</td>
                    <td className="px-4 py-2.5">{p.role}</td>
                    <td className="px-4 py-2.5">
                      <span className={p.status === 'active' ? 'text-green-400' : 'text-red-400'}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right space-x-3">
                      {p.role !== 'super-admin' && (
                        <>
                          {p.status === 'active' ? (
                            <button onClick={() => handleAction(p.id, 'suspend')} className="text-xs font-semibold text-[#B8860B] hover:underline">
                              Suspend
                            </button>
                          ) : (
                            <button onClick={() => handleAction(p.id, 'reactivate')} className="text-xs font-semibold text-[#B8860B] hover:underline">
                              Reactivate
                            </button>
                          )}
                          <button onClick={() => setResetTarget(p.id)} className="text-xs font-semibold text-[#B8860B] hover:underline">
                            Reset Password
                          </button>
                          <button onClick={() => handleAction(p.id, 'remove')} className="text-xs font-semibold text-red-400 hover:underline">
                            Remove
                          </button>
                        </>
                      )}
                      {resetTarget === p.id && (
                        <div className="mt-2 flex gap-2 justify-end">
                          <input
                            type="text"
                            placeholder="New password (10+ chars)"
                            value={resetValue}
                            onChange={(e) => setResetValue(e.target.value)}
                            className="rounded-md bg-[#0d0808] border border-[#3a3a3a] text-xs text-[#e8e2d4] px-2 py-1"
                          />
                          <button onClick={() => handleResetPassword(p.id)} className="text-xs font-semibold text-[#B8860B]">
                            Save
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
