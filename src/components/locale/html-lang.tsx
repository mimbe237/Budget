"use client";

import { useEffect } from 'react';
import { useTranslation } from '@/lib/i18n';

export function HtmlLangSync() {
  const { locale } = useTranslation();

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return null;
}
