# 📱 Plan d'Implémentation Mobile - Budget Pro

**Approche**: Implémentation progressive, testée, sans casser l'existant.

---

## 🎯 Stratégie d'Implémentation

### Principe: **Feature Flags + Progressive Enhancement**
- Chaque nouvelle fonctionnalité mobile est opt-in via feature flag
- L'application desktop reste 100% fonctionnelle
- Tests à chaque étape avant de passer à la suivante
- Rollback facile si problème détecté

---

## 📅 Timeline (6 semaines)

### Semaine 1-2: Fondations PWA
**Objectif**: PWA score ≥ 95 sans casser l'existant

**Tâches**:
1. ✅ Manifest.webmanifest optimisé
2. ✅ Icônes PWA (192, 512, maskable)
3. ✅ Service Worker Workbox (routes critiques)
4. ✅ Page /offline
5. ✅ Background Sync queue
6. ✅ Tests Lighthouse

**Critères de validation**:
- PWA score Lighthouse ≥ 95
- Offline mode fonctionnel (lecture seule)
- Aucune régression desktop
- Tests e2e passants

---

### Semaine 3: UI Mobile (Bottom Nav + FAB)
**Objectif**: Navigation mobile native-like

**Tâches**:
1. ✅ BottomNav component (5 items max)
2. ✅ FAB "Ajouter transaction"
3. ✅ Safe areas (iOS/Android insets)
4. ✅ Android back handler
5. ✅ Touch targets ≥ 48x48dp
6. ✅ Tests responsive

**Critères de validation**:
- Bottom nav visible uniquement < 768px
- FAB ne chevauche pas le contenu
- Back button Android fonctionne
- Desktop non affecté

---

### Semaine 4: Performance
**Objectif**: Performance score ≥ 90, LCP ≤ 2.5s

**Tâches**:
1. ✅ Dynamic imports (Recharts mobile)
2. ✅ next/image partout
3. ✅ Bundle analyzer
4. ✅ Preconnect Firebase
5. ✅ Remove console.* en prod
6. ✅ Compression assets

**Critères de validation**:
- Lighthouse Performance ≥ 90
- Bundle initial ≤ 250 KB gzip
- LCP ≤ 2.5s sur Moto G4
- Pas de régression desktop

---

### Semaine 5: TWA Setup
**Objectif**: Package Android prêt pour Play Store

**Tâches**:
1. ✅ twa-manifest.json
2. ✅ Bubblewrap init
3. ✅ Keystore génération
4. ✅ assetlinks.json
5. ✅ Build AAB
6. ✅ Test sur device Android

**Critères de validation**:
- AAB signe et installable
- Deep links fonctionnels
- Pas de barre Chrome
- Notifications OK

---

### Semaine 6: Polish & Publication
**Objectif**: Soumission Play Store

**Tâches**:
1. ✅ Screenshots (8 écrans)
2. ✅ Feature graphic 1024x500
3. ✅ Privacy policy
4. ✅ Data Safety form
5. ✅ Play Console setup
6. ✅ Internal testing
7. ✅ Soumission

**Critères de validation**:
- Tous les assets Play Store prêts
- Pas d'erreur validation Google
- Tests internes OK
- Changelog clair

---

## 🔧 Implémentation Détaillée

### Phase 1.1: Manifest PWA (Jour 1)

**Fichier**: `public/manifest.webmanifest`

```bash
# 1. Créer le fichier
touch public/manifest.webmanifest

# 2. Copier le contenu depuis MOBILE_OPTIMIZATION.md (Phase 1.1)

# 3. Référencer dans layout.tsx
# Ajouter: <link rel="manifest" href="/manifest.webmanifest" />

# 4. Tester
npm run build
npm run start
# Ouvrir Chrome DevTools > Application > Manifest
```

**Tests**:
```bash
# Lighthouse
npm run perf:audit

# Vérifier PWA score ≥ 95
# Vérifier "Installable" = true
```

---

### Phase 1.2: Icônes PWA (Jour 1-2)

