'use client';

import { useUser } from '@/firebase';
import { I18nProvider } from '@/lib/i18n';
import { ReactNode } from 'react';

export function I18nProviderWrapper({ children }: { children: ReactNode }) {
  const { userProfile } = useUser();
  
  // Extract locale from userProfile (e.g., 'fr-CM' -> 'fr', 'en-US' -> 'en')
  const locale = userProfile?.locale 
    ? (userProfile.locale.split('-')[0] as 'fr' | 'en')
    : 'fr';

  return (
    <I18nProvider locale={locale}>
      {children}
    </I18nProvider>
  );
}
