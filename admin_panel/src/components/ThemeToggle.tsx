"use client";
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('bp-theme') : null;
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      setDark(true);
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('bp-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('bp-theme', 'light');
    }
  };

  return (
    <button
      onClick={toggle}
      aria-label="Basculer thème"
      className={`group inline-flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-black/5 transition hover:-translate-y-[1px] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/60 ${dark ? 'bg-gradient-to-r from-gray-900 to-gray-800 text-slate-50' : 'bg-white/90 text-slate-800'} ${className}`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${dark ? 'bg-white/10 text-amber-300' : 'bg-[var(--brand)]/12 text-[var(--brand)]'} shadow-inner`}
      >
        {dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </span>
      <span className="flex flex-col leading-tight text-left">
        <span className="text-[11px] uppercase tracking-[0.16em] text-[var(--muted)]">
          Thème
        </span>
        <span>{dark ? 'Nuit active' : 'Mode clair'}</span>
      </span>
    </button>
  );
}