**Étapes**:
```bash
# 1. Installer sharp
npm install --save-dev sharp

# 2. Créer script
touch scripts/generate-pwa-icons.js
# Copier le script depuis MOBILE_OPTIMIZATION.md (Phase 6.1)

# 3. Créer icônes
npm run pwa:icons

# 4. Vérifier
ls -lh public/icons/
# Doit contenir: icon-192.png, icon-512.png, maskable-512.png, badge-96.png
```

**Tests**:
```bash
# Ouvrir Chrome DevTools > Application > Manifest
# Vérifier que toutes les icônes sont chargées
# Installer PWA et vérifier l'icône sur l'écran d'accueil
```

---

### Phase 1.3: Service Worker Workbox (Jour 2-3)

**Installation**:
```bash
npm install next-pwa workbox-webpack-plugin
```

**Configuration** (`next.config.ts`):
```typescript
import withPWA from 'next-pwa';

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    // Voir MOBILE_OPTIMIZATION.md Phase 1.2 pour config complète
  ],
  fallbacks: {
    document: '/offline',
  },
});

export default pwaConfig(nextConfig);
```

**Tests**:
```bash
# 1. Build
npm run build

# 2. Start prod
npm run start

# 3. Ouvrir DevTools > Application > Service Workers
# Vérifier "Status: Activated and running"

# 4. Test offline
# DevTools > Network > Offline
# Naviguer vers /dashboard (doit charger depuis cache)
# Naviguer vers /offline (fallback)
```

---

### Phase 1.4: Background Sync Queue (Jour 3-4)

**Fichier**: `src/lib/offline-queue.ts`

```bash
# 1. Installer idb
npm install idb

# 2. Créer le fichier
touch src/lib/offline-queue.ts
# Copier le code depuis MOBILE_OPTIMIZATION.md (Phase 1.3)

# 3. Intégrer dans transactions/add
# Modifier src/app/transactions/add/page.tsx
```

**Modification** (`transactions/add/page.tsx`):
```typescript
import { queueOperation } from '@/lib/offline-queue';

const handleSubmit = async (data) => {
  if (!navigator.onLine) {
    // Queue l'opération
    await queueOperation('transaction', data);
    toast.success('Transaction enregistrée. Sera synchronisée dès la reconnexion.');
    return;
  }
  
  // Logique normale
  await saveTransaction(data);
};
```

**Tests**:
```bash
# 1. Ouvrir app en mode online
# 2. Passer en offline (DevTools)
# 3. Créer une transaction
# 4. Vérifier IndexedDB: budget-offline-queue > pending-operations
# 5. Repasser en online
# 6. Vérifier que la queue se vide (opération synchronisée)
# 7. Vérifier la transaction dans Firestore
```

---

### Phase 2.1: Bottom Navigation (Jour 5-6)

**Fichier**: `src/components/mobile/BottomNav.tsx`

```bash
# 1. Créer composant
mkdir -p src/components/mobile
touch src/components/mobile/BottomNav.tsx
# Copier le code depuis MOBILE_OPTIMIZATION.md (Phase 2.1)

# 2. Intégrer dans layout
# Modifier src/app/layout.tsx
```

**Modification** (`layout.tsx`):
```typescript
import { BottomNav } from '@/components/mobile/BottomNav';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <BottomNav /> {/* Seulement visible < 768px */}
      </body>
    </html>
  );
}
```

**CSS** (`globals.css`):
```css
/* Padding pour contenu (éviter que bottom nav cache le contenu) */
@media (max-width: 767px) {
  main {
    padding-bottom: calc(64px + env(safe-area-inset-bottom));
  }
}
```

**Tests**:
```bash
# 1. Lancer dev
npm run dev

# 2. Ouvrir en responsive (375px width)
# 3. Vérifier bottom nav visible
# 4. Naviguer entre les onglets
# 5. Vérifier l'onglet actif est surligné
# 6. Redimensionner > 768px
# 7. Vérifier bottom nav disparaît
```

---

### Phase 2.2: FAB (Jour 6)

**Fichier**: `src/components/mobile/FAB.tsx`

```bash
# 1. Créer composant
touch src/components/mobile/FAB.tsx
# Copier le code depuis MOBILE_OPTIMIZATION.md (Phase 2.2)

# 2. Intégrer dans layout
```

