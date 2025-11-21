# 📱 Optimisation Mobile & Publication Play Store - Budget Pro

**Date**: 3 novembre 2025  
**Version cible**: 2.0.0 Mobile-First  
**Stack**: Next.js 15.3.3 + Firebase + PWA + TWA (Trusted Web Activity)

---

## 🎯 Objectifs

Transformer l'application Budget Pro en une PWA hyper-performante avec packaging Android TWA pour publication sur Google Play Store, sans réécriture native.

### Critères de succès
- ✅ **Lighthouse Mobile**: PWA ≥ 95, Performance ≥ 90
- ✅ **Core Web Vitals**: LCP ≤ 2.5s, INP ≤ 200ms, CLS ≈ 0
- ✅ **Bundle JS**: Initial ≤ 250 KB gzip
- ✅ **Expérience**: Navigation native-like avec Bottom Nav + FAB
- ✅ **Offline**: CRUD complet avec queue sync (Background Sync)
- ✅ **TWA**: Plein écran sans barre Chrome, deep links, notifications

---

## 📋 Plan d'Implémentation

### Phase 1: PWA Renforcée ✅
#### 1.1 Manifest Web App
**Fichier**: `public/manifest.webmanifest`

```json
{
  "name": "Budget Pro - Gestion Finances",
  "short_name": "Budget Pro",
  "description": "Application complète de gestion budgétaire et financière",
  "start_url": "/?source=pwa",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#4F46E5",
  "background_color": "#FFFFFF",
  "categories": ["finance", "productivity"],
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/adaptive-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ],
  "shortcuts": [
    {
      "name": "Ajouter Transaction",
      "short_name": "Transaction",
      "description": "Ajouter une nouvelle transaction rapidement",
      "url": "/transactions/add?source=shortcut",
      "icons": [{ "src": "/icons/shortcut-transaction.png", "sizes": "96x96" }]
    },
    {
      "name": "Mes Rapports",
      "short_name": "Rapports",
      "description": "Consulter les rapports financiers",
      "url": "/reports?source=shortcut",
      "icons": [{ "src": "/icons/shortcut-reports.png", "sizes": "96x96" }]
    },
    {
      "name": "Mes Dettes",
      "short_name": "Dettes",
      "description": "Gérer mes dettes et échéances",
      "url": "/debts?source=shortcut",
      "icons": [{ "src": "/icons/shortcut-debts.png", "sizes": "96x96" }]
    },
    {
      "name": "Objectifs",
      "short_name": "Objectifs",
      "description": "Suivre mes objectifs financiers",
      "url": "/goals?source=shortcut",
      "icons": [{ "src": "/icons/shortcut-goals.png", "sizes": "96x96" }]
    }
  ],
  "share_target": {
    "action": "/transactions/add",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "description",
      "text": "notes",
      "files": [
        {
          "name": "attachment",
          "accept": ["image/*", "application/pdf"]
        }
      ]
    }
  }
}
```

#### 1.2 Service Worker Workbox
**Fichier**: `public/sw.js` (à générer via Workbox)

**Stratégies**:
- **NetworkFirst**: Pages HTML, API Next.js, données SSR
- **StaleWhileRevalidate**: JSON légers, données Firestore
- **CacheFirst**: Polices, icônes, images statiques
- **Offline fallback**: `/offline` + queue Background Sync

**Configuration Workbox** (`next.config.ts`):
```typescript
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // NetworkFirst: Pages dynamiques
    {
      urlPattern: /^https?.*\/(dashboard|transactions|goals|debts|reports)/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'pages-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 24 * 60 * 60, // 24h
        },
        networkTimeoutSeconds: 10,
      },
    },
    // StaleWhileRevalidate: API & Firestore
    {
      urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'firestore-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60, // 1h
        },
      },
    },
    // CacheFirst: Assets statiques
    {
      urlPattern: /\.(?:png|jpg|jpeg|webp|svg|gif|woff|woff2|ttf|eot)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 jours
        },
      },
    },
  ],
  fallbacks: {
    document: '/offline',
  },
});
```

#### 1.3 Background Sync Queue
**Fichier**: `src/lib/offline-queue.ts`

Gère les opérations critiques offline (ajout transaction, paiement dette) avec queue IndexedDB.

