'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const LANGUAGES = [
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
];

interface LanguageSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export function LanguageSelect({ value, onChange, error, className = "" }: LanguageSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedLanguage = LANGUAGES.find(lang => lang.code === value);

  const handleSelect = (language: typeof LANGUAGES[0]) => {
    onChange(language.code);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 border rounded-md text-left bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
      >
        <div className="flex items-center gap-3">
          {selectedLanguage ? (
            <>
              <span className="text-lg">{selectedLanguage.flag}</span>
              <span className="text-sm font-medium text-gray-900">
                {selectedLanguage.name}
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-500">Sélectionner une langue</span>
          )}
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto overscroll-contain sm:max-w-none max-w-[90vw]">
          {LANGUAGES.map((language) => (
            <button
              key={language.code}
              type="button"
              onClick={() => handleSelect(language)}
              className={`w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none ${
                selectedLanguage?.code === language.code ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
              }`}
            >
              <span className="text-lg">{language.flag}</span>
              <span className="text-sm font-medium">
                {language.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}