**Modification** (`layout.tsx`):
```typescript
import { FAB } from '@/components/mobile/FAB';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <BottomNav />
        <FAB /> {/* Seulement visible < 768px */}
      </body>
    </html>
  );
}
```

**Tests**:
```bash
# 1. Ouvrir en mobile (375px)
# 2. Vérifier FAB visible en bas à droite
# 3. Cliquer sur FAB
# 4. Vérifier redirection vers /transactions/add
# 5. Vérifier FAB ne chevauche pas le contenu
# 6. Scroll vers le bas
# 7. Vérifier FAB reste au-dessus du bottom nav
```

---

### Phase 2.3: Safe Areas iOS/Android (Jour 7)

**CSS** (`globals.css`):
```css
/* Copier depuis MOBILE_OPTIMIZATION.md (Phase 2.4) */
:root {
  --safe-area-inset-top: env(safe-area-inset-top);
  --safe-area-inset-bottom: env(safe-area-inset-bottom);
  --safe-area-inset-left: env(safe-area-inset-left);
  --safe-area-inset-right: env(safe-area-inset-right);
}

/* Touch targets */
button,
a[role="button"] {
  min-width: 48px;
  min-height: 48px;
}
```

**Viewport** (`layout.tsx`):
```tsx
<meta 
  name="viewport" 
  content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover" 
/>
```

**Tests**:
```bash
# iOS Safari (simulateur ou device réel)
# 1. Ouvrir app en plein écran
# 2. Vérifier que le contenu n'est pas rogné par le notch
# 3. Vérifier bottom nav respecte le safe area du bas
# 4. Tester en orientation portrait et paysage
```

---

### Phase 2.4: Android Back Handler (Jour 7-8)

**Hook**: `src/hooks/useAndroidBackHandler.ts`

```bash
# 1. Créer hook
touch src/hooks/useAndroidBackHandler.ts
# Copier le code depuis MOBILE_OPTIMIZATION.md (Phase 2.3)

# 2. Utiliser dans layout
```

**Modification** (`layout.tsx`):
```typescript
'use client';
import { useAndroidBackHandler } from '@/hooks/useAndroidBackHandler';

export default function RootLayout({ children }) {
  useAndroidBackHandler(); // Activer la gestion du back
  
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
```

**Tests** (Android device ou emulator):
```bash
# 1. Ouvrir app
# 2. Naviguer: Dashboard > Transactions > Add
# 3. Appuyer sur back Android
# 4. Vérifier retour à Transactions
# 5. Appuyer sur back Android
# 6. Vérifier retour à Dashboard
# 7. Appuyer sur back Android
# 8. Vérifier dialog "Quitter l'app ?"
```

---

### Phase 3.1: Dynamic Imports Mobile (Jour 9-10)

**Optimisation Recharts** (`dashboard/page.tsx`):
```typescript
import dynamic from 'next/dynamic';

// Charger Recharts uniquement côté client
const TrendChart = dynamic(
  () => import('@/components/dashboard/charts').then(mod => mod.TrendChart),
  { 
    ssr: false,
    loading: () => <ChartSkeleton />
  }
);

// Détecter mobile
const isMobile = () => typeof window !== 'undefined' && window.innerWidth < 768;

export default function DashboardPage() {
  return (
    <div>
      <KPICards /> {/* SSR */}
      
      {/* Graphique desktop */}
      {!isMobile() && <TrendChart />}
      
      {/* Sparkline mobile (léger) */}
      {isMobile() && <MobileSparkline />}
    </div>
  );
}
```

**Tests**:
```bash
# 1. Build
npm run build

# 2. Analyser bundle
npm run analyze

# 3. Vérifier:
# - Recharts dans un chunk séparé
# - Chunk principal ≤ 250 KB

# 4. Tester mobile
# DevTools > Network > Slow 3G
# Vérifier temps de chargement ≤ 3s
```

---

### Phase 3.2: Next/Image Partout (Jour 10-11)

**Rechercher toutes les images**:
```bash
grep -r "<img" src/
# Remplacer par <Image from="next/image" />
```

**Template de remplacement**:
```tsx
// Avant
<img src="/logo.png" alt="Logo" width="200" height="100" />

// Après
import Image from 'next/image';

<Image 
  src="/logo.png" 
  alt="Logo" 
  width={200} 
  height={100}
  priority={false} // true si above-the-fold
/>
```

