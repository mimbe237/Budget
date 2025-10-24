import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { OnlineStatusIndicator, ServiceWorkerUpdateNotification } from '@/hooks/use-service-worker';
import 'dotenv/config';
import { FirebaseClientProvider } from '@/firebase';
import { AutoSeedCategories } from '@/components/AutoSeedCategories';
import { ThemeProvider } from '@/components/theme-provider';
import { ReactQueryProvider } from '@/components/react-query-provider';
import { FirebaseStatus } from '@/components/firebase-status';
import { OnboardingGate } from '@/components/onboarding/OnboardingGate';
import { HtmlLangSync } from '@/components/locale/html-lang';
import { I18nProviderWrapper } from '@/components/i18n-provider-wrapper';

export const metadata: Metadata = {
  title: 'BudgetWise',
  description: 'Track your expenses, set goals, and gain financial clarity.',
};

// viewport est géré dans app/viewport.ts

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReactQueryProvider>
            <FirebaseClientProvider>
              <I18nProviderWrapper>
                <AutoSeedCategories />
                <FirebaseStatus />
                <OnboardingGate>
                  {children}
                </OnboardingGate>
                {/* Sync <html lang> with user locale */}
                <HtmlLangSync />
              </I18nProviderWrapper>
            </FirebaseClientProvider>
            {/* Statut en ligne/hors ligne et update SW */}
            <OnlineStatusIndicator />
            <ServiceWorkerUpdateNotification />
            <Toaster />
          </ReactQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
