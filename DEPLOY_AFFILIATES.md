# Guide de Déploiement - Système d'Affiliation

## ⚠️ Problèmes résolus avant déploiement

### 1. Correction TypeScript (✅ FAIT)
**Fichier** : `functions/src/affiliates/management.ts`  
**Problème** : Variable `code` utilisée avant assignation  
**Solution** : Initialisée à `''` et ajout vérification `!code`

### 2. Correction firebase.json (✅ FAIT)
**Problème** : Duplication de l'entrée `functions`  
**Solution** : Consolidée en une seule entrée array avec `nodejs20`

### 3. Nettoyage indexes (✅ FAIT)
**Fichiers** : `firestore.indexes.json`  
**Supprimés** :
- Index `referrals.status` (simple field, auto-indexé)
- Index `commissions.referralId` (simple field, auto-indexé)

## 📋 Étapes de déploiement

### Étape 1 : Vérifier la connexion Firebase
```bash
firebase login:list
firebase use studio-3821270625-cd276
```

### Étape 2 : Compiler les Functions
```bash
cd functions
npm install
npm run build
cd ..
```

✅ **Résultat attendu** : Dossier `functions/lib/` créé avec les fichiers JS compilés

### Étape 3 : Déployer les Firestore Rules & Indexes

#### Option A : Tout déployer ensemble
```bash
firebase deploy --only firestore
```

#### Option B : Séparément (en cas d'erreur)
```bash
# Indexes d'abord
firebase deploy --only firestore:indexes

# Rules ensuite
firebase deploy --only firestore:rules
```

### Étape 4 : Déployer les Cloud Functions

#### Option A : Déployer toutes les fonctions affiliés
```bash
firebase deploy --only functions
```

#### Option B : Déployer fonction par fonction (plus lent mais plus sûr)
```bash
# Tracking (le plus important)
firebase deploy --only functions:trackClick

# Management
firebase deploy --only functions:createAffiliate
firebase deploy --only functions:approveAffiliate
firebase deploy --only functions:blockAffiliate
firebase deploy --only functions:createAffiliateLink

# Attribution
firebase deploy --only functions:attributeConversion

# Webhooks
firebase deploy --only functions:approveOrVoidOnEvents

# Payouts & CRON
firebase deploy --only functions:recurringCommissionsCron
firebase deploy --only functions:generatePayoutsCron
firebase deploy --only functions:markPayoutPaid

# Anti-fraude
firebase deploy --only functions:antiFraudScannerCron
```

**⏱️ Durée estimée** : 
- Toutes ensemble : 5-10 minutes
- Une par une : 15-20 minutes

### Étape 5 : Récupérer l'URL de trackClick

```bash
firebase functions:list
```

Chercher dans la sortie :
```
trackClick (us-central1) - https://us-central1-studio-3821270625-cd276.cloudfunctions.net/trackClick
```

OU via console Firebase :
1. Ouvrir https://console.firebase.google.com/project/studio-3821270625-cd276/functions
2. Cliquer sur `trackClick`
3. Copier l'URL (onglet "Détails")

### Étape 6 : Configurer les variables d'environnement

**Fichier** : `.env.local` (à la racine du projet)

```bash
# Ajouter cette ligne
NEXT_PUBLIC_TRACK_CLICK_URL=https://us-central1-studio-3821270625-cd276.cloudfunctions.net/trackClick
```

**Important** : L'URL doit correspondre exactement à celle obtenue à l'étape 5.

### Étape 7 : Initialiser le Programme d'Affiliation

```bash
cd scripts
node seed-affiliate-program.js
```

Ce script crée :
- Collection `affiliateProgram` avec les règles de commission par défaut
- Tiers (BRONZE, SILVER, GOLD, PLATINUM)
- Seuils de conversions
- Cookie expiry (60-120 jours)

### Étape 8 : Redémarrer Next.js

```bash
npm run dev
```

✅ Vérifier dans les logs :
```
○ Compiling / ...
✓ Compiled / in XXXms
```

## 🧪 Tests Post-Déploiement

