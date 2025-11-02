'use client';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
  Menu,
  Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { useUser } from '@/firebase';

import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
// ...existing code...
import { ThemeToggle } from '@/components/theme-toggle';
import { QuickAddShortcuts } from './quick-add-shortcuts';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isUserLoading, userProfile } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isFrench = userProfile?.locale === 'fr-CM';

  // Optimisation : mémoriser les items de navigation
  const navItems = useMemo(
    () => [
      // Nouvel ordre demandé : Tableau de bord, Transactions, Catégories, Objectifs, Dettes, Analyse IA, Rapports, Paramètres
  { href: '/dashboard', label: isFrench ? 'Tableau de bord' : 'Dashboard', icon: LayoutGrid, dataTour: undefined },
  { href: '/transactions', label: isFrench ? 'Transactions' : 'Transactions', icon: List, dataTour: undefined },
  { href: '/categories', label: isFrench ? 'Catégories' : 'Categories', icon: Folder, dataTour: undefined },
  { href: '/goals', label: isFrench ? 'Objectifs' : 'Goals', icon: Target, dataTour: undefined },
  { href: '/debts', label: isFrench ? 'Dettes' : 'Debts', icon: Landmark, dataTour: undefined },
  { href: '/ai-insights', label: isFrench ? 'Analyse IA' : 'AI Insights', icon: Sparkles, dataTour: undefined },
  { href: '/reports', label: isFrench ? 'Rapports' : 'Reports', icon: FileBarChart, dataTour: 'nav-reports' },
  { href: '/settings', label: isFrench ? 'Paramètres' : 'Settings', icon: Settings, dataTour: undefined },
    ],
    [isFrench]
  );

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center h-screen" role="status" aria-live="polite">
        <div className="text-2xl font-semibold">
          {isFrench ? 'Chargement de votre tableau de bord...' : 'Loading your dashboard...'}
        </div>
        <span className="sr-only">
          {isFrench ? 'Chargement en cours, veuillez patienter' : 'Loading in progress, please wait'}
        </span>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Sidebar glassmorphism */}
      <aside 
        id="main-navigation"
        className="hidden md:block bg-gradient-to-br from-white/60 via-blue-50/80 to-indigo-100/60 backdrop-blur-xl shadow-xl border-0 rounded-r-3xl" 
        aria-label={isFrench ? "Navigation principale" : "Main navigation"}
      >
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-16 items-center border-b px-6">
            <Logo className="animate-spin-slow h-10 w-auto" />
          </div>
          <div className="flex-1 pt-4">
            <nav 
              className="grid items-start px-2 text-base font-semibold lg:px-4 gap-2"
              aria-label={isFrench ? "Menu principal" : "Main menu"}
            >
              {navItems.map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  data-tour={item.dataTour}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-gray-700 transition-all hover:bg-blue-50 hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2',
                    { 'bg-blue-100 text-blue-700 shadow-lg': pathname === item.href }
                  )}
                >
                  <item.icon className="h-5 w-5" aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </aside>
      
      <div className="flex flex-col">
        {/* Header sticky glassmorphism */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-gradient-to-r from-white/60 via-blue-50/80 to-indigo-100/60 backdrop-blur-xl px-6 shadow-md">
          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden min-h-[44px] min-w-[44px]"
                aria-label={isFrench ? "Ouvrir le menu" : "Open menu"}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col p-0 w-[280px]">
              <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Logo />
              </div>
              <nav 
                className="flex-1 grid items-start px-2 py-4 text-sm font-medium gap-1"
                aria-label={isFrench ? "Menu de navigation mobile" : "Mobile navigation menu"}
              >
                {navItems.map(item => (
                  <Link
                    key={item.label}
                    href={item.href}
                    data-tour={item.dataTour}
                    onClick={() => setIsMobileMenuOpen(false)}
                    aria-current={pathname === item.href ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-muted-foreground transition-all hover:text-primary hover:bg-muted min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                      { 'bg-muted text-primary': pathname === item.href }
                    )}
                  >
                    <item.icon className="h-5 w-5" aria-hidden="true" />
                    <span className="text-base">{item.label}</span>
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          
          <div className="w-full flex-1">
            {/* Can add a search bar or other header content here */}
          </div>
          <ThemeToggle isFrench={isFrench} />
          <UserNav premium />
        </header>
        <main id="main-content" className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6" tabIndex={-1}>
          {children}
        </main>
        <QuickAddShortcuts />
      </div>
      <style jsx global>{`
        .animate-spin-slow {
          animation: spin 6s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
