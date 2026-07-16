'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n-context';
import { createClient } from '@/lib/supabase/client';
import { CandidateCard } from './CandidateCard';

type FormState = {
  fullLegalName: string;
  pseudonym: string;
  location: 'inside' | 'diaspora' | '';
  occupation: string;
  ageBracket: string;
  educationLevel: string;
  ideology: string;
  ideologyOther: string;
  politicalDevelopment: string;
  worksStudied: string;
  previousOrg: string;
  previousOrgDetails: string;
  howHeard: string;
  howHeardOther: string;
  contactMethod: string;
  contactDetails: string;
  timeCommitment: string;
  skills: string[];
  skillsOther: string;
  translationLanguages: string;
  experience: string;
  selfEvaluation: string;
  acceptsAssignments: string;
  acceptedDemocraticCentralism: boolean;
  acceptedOath: boolean;
  motivation: string;
};

const initialState: FormState = {
  fullLegalName: '',
  pseudonym: '',
  location: '',
  occupation: '',
  ageBracket: '',
  educationLevel: '',
  ideology: '',
  ideologyOther: '',
  politicalDevelopment: '',
  worksStudied: '',
  previousOrg: '',
  previousOrgDetails: '',
  howHeard: '',
  howHeardOther: '',
  contactMethod: '',
  contactDetails: '',
  timeCommitment: '',
  skills: [],
  skillsOther: '',
  translationLanguages: '',
  experience: '',
  selfEvaluation: '',
  acceptsAssignments: '',
  acceptedDemocraticCentralism: false,
  acceptedOath: false,
  motivation: '',
};