### Test 1 : Inscription Affilié
1. Visiter http://localhost:3000/affiliates/register
2. Remplir le formulaire (PayPal, SEPA, ou Mobile Money)
3. Soumettre
4. ✅ Statut devrait être `PENDING`

### Test 2 : Approbation Admin
1. Connexion admin (voir `ADMIN_USERS_README.md`)
2. Visiter http://localhost:3000/admin/affiliates
3. Cliquer "Approuver" sur l'affilié créé
4. ✅ Statut devient `APPROVED`

### Test 3 : Création de lien
1. Visiter http://localhost:3000/affiliates/links
2. Créer un lien avec :
   - Destination : `http://localhost:3000`
   - Campagne : `test-nov-2025`
   - UTM Source : `facebook`
3. ✅ Lien généré : `http://localhost:3000?aff=ABC123&utm_source=facebook&...`

### Test 4 : Tracking de Click
1. Ouvrir un nouvel onglet **Incognito**
2. Visiter le lien généré à l'étape 3
3. Ouvrir DevTools → Console
4. Vérifier localStorage :
   ```javascript
   console.log(localStorage.getItem('aff:code')); // ABC123
   console.log(localStorage.getItem('aff:deviceId')); // un UUID
   console.log(localStorage.getItem('aff:clickId')); // un UUID
   ```
5. Vérifier Firestore Console :
   - Collection `clicks` → 1 nouveau document avec `affiliateId`, `linkId`, `createdAt`

### Test 5 : Attribution de Conversion (Manuel pour l'instant)
```javascript
// Dans la console Firebase Functions
const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Simuler une conversion
const attributeConversion = httpsCallable(functions, 'attributeConversion');
attributeConversion({
  userId: 'USER_ID_TEST',
  orderId: 'ORDER_123',
  amount: 5000,
  clickId: 'CLICK_ID_FROM_STEP_4',
  deviceId: 'DEVICE_ID_FROM_STEP_4'
});
```

6. Vérifier dans Firestore :
   - Collection `referrals` → 1 nouveau document
   - Collection `commissions` → 1 nouveau document (status: PENDING)

### Test 6 : Paiement Commission (CRON - attendre 1er du mois)
Les CRONs s'exécutent automatiquement :
- `recurringCommissionsCron` : Chaque jour à 02:00 (crée commissions RECURRING)
- `generatePayoutsCron` : 1er du mois à 03:00 (crée payouts DUE)
- `antiFraudScannerCron` : Chaque jour à 04:00 (détecte fraudes)

**Pour tester manuellement** :
```bash
# Via Firebase CLI
firebase functions:shell

# Dans le shell
generatePayoutsCron()
```

## 🐛 Dépannage

### Erreur : "socket hang up"
**Cause** : Connexion réseau instable  
**Solution** :
1. Vérifier la connexion internet
2. Désactiver VPN/proxy si actif
3. Réessayer dans quelques minutes
4. Utiliser déploiement fonction par fonction (Option B)

### Erreur : "Failed to make request to firebaserules.googleapis.com"
**Cause** : API Firestore Rules non activée ou problème réseau  
**Solution** :
```bash
# Activer l'API manuellement
gcloud services enable firebaserules.googleapis.com --project=studio-3821270625-cd276

# OU via console
# https://console.cloud.google.com/apis/library/firebaserules.googleapis.com?project=studio-3821270625-cd276
```

### Erreur : "index is not necessary"
**Cause** : Index sur un seul champ (Firestore les crée automatiquement)  
**Solution** : ✅ Déjà corrigé dans `firestore.indexes.json`

### Erreur : "Variable 'code' is used before being assigned"
**Cause** : TypeScript strict mode  
**Solution** : ✅ Déjà corrigé dans `functions/src/affiliates/management.ts`

### trackClick ne retourne rien
**Causes possibles** :
1. User-Agent invalide (détecté comme bot)
2. IP en liste noire
3. Code affilié inexistant

**Debug** :
```bash
# Voir les logs Cloud Functions
firebase functions:log --only trackClick

# Logs en temps réel
firebase functions:log --only trackClick --follow
```

