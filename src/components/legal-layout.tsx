'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ShieldCheck, FileText, Lock, ScrollText, Archive } from 'lucide-react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { usePathname } from 'next/navigation';

interface LegalLayoutProps {
  children: React.ReactNode;
}

export function LegalLayout({ children }: LegalLayoutProps) {
  const pathname = usePathname() ?? '';
  const navItems = [
    { href: '/legal/terms', label: 'Conditions de service', icon: FileText },
    { href: '/legal/privacy', label: 'Confidentialité', icon: ShieldCheck },
    { href: '/legal/security', label: 'Sécurité', icon: Lock },
    { href: '/legal/data-deletion', label: 'Suppression des données', icon: Archive },
    { href: '/legal/cookies', label: 'Cookies', icon: ScrollText },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100">
      {/* Header - Responsive */}
      <header className="sticky top-0 z-50 border-b border-slate-200/50 bg-white/95 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-2 sm:h-16 sm:gap-4">
            {/* Logo */}
            <Link href="/" className="flex shrink-0 items-center gap-2 transition-opacity hover:opacity-80">
              <Image 
                src="/icons/icon-192.png" 
                alt="Budget Pro" 
                width={28} 
                height={28}
                className="rounded-lg sm:h-8 sm:w-8"
              />
              <span className="text-base font-bold text-slate-900 sm:text-lg">Budget Pro</span>
            </Link>

            {/* Navigation - Responsive */}
            <div className="flex items-center gap-2 sm:gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow-md sm:gap-2 sm:px-4 sm:py-2 sm:text-sm"
                aria-label="Retour à la page d'accueil"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Retour à l'accueil</span>
                <span className="sm:hidden">Accueil</span>
              </Link>
              <div className="shrink-0">
                <LanguageSwitcher compact />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-6 px-4 sm:py-12 lg:py-16">
        <div className="mx-auto max-w-7xl lg:flex lg:gap-10">
          {/* Sidebar Navigation - Horizontal scroll sur mobile, fixe sur desktop */}
          <aside className="mb-6 lg:mb-0 lg:w-64 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-lg backdrop-blur lg:rounded-3xl lg:p-5">
              <div className="mb-4 lg:mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 lg:tracking-[0.3em]">Legal</p>
                <h5 className="text-base font-semibold text-slate-900 lg:text-lg">Documentation</h5>
              </div>
              
              {/* Navigation scrollable horizontalement sur mobile */}
              <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:space-y-1 lg:overflow-visible lg:pb-0" style={{scrollbarWidth: 'thin'}}>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition lg:gap-3 lg:rounded-2xl lg:text-sm ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 shadow-sm'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="whitespace-nowrap">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
          
          <section className="flex-1 min-w-0">{children}</section>
        </div>
      </main>

      {/* Footer - Responsive */}
      <footer className="border-t border-slate-200 bg-white/60 py-6 sm:py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-3 text-center text-sm text-slate-700 sm:gap-4 md:flex-row md:items-center md:justify-between md:text-left">
            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-start">
              <span className="text-xs sm:text-sm">© {new Date().getFullYear()} Budget Pro</span>
              <span className="text-slate-400">•</span>
              <a
                href="https://www.beonweb.cm"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-slate-700 underline-offset-4 transition hover:text-blue-600 sm:text-sm"
              >
                Propulsé par BEONWEB
              </a>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-1 text-xs sm:gap-2 sm:text-sm md:justify-end">
              <Link
                href="/legal/privacy"
                className="text-slate-600 transition hover:text-blue-600"
              >
                Confidentialité
              </Link>
              <span className="text-slate-400">•</span>
              <Link
                href="/legal/terms"
                className="text-slate-600 transition hover:text-blue-600"
              >
                Conditions
              </Link>
              <span className="text-slate-400">•</span>
              <Link
                href="/legal/security"
                className="text-slate-600 transition hover:text-blue-600"
              >
                Sécurité
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