```typescript
import { openDB, DBSchema } from 'idb';

interface QueuedOperation {
  id: string;
  type: 'transaction' | 'payment' | 'contribution';
  data: any;
  timestamp: number;
  retries: number;
}

interface OfflineQueueDB extends DBSchema {
  'pending-operations': {
    key: string;
    value: QueuedOperation;
  };
}

const DB_NAME = 'budget-offline-queue';
const STORE_NAME = 'pending-operations';

export async function queueOperation(type: QueuedOperation['type'], data: any) {
  const db = await openDB<OfflineQueueDB>(DB_NAME, 1, {
    upgrade(db) {
      db.createObjectStore(STORE_NAME, { keyPath: 'id' });
    },
  });

  const operation: QueuedOperation = {
    id: crypto.randomUUID(),
    type,
    data,
    timestamp: Date.now(),
    retries: 0,
  };

  await db.add(STORE_NAME, operation);
  
  // Tenter sync immédiatement si en ligne
  if (navigator.onLine) {
    await syncQueue();
  }
}

export async function syncQueue() {
  const db = await openDB<OfflineQueueDB>(DB_NAME, 1);
  const operations = await db.getAll(STORE_NAME);

  for (const op of operations) {
    try {
      await executeOperation(op);
      await db.delete(STORE_NAME, op.id);
    } catch (error) {
      op.retries++;
      if (op.retries >= 3) {
        // Échec définitif, supprimer ou marquer
        await db.delete(STORE_NAME, op.id);
      } else {
        await db.put(STORE_NAME, op);
      }
    }
  }
}

async function executeOperation(op: QueuedOperation) {
  // Logique de synchronisation selon le type
  switch (op.type) {
    case 'transaction':
      // Appeler API Firebase pour créer transaction
      break;
    case 'payment':
      // Enregistrer paiement dette
      break;
    case 'contribution':
      // Ajouter contribution objectif
      break;
  }
}

// Écouter retour en ligne
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncQueue();
  });
}
```

---

### Phase 2: UI Mobile Material 3 ✅

#### 2.1 Bottom Navigation
**Fichier**: `src/components/mobile/BottomNav.tsx`

```tsx
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
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Masquer sur pages non-principales
  if (pathname.includes('/add') || pathname.includes('/edit') || pathname.includes('/onboarding')) {
    return null;
  }

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
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
                "min-w-[48px] min-h-[48px]", // Touch target
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={cn("w-6 h-6", isActive && "fill-current")} />
              <span className="text-[10px] mt-1 font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
```

#### 2.2 Floating Action Button (FAB)
**Fichier**: `src/components/mobile/FAB.tsx`

```tsx
'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function FAB() {
  const router = useRouter();

  return (
    <Button
      size="lg"
      className="fixed bottom-20 right-6 z-40 h-14 w-14 rounded-full shadow-lg md:hidden"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      onClick={() => router.push('/transactions/add')}
      aria-label="Ajouter une transaction"
    >
      <Plus className="h-6 w-6" />
    </Button>
  );
}
```

#### 2.3 Android Back Handler
**Fichier**: `src/hooks/useAndroidBackHandler.ts`

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

const ROOT_ROUTES = ['/dashboard', '/transactions', '/goals', '/debts', '/reports'];

export function useAndroidBackHandler() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      // Si on est sur une route racine, demander confirmation de sortie
      if (ROOT_ROUTES.includes(pathname)) {
        e.preventDefault();
        
        const confirmExit = window.confirm('Voulez-vous quitter l\'application ?');
        if (confirmExit) {
          // TWA: fermer l'app
          if ('TrustedWebActivity' in window) {
            window.history.back();
          } else {
            // Browser: retour normal
            window.history.back();
          }
        } else {
          // Rester sur la page
          window.history.pushState(null, '', pathname);
        }
      }
    };

    // Pousser un état initial pour détecter le back
    window.history.pushState(null, '', pathname);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [pathname, router]);
}
```

#### 2.4 Safe Areas & Insets
**Fichier**: `src/app/globals.css`

```css
/* Safe areas pour iOS/Android */
:root {
  --safe-area-inset-top: env(safe-area-inset-top);
  --safe-area-inset-bottom: env(safe-area-inset-bottom);
  --safe-area-inset-left: env(safe-area-inset-left);
  --safe-area-inset-right: env(safe-area-inset-right);
}

/* Padding pour contenu principal (éviter bottom nav) */
.mobile-content-padding {
  padding-bottom: calc(64px + env(safe-area-inset-bottom));
}

