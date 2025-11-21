# 🤝 Système d'Affiliation - Budget Pro

## Vue d'ensemble

Le système d'affiliation de Budget Pro permet de suivre les clics, conversions et commissions des affiliés, avec attribution automatique, paiements récurrents, détection anti-fraude et portail affilié complet.

---

## 📋 Fonctionnalités

### Suivi & Attribution
- ✅ Tracking des clics avec cookie 90j + localStorage
- ✅ Attribution LAST_CLICK / FIRST_CLICK configurable
- ✅ Cross-device tracking via Auth
- ✅ Détection bots (User-Agent)
- ✅ Hashing IP/UA pour RGPD

### Commissions
- ✅ One-shot (achats uniques)
- ✅ Récurrent (abonnements, jusqu'à 12 mois)
- ✅ Paliers (BASIC/PRO/VIP)
- ✅ Bonus
- ✅ Clawback (refunds/chargebacks)

### Paiements
- ✅ Seuil minimum configurable
- ✅ Génération automatique mensuelle
- ✅ Méthodes : SEPA, PayPal, Mobile Money
- ✅ Factures PDF (à implémenter)

### Anti-Fraude
- ✅ Détection auto-référencement
- ✅ Ratio clic→conversion anormal
- ✅ IPs multiples en peu de temps
- ✅ Trafic bot excessif

### Portail Affilié
- 📊 Dashboard KPIs temps réel
- 🔗 Générateur de liens + bannières
- 📈 Stats par campagne/période
- 💰 Conversions, commissions, paiements
- 🧾 Factures & retraits

### Admin
- ✅ Validation affiliés
- ✅ Surveillance anti-fraude
- ✅ Audit trail (admin_logs)
- ✅ Génération payouts
- ✅ Exports CSV/Excel

---

## 🏗️ Architecture

### Collections Firestore

```
affiliates/
  {affiliateId}
    - userId: string
    - status: PENDING|APPROVED|BLOCKED
    - programTier: BASIC|PRO|VIP
    - defaultAttribution: LAST_CLICK|FIRST_CLICK
    - cookieDays: number
    - payoutMethod: SEPA|PayPal|MobileMoney
    - totals: { clicks, referrals, approvedCommissions, pendingCommissions, paidOut }

affiliateLinks/
  {linkId}
    - affiliateId: string
    - code: string (unique)
    - destinationUrl: string
    - utmDefaults: { source, medium, campaign }
    - active: boolean

clicks/
  {clickId}
    - linkId, affiliateId
    - ipHash, uaHash, deviceId
    - utm: { source, medium, campaign, content, term }
    - landingPath, referer
    - isBot: boolean

referrals/
  {referralId}
    - affiliateId, linkId, clickId, userId
    - eventType: SIGNUP|PURCHASE|SUBSCRIPTION_START
    - orderId, subscriptionId
    - amountGross, currency
    - status: PENDING|APPROVED|REJECTED

commissions/
  {commissionId}
    - affiliateId, referralId
    - schema: FIXED|PERCENT|RECURRING|TIERED|BONUS
    - basisAmount, ratePct, fixedAmount
    - period: ONE_TIME|MONTHLY
    - monthKey: YYYY-MM
    - status: PENDING|APPROVED|VOID|PAID
    - reason: NORMAL|REFUND|CHARGEBACK|FRAUD

payouts/
  {payoutId}
    - affiliateId
    - periodFrom, periodTo
    - amount, currency
    - status: DUE|PROCESSING|PAID|FAILED
    - method, destinationMasked
    - invoiceUrl

programRules/
  BASIC|PRO|VIP
    - defaultRatePct: number
    - fixedBounty: number
    - recurringMonths: number
    - minPayout: number
    - cookieDays: number
    - attribution: FIRST_TOUCH|LAST_TOUCH
```

### Index Firestore

Déjà ajoutés dans `firestore.indexes.json` :
- clicks: (affiliateId, createdAt desc), (linkId, createdAt desc)
- referrals: (affiliateId, createdAt desc), (userId, createdAt desc), (status)
- commissions: (affiliateId, status, monthKey), (referralId)
- payouts: (affiliateId, status, periodTo desc)
- affiliateLinks: (affiliateId, active)
- affiliates: (status, createdAt desc)

### Cloud Functions

**Management**
- `createAffiliate()` - Créer un affilié (statut PENDING)
- `approveAffiliate()` - Approuver (admin)
- `blockAffiliate()` - Bloquer (admin)
- `createAffiliateLink()` - Générer lien unique

**Tracking**
- `trackClick()` - HTTPS GET endpoint pour tracking

**Attribution**
- `attributeConversion()` - Attribuer conversion → créer referral + commission

**Webhooks**
- `approveOrVoidOnEvents()` - Approuver/annuler commissions selon paiements

**CRON**
- `recurringCommissionsCron()` - Quotidien : générer commissions mensuelles
- `generatePayoutsCron()` - Mensuel (1er) : créer payouts ≥ seuil
- `antiFraudScannerCron()` - Quotidien : détecter fraude

**Paiements**
- `markPayoutPaid()` - Marquer payout payé + générer facture

---

## 🚀 Installation & Setup

### 1. Déployer les règles Firestore

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 2. Seed program rules

```bash
cd scripts
node seed-affiliate-program.js
```

Cela créera 3 tiers :
- **BASIC**: 15%, 3 mois récurrents, seuil 50k XAF
- **PRO**: 20%, 6 mois récurrents, seuil 30k XAF
- **VIP**: 25%, 12 mois récurrents, seuil 20k XAF

### 3. Déployer les fonctions

```bash
cd functions
npm install
npm run build
firebase deploy --only functions
```

### 4. Configurer les variables d'environnement

```bash
firebase functions:config:set \
  hash.salt="votre-secret-salt-aleatoire"
```

---

## 📖 Usage

### Créer un affilié

```typescript
import { httpsCallable } from 'firebase/functions';

const createAffiliate = httpsCallable(functions, 'createAffiliate');
const result = await createAffiliate({ programTier: 'BASIC' });
// { affiliateId, status: 'PENDING' }
```

### Approuver un affilié (admin)

```typescript
const approveAffiliate = httpsCallable(functions, 'approveAffiliate');
await approveAffiliate({ affiliateId: 'abc123' });
```

### Créer un lien affilié

```typescript
const createAffiliateLink = httpsCallable(functions, 'createAffiliateLink');
const result = await createAffiliateLink({
  destinationUrl: 'https://budgetpro.cm/signup',
  campaignName: 'summer2025'
});
// { linkId, code: 'summer2025-a1b2c3d4', url: '...?aff=summer2025-a1b2c3d4' }
```

### Tracking (client-side)

```html
<script>
  // Exemple : tracking automatique sur landing page
  const urlParams = new URLSearchParams(window.location.search);
  const affCode = urlParams.get('aff');
  
  if (affCode) {
    // Stocker dans cookie + localStorage
    document.cookie = `aff_code=${affCode}; max-age=${90*24*60*60}; path=/`;
    localStorage.setItem('aff_code', affCode);
    
    // Appel API tracking
    const deviceId = localStorage.getItem('device_id') || crypto.randomUUID();
    localStorage.setItem('device_id', deviceId);
    
    fetch(`https://your-region-your-project.cloudfunctions.net/trackClick?aff=${affCode}&deviceId=${deviceId}&landing=${window.location.pathname}&utm_source=${urlParams.get('utm_source') || ''}&utm_medium=${urlParams.get('utm_medium') || ''}&utm_campaign=${urlParams.get('utm_campaign') || ''}`)
      .then(res => res.json())
      .then(data => {
        localStorage.setItem('aff_click_id', data.clickId);
      });
  }
