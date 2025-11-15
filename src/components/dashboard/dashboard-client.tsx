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

import { useUser, useAuth } from '@/firebase';

import { UserNav } from '@/components/user-nav';
import { Logo } from '@/components/logo';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { signOut } from 'firebase/auth';
// ...existing code...
import { ThemeToggle } from '@/components/theme-toggle';
import { QuickAddShortcuts } from './quick-add-shortcuts';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { AppBottomNav } from '@/components/layout/app-bottom-nav';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isUserLoading, userProfile } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isFrench = userProfile?.locale === 'fr-CM';
  const userAvatar = useMemo(
    () => PlaceHolderImages.find((img) => img.id === 'user-avatar'),
    [],
  );
  const userDisplayName = userProfile?.firstName || user?.displayName || user?.email || (isFrench ? 'Utilisateur' : 'User');
  const userEmail = user?.email || (isFrench ? 'Compte invité' : 'Guest account');
  const userInitial = userDisplayName.charAt(0).toUpperCase() || 'U';

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
    <>
      <div className="relative flex min-h-screen w-full bg-background lg:grid lg:grid-cols-[260px_1fr]">
        <aside
          id="main-navigation"
          className="hidden lg:block border-r border-border/60 bg-sidebar backdrop-blur-xl"
          aria-label={isFrench ? 'Navigation principale' : 'Main navigation'}
        >
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-20 items-center border-b border-border/60 px-6">
              <Logo className="h-10 w-auto" />
            </div>
            <div className="flex-1 overflow-y-auto pt-4">
              <nav
                className="grid items-start gap-2 px-4 text-base font-semibold"
                aria-label={isFrench ? 'Menu principal' : 'Main menu'}
              >
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    data-tour={item.dataTour}
                    aria-current={pathname === item.href ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-4 py-3 text-muted-foreground transition-all duration-200 hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                      pathname === item.href && 'bg-primary/10 text-primary shadow-inner shadow-primary/10'
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

        <div className="flex min-h-screen flex-col">
          <header
            className="sticky top-0 z-30 flex min-h-[64px] items-center gap-3 border-b border-border/60 bg-surface/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8"
            style={{ paddingTop: 'max(0.5rem, var(--safe-area-top))' }}
          >
          {/* Mobile Menu */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 touch-target lg:hidden"
                aria-label={isFrench ? "Ouvrir le menu" : "Open menu"}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="flex h-full w-full max-w-[320px] flex-col overflow-hidden border-r border-white/20 bg-gradient-to-br from-white/85 via-blue-50/75 to-indigo-100/80 p-0 shadow-2xl backdrop-blur-xl"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>{isFrench ? 'Menu de navigation mobile' : 'Mobile navigation menu'}</SheetTitle>
              </SheetHeader>
              <div className="relative overflow-hidden px-6 pb-6 pt-10">
                <div
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.32),_transparent_62%)]"
                  aria-hidden="true"
                />
                <div className="relative z-10 flex items-center justify-between">
                  <Logo className="h-8 w-auto drop-shadow" />
                  <span className="text-xs font-medium text-slate-600">
                    {isFrench ? 'Version mobile' : 'Mobile view'}
                  </span>
                </div>
                <div className="relative z-10 mt-6 flex items-center gap-4">
                  <Avatar className="h-12 w-12 border border-white/60 shadow-lg backdrop-blur">
                    <AvatarImage
                      src={user?.photoURL || userAvatar?.imageUrl}
                      alt="User avatar"
                      data-ai-hint={userAvatar?.imageHint}
                    />
                    <AvatarFallback>{userInitial}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">{userDisplayName}</p>
                    <p className="truncate text-xs text-slate-600">{userEmail}</p>
                  </div>
                </div>
                <div className="relative z-10 mt-5 flex items-center gap-2 text-xs text-slate-600">
                  <Badge className="bg-white/70 text-primary shadow-sm backdrop-blur-sm">
                    {isFrench ? 'Connecté' : 'Online'}
                  </Badge>
                  <span>{isFrench ? 'Navigation principale' : 'Main navigation'}</span>
                </div>
              </div>
              <nav
                className="flex-1 overflow-y-auto px-4 pb-6 pt-2 space-y-2"
                aria-label={isFrench ? 'Menu de navigation mobile' : 'Mobile navigation menu'}
              >
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      data-tour={item.dataTour}
                      onClick={() => setIsMobileMenuOpen(false)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'group flex items-center gap-4 rounded-2xl px-4 py-3 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2',
                        'bg-white/45 text-slate-700 hover:bg-white hover:text-primary hover:shadow-xl',
                        isActive && 'bg-white text-primary shadow-lg ring-1 ring-primary/20'
                      )}
                    >
                      <span
                        className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-xl bg-white/70 text-primary shadow-sm transition-all duration-200',
                          'group-hover:bg-primary group-hover:text-white',
                          isActive && 'bg-primary text-white shadow-md'
                        )}
                      >
                        <item.icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{item.label}</span>
                        <span className="text-xs text-slate-500">
                          {isFrench ? 'Accéder' : 'Open'}
                        </span>
                      </div>
                      <span className="ml-auto text-base font-semibold text-primary/60 opacity-0 transition-opacity group-hover:opacity-100">
                        →
                      </span>
                    </Link>
                  );
                })}
              </nav>
              <div className="border-t border-white/35 bg-white/60 px-6 py-4 backdrop-blur-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">
                    {isFrench ? 'Apparence' : 'Appearance'}
                  </span>
                  <ThemeToggle isFrench={isFrench} />
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <div className="w-full flex-1">
            {/* Can add a search bar or other header content here */}
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle isFrench={isFrench} />
            <Button
              variant="outline"
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold"
              onClick={() => {
                if (!auth) return;
                signOut(auth).then(() => router.push('/login'));
              }}
            >
              {isFrench ? 'Déconnexion' : 'Log out'}
            </Button>
            <UserNav premium />
          </div>
          </header>
          <main
            id="main-content"
            className="flex flex-1 flex-col gap-4 px-4 pb-[calc(var(--bottom-nav-height)+2rem)] pt-4 sm:px-6 lg:px-10 lg:pb-12"
            tabIndex={-1}
          >
            <div className="mx-auto w-full max-w-5xl space-y-4">{children}</div>
          </main>
        </div>
      </div>
      <AppBottomNav />
      <QuickAddShortcuts />
      <style jsx global>{`
        .animate-spin-slow {
          animation: spin 6s linear infinite;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