export function MembershipForm({ pollId }: { pollId: string }) {
  const { t, lang } = useI18n();
  const [form, setForm] = useState<FormState>(initialState);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ memberId: string; regionCity: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: false }));
  }

  function toggleSkill(skill: string) {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill],
    }));
  }

  function validate(): boolean {
    const req: (keyof FormState)[] = [
      'fullLegalName', 'pseudonym', 'location', 'occupation', 'ageBracket',
      'educationLevel', 'ideology', 'politicalDevelopment', 'previousOrg',
      'howHeard', 'contactMethod', 'contactDetails', 'timeCommitment',
      'experience', 'selfEvaluation', 'acceptsAssignments', 'motivation',
    ];
    const nextErrors: Record<string, boolean> = {};
    req.forEach((key) => {
      if (!form[key]) nextErrors[key] = true;
    });
    if (form.skills.length === 0) nextErrors.skills = true;
    if (form.previousOrg !== 'none' && !form.previousOrgDetails) nextErrors.previousOrgDetails = true;
    if (form.howHeard === 'other' && !form.howHeardOther) nextErrors.howHeardOther = true;
    if (!form.acceptedDemocraticCentralism) nextErrors.acceptedDemocraticCentralism = true;
    if (!form.acceptedOath) nextErrors.acceptedOath = true;
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function generateMemberId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = 'OBS-';
    for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    if (!validate()) {
      document.querySelector('[data-error="true"]')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setSubmitting(true);
    const memberId = generateMemberId();
    const regionCity = form.location === 'inside' ? 'Ethiopia' : 'Diaspora';

    const supabase = createClient();
    const { error } = await supabase.from('submissions').insert({
      poll_id: pollId,
      member_id: memberId,
      full_name: form.fullLegalName,
      pseudonym: form.pseudonym,
      contact_method: form.contactMethod,
      contact_details: form.contactDetails,
      location: form.location,
      region_city: regionCity,
      occupation: form.occupation,
      age_bracket: form.ageBracket,
      education_level: form.educationLevel,
      ideology: form.ideology,
      ideology_other: form.ideologyOther || null,
      political_development: form.politicalDevelopment,
      works_studied: form.worksStudied,
      previous_org: form.previousOrg,
      previous_org_details: form.previousOrgDetails || null,
      how_heard: form.howHeard,
      how_heard_other: form.howHeardOther || null,
      time_commitment: form.timeCommitment,
      skills: form.skills,
      skills_other: form.skillsOther || null,
      translation_languages: form.translationLanguages || null,
      experience: form.experience,
      self_evaluation: form.selfEvaluation,
      accepts_assignments: form.acceptsAssignments,
      accepted_democratic_centralism: form.acceptedDemocraticCentralism,
      accepted_oath: form.acceptedOath,
      interest_statement: form.motivation,
    });

    setSubmitting(false);

    if (error) {
      setSubmitError(error.message);
      return;
    }
    setResult({ memberId, regionCity });
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 px-4 bg-[#faf8f5]">
        <span className="inline-block bg-[#0d0d0d] text-[#B8860B] px-3 py-1 font-extrabold uppercase tracking-[0.15em] text-[10px] mb-5">
          Application Received
        </span>
        <h2 className="text-2xl font-black uppercase text-[#0d0d0d] mb-3">{t('successTitle')}</h2>
        <p className="text-[#4a4438] mb-10">{t('successBody')}</p>
                <CandidateCard
          autoDownload
          data={{
            memberId: result.memberId,
            fullName: form.pseudonym,  // ← was form.fullLegalName
            regionCity: result.regionCity,
            dateOfIssue: new Date().toLocaleDateString(lang === 'AM' ? 'am-ET' : 'en-US', {
              year: 'numeric', month: 'long', day: 'numeric',
            }),
          }}
        />
      </div>
    );
  }

  return (
    <div className="bg-[#faf8f5] min-h-full">
      <div className="relative w-full h-56 md:h-72 border-b-[3px] border-[#8a0000] overflow-hidden bg-[#0d0d0d]">
        <Image
          src="/membership-banner.jpg"
          alt=""
          fill
          priority
          className="object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/60 to-[#0d0d0d]/20" />
        <div className="relative h-full max-w-2xl mx-auto px-4 flex flex-col items-center justify-end pb-7 text-center">
          <span className="text-[#B8860B] uppercase tracking-[0.25em] text-[11px] font-extrabold mb-2">
            Official Application
          </span>
          <h1 className="font-black uppercase text-xl md:text-3xl text-white leading-tight max-w-xl">
            {t('formTitle')}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 py-12" dir={lang === 'AM' ? 'auto' : 'ltr'}>
        <div className="border-2 border-[#0d0d0d] bg-white px-5 py-4 mb-10 flex items-start gap-3 text-xs text-[#4a4438] leading-relaxed">
          <span className="shrink-0 font-black text-[#8a0000] uppercase tracking-wide">Notice —</span>
          <p>{t('formNoticeBody')}</p>
        </div>

        {/* ── Section 1: Personal Information ── */}
        <FormSection num="01" accent="red" title={t('section1')}>
          <Field label={t('fullLegalName')} help={t('fullLegalNameHelp')} error={errors.fullLegalName}>
            <input type="text" value={form.fullLegalName} onChange={(e) => update('fullLegalName', e.target.value)} className={inputClass} />
          </Field>

          <Field label={t('q1_label')} help={t('q1_text')} error={errors.pseudonym}>
            <input type="text" value={form.pseudonym} onChange={(e) => update('pseudonym', e.target.value)} className={inputClass} />
          </Field>

          <Field label={t('q2_label')} help={t('q2_text')} error={errors.location}>
            <RadioGroup name="location" value={form.location} onChange={(v) => update('location', v as FormState['location'])} options={[
              { value: 'inside', label: t('q2_opt_inside') },
              { value: 'diaspora', label: t('q2_opt_diaspora') },
            ]} />
          </Field>

          <Field label={t('q3_label')} help={t('q3_text')} error={errors.occupation}>
            <input type="text" value={form.occupation} onChange={(e) => update('occupation', e.target.value)} className={inputClass} />
          </Field>

          <Field label={t('q4_label')} help={t('q4_text')} error={errors.ageBracket}>
            <RadioGroup name="ageBracket" value={form.ageBracket} onChange={(v) => update('ageBracket', v)} options={[
              { value: 'under-18', label: t('q4_opt_1') },
              { value: '18-25', label: t('q4_opt_2') },
              { value: '26-35', label: t('q4_opt_3') },
              { value: '36-50', label: t('q4_opt_4') },
              { value: '50+', label: t('q4_opt_5') },
            ]} />
          </Field>

          <Field label={t('q5_label')} help={t('q5_text')} error={errors.educationLevel}>
            <RadioGroup name="educationLevel" value={form.educationLevel} onChange={(v) => update('educationLevel', v)} options={[
              { value: 'none', label: t('q5_opt_1') },
              { value: 'primary', label: t('q5_opt_2') },
              { value: 'secondary', label: t('q5_opt_3') },
              { value: 'vocational', label: t('q5_opt_4') },
              { value: 'some-university', label: t('q5_opt_5') },
              { value: 'degree+', label: t('q5_opt_6') },
            ]} />
          </Field>
        </FormSection>

        {/* ── Section 2: Political Development ── */}
        <FormSection num="02" accent="black" title={t('section2')}>
          <Field label={t('q6_label')} help={t('q6_text')} error={errors.ideology}>
            <RadioGroup name="ideology" value={form.ideology} onChange={(v) => update('ideology', v)} options={[
              { value: 'marxist-leninist', label: t('q6_opt_ml') },
              { value: 'socialist', label: t('q6_opt_soc') },
              { value: 'anti-imperialist-nationalist', label: t('q6_opt_nat') },
              { value: 'other', label: t('q6_opt_other') },
            ]} />
            {form.ideology === 'other' && (
              <input type="text" value={form.ideologyOther} onChange={(e) => update('ideologyOther', e.target.value)} className={`${inputClass} mt-2`} />
            )}
          </Field>

          <Field label={t('q7_label')} help={t('q7_text')} error={errors.politicalDevelopment}>
            <textarea value={form.politicalDevelopment} onChange={(e) => update('politicalDevelopment', e.target.value)} className={textareaClass} rows={4} />
          </Field>

          <Field label={t('q8_label')} help={t('q8_text')} error={false}>
            <textarea value={form.worksStudied} onChange={(e) => update('worksStudied', e.target.value)} className={textareaClass} rows={3} placeholder='"none"' />
          </Field>

          <Field label={t('q9_label')} help={t('q9_text')} error={errors.previousOrg}>
            <RadioGroup name="previousOrg" value={form.previousOrg} onChange={(v) => update('previousOrg', v)} options={[
              { value: 'current', label: t('q9_opt_current') },
              { value: 'former', label: t('q9_opt_former') },
              { value: 'none', label: t('q9_opt_none') },
            ]} />
            {form.previousOrg !== 'none' && form.previousOrg !== '' && (
              <Field label={t('q9_details_label')} help={t('q9_details_text')} error={errors.previousOrgDetails} noPad>
                <textarea value={form.previousOrgDetails} onChange={(e) => update('previousOrgDetails', e.target.value)} className={textareaClass} rows={3} />
              </Field>
            )}
          </Field>

          <Field label={t('q10_label')} help={t('q10_text')} error={errors.howHeard}>
            <RadioGroup name="howHeard" value={form.howHeard} onChange={(v) => update('howHeard', v)} options={[
              { value: 'referral', label: t('q10_opt_referral') },
              { value: 'social', label: t('q10_opt_social') },
              { value: 'material', label: t('q10_opt_material') },
              { value: 'event', label: t('q10_opt_event') },
              { value: 'other', label: t('q10_opt_other') },
            ]} />
            {form.howHeard === 'other' && (
              <input type="text" value={form.howHeardOther} onChange={(e) => update('howHeardOther', e.target.value)} className={`${inputClass} mt-2`} />
            )}
          </Field>
        </FormSection>

        {/* ── Section 3: Organizational Capacity ── */}
        <FormSection num="03" accent="gold" title={t('section3')}>
          <Field label={t('q11_label')} help={t('q11_text')} error={errors.contactMethod}>
            <RadioGroup name="contactMethod" value={form.contactMethod} onChange={(v) => update('contactMethod', v)} options={[
              { value: 'referral', label: t('q11_opt_referral') },
              { value: 'phone', label: t('q11_opt_phone') },
              { value: 'secure', label: t('q11_opt_secure') },
              { value: 'email', label: t('q11_opt_email') },
              { value: 'inperson', label: t('q11_opt_inperson') },
              { value: 'other', label: t('q11_opt_other') },
            ]} />
            <Field label={t('q11_details_label')} help={t('q11_details_text')} error={errors.contactDetails} noPad>
              <textarea value={form.contactDetails} onChange={(e) => update('contactDetails', e.target.value)} className={textareaClass} rows={2} />
            </Field>
          </Field>

          <Field label={t('q12_label')} help={t('q12_text')} error={errors.timeCommitment}>
            <RadioGroup name="timeCommitment" value={form.timeCommitment} onChange={(v) => update('timeCommitment', v)} options={[
              { value: '1-3', label: t('q12_opt_1') },
              { value: '3-5', label: t('q12_opt_2') },
              { value: '5-10', label: t('q12_opt_3') },
              { value: '10+', label: t('q12_opt_4') },
            ]} />
          </Field>

          <Field label={t('q13_label')} help={t('q13_text')} error={errors.skills}>
            <div className="space-y-2.5">
              {[
                ['writing', t('q13_opt_writing')],
                ['research', t('q13_opt_research')],
                ['design', t('q13_opt_design')],
                ['video', t('q13_opt_video')],
                ['organizing', t('q13_opt_organizing')],
                ['tech', t('q13_opt_tech')],
                ['fundraising', t('q13_opt_fundraising')],
                ['translation', t('q13_opt_translation')],
                ['other', t('q13_opt_other')],
              ].map(([value, label]) => (
                <label key={value} className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={form.skills.includes(value)} onChange={() => toggleSkill(value)} className="mt-1 accent-[#8a0000]" />
                  <span className="text-sm text-[#1a1a1a]">{label}</span>
                </label>
              ))}
              {form.skills.includes('translation') && (
                <input type="text" value={form.translationLanguages} onChange={(e) => update('translationLanguages', e.target.value)} className={inputClass} placeholder="Languages" />
              )}
              {form.skills.includes('other') && (
                <input type="text" value={form.skillsOther} onChange={(e) => update('skillsOther', e.target.value)} className={inputClass} />
              )}
            </div>
          </Field>

          <Field label={t('q14_label')} help={t('q14_text')} error={errors.experience}>
            <textarea value={form.experience} onChange={(e) => update('experience', e.target.value)} className={textareaClass} rows={3} />
          </Field>
        </FormSection>

        {/* ── Section 4: Self-Evaluation and Commitment ── */}
        <FormSection num="04" accent="red" title={t('section4')}>
          <Field label={t('q15_label')} help={t('q15_text')} error={errors.selfEvaluation}>
            <textarea value={form.selfEvaluation} onChange={(e) => update('selfEvaluation', e.target.value)} className={textareaClass} rows={4} />
          </Field>

          <Field label={t('q16_label')} help={t('q16_text')} error={errors.acceptsAssignments}>
            <RadioGroup name="acceptsAssignments" value={form.acceptsAssignments} onChange={(v) => update('acceptsAssignments', v)} options={[
              { value: 'yes', label: t('q16_opt_yes') },
              { value: 'discuss', label: t('q16_opt_discuss') },
              { value: 'no', label: t('q16_opt_no') },
            ]} />
          </Field>

          <Field label={t('q17_label')} help={t('q17_text')} error={errors.acceptedDemocraticCentralism}>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.acceptedDemocraticCentralism} onChange={(e) => update('acceptedDemocraticCentralism', e.target.checked)} className="mt-1 accent-[#8a0000]" />
              <span className="text-sm text-[#1a1a1a]">{t('q17_opt')}</span>
            </label>
          </Field>

          <Field label={t('q18_label')} help={t('q18_text')} error={errors.acceptedOath}>
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" checked={form.acceptedOath} onChange={(e) => update('acceptedOath', e.target.checked)} className="mt-1 accent-[#8a0000]" />
              <span className="text-sm text-[#1a1a1a]">{t('q18_opt')}</span>
            </label>
          </Field>

          <Field label={t('q19_label')} help={t('q19_text')} error={errors.motivation}>
            <textarea value={form.motivation} onChange={(e) => update('motivation', e.target.value)} className={textareaClass} rows={4} />
          </Field>
        </FormSection>

        {submitError && (
          <p className="text-[#8a0000] text-sm text-center mb-4 border-2 border-[#8a0000] px-4 py-2 font-semibold">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full border-2 border-[#0d0d0d] bg-[#8a0000] disabled:opacity-60 text-white font-extrabold py-4 text-sm tracking-wide uppercase transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#0d0d0d] disabled:hover:translate-y-0 disabled:hover:shadow-none"
        >
          {submitting ? t('submitting') : t('submit')}
        </button>

        <p className="text-center text-[11px] text-[#9a9284] mt-5 tracking-wide">
          {t('formFooterNote')}
        </p>
      </form>
    </div>
  );
}

const inputClass =
  'w-full bg-white border-2 border-[#0d0d0d]/15 focus:border-[#0d0d0d] focus:outline-none text-[#1a1a1a] text-sm px-3 py-2.5 transition-colors';
const textareaClass = `${inputClass} resize-y`;

const accentBar: Record<string, string> = {
  red: 'bg-[#8a0000]',
  black: 'bg-[#0d0d0d]',
  gold: 'bg-[#B8860B]',
};
const accentText: Record<string, string> = {
  red: 'text-[#8a0000]',
  black: 'text-[#0d0d0d]',
  gold: 'text-[#0d0d0d] bg-[#B8860B]',
};

function FormSection({
  num, title, accent, children,
}: { num: string; title: string; accent: 'red' | 'black' | 'gold'; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <div className="flex items-center gap-3 mb-0">
        <span className={`shrink-0 w-9 h-9 flex items-center justify-center font-black text-xs border-2 border-[#0d0d0d] ${accentText[accent]}`}>
          {num}
        </span>
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0d0d0d]">{title}</h2>
      </div>
      <div className={`h-1.5 ${accentBar[accent]} ml-[3px] w-9`} />
      <div className="border-2 border-[#0d0d0d] bg-white px-5 py-7 md:px-7 mt-4 space-y-7">
        {children}
      </div>
    </section>
  );
}

function Field({
  label, help, error, children, noPad = false,
}: { label: string; help?: string; error?: boolean; children: React.ReactNode; noPad?: boolean }) {
  return (
    <div data-error={error ? 'true' : 'false'} className={error ? `ring-2 ring-[#8a0000]/60 ${noPad ? '' : 'p-3 -m-3'}` : ''}>
      <label className="block text-sm font-bold text-[#0d0d0d] mb-1">{label}</label>
      {help && <p className="text-xs text-[#6b6458] mb-2 leading-relaxed">{help}</p>}
      {children}
      {error && <p className="text-xs text-[#8a0000] font-semibold mt-1.5">Required</p>}
    </div>
  );
}

function RadioGroup({
  name, value, onChange, options,
}: { name: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label key={opt.value} className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="radio"
            name={name}
            checked={value === opt.value}
            onChange={() => onChange(opt.value)}
            className="mt-1 accent-[#8a0000]"
          />
          <span className="text-sm text-[#1a1a1a]">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