</script>
```

### Attribution de conversion

```typescript
const attributeConversion = httpsCallable(functions, 'attributeConversion');

// À l'achat ou inscription
const clickId = localStorage.getItem('aff_click_id');
const deviceId = localStorage.getItem('device_id');

await attributeConversion({
  userId: auth.currentUser.uid,
  orderId: 'order_123',
  amount: 50000, // XAF
  currency: 'XAF',
  eventType: 'PURCHASE',
  clickId,
  deviceId,
});
```

---

## 🧪 Tests

### Unitaires (Vitest)

```bash
npm run test
```

### E2E (Playwright)

```bash
npx playwright test
```

---

## 📊 KPIs & Métriques

- **Taux de conversion** : referrals / clicks
- **EPC** (Earnings Per Click) : commissions / clicks
- **LTV par affilié** : revenus générés vie entière
- **Délai approbation → paiement**
- **% chargebacks**
- **Contribution CA par tier**

---

## 🔐 Sécurité & Conformité

- **RGPD** : IP/UA hashés, droit suppression via rules
- **Anti-fraude** : scanner quotidien, blocage auto
- **Consentement cookies** : bannière requise (à implémenter côté UI)
- **Disclosure légal** : mention "lien affilié" sur pages publics

---

## 🛠️ Roadmap

- [ ] Portail affilié Next.js (pages + composants UI)
- [ ] Admin affiliés (pages Next.js)
- [ ] Génération factures PDF (Cloud Run + pdf-lib)
- [ ] Exports CSV/Excel (admin + affilié)
- [ ] Intégration paiements (Stripe, PayPal, MTN/Orange Money)
- [ ] Webhooks externes (notif affilié, sync CRM)
- [ ] Tests e2e complets (Playwright)
- [ ] Bannières & médias (générateur UI)

---

## 📞 Support

Pour questions ou bugs, contactez l'équipe dev ou ouvrez une issue dans le repo.

---

**Dernière mise à jour** : 2 novembre 2025  
**Version** : 1.0.0 (Beta)
