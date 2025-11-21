'use client';

import { Plus } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function FAB() {
  const router = useRouter();
  const pathname = usePathname();

  // Masquer sur certaines pages
  const shouldHide = !pathname ||
    pathname.includes('/add') || 
    pathname.includes('/edit') || 
    pathname.includes('/new') ||
    pathname.includes('/login') ||
    pathname.includes('/signup') ||
    pathname.includes('/admin');

  if (shouldHide) {
    return null;
  }

  const handleClick = () => {
    router.push('/transactions/add');
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        "fixed z-40 md:hidden",
        "w-14 h-14 rounded-full shadow-lg",
        "bg-primary hover:bg-primary/90 active:bg-primary/80",
        "flex items-center justify-center",
        "transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      )}
      style={{
        right: '16px',
        bottom: 'calc(env(safe-area-inset-bottom) + 80px)', // Au-dessus du BottomNav (16px + 64px)
      }}
      aria-label="Ajouter une transaction"
    >
      <Plus className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
    </button>
  );
}