/* Touch targets minimums (Material 3) */
button,
a[role="button"],
input[type="checkbox"],
input[type="radio"] {
  min-width: 48px;
  min-height: 48px;
}

/* Smooth scrolling natif */
html {
  scroll-behavior: smooth;
  -webkit-tap-highlight-color: transparent;
}

/* Désactiver le zoom sur input (iOS) */
input,
select,
textarea {
  font-size: 16px;
}

/* Reduce motion pour accessibilité */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

### Phase 3: TWA (Trusted Web Activity) ✅

#### 3.1 Configuration Bubblewrap
**Fichier**: `twa-manifest.json`

```json
{
  "packageId": "cm.touchpoint.budget",
  "host": "budget-app.touchpoint.cm",
  "name": "Budget Pro",
  "launcherName": "Budget Pro",
  "display": "standalone",
  "orientation": "portrait",
  "themeColor": "#4F46E5",
  "navigationColor": "#FFFFFF",
  "navigationColorDark": "#1F2937",
  "backgroundColor": "#FFFFFF",
  "enableNotifications": true,
  "startUrl": "/?source=twa",
  "iconUrl": "https://budget-app.touchpoint.cm/icons/icon-512.png",
  "maskableIconUrl": "https://budget-app.touchpoint.cm/icons/maskable-512.png",
  "monochromeIconUrl": "https://budget-app.touchpoint.cm/icons/monochrome-512.png",
  "splashScreenFadeOutDuration": 300,
  "signingKey": {
    "path": "./android.keystore",
    "alias": "budget-key"
  },
  "appVersionName": "2.0.0",
  "appVersionCode": 200,
  "shortcuts": [
    {
      "name": "Ajouter Transaction",
      "short_name": "Transaction",
      "url": "/transactions/add?source=shortcut",
      "iconUrl": "https://budget-app.touchpoint.cm/icons/shortcut-transaction.png"
    },
    {
      "name": "Mes Rapports",
      "short_name": "Rapports",
      "url": "/reports?source=shortcut",
      "iconUrl": "https://budget-app.touchpoint.cm/icons/shortcut-reports.png"
    }
  ],
  "enableSiteSettingsShortcut": true,
  "isChromeOSOnly": false,
  "minSdkVersion": 23,
  "targetSdkVersion": 34,
  "splashScreenBackgroundColor": "#FFFFFF",
  "splashScreenImageUrl": "https://budget-app.touchpoint.cm/icons/splash-512.png"
}
```

#### 3.2 Digital Asset Links
**Fichier**: `public/.well-known/assetlinks.json`

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "cm.touchpoint.budget",
      "sha256_cert_fingerprints": [
        "SHA256_FINGERPRINT_HERE"
      ]
    }
  }
]
```

**Important**: Générer le fingerprint après création du keystore :
```bash
keytool -list -v -keystore android.keystore -alias budget-key
```

#### 3.3 Scripts NPM
**Fichier**: `package.json`

```json
{
  "scripts": {
    "twa:init": "bubblewrap init --manifest=twa-manifest.json",
    "twa:build": "bubblewrap build",
    "twa:update": "bubblewrap update",
    "twa:install": "bubblewrap install",
    "pwa:icons": "node scripts/generate-pwa-icons.js",
    "sw:build": "workbox generateSW workbox-config.js",
    "analyze": "ANALYZE=true npm run build",
    "perf:audit": "lighthouse http://localhost:9002 --output=html --output-path=./lighthouse-report.html --chrome-flags='--headless' --only-categories=performance,pwa,accessibility",
    "perf:mobile": "lighthouse http://localhost:9002 --output=html --output-path=./lighthouse-mobile.html --preset=mobile --chrome-flags='--headless'"
  },
  "devDependencies": {
    "@bubblewrap/cli": "^1.20.0",
    "next-pwa": "^5.6.0",
    "workbox-webpack-plugin": "^7.0.0",
    "@next/bundle-analyzer": "^15.3.3",
    "lighthouse": "^11.0.0"
  }
}
```

---

### Phase 4: Performance Optimizations ✅

#### 4.1 Next.js Configuration
**Fichier**: `next.config.ts`

```typescript
import type { NextConfig } from 'next';
import withPWA from 'next-pwa';
import withBundleAnalyzer from '@next/bundle-analyzer';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // Compression & optimisations
  compress: true,
  poweredByHeader: false,
  
  // Images
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    minimumCacheTTL: 31536000,
  },
  
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],
      },
    },
    productionBrowserSourceMaps: false,
  }),
  
  // Headers pour performance
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/.well-known/assetlinks.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600',
          },
        ],
      },
    ];
  },
  
  // Preconnect aux services critiques
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/:path*',
          has: [
            {
              type: 'header',
              key: 'x-preconnect',
              value: 'firestore',
            },
          ],
          destination: '/:path*',
        },
      ],
    };
  },
};

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  // Config Workbox détaillée dans Phase 1.2
});

