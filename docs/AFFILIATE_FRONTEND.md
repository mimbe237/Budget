# Système d'Affiliation Budget Pro - Guide Frontend

## 📁 Structure des fichiers

### Pages Utilisateur (`/affiliates`)
- `/affiliates` - Dashboard principal (KPIs, liens rapides)
- `/affiliates/register` - Inscription affilié
- `/affiliates/links` - Gestion des liens UTM
- `/affiliates/stats` - Graphiques de performance (Recharts)
- `/affiliates/conversions` - Liste des referrals
- `/affiliates/commissions` - Historique des commissions
- `/affiliates/payouts` - Historique des paiements
- `/affiliates/profile` - Paramètres & méthode de paiement

### Pages Admin (`/admin/affiliates`)
- `/admin/affiliates` - Liste tous les affiliés, approbation/blocage
- `/admin/affiliates/[id]` - Détails d'un affilié (liens, conversions, commissions)
- `/admin/affiliates/payouts` - Gestion des paiements (marquer payé, générer factures)

### Hooks React Query (`src/hooks/affiliates/`)
- `useAffiliate()` - Compte affilié de l'utilisateur connecté
- `useAffiliateLinks(affiliateId)` - Liens d'un affilié
- `useClicks(affiliateId, since?)` - Clics avec filtre date
- `useReferrals(affiliateId, status?)` - Conversions avec filtre statut
- `useCommissions(affiliateId, status?)` - Commissions
- `usePayouts(affiliateId, status?)` - Paiements

