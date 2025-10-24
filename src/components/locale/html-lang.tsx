"use client";

import { useEffect } from 'react';
import { useUser } from '@/firebase';

export function HtmlLangSync() {
  const { userProfile } = useUser();

  useEffect(() => {
    const lang = userProfile?.locale === 'fr-CM' ? 'fr' : userProfile?.locale === 'en-US' ? 'en' : 'en';
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
    }
  }, [userProfile?.locale]);

  return null;
}
