'use client';

import { createContext, useContext, useState, useMemo, type ReactNode } from 'react';
import { translations, type Lang, type TranslationKey } from './translations';

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('EN');

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      setLang,
      toggleLang: () => setLang((prev) => (prev === 'EN' ? 'AM' : 'EN')),
      t: (key: TranslationKey) => translations[lang][key],
    }),
    [lang]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within an I18nProvider');
  return ctx;
}
