"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FileSpreadsheet, LogOut, Radio, Languages } from 'lucide-react';
import Logo from './Logo';
import { auth } from '@/lib/firebase';

const items = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
  { href: '/admin/export', label: 'Export', icon: FileSpreadsheet },
  { href: '/admin/translations', label: 'Traductions', icon: Languages },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:flex-col">
      <div className="sticky top-0 flex h-screen w-[18rem] flex-col overflow-hidden border-r border-white/60 bg-white/90 backdrop-blur-xl dark:border-gray-800/80 dark:bg-gray-950/70">
        <div className="flex items-center justify-between border-b border-white/60 px-5 py-4 dark:border-gray-800/80">
          <div className="flex items-center gap-3">
            <Logo variant="icon" size="md" className="drop-shadow-md" />
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">BudgetPro</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Control Center</p>
            </div>
          </div>
          <span className="rounded-full bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm">
            Admin
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-gradient-to-r from-[var(--brand)] to-[var(--brand-secondary)] text-white shadow-lg shadow-[rgba(62,99,221,0.22)]'
                    : 'text-gray-700 dark:text-gray-200 hover:-translate-x-1 hover:bg-gray-100/80 dark:hover:bg-gray-800/70'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-[var(--brand)] dark:group-hover:text-[var(--brand)]'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-white/60 px-4 py-4 dark:border-gray-800/80">
          <div className="rounded-xl border border-white/70 bg-gradient-to-br from-white to-[var(--surface-strong)] px-4 py-3 shadow-sm dark:border-gray-800 dark:from-gray-900 dark:to-gray-800">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--brand)]/10 text-[var(--brand)]">
                <Radio className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Statut</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">En ligne & sécurisé</p>
              </div>
            </div>
          </div>

          <button
            onClick={async () => { await auth.signOut(); window.location.href = '/admin/login'; }}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-rose-500/25 transition hover:brightness-110"
          >
            <LogOut className="h-4 w-4" /> Déconnexion
          </button>
        </div>
      </div>
    </aside>
  );
}