**Tests**:
```bash
# 1. Build
npm run build

# 2. Lighthouse
npm run perf:mobile

# 3. Vérifier:
# - Images servies en WebP/AVIF
# - Lazy loading activé
# - Pas d'images non optimisées
```

---

### Phase 4.1: TWA Init (Jour 12-13)

**Installation Bubblewrap**:
```bash
npm install -g @bubblewrap/cli
```

**Initialisation**:
```bash
# 1. Créer twa-manifest.json
touch twa-manifest.json
# Copier depuis MOBILE_OPTIMIZATION.md (Phase 3.1)

# 2. Init Bubblewrap
bubblewrap init --manifest=twa-manifest.json

# Réponses interactives:
# - Domain: budget-app.touchpoint.cm
# - Package ID: cm.touchpoint.budget
# - App name: Budget Pro
# - Theme color: #4F46E5
# - Navigation color: #FFFFFF
# - Orientation: portrait
# - Display: standalone
# - Icon URL: https://budget-app.touchpoint.cm/icons/icon-512.png
```

**Générer Keystore** (une seule fois):
```bash
keytool -genkey -v -keystore android.keystore \
  -alias budget-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Réponses:
# - Password: [SECURE_PASSWORD]
# - First/Last name: Budget Pro
# - Organization: Touch Point Insights
# - City: Douala
# - State: Littoral
# - Country: CM
```

**⚠️ IMPORTANT**: Sauvegarder `android.keystore` et le mot de passe de façon sécurisée !

---

### Phase 4.2: Digital Asset Links (Jour 13)

**Récupérer SHA256 Fingerprint**:
```bash
keytool -list -v -keystore android.keystore -alias budget-key

# Copier la ligne:
# SHA256: XX:XX:XX:XX:...
# Remplacer les ":" par rien pour assetlinks.json
```

**Créer assetlinks.json**:
```bash
mkdir -p public/.well-known
touch public/.well-known/assetlinks.json
```

**Contenu** (`public/.well-known/assetlinks.json`):
```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "cm.touchpoint.budget",
      "sha256_cert_fingerprints": [
        "VOTRE_SHA256_FINGERPRINT_ICI"
      ]
    }
  }
]
```

**Vérifier en production**:
```bash
# Déployer sur domaine
# Vérifier accessible:
curl https://budget-app.touchpoint.cm/.well-known/assetlinks.json

# Valider avec Google:
# https://developers.google.com/digital-asset-links/tools/generator
```

---

### Phase 4.3: Build AAB (Jour 14)

**Build**:
```bash
# 1. Build Next.js
npm run build

# 2. Build TWA
bubblewrap build

# Ou avec script NPM:
npm run twa:build

# Fichier généré:
# app-release-bundle.aab
```

**Tester sur device Android**:
```bash
# 1. Connecter device Android (USB debugging activé)
adb devices

# 2. Installer AAB
bubblewrap install

# Ou:
npm run twa:install

# 3. Ouvrir l'app sur le device
# 4. Vérifier:
# - Pas de barre Chrome
# - Plein écran
# - Icône sur launcher
# - Splash screen
# - Navigation fonctionne
# - Deep links OK
```

---

### Phase 5: Publication Play Store (Jour 15-17)

**Préparer Assets**:
```bash
# 1. Screenshots (min 2, max 8)
# Utiliser device ou emulator pour capturer:
# - Dashboard
# - Transactions
# - Budget
# - Objectifs
# - Dettes
# - Rapports
# - Dark mode
# - Offline mode

# Dimensions:
# Téléphone: 1080x1920 ou 1080x2340
# Tablette 7": 1920x1200
# Tablette 10": 2560x1600

# 2. Feature graphic
# Créer image 1024x500 PNG
# Contenu: Logo + titre + tagline

# 3. Icône high-res
# 512x512 PNG 32-bit avec alpha
```

