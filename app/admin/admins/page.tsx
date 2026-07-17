'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Profile {
  id: string;
  email: string;
  role: 'super-admin' | 'admin';
  status: 'active' | 'suspended';
  created_at: string;
  pseudonym?: string; // Add pseudonym field
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
  const [showEmails, setShowEmails] = useState(false); // Toggle for showing emails

  // Helper: Mask email for privacy
  function maskEmail(email: string): string {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    
    // If email is very short, mask differently
    if (local.length <= 3) {
      return local[0] + '***@' + domain;
    }
    
    // Show first 2 chars and last 2 chars of local part
    const maskedLocal = local.slice(0, 2) + '***' + local.slice(-2);
    return `${maskedLocal}@${domain}`;
  }

  // Helper: Get display name (pseudonym or masked email)
  function getDisplayName(profile: Profile): string {
    if (profile.pseudonym) {
      return profile.pseudonym;
    }
    // If no pseudonym, use masked email
    return maskEmail(profile.email);
  }

  async function loadProfiles() {
    const supabase = createClient();
    // Also fetch pseudonym if it exists in your profiles table
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });
    
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
    
    // Validate password strength
    if (newPassword.length < 10) {
      setFormError('Password must be at least 10 characters long.');
      setCreating(false);
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      setFormError('Please enter a valid email address.');
      setCreating(false);
      return;
    }

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
    
    setFormSuccess(`Admin account created for ${maskEmail(newEmail)}. Share the password with them securely.`);
    setNewEmail('');
    setNewPassword('');
    loadProfiles();
  }

  async function handleAction(targetId: string, action: 'suspend' | 'reactivate' | 'remove') {
    if (action === 'remove' && !confirm('⚠️ Permanently remove this admin account? This cannot be undone.')) {
      return;
    }
    
    try {
      const res = await fetch('/api/admin/manage-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, action }),
      });
      
      if (res.ok) {
        setFormSuccess(`Admin ${action} successful.`);
        loadProfiles();
        // Clear success message after 5 seconds
        setTimeout(() => setFormSuccess(null), 5000);
      } else {
        const json = await res.json();
        setFormError(json.error ?? `Failed to ${action} admin.`);
      }
    } catch (error) {
      setFormError('An unexpected error occurred.');
    }
  }

  async function handleResetPassword(targetId: string) {
    if (resetValue.length < 10) {
      setFormError('New password must be at least 10 characters.');
      return;
    }
    
    try {
      const res = await fetch('/api/admin/manage-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, action: 'reset-password', newPassword: resetValue }),
      });
      
      if (res.ok) {
        setFormSuccess('Password reset successfully.');
        setResetTarget(null);
        setResetValue('');
        setTimeout(() => setFormSuccess(null), 5000);
      } else {
        const json = await res.json();
        setFormError(json.error ?? 'Failed to reset password.');
      }
    } catch (error) {
      setFormError('An unexpected error occurred.');
    }
  }

  // Toggle email visibility
  const toggleEmailVisibility = () => {
    setShowEmails(!showEmails);
  };

  return (
    <div className="space-y-8">
      {/* Form Messages */}
      {formError && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-md p-3">
          <p className="text-red-400 text-sm">{formError}</p>
        </div>
      )}
      {formSuccess && (
        <div className="bg-green-900/20 border border-green-500/50 rounded-md p-3">
          <p className="text-green-400 text-sm">{formSuccess}</p>
        </div>
      )}

      {/* Create Admin Section */}
      <section>
        <h1 className="text-lg font-bold text-[#F4E7C1] mb-4">Create Admin</h1>
        <p className="text-xs text-[#9a9284] mb-4 max-w-lg">
          Set the email and a temporary password for the new admin yourself — they do not
          self-register. Share the password with them through a secure channel; they can
          change it after logging in.
        </p>
        
        <form onSubmit={handleCreate} className="flex flex-wrap gap-3 items-end max-w-2xl">
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-bold text-[#B8860B] mb-1 uppercase">
              Email
            </label>
            <input
              type="email"
              required
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full rounded-md bg-[#1c1414] border border-[#3a3a3a] focus:border-[#B8860B] focus:outline-none text-sm text-[#e8e2d4] px-3 py-2"
              placeholder="admin@example.com"
              autoComplete="off"
            />
          </div>
          
          <div className="flex-1 min-w-[220px]">
            <label className="block text-xs font-bold text-[#B8860B] mb-1 uppercase">
              Temporary Password
            </label>
            <input
              type="text"
              required
              minLength={10}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-md bg-[#1c1414] border border-[#3a3a3a] focus:border-[#B8860B] focus:outline-none text-sm text-[#e8e2d4] px-3 py-2"
              placeholder="At least 10 characters (strong recommended)"
              autoComplete="off"
            />
          </div>
          
          <button
            type="submit"
            disabled={creating}
            className="rounded-md bg-[#a30000] hover:bg-[#8a0000] disabled:opacity-60 text-white font-semibold px-5 py-2 text-sm transition-colors"
          >
            {creating ? 'Creating...' : 'Create Admin'}
          </button>
        </form>
      </section>

      {/* Admin List Section */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-[#F4E7C1]">All Admin Accounts</h2>
          
          <div className="flex items-center gap-3">
            <button
              onClick={toggleEmailVisibility}
              className="text-xs text-[#B8860B] hover:underline"
            >
              {showEmails ? 'Hide' : 'Show'} Emails
            </button>
            <span className="text-xs text-[#9a9284]">
              {profiles.length} admin{profiles.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-[#9a9284] text-sm">Loading admin accounts...</div>
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-12 border border-[#3a3a3a] rounded-lg">
            <p className="text-[#9a9284] text-sm">No admin accounts found.</p>
          </div>
        ) : (
          <div className="border border-[#3a3a3a] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#1c1414] text-[#B8860B] text-xs uppercase tracking-wide">
                  <tr>
                    <th className="text-left px-4 py-2.5">Admin</th>
                    <th className="text-left px-4 py-2.5">Role</th>
                    <th className="text-left px-4 py-2.5">Status</th>
                    <th className="text-right px-4 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((profile, index) => (
                    <tr 
                      key={profile.id} 
                      className={`border-t border-[#2a2a2a] text-[#e8e2d4] ${
                        index % 2 === 0 ? 'bg-[#0d0808]' : 'bg-[#1c1414]'
                      }`}
                    >
                      {/* Display Name Column - Uses Pseudonym or Masked Email */}
                      <td className="px-4 py-2.5">
                        <div className="flex flex-col">
                          <span className="font-medium text-[#F4E7C1]">
                            {getDisplayName(profile)}
                          </span>
                          {/* Show email as tooltip or hidden */}
                          {showEmails ? (
                            <span className="text-[#9a9284] text-xs mt-0.5">
                              {profile.email}
                            </span>
                          ) : (
                            <span className="text-[#9a9284] text-xs mt-0.5 opacity-50">
                              ••••••••
                            </span>
                          )}
                        </div>
                      </td>
                      
                      {/* Role Column */}
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          profile.role === 'super-admin' 
                            ? 'bg-purple-900/30 text-purple-400 border border-purple-500/30' 
                            : 'bg-blue-900/30 text-blue-400 border border-blue-500/30'
                        }`}>
                          {profile.role === 'super-admin' ? '🔑 Super Admin' : '👤 Admin'}
                        </span>
                      </td>
                      
                      {/* Status Column */}
                      <td className="px-4 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 ${
                          profile.status === 'active' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${
                            profile.status === 'active' ? 'bg-green-400' : 'bg-red-400'
                          }`} />
                          {profile.status}
                        </span>
                      </td>
                      
                      {/* Actions Column */}
                      <td className="px-4 py-2.5 text-right">
                        {profile.role !== 'super-admin' ? (
                          <div className="flex flex-wrap items-center justify-end gap-2">
                            {/* Suspend/Reactivate */}
                            {profile.status === 'active' ? (
                              <button 
                                onClick={() => handleAction(profile.id, 'suspend')} 
                                className="text-xs font-semibold text-yellow-500 hover:text-yellow-400 transition-colors"
                              >
                                Suspend
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleAction(profile.id, 'reactivate')} 
                                className="text-xs font-semibold text-green-500 hover:text-green-400 transition-colors"
                              >
                                Reactivate
                              </button>
                            )}
                            
                            <span className="text-[#3a3a3a]">|</span>
                            
                            {/* Reset Password */}
                            <button 
                              onClick={() => setResetTarget(profile.id)} 
                              className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              Reset PW
                            </button>
                            
                            <span className="text-[#3a3a3a]">|</span>
                            
                            {/* Remove */}
                            <button 
                              onClick={() => handleAction(profile.id, 'remove')} 
                              className="text-xs font-semibold text-red-400 hover:text-red-300 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-[#9a9284]">Protected</span>
                        )}
                        
                        {/* Reset Password Input */}
                        {resetTarget === profile.id && (
                          <div className="mt-2 flex gap-2 justify-end">
                            <input
                              type="text"
                              placeholder="New password (10+ chars)"
                              value={resetValue}
                              onChange={(e) => setResetValue(e.target.value)}
                              className="rounded-md bg-[#0d0808] border border-[#3a3a3a] text-xs text-[#e8e2d4] px-2 py-1 w-48"
                              autoFocus
                            />
                            <button 
                              onClick={() => handleResetPassword(profile.id)} 
                              className="text-xs font-semibold text-green-400 hover:text-green-300 px-2 py-1 bg-green-900/20 rounded border border-green-500/30 transition-colors"
                            >
                              Save
                            </button>
                            <button 
                              onClick={() => {
                                setResetTarget(null);
                                setResetValue('');
                              }} 
                              className="text-xs font-semibold text-[#9a9284] hover:text-white px-2 py-1 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Security Note */}
        <div className="mt-4 p-3 bg-yellow-900/10 border border-yellow-500/20 rounded-md">
          <p className="text-xs text-[#9a9284]">
            🔒 <span className="font-semibold">Security Note:</span> Admin emails are masked by default 
            to prevent shoulder surfing. Only verified administrators should see full email addresses.
            All password changes are logged for audit purposes.
          </p>
        </div>
      </section>
    </div>
  );
}
