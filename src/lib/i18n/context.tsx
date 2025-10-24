'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { translations, Locale } from './translations';

type TranslationValue = string | Record<string, any>;

interface I18nContextType {
  locale: Locale;
  t: (key: string) => string;
  formatMessage: (key: string, params: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ 
  children, 
  locale = 'fr' 
}: { 
  children: ReactNode; 
  locale?: Locale;
}) {
  const t = (key: string): string => {
    const keys = key.split('.');
    let value: TranslationValue = translations[locale];
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        // Fallback to key if translation not found
        console.warn(`Translation missing for key: ${key} in locale: ${locale}`);
        return key;
      }
    }
    
    return typeof value === 'string' ? value : key;
  };

  const formatMessage = (key: string, params: Record<string, string | number>): string => {
    let message = t(key);
    
    // Replace {param} with values
    Object.entries(params).forEach(([param, value]) => {
      message = message.replace(`{${param}}`, String(value));
    });
    
    return message;
  };

  return (
    <I18nContext.Provider value={{ locale, t, formatMessage }}>
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