**Play Console Setup**:
```bash
# 1. Créer app sur https://play.google.com/console
# 2. Remplir informations:
#    - Nom, description courte/longue
#    - Catégories, tags
#    - Screenshots, feature graphic
#    - Privacy policy URL
#    - Data Safety form
# 3. Upload AAB dans Internal testing
# 4. Attendre validation (quelques heures)
# 5. Tester avec testeurs internes
# 6. Si OK, promouvoir vers Production
```

---

## ✅ Checklist Finale

### Tests Pre-Production
- [ ] Lighthouse Mobile: PWA ≥ 95, Perf ≥ 90
- [ ] Core Web Vitals: LCP ≤ 2.5s, INP ≤ 200ms
- [ ] Bundle size: Initial ≤ 250 KB gzip
- [ ] Offline mode: CRUD complet fonctionnel
- [ ] Bottom nav + FAB: Aucun chevauchement
- [ ] Android back: Dialog confirmation sur routes racine
- [ ] Notifications: Permission + réception OK
- [ ] Deep links: Ouvrir liens externes dans app
- [ ] Safe areas: Pas de contenu rogné (iOS notch, Android gesture bar)
- [ ] Touch targets: Tous ≥ 48x48dp
- [ ] Accessibilité: Labels ARIA, contrastes AA
- [ ] Dark mode: Respect prefers-color-scheme
- [ ] Tests e2e: Tous passants

### Assets Play Store
- [ ] 2-8 screenshots (téléphone)
- [ ] 2-8 screenshots (tablette 7")
- [ ] 2-8 screenshots (tablette 10") - optionnel
- [ ] Feature graphic 1024x500
- [ ] Icône high-res 512x512
- [ ] Video promo (optionnel)
- [ ] Description courte (80 chars)
- [ ] Description complète (4000 chars)
- [ ] Changelog (500 chars)

### Légal & Compliance
- [ ] Privacy Policy (URL publique)
- [ ] Terms of Service (URL publique)
- [ ] Data Safety form rempli
- [ ] RGPD compliance (si applicable)
- [ ] Age rating approprié (PEGI, ESRB)

### Technique
- [ ] assetlinks.json déployé et accessible
- [ ] SHA256 fingerprint correct
- [ ] Target SDK ≥ 33 (Android 13)
- [ ] 64-bit support (par défaut TWA)
- [ ] Permissions Android justifiées
- [ ] Pas de code obfusqué (TWA utilise web)

### Post-Publication
- [ ] Firebase Performance monitoring activé
- [ ] Firebase Analytics configuré
- [ ] Crashlytics (optionnel)
- [ ] Support email répondant
- [ ] Roadmap v2.1 planifiée

---

## 🚨 Troubleshooting

### Service Worker ne s'active pas
```bash
# 1. Vérifier registration
console.log('SW registered:', navigator.serviceWorker.controller);

# 2. Forcer activation
# Chrome DevTools > Application > Service Workers > "Skip waiting"

# 3. Clear cache
# Application > Storage > Clear site data
```

### Bottom Nav chevauche le contenu
```css
/* Ajouter padding dynamique */
@media (max-width: 767px) {
  main {
    padding-bottom: calc(64px + env(safe-area-inset-bottom) + 20px);
  }
}
```

### TWA n'ouvre pas l'app au clic sur lien
```bash
# 1. Vérifier assetlinks.json accessible
curl https://your-domain.com/.well-known/assetlinks.json

# 2. Vérifier SHA256 correct
keytool -list -v -keystore android.keystore -alias budget-key

# 3. Réinstaller app
adb uninstall cm.touchpoint.budget
bubblewrap install

# 4. Clear app data
# Settings > Apps > Budget Pro > Storage > Clear data
```

### Performance Lighthouse < 90
```bash
# 1. Analyser bundle
npm run analyze

# 2. Identifier gros chunks
# 3. Lazy load composants lourds
# 4. Vérifier images optimisées (WebP/AVIF)
# 5. Désactiver sourcemaps en prod
# 6. Remove console.* via SWC
```

---

## 📞 Support

**Questions techniques** : support@touchpoint.cm  
**Documentation complète** : `docs/MOBILE_OPTIMIZATION.md`  
**Roadmap** : `docs/ROADMAP.md`

---

**Dernière mise à jour** : 3 novembre 2025  
**Version** : 1.0.0