export default bundleAnalyzer(pwaConfig(nextConfig));
```

#### 4.2 Dynamic Imports Mobile
**Fichier**: `src/app/dashboard/page.tsx`

```tsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load graphiques lourds sur mobile
const RechartsChart = dynamic(
  () => import('@/components/dashboard/charts').then(mod => mod.TrendChart),
  { 
    ssr: false,
    loading: () => <ChartSkeleton />
  }
);

// Détecter mobile
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

export default function DashboardPage() {
  return (
    <div>
      {/* Données critiques en SSR */}
      <KPICards />
      
      {/* Graphique chargé après hydration sur mobile */}
      {!isMobile() ? (
        <Suspense fallback={<ChartSkeleton />}>
          <RechartsChart />
        </Suspense>
      ) : (
        <SparklineChart /> {/* Version légère mobile */}
      )}
    </div>
  );
}
```

#### 4.3 Preconnect & Resource Hints
**Fichier**: `src/app/layout.tsx`

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        {/* Preconnect aux services critiques */}
        <link rel="preconnect" href="https://firestore.googleapis.com" />
        <link rel="preconnect" href="https://storage.googleapis.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebase.googleapis.com" />
        
        {/* Manifest PWA */}
        <link rel="manifest" href="/manifest.webmanifest" />
        
        {/* Theme colors */}
        <meta name="theme-color" content="#4F46E5" />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#1F2937" />
        
        {/* Viewport optimal */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" />
        
        {/* PWA Apple */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        {children}
        <BottomNav />
        <FAB />
      </body>
    </html>
  );
}
```

---

### Phase 5: Notifications & Permissions ✅

#### 5.1 FCM Web Configuration
**Fichier**: `src/lib/fcm-web.ts`

```typescript
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { getApp } from 'firebase/app';

const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications non supportées');
    return null;
  }

  const permission = await Notification.requestPermission();
  
  if (permission === 'granted') {
    const messaging = getMessaging(getApp());
    const token = await getToken(messaging, { vapidKey: VAPID_KEY });
    
    // Sauvegarder le token dans Firestore
    return token;
  }
  
  return null;
}

export function listenToMessages() {
  if (!('Notification' in window)) return;
  
  const messaging = getMessaging(getApp());
  
  onMessage(messaging, (payload) => {
    console.log('Message reçu:', payload);
    
    // Afficher notification custom
    if (payload.notification) {
      new Notification(payload.notification.title || 'Budget Pro', {
        body: payload.notification.body,
        icon: '/icons/icon-192.png',
        badge: '/icons/badge-96.png',
        vibrate: [200, 100, 200],
      });
    }
  });
}
```

#### 5.2 Canaux de Notification Android
**Fichier**: `src/lib/notification-channels.ts`

```typescript
export const NOTIFICATION_CHANNELS = {
  HIGH_PRIORITY: {
    id: 'high-priority',
    name: 'Alertes Importantes',
    description: 'Échéances, dépassements budgétaires',
    importance: 4, // HIGH
    sound: 'default',
    vibration: [0, 250, 250, 250],
  },
  NORMAL: {
    id: 'normal',
    name: 'Notifications Générales',
    description: 'Objectifs atteints, confirmations',
    importance: 3, // NORMAL
    sound: 'default',
    vibration: [0, 200],
  },
  LOW: {
    id: 'low',
    name: 'Rappels',
    description: 'Rapports hebdomadaires, conseils',
    importance: 2, // LOW
    sound: null,
    vibration: null,
  },
};
```

---

### Phase 6: Icônes PWA & Assets ✅

#### 6.1 Script de Génération d'Icônes
**Fichier**: `scripts/generate-pwa-icons.js`

