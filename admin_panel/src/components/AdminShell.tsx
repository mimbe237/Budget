"use client";
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import ThemeToggle from './ThemeToggle';
import AdminGuard from './AdminGuard';

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <AdminGuard>
      <div className="relative min-h-screen supports-[height:100dvh]:min-h-[100dvh] text-[var(--foreground)] bg-[var(--background)]">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-32 top-10 h-72 w-72 rounded-full bg-[radial-gradient(circle_at_center,rgba(62,99,221,0.22),transparent_55%)] blur-3xl" />
          <div className="absolute right-10 top-52 h-80 w-80 rounded-full bg-[radial-gradient(circle_at_center,rgba(124,58,237,0.2),transparent_55%)] blur-3xl" />
        </div>

        <div className="relative flex">
          <Sidebar />

          <div className="flex min-h-screen supports-[height:100dvh]:min-h-[100dvh] flex-1 flex-col">
            <header className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-white/60 bg-white/80 px-4 py-3 backdrop-blur-md dark:border-gray-800 dark:bg-gray-900/75">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand)] to-[var(--brand-secondary)] text-white shadow-lg shadow-[rgba(62,99,221,0.32)]">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--muted)]">
                    BudgetPro • Pilotage
                  </p>
                  <p className="text-sm font-semibold text-[var(--foreground)]">
                    Vue administrateur sécurisée
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col text-right leading-tight">
                  <span className="text-[11px] text-[var(--muted)]">Connecté</span>
                  <span className="text-sm font-semibold text-[var(--foreground)]">
                    {user?.email || 'Administrateur'}
                  </span>
                </div>
                <ThemeToggle className="shrink-0" />
              </div>
            </header>

            <main className="relative z-10 flex-1 min-h-0 overflow-auto p-4 md:p-8">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AdminGuard>
  );
}
