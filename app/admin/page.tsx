'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CandidateCard } from '@/components/CandidateCard';

interface Submission {
  id: string;
  poll_id: string;
  member_id: string;
  full_name: string;
  pseudonym: string;
  contact_method: string;
  contact_details: string | null;
  location: string;
  region_city: string | null;
  occupation: string | null;
  age_bracket: string | null;
  education_level: string | null;
  ideology: string;
  ideology_other: string | null;
  political_development: string | null;
  works_studied: string | null;
  // Legacy fields
  essay_state: string | null;
  essay_national_question: string | null;
  essay_abiy: string | null;
  essay_class_struggle: string | null;
  security_understanding: string | null;
  // New fields
  previous_org: string | null;
  previous_org_details: string | null;
  how_heard: string | null;
  how_heard_other: string | null;
  time_commitment: string;
  skills: string[];
  skills_other: string | null;
  translation_languages: string | null;
  experience: string;
  self_evaluation: string | null;
  accepts_assignments: string | null;
  accepted_democratic_centralism: boolean;
  accepted_oath: boolean;
  interest_statement: string;
  location_verified: boolean;
  location_verified_by: string | null;
  location_verified_at: string | null;
  admin_notes: string | null;
  ip_hash: string | null;
  created_at: string;
}

type EditField = 'location' | 'region_city' | 'admin_notes';

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [filterVerified, setFilterVerified] = useState<'all' | 'unverified' | 'verified'>('all');
  const [detail, setDetail] = useState<Submission | null>(null);
  const [preview, setPreview] = useState<Submission | null>(null);
  const [editTarget, setEditTarget] = useState<Submission | null>(null);
  const [editField, setEditField] = useState<EditField | null>(null);
  const [editValue, setEditValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);
  const [unverifying, setUnverifying] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) setSubmissions(data as Submission[]);
      setLoading(false);
    })();
  }, []);

  const filtered = submissions.filter((s) => {
    const q = query.trim().toLowerCase();
    if (q && !s.member_id.toLowerCase().includes(q) && !s.pseudonym.toLowerCase().includes(q)) return false;
    if (filterVerified === 'verified' && !s.location_verified) return false;
    if (filterVerified === 'unverified' && s.location_verified) return false;
    return true;
  });

  const unverifiedCount = submissions.filter((s) => !s.location_verified).length;

  async function handleSaveEdit(submissionId: string) {
    if (!editField) return;
    setSaving(true);
    setSaveError(null);
    const supabase = createClient();
    const { error } = await supabase
      .from('submissions')
      .update({ [editField]: editValue || null })
      .eq('id', submissionId);
    setSaving(false);
    if (error) { setSaveError(error.message); return; }
    setSubmissions((prev) => prev.map((s) => s.id === submissionId ? { ...s, [editField]: editValue || null } : s));
    if (detail?.id === submissionId) setDetail((prev) => prev ? { ...prev, [editField]: editValue || null } : prev);
    setEditField(null);
    setEditValue('');
  }

  async function handleVerifyLocation(submissionId: string) {
    setVerifying(submissionId);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('submissions')
      .update({ location_verified: true, location_verified_by: user?.id, location_verified_at: new Date().toISOString() })
      .eq('id', submissionId);
    if (!error) {
      const stamp = { location_verified: true, location_verified_by: user?.id ?? null, location_verified_at: new Date().toISOString() };
      setSubmissions((prev) => prev.map((s) => s.id === submissionId ? { ...s, ...stamp } : s));
      if (detail?.id === submissionId) setDetail((prev) => prev ? { ...prev, ...stamp } : prev);
    }
    setVerifying(null);
  }

  async function handleUnverifyLocation(submissionId: string) {
    if (!confirm('Remove location verification?')) return;
    setUnverifying(submissionId);
    const supabase = createClient();
    const { error } = await supabase
      .from('submissions')
      .update({ location_verified: false, location_verified_by: null, location_verified_at: null })
      .eq('id', submissionId);
    if (!error) {
      const reset = { location_verified: false, location_verified_by: null, location_verified_at: null };
      setSubmissions((prev) => prev.map((s) => s.id === submissionId ? { ...s, ...reset } : s));
      if (detail?.id === submissionId) setDetail((prev) => prev ? { ...prev, ...reset } : prev);
    }
    setUnverifying(null);
  }

  function openEditField(field: EditField, currentValue: string | null) {
    setEditField(field);
    setEditValue(currentValue ?? '');
    setSaveError(null);
  }

  // ── Label formatters ──
  const L = {
    contactMethod: (v: string | null) => {
      if (!v) return '—';
      const m: Record<string, string> = {
        referral: 'Through referrer',
        phone: 'By phone',
        secure: 'Secure messaging (Telegram/Signal)',
        email: 'By email',
        inperson: 'In person',
        other: 'Other',
      };
      return m[v] ?? v;
    },
    prevOrg: (v: string | null) => {
      if (!v) return '—';
      const m: Record<string, string> = { current: 'Currently a member', former: 'Previously a member', none: 'No prior membership' };
      return m[v] ?? v;
    },
    howHeard: (v: string | null, other?: string | null) => {
      if (!v) return '—';
      const m: Record<string, string> = {
        referral: 'Personal contact / member',
        social: 'Social media',
        material: 'Party publication / material',
        event: 'Public event / meeting',
        other: other ?? 'Other',
      };
      return m[v] ?? v;
    },
    assignments: (v: string | null) => {
      if (!v) return '—';
      const m: Record<string, string> = { yes: 'Yes, prepared', discuss: 'Wants to discuss', no: 'No' };
      return m[v] ?? v;
    },
    edu: (v: string | null) => {
      if (!v) return '—';
      const m: Record<string, string> = {
        none: 'No formal education',
        primary: 'Primary school',
        secondary: 'Secondary school',
        vocational: 'Vocational / technical',
        'some-university': 'Some university',
        'degree+': 'University degree or higher',
      };
      return m[v] ?? v;
    },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-[#F4E7C1]">Submissions ({submissions.length})</h1>
          {unverifiedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#a30000]/20 border border-[#a30000]/40 px-3 py-0.5 text-xs font-semibold text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
              {unverifiedCount} need location verification
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex rounded-md border border-[#3a3a3a] overflow-hidden text-xs">
            {(['all', 'unverified', 'verified'] as const).map((f) => (
              <button key={f} onClick={() => setFilterVerified(f)} className={`px-3 py-1.5 font-semibold transition-colors ${filterVerified === f ? 'bg-[#B8860B] text-[#0d0808]' : 'bg-[#1c1414] text-[#9a9284] hover:text-[#e8e2d4]'}`}>
                {f === 'all' ? 'All' : f === 'unverified' ? 'Unverified' : 'Verified'}
              </button>
            ))}
          </div>
          <input type="text" placeholder="Search by Member ID or Pseudonym" value={query} onChange={(e) => setQuery(e.target.value)} className="rounded-md bg-[#1c1414] border border-[#3a3a3a] focus:border-[#B8860B] focus:outline-none text-sm text-[#e8e2d4] px-3 py-2 w-72" />
        </div>
      </div>

      {unverifiedCount > 0 && filterVerified === 'all' && (
        <div className="mb-4 rounded-lg border border-[#B8860B]/30 bg-[#B8860B]/5 px-4 py-3 text-xs text-[#c9c2b2]">
          <strong className="text-[#B8860B]">Reminder:</strong> Every new submission requires personal contact to confirm the member's exact city/area. Verify only after this contact is complete.
        </div>
      )}

      {loading ? (
        <p className="text-[#9a9284] text-sm">Loading…</p>
      ) : (
        <div className="border border-[#3a3a3a] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#1c1414] text-[#B8860B] text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-2.5">Member ID</th>
                <th className="text-left px-4 py-2.5">Pseudonym</th>
                <th className="text-left px-4 py-2.5">Occupation</th>
                <th className="text-left px-4 py-2.5">Location</th>
                <th className="text-left px-4 py-2.5">Verified</th>
                <th className="text-left px-4 py-2.5">Date</th>
                <th className="text-right px-4 py-2.5">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className={`border-t border-[#2a2a2a] text-[#e8e2d4] ${!s.location_verified ? 'bg-[#a30000]/5' : ''}`}>
                  <td className="px-4 py-2.5 font-mono text-[#a30000] font-semibold">{s.member_id}</td>
                  <td className="px-4 py-2.5">{s.pseudonym}</td>
                  <td className="px-4 py-2.5 text-[#9a9284]">{s.occupation ?? '—'}</td>
                  <td className="px-4 py-2.5">
                    <div className="capitalize">{s.location}</div>
                    {s.region_city && <div className="text-xs text-[#9a9284]">{s.region_city}</div>}
                  </td>
                  <td className="px-4 py-2.5">
                    {s.location_verified ? (
                      <span className="inline-flex items-center gap-1 text-green-400 text-xs font-semibold">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-red-400 text-xs font-semibold">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        Unverified
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[#9a9284]">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2.5 text-right space-x-2">
                    <button onClick={() => setDetail(s)} className="text-xs font-semibold text-[#B8860B] hover:underline">View</button>
                    <button onClick={() => setEditTarget(s)} className="text-xs font-semibold text-[#B8860B] hover:underline">Edit</button>
                    <button onClick={() => setPreview(s)} className="text-xs font-semibold text-[#B8860B] hover:underline">Card</button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[#9a9284]">No submissions found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {detail && <DetailModal submission={detail} onClose={() => setDetail(null)} L={L} />}
      {editTarget && (
        <EditModal submission={editTarget} onClose={() => { setEditTarget(null); setEditField(null); setEditValue(''); setSaveError(null); }}
          editField={editField} setEditField={setEditField} editValue={editValue} setEditValue={setEditValue}
          saving={saving} saveError={saveError} onSave={handleSaveEdit} onOpenField={openEditField}
          onCancelEdit={() => { setEditField(null); setEditValue(''); setSaveError(null); }}
          onVerify={handleVerifyLocation} onUnverify={handleUnverifyLocation} verifying={verifying} unverifying={unverifying} L={L} />
      )}
      {preview && (
        <Modal onClose={() => setPreview(null)}>
          <CandidateCard data={{ memberId: preview.member_id, fullName: preview.full_name, regionCity: preview.region_city ?? '', dateOfIssue: new Date(preview.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) }} />
        </Modal>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  DETAIL MODAL                                                              */
/* -------------------------------------------------------------------------- */
function DetailModal({ submission: s, onClose, L }: { submission: Submission; onClose: () => void; L: ReturnType<typeof useLabelFormatters> }) {
  const isLegacy = !!s.essay_state || !!s.essay_national_question || !!s.essay_abiy || !!s.essay_class_struggle || !!s.security_understanding;

  return (
    <Modal onClose={onClose} wide>
      <div className="text-left space-y-3 max-h-[75vh] overflow-y-auto pr-2">
        <div className="flex items-center gap-3 mb-2 flex-wrap">
          <h2 className="text-[#F4E7C1] font-bold text-base">{s.member_id} — {s.pseudonym}</h2>
          {s.location_verified
            ? <span className="inline-flex items-center gap-1 rounded-full bg-green-900/30 border border-green-800/40 px-2.5 py-0.5 text-xs font-semibold text-green-400">Location Verified</span>
            : <span className="inline-flex items-center gap-1 rounded-full bg-red-900/30 border border-red-800/40 px-2.5 py-0.5 text-xs font-semibold text-red-400">Location NOT Verified</span>
          }
        </div>

        <Row label="Full Legal Name" value={s.full_name} />
        <Row label="Pseudonym" value={s.pseudonym} />
        <Row label="Contact Method" value={L.contactMethod(s.contact_method)} />
        {s.contact_details && <Row label="Contact Details" value={s.contact_details} />}
        <Row label="Location" value={s.location} />
        <Row label="Region / City" value={s.region_city ?? '—'} />
        {s.occupation && <Row label="Occupation" value={s.occupation} />}
        {s.age_bracket && <Row label="Age Range" value={s.age_bracket} />}
        {s.education_level && <Row label="Education" value={L.edu(s.education_level)} />}
        {s.location_verified && s.location_verified_at && <Row label="Verified At" value={new Date(s.location_verified_at).toLocaleString()} />}
        {s.admin_notes && <Row label="Admin Notes" value={s.admin_notes} />}

        <hr className="border-[#3a3a3a] my-2" />

        <Row label="Ideology" value={s.ideology_other ? `${s.ideology} — ${s.ideology_other}` : s.ideology} />
        {s.political_development && <Row label="Origin of Political Consciousness" value={s.political_development} />}
        {s.works_studied && <Row label="Marxist-Leninist Works Studied" value={s.works_studied} />}
        {s.essay_state && <Row label="The Ethiopian State (legacy)" value={s.essay_state} />}
        {s.previous_org && <Row label="Previous Org Membership" value={L.prevOrg(s.previous_org)} />}
        {s.previous_org_details && <Row label="Org Details" value={s.previous_org_details} />}
        {s.how_heard && <Row label="How They Heard" value={L.howHeard(s.how_heard, s.how_heard_other)} />}

        <hr className="border-[#3a3a3a] my-2" />

        <Row label="Time Commitment" value={s.time_commitment} />
        <Row label="Skills" value={s.skills.join(', ') + (s.skills_other ? ` (${s.skills_other})` : '')} />
        {s.translation_languages && <Row label="Translation Languages" value={s.translation_languages} />}
        <Row label="Organizing Experience" value={s.experience} />
        {s.accepts_assignments && <Row label="Accepts Assignments" value={L.assignments(s.accepts_assignments)} />}

        <hr className="border-[#3a3a3a] my-2" />

        {s.self_evaluation && <Row label="Self-Evaluation" value={s.self_evaluation} />}
        <Row label="Democratic Centralism" value={s.accepted_democratic_centralism ? 'Accepted' : 'Not accepted'} />
        <Row label="Oath" value={s.accepted_oath ? 'Pledged' : 'Not pledged'} />
        <Row label="Motivation" value={s.interest_statement} />

        {isLegacy && (
          <>
            <hr className="border-[#3a3a3a] my-2" />
            <p className="text-[10px] text-[#9a9284] uppercase tracking-widest font-bold">Legacy Responses</p>
            {s.essay_national_question && <Row label="National Question" value={s.essay_national_question} />}
            {s.essay_abiy && <Row label="Abiy Ahmed Assessment" value={s.essay_abiy} />}
            {s.essay_class_struggle && <Row label="Class Struggle" value={s.essay_class_struggle} />}
            {s.security_understanding && <Row label="Security Understanding" value={s.security_understanding} />}
          </>
        )}

        <hr className="border-[#3a3a3a] my-2" />
        <Row label="Submitted" value={new Date(s.created_at).toLocaleString()} />
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  EDIT MODAL                                                                */
/* -------------------------------------------------------------------------- */
function EditModal({
  submission: s, onClose, editField, setEditField, editValue, setEditValue,
  saving, saveError, onSave, onOpenField, onCancelEdit, onVerify, onUnverify, verifying, unverifying, L,
}: {
  submission: Submission; onClose: () => void;
  editField: EditField | null; setEditField: (f: EditField | null) => void;
  editValue: string; setEditValue: (v: string) => void;
  saving: boolean; saveError: string | null;
  onSave: (id: string) => Promise<void>; onOpenField: (field: EditField, currentValue: string | null) => void; onCancelEdit: () => void;
  onVerify: (id: string) => Promise<void>; onUnverify: (id: string) => Promise<void>;
  verifying: string | null; unverifying: string | null;
  L: ReturnType<typeof useLabelFormatters>;
}) {
  const labels: Record<EditField, string> = { location: 'Location (In/Out of Ethiopia)', region_city: 'Region / City', admin_notes: 'Admin Notes' };
  const hints: Record<EditField, string> = { location: 'e.g. "Inside Ethiopia" or "Outside Ethiopia"', region_city: 'The specific city/area. Must be confirmed via personal contact.', admin_notes: 'Verification log, follow-up reminders, contact attempts, etc.' };

  return (
    <Modal onClose={onClose} wide>
      <div className="text-left space-y-4 max-h-[75vh] overflow-y-auto pr-2">
        <div className="flex items-center justify-between">
          <h2 className="text-[#F4E7C1] font-bold text-base">Edit: {s.member_id} — {s.pseudonym}</h2>
          {s.location_verified
            ? <span className="inline-flex items-center gap-1 rounded-full bg-green-900/30 border border-green-800/40 px-2.5 py-0.5 text-xs font-semibold text-green-400">Verified</span>
            : <span className="inline-flex items-center gap-1 rounded-full bg-red-900/30 border border-red-800/40 px-2.5 py-0.5 text-xs font-semibold text-red-400">Unverified</span>
          }
        </div>

        <div className="rounded-lg border border-[#B8860B]/20 bg-[#B8860B]/5 p-4 space-y-3">
          <h3 className="text-sm font-bold text-[#B8860B] uppercase tracking-wide">Location Verification</h3>
          <p className="text-xs text-[#9a9284]">You must personally contact the member to confirm their exact city/area. Only verify after this contact is complete.</p>
          {s.location_verified && s.location_verified_at && <p className="text-xs text-green-400/70">Verified at {new Date(s.location_verified_at).toLocaleString()}</p>}
          <div className="flex gap-2">
            {!s.location_verified ? (
              <button onClick={() => onVerify(s.id)} disabled={verifying === s.id} className="rounded-md bg-green-800 hover:bg-green-700 disabled:opacity-60 text-white font-semibold px-4 py-2 text-xs">{verifying === s.id ? '…' : '✓ Mark Location Verified'}</button>
            ) : (
              <button onClick={() => onUnverify(s.id)} disabled={unverifying === s.id} className="rounded-md bg-[#3a3a3a] hover:bg-[#4a4a4a] disabled:opacity-60 text-[#e8e2d4] font-semibold px-4 py-2 text-xs">{unverifying === s.id ? '…' : 'Remove Verification'}</button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-[#F4E7C1] uppercase tracking-wide">Editable Fields</h3>
          {(['location', 'region_city', 'admin_notes'] as EditField[]).map((field) => {
            const isEditing = editField === field;
            const current = s[field] as string | null;
            return (
              <div key={field} className="rounded-lg border border-[#3a3a3a] bg-[#0d0808] p-3">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wide text-[#B8860B]">{labels[field]}</label>
                  {!isEditing && <button onClick={() => onOpenField(field, current)} className="text-xs font-semibold text-[#B8860B] hover:underline">Edit</button>}
                </div>
                {isEditing ? (
                  <div className="space-y-2">
                    {field === 'admin_notes'
                      ? <textarea value={editValue} onChange={(e) => setEditValue(e.target.value)} rows={4} className="w-full rounded-md bg-[#1c1414] border border-[#3a3a3a] focus:border-[#B8860B] focus:outline-none text-sm text-[#e8e2d4] px-3 py-2 resize-y" placeholder={hints[field]} autoFocus />
                      : <input type="text" value={editValue} onChange={(e) => setEditValue(e.target.value)} className="w-full rounded-md bg-[#1c1414] border border-[#3a3a3a] focus:border-[#B8860B] focus:outline-none text-sm text-[#e8e2d4] px-3 py-2" placeholder={hints[field]} autoFocus />
                    }
                    <p className="text-[10px] text-[#9a9284]">{hints[field]}</p>
                    {saveError && editField === field && <p className="text-red-400 text-xs">{saveError}</p>}
                    <div className="flex gap-2">
                      <button onClick={() => onSave(s.id)} disabled={saving} className="rounded-md bg-[#a30000] hover:bg-[#8a0000] disabled:opacity-60 text-white font-semibold px-3 py-1.5 text-xs">{saving ? 'Saving…' : 'Save'}</button>
                      <button onClick={onCancelEdit} className="rounded-md bg-[#3a3a3a] hover:bg-[#4a4a4a] text-[#e8e2d4] font-semibold px-3 py-1.5 text-xs">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-[#e8e2d4] whitespace-pre-wrap">{current || <span className="text-[#9a9284] italic">Not set</span>}</div>
                )}
              </div>
            );
          })}
        </div>

        <div className="space-y-2 pt-2 border-t border-[#3a3a3a]">
          <h3 className="text-sm font-bold text-[#9a9284] uppercase tracking-wide">Reference (Read-Only)</h3>
          <Row label="Full Legal Name" value={s.full_name} />
          {s.occupation && <Row label="Occupation" value={s.occupation} />}
          <Row label="Contact Method" value={L.contactMethod(s.contact_method)} />
          {s.contact_details && <Row label="Contact Details" value={s.contact_details} />}
          <Row label="Ideology" value={s.ideology_other ? `${s.ideology} — ${s.ideology_other}` : s.ideology} />
          <Row label="Submitted" value={new Date(s.created_at).toLocaleString()} />
        </div>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------------------- */
/*  SHARED                                                                    */
/* -------------------------------------------------------------------------- */
function useLabelFormatters() {
  return {
    contactMethod: (v: string | null) => {
      if (!v) return '—';
      const m: Record<string, string> = { referral: 'Through referrer', phone: 'By phone', secure: 'Secure messaging', email: 'By email', inperson: 'In person', other: 'Other' };
      return m[v] ?? v;
    },
    prevOrg: (v: string | null) => {
      if (!v) return '—';
      const m: Record<string, string> = { current: 'Currently a member', former: 'Previously a member', none: 'No prior membership' };
      return m[v] ?? v;
    },
    howHeard: (v: string | null, other?: string | null) => {
      if (!v) return '—';
      const m: Record<string, string> = { referral: 'Personal contact / member', social: 'Social media', material: 'Party publication', event: 'Public event', other: other ?? 'Other' };
      return m[v] ?? v;
    },
    assignments: (v: string | null) => {
      if (!v) return '—';
      const m: Record<string, string> = { yes: 'Yes, prepared', discuss: 'Wants to discuss', no: 'No' };
      return m[v] ?? v;
    },
    edu: (v: string | null) => {
      if (!v) return '—';
      const m: Record<string, string> = { none: 'No formal education', primary: 'Primary', secondary: 'Secondary', vocational: 'Vocational/technical', 'some-university': 'Some university', 'degree+': 'Degree or higher' };
      return m[v] ?? v;
    },
  };
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wide text-[#B8860B]">{label}</div>
      <div className="text-sm text-[#e8e2d4] whitespace-pre-wrap">{value}</div>
    </div>
  );
}

function Modal({ children, onClose, wide = false }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className={`bg-[#1c1414] border border-[#B8860B]/30 rounded-xl p-6 w-full ${wide ? 'max-w-2xl' : 'max-w-lg'}`} onClick={(e) => e.stopPropagation()}>
        {children}
        <button onClick={onClose} className="mt-5 text-xs font-semibold text-[#9a9284] hover:text-[#e8e2d4]">Close</button>
      </div>
    </div>
  );
}