```javascript
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ICON_DIR = path.join(__dirname, '../public/icons');
const SOURCE_ICON = path.join(__dirname, '../public/logo.svg');

const SIZES = [
  { size: 192, name: 'icon-192.png', purpose: 'any' },
  { size: 512, name: 'icon-512.png', purpose: 'any' },
  { size: 512, name: 'maskable-512.png', purpose: 'maskable', padding: 0.1 },
  { size: 96, name: 'badge-96.png', purpose: 'monochrome' },
];

async function generateIcons() {
  if (!fs.existsSync(ICON_DIR)) {
    fs.mkdirSync(ICON_DIR, { recursive: true });
  }

  for (const config of SIZES) {
    const outputPath = path.join(ICON_DIR, config.name);
    
    let pipeline = sharp(SOURCE_ICON).resize(config.size, config.size);
    
    // Ajouter padding pour maskable
    if (config.padding) {
      const padSize = Math.round(config.size * config.padding);
      pipeline = pipeline.extend({
        top: padSize,
        bottom: padSize,
        left: padSize,
        right: padSize,
        background: { r: 79, g: 70, b: 229, alpha: 1 }, // theme_color
      });
    }
    
    await pipeline.png().toFile(outputPath);
    console.log(`✅ Généré: ${config.name}`);
  }
}

generateIcons().catch(console.error);
```

**Installation**: `npm install --save-dev sharp`

---

### Phase 7: Offline UX ✅

#### 7.1 Page Offline
**Fichier**: `src/app/offline/page.tsx`

```tsx
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
      <WifiOff className="w-24 h-24 text-muted-foreground mb-6" />
      <h1 className="text-2xl font-bold mb-2">Vous êtes hors ligne</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        Certaines fonctionnalités sont limitées sans connexion Internet. 
        Vos modifications seront synchronisées automatiquement dès le retour en ligne.
      </p>
      <Button 
        onClick={() => window.location.reload()}
        variant="outline"
      >
        Réessayer
      </Button>
    </div>
  );
}
```

#### 7.2 Indicateur de Statut
**Fichier**: `src/components/mobile/OnlineStatus.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function OnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBadge(true);
      setTimeout(() => setShowBadge(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBadge(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBadge) return null;

  return (
    <Badge 
      variant={isOnline ? 'default' : 'destructive'}
      className="fixed top-4 right-4 z-50 animate-in slide-in-from-top"
    >
      {isOnline ? (
        <>
          <Wifi className="w-3 h-3 mr-1" />
          En ligne
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 mr-1" />
          Hors ligne
        </>
      )}
    </Badge>
  );
}
```

---

### Phase 8: Publication Play Store ✅

#### 8.1 Checklist Pré-Publication

**Fichier**: `README-PLAYSTORE.md`

```markdown
# 📱 Checklist Publication Google Play Store - Budget Pro

## 1. Préparation du Build

### Assets requis
- [x] Icône app 512x512 PNG (adaptive + maskable)
- [x] Feature graphic 1024x500 PNG
- [x] Screenshots (min 2, max 8):
  - Téléphone: 16:9 ou 9:16
  - Tablette 7": 16:9 ou 9:16
  - Tablette 10": 16:9 ou 9:16
- [x] Vidéo démo (optionnel, YouTube link)
- [x] Logo texte 192x192 PNG (transparent)

### Configuration TWA
```bash
# 1. Initialiser Bubblewrap
npm run twa:init

# 2. Générer keystore (une fois)
keytool -genkey -v -keystore android.keystore \
  -alias budget-key -keyalg RSA -keysize 2048 \
  -validity 10000

# 3. Build AAB
npm run twa:build

# 4. Récupérer SHA256 fingerprint
keytool -list -v -keystore android.keystore -alias budget-key

