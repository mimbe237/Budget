# 🚀 Commandes Rapides - Système d'Affiliation

## 📍 État Actuel
- ✅ **Frontend** : 100% prêt
- ✅ **Backend** : Code compilé, prêt à déployer
- ⏸️ **Déploiement** : En attente (problème réseau temporaire)
- ✅ **Firestore** : Programme initialisé
- ✅ **Next.js** : http://localhost:9002

---

## 🎯 Commandes Essentielles

### 1. Démarrer le Serveur Dev
```bash
cd /Users/macbook/Touch-Point-Insights/Finance/Budget
npm run dev
# Ouvre sur http://localhost:9002
```

### 2. Déployer Backend (Quand Réseau Stable)

#### Option A : Déploiement Complet (Rapide)
```bash
# Tout en une fois (5-10 min)
firebase deploy --only functions
firebase deploy --only firestore:rules,firestore:indexes
```

#### Option B : Déploiement Progressif (Plus Sûr)
```bash
# Fonctions critiques d'abord
firebase deploy --only functions:trackClick
firebase deploy --only functions:createAffiliate
firebase deploy --only functions:createAffiliateLink

# Puis les autres
firebase deploy --only functions:approveAffiliate
firebase deploy --only functions:blockAffiliate
firebase deploy --only functions:attributeConversion
firebase deploy --only functions:markPayoutPaid

# CRONs en dernier
firebase deploy --only functions:recurringCommissionsCron
firebase deploy --only functions:generatePayoutsCron
firebase deploy --only functions:antiFraudScannerCron

# Rules & Indexes
firebase deploy --only firestore:indexes
firebase deploy --only firestore:rules
```

### 3. Après Déploiement : Configurer Tracking URL

#### Récupérer l'URL de trackClick
```bash
firebase functions:list | grep trackClick
# Résultat attendu :
# trackClick (us-central1) - https://us-central1-studio-3821270625-cd276.cloudfunctions.net/trackClick
```

#### Mettre à jour .env.local
```bash
# Ouvrir .env.local et remplacer
NEXT_PUBLIC_TRACK_CLICK_URL=""

# Par (remplacer REGION par us-central1 ou autre)
NEXT_PUBLIC_TRACK_CLICK_URL="https://us-central1-studio-3821270625-cd276.cloudfunctions.net/trackClick"
```

#### Redémarrer Next.js
```bash
# Tuer le serveur (Ctrl+C dans le terminal)
npm run dev
```

### 4. Réinitialiser le Programme (Si Besoin)
```bash
cd scripts
node seed-affiliate-program.js
# Crée/met à jour affiliateProgram/default avec les 4 tiers
```

---

## 🧪 Tester le Système

### Test 1 : UI Pages Affiliates (Maintenant)
```bash
# Visiter ces URLs dans le navigateur
open http://localhost:9002/affiliates
open http://localhost:9002/affiliates/register
open http://localhost:9002/affiliates/links
open http://localhost:9002/admin/affiliates
```

### Test 2 : Workflow Complet (Après Déploiement)

#### A. Inscription Affilié
```
1. Visiter http://localhost:9002/affiliates/register
2. Remplir formulaire (nom, email, méthode paiement)
3. Soumettre
4. Vérifier Firestore : Collection "affiliates", status: PENDING
```

#### B. Approbation Admin
```
1. Se connecter en tant qu'admin
2. Visiter http://localhost:9002/admin/affiliates
3. Cliquer "Approuver" sur l'affilié créé
4. Vérifier status devient APPROVED
```

#### C. Création Lien
```
1. Visiter http://localhost:9002/affiliates/links
2. Créer un lien :
   - Destination : http://localhost:9002
   - Campagne : test-nov-2025
   - UTM Source : facebook
3. Copier le lien généré (ex: http://localhost:9002?aff=ABC123&utm_source=facebook)
```

#### D. Tracking Click
```
1. Ouvrir **nouvel onglet incognito**
2. Visiter le lien copié
3. Ouvrir DevTools → Console
4. Vérifier :
   localStorage.getItem('aff:code')     // ABC123
   localStorage.getItem('aff:deviceId') // UUID
   localStorage.getItem('aff:clickId')  // UUID
5. Vérifier Firestore : Collection "clicks", nouveau document
```

#### E. Attribution Conversion
```
1. Simuler un signup/achat avec le même navigateur incognito
2. Vérifier Firestore :
   - Collection "referrals" : nouveau document
   - Collection "commissions" : nouveau document (status: PENDING)
```

---

## 🔍 Diagnostics

### Vérifier l'état Firebase
```bash
firebase projects:list
firebase use studio-3821270625-cd276
firebase functions:list
```

### Voir les logs Functions
```bash
# Tous les logs
firebase functions:log

# Logs d'une fonction spécifique
firebase functions:log --only trackClick

# Logs en temps réel
firebase functions:log --follow
```

### Compiler les Functions Localement
```bash
cd functions
npm install
npm run build
# Vérifier que lib/ est créé sans erreurs
```

### Tester avec Emulators (Alternative au Déploiement)
```bash
# Démarrer tous les émulateurs
firebase emulators:start

# Ouvrir UI émulateurs
open http://localhost:4000

# Exécuter tests e2e
npx playwright test
```

---

## 🐛 Problèmes Courants

### Port 9002 déjà utilisé
```bash
# Tuer le processus
lsof -ti:9002 | xargs kill -9
npm run dev
```

### Erreur "ECONNRESET" lors du déploiement
```bash
# Vérifier connexion
ping googleapis.com

# Attendre connexion stable
# Utiliser Option B (déploiement progressif)
```

### localStorage vide après click
```bash
# Vérifier URL configurée
echo $NEXT_PUBLIC_TRACK_CLICK_URL

# Si vide, mettre à jour .env.local et redémarrer
npm run dev
```

### Aucune commission créée
```bash
# Vérifier programme initialisé
# Dans Firestore Console : affiliateProgram/default doit exister

# Sinon, réexécuter
cd scripts
node seed-affiliate-program.js
```

---

## 📚 Documentation Complète

| Document | Description |
|----------|-------------|
| `AFFILIATE_STATUS.md` | État actuel du système (ce fichier résumé) |
| `DEPLOY_AFFILIATES.md` | Guide détaillé déploiement + dépannage |
| `docs/AFFILIATE_FRONTEND.md` | Guide frontend (workflows, exemples) |
| `README.md` | Documentation projet général |

---

## 🎯 Actions Recommandées (Par Priorité)

### Maintenant
1. ✅ **Tester UI** : Visiter les pages pour voir l'interface
2. ✅ **Lire documentation** : Parcourir `AFFILIATE_STATUS.md`

### Quand Connexion Stable
1. 🚀 **Déployer functions** : `firebase deploy --only functions`
2. 🔒 **Déployer rules** : `firebase deploy --only firestore`
3. ⚙️ **Configurer .env.local** : Ajouter `NEXT_PUBLIC_TRACK_CLICK_URL`
4. 🧪 **Tests complets** : Suivre workflow A→B→C→D→E

### Améliorations Futures
1. 📧 **Emails** : Sendgrid pour notifications
2. 📄 **PDF** : Génération factures
3. 📥 **CSV** : Export données
4. 🛡️ **Rate limiting** : Protection anti-abus

---

**Dernière mise à jour** : 2 novembre 2025, 18:50  
**Version** : 1.0.0  
**Status** : ✅ Prêt à déployer
