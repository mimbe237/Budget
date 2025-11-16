'use client';

import { useUser } from '@/firebase';

export function Footer() {
  const { userProfile } = useUser();
  const currentYear = new Date().getFullYear();
  const isFrench = (userProfile?.locale as string)?.startsWith('fr');

  return (
    <footer className="w-full border-t border-border bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col items-center justify-center gap-2 text-center sm:flex-row sm:gap-1">
          <p className="text-xs text-muted-foreground/70 sm:text-sm">
            {isFrench ? 'Propulsé par' : 'Powered by'}{' '}
            <a
              href="http://beonweb.cm"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-muted-foreground/90 transition-colors hover:text-primary hover:underline"
            >
              BEONWEB
            </a>{' '}
            © {currentYear}
          </p>
          <span className="hidden text-muted-foreground/50 sm:inline">•</span>
          <a
            href="/"
            className="text-xs text-muted-foreground/70 transition-colors hover:text-primary hover:underline sm:text-sm"
          >
            {isFrench ? 'Présentation' : 'About'}
          </a>
          <span className="hidden text-muted-foreground/50 sm:inline">•</span>
          <a
            href="mailto:contact@budgetpro.net"
            className="text-xs text-muted-foreground/70 transition-colors hover:text-primary hover:underline sm:text-sm"
          >
            {isFrench ? 'Contactez-nous : ' : 'Contact us: '}contact@budgetpro.net
          </a>
        </div>
      </div>
    </footer>
  );
}
