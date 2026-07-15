'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useI18n } from '@/lib/i18n-context';
import { MembershipForm } from './MembershipForm';

export function HomeClient({ pollId }: { pollId: string | null }) {
  const { t } = useI18n();
  const [started, setStarted] = useState(false);

  if (started && pollId) {
    return <MembershipForm pollId={pollId} />;
  }

  return (
    <main className="bg-[#faf8f5]">
      {/* ── Hero ─────────────────────────────────────────────────────────
          Replace /hero-banner.jpg with your real image at /public/.
      ──────────────────────────────────────────────────────────────── */}
      <section className="relative border-b-2 border-[#0d0d0d] overflow-hidden">
        <div className="absolute inset-0 bg-[#0d0d0d]">
          <Image
            src="/hero-banner.jpg"
            alt=""
            fill
            priority
            className="object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d0d]/70 via-[#0d0d0d]/60 to-[#0d0d0d]" />
        </div>

        <div className="relative flex flex-col items-center justify-center px-4 py-24 md:py-32 text-center">
          <Image
            src="/logo2.png"
            alt="Party logo"
            width={84}
            height={84}
            className="mb-8"
            priority
          />

          <span className="inline-block bg-[#8a0000] text-white px-3 py-1.5 font-extrabold uppercase tracking-[0.15em] text-[11px] mb-6">
            {t('tagline')}
          </span>

          <h1 className="font-black uppercase text-3xl md:text-5xl leading-[0.95] tracking-tight text-white max-w-2xl mb-6">
            {t('siteName')}
          </h1>

          <p className="max-w-xl text-[#e8e2d4] text-base md:text-lg mb-10 leading-relaxed">
            {t('heroBody')}
          </p>

          {pollId ? (
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setStarted(true);
              }}
              className="inline-block border-2 border-white bg-[#8a0000] text-white font-extrabold uppercase tracking-wide px-10 py-4 text-sm transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#B8860B]"
            >
              {t('joinStruggle')}
            </a>
          ) : (
            <p className="text-[#c9c2b2] text-sm border-2 border-white/20 px-5 py-3">
              {t('heroNoActivePoll')}
            </p>
          )}
        </div>
      </section>

      {/* ── Who We Are ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white border-b-2 border-[#0d0d0d]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <span className="shrink-0 w-9 h-9 flex items-center justify-center font-black text-xs border-2 border-[#0d0d0d] text-[#8a0000]">
              01
            </span>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0d0d0d]">
              {t('whoWeAreLabel')}
            </h2>
          </div>
          <div className="h-1.5 bg-[#8a0000] ml-[3px] w-9 mb-8" />
          <p className="text-[#1a1a1a] leading-relaxed mb-4">
            {t('whoWeAreBody1')}
          </p>
          <p className="text-[#1a1a1a] leading-relaxed">
            {t('whoWeAreBody2')}
          </p>
        </div>
      </section>

      {/* ── What We Call For ─────────────────────────────────────────────
          Replace /call-image.jpg with your real image at /public/.
      ──────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-[#faf8f5] border-b-2 border-[#0d0d0d]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="shrink-0 w-9 h-9 flex items-center justify-center font-black text-xs border-2 border-[#0d0d0d] text-[#0d0d0d]">
                02
              </span>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0d0d0d]">
                {t('callForLabel')}
              </h2>
            </div>
            <div className="h-1.5 bg-[#0d0d0d] ml-[3px] w-9 mb-8" />

            <ul className="space-y-5">
              <DemandRow title={t('demand1Title')} body={t('demand1Body')} />
              <DemandRow title={t('demand2Title')} body={t('demand2Body')} />
              <DemandRow title={t('demand3Title')} body={t('demand3Body')} />
              <DemandRow title={t('demand4Title')} body={t('demand4Body')} />
            </ul>
          </div>

          <div className="relative w-full aspect-[4/3] border-2 border-[#0d0d0d]">
            <Image
              src="/call-image.jpg"
              alt={t('callForImageAlt')}
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      {/* ── Why Join ─────────────────────────────────────────────────────
          Replace /join-image.jpg with your real image at /public/.
      ──────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-white border-b-2 border-[#0d0d0d]">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <span className="shrink-0 w-9 h-9 flex items-center justify-center font-black text-xs border-2 border-[#0d0d0d] text-[#8a0000]">
              03
            </span>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0d0d0d]">
              {t('whyJoinLabel')}
            </h2>
          </div>
          <div className="h-1.5 bg-[#8a0000] ml-[3px] w-9 mb-10" />

          <div className="grid md:grid-cols-5 gap-10 items-start">
            <div className="md:col-span-2 relative w-full aspect-square border-2 border-[#0d0d0d]">
              <Image
                src="/join-image.jpg"
                alt={t('whyJoinImageAlt')}
                fill
                className="object-cover"
              />
            </div>

            <div className="md:col-span-3 grid gap-6 sm:grid-cols-2">
              <ReasonCard num="I." title={t('reason1Title')} body={t('reason1Body')} />
              <ReasonCard num="II." title={t('reason2Title')} body={t('reason2Body')} />
              <ReasonCard num="III." title={t('reason3Title')} body={t('reason3Body')} />
              <ReasonCard num="IV." title={t('reason4Title')} body={t('reason4Body')} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Path to Membership ───────────────────────────────────────── */}
      <section className="py-20 px-4 bg-[#faf8f5]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <span className="shrink-0 w-9 h-9 flex items-center justify-center font-black text-xs border-2 border-[#0d0d0d] text-[#0d0d0d] bg-[#B8860B]">
              04
            </span>
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-[#0d0d0d]">
              {t('pathLabel')}
            </h2>
          </div>
          <div className="h-1.5 bg-[#B8860B] ml-[3px] w-9 mb-10" />

          <ol className="space-y-6">
            <StepRow n="1" title={t('step1Title')} body={t('step1Body')} />
            <StepRow n="2" title={t('step2Title')} body={t('step2Body')} />
            <StepRow n="3" title={t('step3Title')} body={t('step3Body')} />
          </ol>

          {pollId && (
            <div className="mt-12 text-center">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setStarted(true);
                }}
                className="inline-block border-2 border-[#0d0d0d] bg-[#0d0d0d] text-white font-extrabold uppercase tracking-wide px-8 py-3.5 text-sm transition-all hover:-translate-y-0.5 hover:shadow-[4px_4px_0px_#8a0000]"
              >
                {t('beginApplication')}
              </a>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function DemandRow({ title, body }: { title: string; body: string }) {
  return (
    <li className="border-l-4 border-[#8a0000] pl-4">
      <h3 className="font-extrabold uppercase text-sm text-[#0d0d0d] mb-1 tracking-wide">{title}</h3>
      <p className="text-sm text-[#4a4438] leading-relaxed">{body}</p>
    </li>
  );
}

function ReasonCard({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <div className="border-2 border-[#0d0d0d] bg-[#faf8f5] p-5">
      <span className="block font-black text-[#8a0000] text-base mb-1.5">{num}</span>
      <h3 className="font-extrabold uppercase text-xs text-[#0d0d0d] mb-1.5 tracking-wide">{title}</h3>
      <p className="text-xs text-[#4a4438] leading-relaxed">{body}</p>
    </div>
  );
}

function StepRow({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <li className="flex gap-5">
      <span className="shrink-0 w-10 h-10 rounded-full border-2 border-[#0d0d0d] flex items-center justify-center font-black text-sm text-[#0d0d0d]">
        {n}
      </span>
      <div>
        <h3 className="font-extrabold uppercase text-sm text-[#0d0d0d] mb-1 tracking-wide">{title}</h3>
        <p className="text-sm text-[#4a4438] leading-relaxed">{body}</p>
      </div>
    </li>
  );
}