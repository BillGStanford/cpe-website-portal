'use client';

import Image from 'next/image';
import { useI18n } from '@/lib/i18n-context';

export function SiteHeader() {
  const { t, toggleLang } = useI18n();

  return (
    <>
      <div className="bg-[#0d0d0d] text-white border-b-[3px] border-[#8a0000]">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-2.5 flex items-center gap-3 text-xs md:text-sm">
          <span className="bg-[#8a0000] text-white px-2.5 py-1 font-extrabold uppercase tracking-wider text-[10px] shrink-0">
            {t('siteHeaderBadge' as any)}
          </span>
          <p className="text-[#c9c2b2] truncate">{t('tagline')}</p>
        </div>
      </div>

      <header className="sticky top-0 z-20 bg-[#faf8f5] border-b-2 border-[#0d0d0d]">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Party logo"
              width={42}
              height={42}
              className="shrink-0"
              priority
            />
            <span className="text-[#0d0d0d] font-black text-sm md:text-lg uppercase tracking-tight leading-none">
              {t('siteName')}
            </span>
          </div>

          <button
            onClick={toggleLang}
            aria-label="Toggle language"
            className="border-2 border-[#0d0d0d] text-[#0d0d0d] text-xs font-extrabold uppercase tracking-wide px-3.5 py-2 hover:bg-[#0d0d0d] hover:text-white transition-colors"
          >
            {t('langToggle')}
          </button>
        </div>
      </header>
    </>
  );
}