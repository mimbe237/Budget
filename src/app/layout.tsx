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
import { HtmlLangSync } from '@/components/locale/html-lang';
import { OfflineQueueSync } from '@/components/offline/OfflineQueueSync';
import { BudgetSetupNotification } from '@/components/onboarding/BudgetSetupNotification';
import { I18nProviderWrapper } from '@/components/i18n-provider-wrapper';
import { AffiliateTracker } from '@/components/affiliates/AffiliateTracker';
import { AuthStatusGuard } from '@/components/auth/auth-status-guard';
import { FooterGuard } from '@/components/footer-guard';
import { poppins, ptSans } from './fonts';

export const metadata: Metadata = {
  title: 'Budget Pro',
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
        {/* Preconnect Firebase CDN */}
        <link rel="preconnect" href="https://firebaseapp.com" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.webmanifest" />
        
        {/* Favicon (généré depuis budget-pro-icon.svg) */}
        <link rel="icon" type="image/svg+xml" href="/icons/budget-pro-icon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        
        {/* Theme colors */}
        <meta name="theme-color" content="#4F46E5" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1F2937" />

        {/* PWA Apple */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
  <body className={`${poppins.variable} ${ptSans.variable} font-body antialiased bg-background text-foreground flex flex-col min-h-screen`}>
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
                {/* Tracking affilié global (détecte ?aff=CODE et envoie l'événement) */}
                <AffiliateTracker />
                <AuthStatusGuard>
                  <div className="flex flex-col min-h-screen">
                    <main className="flex-1">
                      {children}
                    </main>
                    <FooterGuard />
                  </div>
                </AuthStatusGuard>
                {/* Sync <html lang> with user locale */}
                <HtmlLangSync />
                {/* Offline queue sync on mount */}
                <OfflineQueueSync />
                {/* Notification pour configurer le budget (première connexion) */}
                <BudgetSetupNotification />

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
