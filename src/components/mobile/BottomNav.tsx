'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Home, Receipt, Target, CreditCard, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Accueil', icon: Home, path: '/dashboard' },
  { id: 'transactions', label: 'Transactions', icon: Receipt, path: '/transactions' },
  { id: 'goals', label: 'Objectifs', icon: Target, path: '/goals' },
  { id: 'debts', label: 'Dettes', icon: CreditCard, path: '/debts' },
  { id: 'reports', label: 'Rapports', icon: BarChart3, path: '/reports' },
] as const;

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Masquer sur pages non-principales
  const shouldHide = !pathname ||
    pathname.includes('/add') || 
    pathname.includes('/edit') || 
    pathname.includes('/new') ||
    pathname.includes('/onboarding') ||
    pathname.includes('/login') ||
    pathname.includes('/signup') ||
    pathname.includes('/admin');

  if (shouldHide) {
    return null;
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      role="navigation"
      aria-label="Navigation principale mobile"
    >
      <div className="flex justify-around items-center h-16">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full transition-colors",
                "min-w-[48px] min-h-[48px]", // Touch target Material 3
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground active:text-primary"
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon 
                className={cn(
                  "w-6 h-6 transition-all",
                  isActive && "scale-110"
                )} 
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span className={cn(
                "text-[10px] mt-1 font-medium transition-all",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
