'use client';
import { useEffect, type ReactNode } from 'react';
import {
  Car,
  CreditCard,
  DollarSign,
  Landmark,
  PartyPopper,
  ShoppingBag,
  Utensils,
  HeartPulse,
  LayoutGrid,
  List,
  Folder,
  Target,
  Settings,
  FileBarChart,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useUser } from '@/firebase';

import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isUserLoading, userProfile } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const isFrench = userProfile?.locale === 'fr-CM';

  const navItems = [
    { href: '/', label: isFrench ? 'Tableau de bord' : 'Dashboard', icon: LayoutGrid },
    { href: '/transactions', label: isFrench ? 'Transactions' : 'Transactions', icon: List },
    { href: '/categories', label: isFrench ? 'Catégories' : 'Categories', icon: Folder },
    { href: '/goals', label: isFrench ? 'Objectifs' : 'Goals', icon: Target },
    { href: '/reports', label: isFrench ? 'Rapports' : 'Reports', icon: FileBarChart },
    { href: '/settings', label: isFrench ? 'Paramètres' : 'Settings', icon: Settings },
  ];

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-2xl font-semibold">{isFrench ? 'Chargement de votre tableau de bord...' : 'Loading your dashboard...'}</div>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Logo />
          </div>
          <div className="flex-1">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              {navItems.map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
                    { 'bg-muted text-primary': pathname === item.href }
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          {/* Add mobile navigation trigger here if needed */}
          <div className="w-full flex-1">
            {/* Can add a search bar or other header content here */}
          </div>
          <UserNav />
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
