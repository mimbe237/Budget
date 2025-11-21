'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileBarChart, Landmark, LayoutGrid, List, Target } from 'lucide-react';

import { cn } from '@/lib/utils';
import { useUser } from '@/firebase';

type Tab = {
  href: string;
  label: string;
  icon: typeof LayoutGrid;
};

const BASE_TABS: Tab[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/transactions', label: 'Transactions', icon: List },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/debts', label: 'Debts', icon: Landmark },
  { href: '/reports', label: 'Reports', icon: FileBarChart },
];

export function AppBottomNav() {
  const pathname = usePathname();
  const { userProfile } = useUser();
  const isFrench = userProfile?.locale === 'fr-CM';

  const tabs = BASE_TABS.map((tab) => {
    if (!isFrench) return tab;
    switch (tab.href) {
      case '/dashboard':
        return { ...tab, label: 'Accueil' };
      case '/transactions':
        return { ...tab, label: 'Mouvements' };
      case '/goals':
        return { ...tab, label: 'Objectifs' };
      case '/debts':
        return { ...tab, label: 'Dettes' };
      case '/reports':
        return { ...tab, label: 'Rapports' };
      default:
        return tab;
    }
  });

  return (
    <nav
      aria-label={isFrench ? 'Navigation principale mobile' : 'Primary mobile navigation'}
      className="fixed inset-x-0 bottom-0 z-40 lg:hidden"
    >
      <div
        className="bottom-nav-blur mx-auto flex max-w-3xl items-center justify-between gap-1 px-3"
        style={{
          paddingTop: '0.35rem',
          paddingBottom: `calc(0.35rem + var(--safe-area-bottom))`,
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            pathname === tab.href || (tab.href !== '/dashboard' && pathname?.startsWith(tab.href));

          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-label={tab.label}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex flex-1 flex-col items-center gap-1 rounded-2xl px-2 py-1.5 text-xs font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
                isActive
                  ? 'text-primary focus-visible:ring-primary'
                  : 'text-muted-foreground focus-visible:ring-muted-foreground'
              )}
            >
              <span
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-2xl transition-colors',
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="text-[11px]">{tab.label}</span>
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-6 -bottom-[3px] h-1 rounded-full bg-primary/80"
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