# 5. Mettre à jour assetlinks.json avec le fingerprint
# 6. Déployer assetlinks.json sur le domaine
```

### Vérifications techniques
- [x] Lighthouse Mobile: PWA ≥ 95, Perf ≥ 90
- [x] Core Web Vitals: LCP ≤ 2.5s, INP ≤ 200ms
- [x] Bundle JS initial ≤ 250 KB gzip
- [x] Offline mode fonctionnel
- [x] Notifications push activées
- [x] Deep links configurés (assetlinks.json)
- [x] Target SDK ≥ 33 (Android 13)
- [x] 64-bit support (par défaut dans TWA)

## 2. Play Console Setup

### Informations de base
- **Nom de l'application**: Budget Pro
- **Description courte** (80 chars max):
  "Gestion complète de vos finances : budget, transactions, dettes, objectifs"

- **Description complète** (4000 chars max):
  ```
  Budget Pro est votre assistant financier personnel pour gérer efficacement 
  vos revenus, dépenses, objectifs d'épargne et dettes.
  
  🎯 FONCTIONNALITÉS PRINCIPALES:
  • Suivi des transactions avec catégorisation automatique
  • Budgets mensuels intelligents avec alertes de dépassement
  • Objectifs financiers avec progression visuelle
  • Gestion complète des dettes (échéanciers, paiements, simulations)
  • Rapports détaillés et analyses IA personnalisées
  • Mode offline complet avec synchronisation automatique
  
  💰 BUDGETS & CATÉGORIES:
  • Répartition automatique selon vos revenus
  • Suggestions personnalisées (loyer, alimentation, transport...)
  • Alertes visuelles en cas de dépassement
  • Suivi en temps réel de votre consommation
  
  🎯 OBJECTIFS D'ÉPARGNE:
  • 4 types : Épargne, Achat, Dette, Plafond
  • Contributions manuelles avec historique
  • Archivage automatique des objectifs atteints
  • Liens avec catégories et dettes
  
  💳 GESTION DES DETTES:
  • Emprunts et prêts avec échéanciers détaillés
  • Simulations de remboursement anticipé
  • Notifications d'échéances
  • Upload de contrats PDF
  
  📊 RAPPORTS & ANALYSES:
  • Graphiques interactifs (revenus, dépenses, solde)
  • Budget vs Réel par catégorie
  • Exports CSV/Excel
  • Insights IA personnalisés
  
  🔒 SÉCURITÉ & CONFIDENTIALITÉ:
  • Vos données sont protégées par Firebase Security
  • Aucune donnée partagée avec des tiers
  • Mode offline avec cache local sécurisé
  • Support multi-devises (XOF, XAF, EUR, USD)
  
  🌐 MULTILINGUE:
  • Français (Cameroun)
  • Anglais (US)
  
  📱 EXPÉRIENCE MOBILE NATIVE:
  • Interface Material Design 3
  • Navigation intuitive avec bottom bar
  • Mode sombre automatique
  • Notifications push intelligentes
  • Fonctionne hors ligne
  
  GRATUIT, SANS PUB, SANS ABONNEMENT!
  ```

### Catégories
- **Catégorie principale**: Finance
- **Catégories secondaires**: Productivité, Entreprise

### Tags
finance, budget, dépenses, épargne, objectifs, dettes, comptabilité, 
gestion, argent, transactions, revenus

## 3. Data Safety Declaration

```json
{
  "dataCollected": [
    {
      "dataType": "Personal info",
      "purposes": ["App functionality", "Account management"],
      "sharing": false,
      "optional": false,
      "items": ["Name", "Email address"]
    },
    {
      "dataType": "Financial info",
      "purposes": ["App functionality"],
      "sharing": false,
      "optional": false,
      "items": ["Purchase history", "Other financial info"]
    },
    {
      "dataType": "App activity",
      "purposes": ["Analytics", "App functionality"],
      "sharing": false,
      "optional": false,
      "items": ["App interactions"]
    }
  ],
  "securityPractices": [
    "Data encrypted in transit (HTTPS)",
    "Data encrypted at rest (Firebase)",
    "Users can request data deletion",
    "Data not shared with third parties"
  ],
  "dataRetention": "User-controlled (until account deletion)"
}
```

## 4. Screenshots Guidelines

### Téléphone (1080x1920 ou 1080x2340)
1. **Dashboard**: Vue d'ensemble KPIs + graphique
2. **Transactions**: Liste avec filtres
3. **Budget**: Répartition par catégorie
4. **Objectifs**: Cartes avec progression
5. **Dettes**: Tableau des échéances
6. **Rapports**: Graphiques interactifs
7. **Dark Mode**: Vue dashboard en mode sombre
8. **Offline**: Badge offline + queue sync

### Conseils
- Utilisez des données réalistes (pas de lorem ipsum)
- Masquez les informations sensibles
- Affichez l'app en situation d'usage réel
- Variez les écrans (jour/nuit, plein/vide)

## 5. Versioning Strategy

### Format: Major.Minor.Patch (Build)
- **Version Name**: 2.0.0
- **Version Code**: 200 (incrémenté à chaque build)

### Changelog Example
```
Version 2.0.0 (Nov 2025)
• Nouvelle interface Material Design 3
• Mode offline complet avec synchronisation
• Navigation bottom bar native
• Amélioration des performances (90+ Lighthouse)
• Support des notifications push
• Nouveaux raccourcis app
• Corrections de bugs et optimisations
```

## 6. Release Process

```bash
# 1. Tests finaux
npm run test
npm run test:e2e
npm run perf:audit

