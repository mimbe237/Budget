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
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200/50 bg-white/95 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <Image 
                src="/icons/icon-192.png" 
                alt="Budget Pro" 
                width={32} 
                height={32}
                className="rounded-lg"
              />
              <span className="text-lg font-bold text-slate-900">Budget Pro</span>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à l'accueil
              </Link>
              <LanguageSwitcher compact />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-12 px-4 sm:py-16">
        <div className="mx-auto max-w-7xl lg:flex lg:gap-10">
          <aside className="mb-8 lg:mb-0 lg:w-64 lg:sticky lg:top-24">
            <div className="rounded-3xl border border-slate-200 bg-white/70 p-5 shadow-lg backdrop-blur">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Legal</p>
                  <h5 className="text-lg font-semibold text-slate-900">Documentation</h5>
                </div>
              </div>
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 shadow-inner shadow-blue-100'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </aside>
          <section className="flex-1">{children}</section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/60 py-8">
        <div className="mx-auto max-w-6xl px-4">
          <div className="flex flex-col gap-4 text-sm text-slate-700 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
              <span>© {new Date().getFullYear()} Budget Pro</span>
              <span className="text-slate-400">•</span>
              <a
                href="https://www.beonweb.cm"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-slate-900 underline-offset-4 transition text-slate-700 hover:text-blue-600"
              >
                Propulsé par BEONWEB
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-1 text-sm justify-center md:justify-end">
              <Link
                href="/legal/privacy"
                className="text-slate-600 transition hover:text-blue-600"
              >
                Confidentialité
              </Link>
              <span className="text-slate-400 mx-1">•</span>
              <Link
                href="/legal/terms"
                className="text-slate-600 transition hover:text-blue-600"
              >
                Conditions
              </Link>
              <span className="text-slate-400 mx-1">•</span>
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
