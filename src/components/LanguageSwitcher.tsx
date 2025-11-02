"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Locale, useTranslation } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const LOCALES: Array<{ value: Locale; label: string; shortLabel: string; flag: string }> = [
  { value: 'fr', label: 'Français', shortLabel: 'FR', flag: '🇫🇷' },
  { value: 'en', label: 'English', shortLabel: 'EN', flag: '🇺🇸' },
];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useTranslation();

  const handleChange = (val: string) => {
    const normalized = val as Locale;
    if (normalized !== locale) {
      setLocale(normalized);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {LOCALES.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => handleChange(option.value)}
            className={cn(
              'flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium transition',
              locale === option.value
                ? 'border-primary bg-primary text-white shadow-sm'
                : 'border-transparent bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
            aria-pressed={locale === option.value}
          >
            <span aria-hidden className="text-base leading-none">
              {option.flag}
            </span>
            <span>{option.shortLabel}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-full">
      <Select value={locale} onValueChange={handleChange}>
        <SelectTrigger className="h-9">
          <SelectValue placeholder={LOCALES[0].label} />
        </SelectTrigger>
        <SelectContent>
          {LOCALES.map(option => (
            <SelectItem key={option.value} value={option.value}>
              <div className="flex items-center gap-2">
                <span aria-hidden className="text-base leading-none">
                  {option.flag}
                </span>
                <span>{option.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