# 2. Build production
npm run build

# 3. Générer AAB TWA
npm run twa:build

# 4. Signer l'AAB (si non fait par Bubblewrap)
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore android.keystore app-release-bundle.aab budget-key

# 5. Vérifier la signature
jarsigner -verify -verbose -certs app-release-bundle.aab

# 6. Upload sur Play Console
# - Internal testing → Closed testing → Open testing → Production
```

## 7. Post-Publication

### Monitoring
- Firebase Performance: Suivre Core Web Vitals
- Firebase Analytics: Comportements utilisateurs
- Play Console: Crashs & ANRs (normalement 0 avec TWA)
- Firebase Crashlytics (optionnel)

### Updates
- Mettre à jour assetlinks.json à chaque nouveau build signé
- Incrémenter Version Code à chaque upload
- Changelog clair dans Play Console
- Tester sur internal track avant production

## 8. Support & Légal

### URLs requises
- **Site web**: https://budget-app.touchpoint.cm
- **Politique de confidentialité**: https://budget-app.touchpoint.cm/privacy
- **Conditions d'utilisation**: https://budget-app.touchpoint.cm/terms
- **Support email**: support@touchpoint.cm

### Mentions légales
- Nom du développeur: Touch Point Insights
- Adresse complète (requis pour Play Store)
- Téléphone de support (optionnel mais recommandé)
```

---

## 📊 Métriques de Succès

### Lighthouse Scores (Cibles)
- **Performance**: ≥ 90
- **PWA**: ≥ 95
- **Accessibility**: ≥ 95
- **Best Practices**: ≥ 95
- **SEO**: ≥ 90

### Core Web Vitals
- **LCP** (Largest Contentful Paint): ≤ 2.5s
- **FID/INP** (First Input Delay / Interaction to Next Paint): ≤ 200ms
- **CLS** (Cumulative Layout Shift): ≤ 0.1

### Bundle Budgets
- **Initial JS**: ≤ 250 KB gzip
- **First-load JS**: ≤ 500 KB gzip
- **Images above-fold**: ≤ 100 KB
- **Total page weight**: ≤ 1.5 MB

### Offline Performance
- **Queue sync success rate**: ≥ 99%
- **Offline operations**: 100% transactions, contributions, paiements
- **Cache hit ratio**: ≥ 80%

---

## 🔧 Commandes Utiles

```bash
# Développement
npm run dev                  # Serveur dev avec Turbopack
npm run build               # Build production
npm run start               # Serveur production

# PWA
npm run pwa:icons           # Générer icônes adaptatives
npm run sw:build            # Builder Service Worker

# TWA
npm run twa:init            # Initialiser config Bubblewrap
npm run twa:build           # Builder AAB Android
npm run twa:install         # Installer sur device connecté

# Performance
npm run analyze             # Analyser bundle sizes
npm run perf:audit          # Lighthouse audit desktop
npm run perf:mobile         # Lighthouse audit mobile

# Tests
npm test                    # Tests unitaires Vitest
npm run test:e2e            # Tests Playwright
npm run test:e2e:ui         # Playwright UI mode
```

---

## 📚 Ressources

### Documentation
- [Next.js PWA](https://github.com/shadowwalker/next-pwa)
- [Bubblewrap CLI](https://github.com/GoogleChromeLabs/bubblewrap)
- [Material Design 3](https://m3.material.io/)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)
- [Play Store Asset Guidelines](https://support.google.com/googleplay/android-developer/answer/9866151)

### Outils
- [PWA Builder](https://www.pwabuilder.com/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [Workbox](https://developers.google.com/web/tools/workbox)
- [Sharp (image processing)](https://sharp.pixelplumbing.com/)

---

**Date de création**: 3 novembre 2025  
**Dernière mise à jour**: 3 novembre 2025  
**Auteur**: Touch Point Insights  
**Version du document**: 1.0.0