### Composants
- `AffiliateTracker` - Détection automatique `?aff=CODE`, stockage cookie/localStorage, appel `trackClick`
- **Intégré dans** `src/app/layout.tsx` (global, s'exécute sur toutes les pages)

### API Client (`src/lib/affiliates/api.ts`)
- `createAffiliate(payload)` - Inscription
- `approveAffiliate({ affiliateId })` - Admin approve
- `blockAffiliate({ affiliateId, reason })` - Admin bloque
- `createAffiliateLink(payload)` - Génère lien UTM
- `markPayoutPaid({ payoutId, txRef, invoiceUrl })` - Admin marque payé

### Utilitaires
- `src/firebase/client.ts` - Exports `db`, `functions` préconfigurés
- `src/lib/affiliates/api.ts` - Wrapper Cloud Functions

## 🚀 Workflow utilisateur

### 1. Inscription
```typescript
// Page: /affiliates/register
import { createAffiliate } from '@/lib/affiliates/api';

await createAffiliate({
  userId: user.uid,
  payoutMethod: 'SEPA', // ou 'PAYPAL', 'MOBILE_MONEY'
  payoutDetails: { bankName, iban },
  promotionChannels: 'Blog, réseaux sociaux'
});
// Statut: PENDING → attend approbation admin
```

### 2. Approbation admin
```typescript
// Page: /admin/affiliates
import { approveAffiliate } from '@/lib/affiliates/api';

await approveAffiliate({ affiliateId: 'abc123' });
// Statut: APPROVED → affilié peut créer des liens
```

### 3. Création de liens
```typescript
// Page: /affiliates/links
import { createAffiliateLink } from '@/lib/affiliates/api';

await createAffiliateLink({
  affiliateId: 'abc123',
  name: 'Campagne Facebook Janvier',
  utmSource: 'facebook',
  utmMedium: 'social',
  utmCampaign: 'jan2025',
  landingPage: 'https://budget-pro.com'
});
// Lien généré: https://budget-pro.com?aff=AFF123&utm_source=facebook&utm_medium=social&utm_campaign=jan2025
```

### 4. Tracking automatique
```typescript
// Composant: AffiliateTracker (dans layout.tsx)
// Détecte ?aff=CODE automatiquement
// Stocke: localStorage + cookie (90 jours par défaut)
// Appelle: GET https://yourproject.cloudfunctions.net/trackClick?aff=CODE&utm_source=...
```

### 5. Attribution de conversion
```typescript
// Backend: functions/src/affiliates/attribution.ts
// Déclenché lors de signup/achat
// Vérifie cookie/localStorage
// Crée referral + commission (PENDING)
```

### 6. Approbation commissions
```typescript
// Backend: functions/src/affiliates/webhooks.ts
// Écoute événements paiement (payment.succeeded)
// Statut commission: PENDING → APPROVED
```

### 7. Génération payouts
```typescript
// Backend: CRON mensuel (1er du mois, 03:00)
// Agrège commissions APPROVED ≥ minPayout (20k XAF)
// Crée payout (DUE)
```

### 8. Paiement par admin
```typescript
// Page: /admin/affiliates/payouts
import { markPayoutPaid } from '@/lib/affiliates/api';

await markPayoutPaid({
  payoutId: 'payout123',
  txRef: 'TXN-2025-001',
  invoiceUrl: 'https://storage.../invoice.pdf'
});
// Statut payout: DUE → PAID
// Statut commissions: APPROVED → PAID
```

## 🎨 Composants UI utilisés

- **shadcn/ui**: Card, Table, Badge, Button, Input, Select, Alert, Skeleton, Tabs, Dialog
- **Recharts**: LineChart, BarChart, PieChart (page stats)
- **Lucide Icons**: TrendingUp, Users, Wallet, Link2, etc.
- **Toast**: `sonner` pour les notifications

## 🔒 Sécurité Firestore

### Rules principales (firestore.rules)
```javascript
// Affiliés: lecture/écriture par owner ou admin
match /affiliates/{affiliateId} {
  allow get, update, delete: if isAuthenticated() && (request.auth.uid == resource.data.userId || isAdmin());
  allow create: if isAuthenticated() && request.auth.uid == request.resource.data.userId;
  allow list: if isAdmin();
}

// Clicks: création publique (tracking), lecture par owner
match /clicks/{clickId} {
  allow get, list: if isAuthenticated() && (request.auth.uid == resource.data.affiliateId || isAdmin());
  allow create: if true; // Tracking public, anti-fraude backend
  allow update, delete: if false;
}

// Commissions/Payouts: admin crée, affilié lit
match /commissions/{commissionId} {
  allow get: if isAuthenticated() && (request.auth.uid == resource.data.affiliateId || isAdmin());
  allow create: if isAdmin();
  allow list: if isAdmin();
}
```

## 🔧 Configuration

### Variables d'environnement
```bash
# .env.local
NEXT_PUBLIC_TRACK_CLICK_URL=https://yourproject.cloudfunctions.net/trackClick
NEXT_PUBLIC_FIREBASE_API_KEY=...
```

### Cloud Functions (déployées)
```bash
# functions/src/affiliates/
- management.ts (createAffiliate, approveAffiliate, blockAffiliate, createAffiliateLink)
- tracking.ts (trackClick - HTTPS GET endpoint public)
- attribution.ts (attributeConversion)
- webhooks.ts (approveOrVoidOnEvents)
- payouts.ts (recurringCommissionsCron, generatePayoutsCron, markPayoutPaid)
- antifraud.ts (antiFraudScannerCron)
```

## 📊 KPIs disponibles

### Utilisateur affilié
- Clics totaux
- Conversions totales
- Revenus totaux (toutes commissions)
- À recevoir (PENDING + APPROVED)
- Taux de conversion (conversions/clics)

### Admin
- Total affiliés
- En attente d'approbation
- Approuvés actifs
- Revenus totaux générés

## 🎯 Prochaines étapes (optionnel)

1. **Tests unitaires** - `vitest` pour hooks et utils
2. **Tests e2e** - `playwright` pour workflow complet (inscription → tracking → commission)
3. **Export CSV** - Télécharger clics/conversions/commissions
4. **PDF Invoices** - Génération factures via Cloud Run + pdf-lib
5. **Emails notifications** - SendGrid/Mailgun pour approbations, payouts
6. **Dashboard analytique avancé** - Cohortes, LTV, CAC par affilié

## 📚 Documentation complète

- **Backend**: `docs/AFFILIATE_SYSTEM.md`
- **Firestore Schema**: `docs/firestore.affiliates.schema.md`
- **Seed Script**: `scripts/seed-affiliate-program.js`
- **Functions**: `functions/src/affiliates/`

## 🐛 Dépannage

### Cookie non détecté
- Vérifier `document.cookie` dans DevTools Console
- Vérifier domaine (SameSite=Lax, Secure uniquement en HTTPS)

### trackClick ne renvoie pas de données
- Vérifier URL dans `.env.local` (NEXT_PUBLIC_TRACK_CLICK_URL)
- Vérifier logs Cloud Functions
- Vérifier anti-bot (User-Agent valide requis)

### Commissions non créées
- Vérifier `attributeConversion` appelé lors de signup/achat
- Vérifier clickId/deviceId passés
- Vérifier cookie expiry (60-120 jours selon tier)

### Règles Firestore permission-denied
- Vérifier `firestore.rules` déployées (`firebase deploy --only firestore:rules`)
- Vérifier custom claims admin (`auth.token.admin == true`)
