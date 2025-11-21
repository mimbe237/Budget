'use client';

import React, { createContext, useContext, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { translations, Locale } from './translations';

type TranslationValue = string | Record<string, any>;

interface I18nContextType {
  locale: Locale;
  t: (key: string) => string;
  formatMessage: (key: string, params: Record<string, string | number>) => string;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ 
  children, 
  locale = 'fr',
  onLocaleChange,
}: { 
  children: ReactNode; 
  locale?: Locale;
  onLocaleChange?: (locale: Locale) => void;
}) {
  const [currentLocale, setCurrentLocale] = useState<Locale>(locale);

  useEffect(() => {
    setCurrentLocale(locale);
  }, [locale]);

  const setLocale = useCallback((nextLocale: Locale) => {
    setCurrentLocale(nextLocale);
    onLocaleChange?.(nextLocale);
  }, [onLocaleChange]);

  const translate = useCallback((key: string): string => {
    const keys = key.split('.');
    let value: TranslationValue = translations[currentLocale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to key if translation not found
        console.warn(`Translation missing for key: ${key} in locale: ${currentLocale}`);
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  }, [currentLocale]);

  const formatMessage = useCallback((key: string, params: Record<string, string | number>): string => {
    let message = translate(key);
    
    // Replace {param} with values
    Object.entries(params).forEach(([param, value]) => {
      message = message.replace(`{${param}}`, String(value));
    });
    
    return message;
  }, [translate]);

  const value = useMemo(() => ({
    locale: currentLocale,
    t: translate,
    formatMessage,
    setLocale,
  }), [currentLocale, translate, formatMessage, setLocale]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within I18nProvider');
  }
  return context;
}