### localStorage vide après click
**Causes** :
1. `NEXT_PUBLIC_TRACK_CLICK_URL` non configuré → fetch échoue silencieusement
2. CORS bloqué (si frontend ≠ localhost)
3. JavaScript désactivé

**Vérification** :
```javascript
// Dans DevTools Console
console.log(process.env.NEXT_PUBLIC_TRACK_CLICK_URL);
// Devrait afficher l'URL complète
```

### Aucune commission créée après conversion
**Causes** :
1. Programme d'affiliation non initialisé (pas de règles)
2. Cookie expiré (> 90 jours)
3. Affilié bloqué ou non approuvé

**Vérification** :
```bash
# Dans Firestore Console
# Collection: affiliateProgram
# Devrait avoir 1 document avec tiers, cookieExpiryDays, etc.

cd scripts
node seed-affiliate-program.js
```

## 📊 Monitoring Production

### Vérifier santé des functions
```bash
# Toutes les functions
firebase functions:list

# Logs d'une function spécifique
firebase functions:log --only trackClick --limit 50

# Quotas et métriques
# https://console.firebase.google.com/project/studio-3821270625-cd276/usage
```

### Métriques clés à surveiller
1. **trackClick** : 
   - Taux d'erreur < 5%
   - Latence p95 < 1s
   - Détection bot ~30-50% des requêtes

2. **attributeConversion** :
   - Taux de matching (clickId ou deviceId trouvé) > 70%
   - Latence p95 < 2s

3. **generatePayoutsCron** :
   - Exécution réussie chaque 1er du mois
   - Nombre de payouts créés cohérent

4. **antiFraudScannerCron** :
   - Exécution quotidienne
   - Alertes sur patterns suspects

### Alertes recommandées (Firebase Extensions)
- Erreur rate > 10% sur trackClick → Email admin
- CRON failure → Email admin + Slack
- Commission void > 30% sur un affilié → Flag review

## 🔐 Sécurité Post-Déploiement

### Firestore Rules
Vérifier dans Console Firebase → Firestore → Rules :
```javascript
// Affiliates : owned read/write
allow get, update: if isAuthenticated() && request.auth.uid == resource.data.userId;
allow create: if isAuthenticated() && request.auth.uid == request.resource.data.userId;
allow list: if isAdmin();

// Clicks : public create (tracking), private read
allow create: if true; // Anti-fraude backend
allow get, list: if isAuthenticated() && isOwnerOrAdmin();

// Commissions/Payouts : admin write, affiliate read
allow get: if isAuthenticated() && isOwnerOrAdmin();
allow create, update, delete: if isAdmin();
```

### Cloud Functions Authentication
- ✅ `trackClick` : Public (détection bot dans code)
- ✅ `createAffiliate` : Authentifié (vérifie `auth.uid`)
- ✅ `approveAffiliate` : Admin seulement (vérifie custom claim `admin`)
- ✅ `markPayoutPaid` : Admin seulement

## 📈 Prochaines Optimisations

1. **CDN pour trackClick** : Réduire latence (Cloud Run + Cloud CDN)
2. **Rate limiting** : Prevent abuse (Firebase App Check + reCAPTCHA)
3. **Webhooks sortants** : Notifier affiliés des conversions/payouts
4. **Dashboard analytique** : Grafana + BigQuery export
5. **Tests e2e** : Playwright scenarios complets

## 📞 Support

- **Firestore Console** : https://console.firebase.google.com/project/studio-3821270625-cd276/firestore
- **Functions Console** : https://console.firebase.google.com/project/studio-3821270625-cd276/functions
- **Documentation Backend** : `docs/AFFILIATE_SYSTEM.md`
- **Documentation Frontend** : `docs/AFFILIATE_FRONTEND.md`

---

**Dernière mise à jour** : 2 novembre 2025  
**Status** : Code prêt, déploiement en attente (problèmes réseau)  
**Build Functions** : ✅ Compilé sans erreurs  
**firebase.json** : ✅ Corrigé (une seule entrée functions)  
**Indexes** : ✅ Nettoyés (indexes simples supprimés)
