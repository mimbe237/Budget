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
  const navItems = useMemo(() => [
    { href: '/', label: isFrench ? 'Tableau de bord' : 'Dashboard', icon: LayoutGrid, dataTour: undefined },
    { href: '/transactions', label: isFrench ? 'Transactions' : 'Transactions', icon: List, dataTour: undefined },
    { href: '/categories', label: isFrench ? 'Catégories' : 'Categories', icon: Folder, dataTour: undefined },
    { href: '/goals', label: isFrench ? 'Objectifs' : 'Goals', icon: Target, dataTour: undefined },
    { href: '/reports', label: isFrench ? 'Rapports' : 'Reports', icon: FileBarChart, dataTour: 'nav-reports' },
    { href: '/settings', label: isFrench ? 'Paramètres' : 'Settings', icon: Settings, dataTour: undefined },
  ], [isFrench]);

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
  {/* SkipLinks supprimé à la demande utilisateur */}
      
      {/* Desktop Sidebar */}
      <aside 
        id="main-navigation"
        className="hidden border-r bg-muted/40 md:block"
        aria-label={isFrench ? "Navigation principale" : "Main navigation"}
      >
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Logo />
          </div>
          <div className="flex-1">
            <nav 
              className="grid items-start px-2 text-sm font-medium lg:px-4"
              aria-label={isFrench ? "Menu principal" : "Main menu"}
            >
              {navItems.map(item => (
                <Link
                  key={item.label}
                  href={item.href}
                  data-tour={item.dataTour}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    { 'bg-muted text-primary': pathname === item.href }
                  )}
                >
                  <item.icon className="h-4 w-4" aria-hidden="true" />
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </aside>
      
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
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
          <UserNav />
        </header>
        <main id="main-content" className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
