'use client';

import { useEffect, useState, useCallback, ReactNode } from 'react';
import { useUser } from '@/firebase';
import { I18nProvider, Locale } from '@/lib/i18n';

const DEFAULT_LOCALE: Locale = 'fr';

function normalizeLocale(value?: string | null): Locale {
  if (!value) return DEFAULT_LOCALE;
  const lower = value.toLowerCase();
  if (lower.startsWith('en')) return 'en';
  return 'fr';
}

export function I18nProviderWrapper({ children }: { children: ReactNode }) {
  const { userProfile } = useUser();
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  // Charger le locale depuis localStorage (client uniquement)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = normalizeLocale(localStorage.getItem('preferredLocale'));
    if (stored !== locale) {
      setLocale(stored);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mettre à jour lorsque le profil utilisateur change
  useEffect(() => {
    if (!userProfile?.locale) return;
    const profileLocale = normalizeLocale(userProfile.locale);
    setLocale(current => (current === profileLocale ? current : profileLocale));
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLocale', profileLocale);
    }
  }, [userProfile?.locale]);

  const handleLocaleChange = useCallback((next: Locale) => {
    setLocale(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('preferredLocale', next);
    }
  }, []);

  return (
    <I18nProvider locale={locale} onLocaleChange={handleLocaleChange}>
      {children}
    </I18nProvider>
  );
}
