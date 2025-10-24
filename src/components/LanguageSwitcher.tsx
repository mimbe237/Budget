"use client";

import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const LOCALES = [
  { value: 'fr-CM', label: 'Français (CM)' },
  { value: 'en-US', label: 'English (US)' },
];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const [locale, setLocale] = useState<string>('fr-CM');

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('preferredLocale') : null;
    if (saved) setLocale(saved);
  }, []);

  const handleChange = (val: string) => {
    setLocale(val);
    if (typeof window !== 'undefined') localStorage.setItem('preferredLocale', val);
  };

  return (
    <div className={compact ? 'w-36' : 'w-full'}>
      <Select value={locale} onValueChange={handleChange}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LOCALES.map(l => (
            <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
