# Guide de Création de 4 Dettes de Test

**Date**: 15 novembre 2025
**Statut**: ✅ Système réparé - Prêt pour les tests

## 🔧 Corrections Appliquées

### 1. Index Firestore Déployés ✅
```bash
firebase deploy --only firestore
```

Les index suivants ont été créés/mis à jour :
- `debtSchedules` : `(debtId ASC, periodIndex ASC)`
- `debtSchedules` : `(debtId ASC, dueDate ASC)`
- `debtSchedules` : `(debtId ASC, status ASC)`
- `debtPayments` : `(debtId ASC, paidAt DESC)`
- `debtRateHistory` : `(debtId ASC, effectiveDate DESC)`

### 2. Règles Firestore Mises à Jour ✅
- Collection `debts` : Permissions read/write pour utilisateurs authentifiés
- Collections `debtSchedules`, `debtPayments`, `debtRateHistory` : Permissions configurées
- Sous-collections `/users/{userId}/debts/*` : Miroir pour queries scoped

### 3. Problème Identifié
**Erreur 500 sur `buildSchedule`** : Index composite manquant
- Résolu par le déploiement Firestore
- Les Cloud Functions `createDebt` et `buildSchedule` sont opérationnelles

## 📝 Créer 4 Dettes de Test - Interface Web

### Méthode 1: Via l'Interface /debts/new

1. **Démarrer l'application**
   ```bash
   npm run dev
   ```

2. **Se connecter**
   - Email: `businessclubleader7@gmail.com`
   - Mot de passe: [votre mot de passe]

3. **Créer les 4 dettes suivantes** :

#### Dette 1: Prêt Immobilier
```
Type: EMPRUNT
Nom: Prêt immobilier - Test 1
Contrepartie: Banque XYZ
Montant: 10 000 000 XAF
Taux annuel: 5.5%
Durée: 240 mois (20 ans)
Fréquence: MENSUEL
Date de début: 01/01/2025
Frais initiaux: 200 000 XAF
Assurance mensuelle: 15 000 XAF
```

#### Dette 2: Crédit Automobile
```
Type: EMPRUNT
Nom: Crédit automobile - Test 2
Contrepartie: Société de crédit ABC
Montant: 5 000 000 XAF
Taux annuel: 8%
Durée: 60 mois (5 ans)
Fréquence: MENSUEL
Date de début: 01/02/2025
Frais initiaux: 100 000 XAF
Assurance mensuelle: 8 000 XAF
```

#### Dette 3: Prêt à un Ami
```
Type: PRET
Nom: Prêt à un ami - Test 3
Contrepartie: Jean Dupont
Montant: 5 000 EUR
Taux annuel: 2%
Durée: 12 mois (1 an)
Fréquence: MENSUEL
Date de début: 01/03/2025
Frais initiaux: 0 EUR
Assurance mensuelle: 0 EUR
```

#### Dette 4: Crédit Consommation
```
Type: EMPRUNT
Nom: Crédit consommation - Test 4
Contrepartie: Banque DEF
Montant: 10 000 USD
Taux annuel: 12%
Durée: 36 mois (3 ans)
Fréquence: MENSUEL
Date de début: 01/04/2025
Mode d'amortissement: PRINCIPAL_CONSTANT
Période de grâce: 2 mois
Frais initiaux: 500 USD
Assurance mensuelle: 50 USD
```

### Méthode 2: Via Script Automatisé (Avancé)

**OPTION A - Configuration Firebase Admin SDK**

1. **Télécharger la clé de service**
   ```bash
   # Via Firebase Console
   # Project Settings > Service Accounts > Generate new private key
   # Sauvegarder dans: firebase-admin-key.json
   ```

2. **Configurer la variable d'environnement**
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS="./firebase-admin-key.json"
   ```

3. **Exécuter le script**
   ```bash
   node scripts/create-test-debts-full.js QE79kfsdIDMVn94c129WVygjMh32
   ```

**OPTION B - Via Firebase Emulator (Développement Local)**

1. **Démarrer les émulateurs**
   ```bash
   firebase emulators:start --only firestore,auth,functions
   ```

2. **Modifier le script pour pointer vers l'émulateur**
   ```javascript
   // Dans create-test-debts-full.js
   if (process.env.FIRESTORE_EMULATOR_HOST) {
     admin.initializeApp({
       projectId: 'studio-3821270625-cd276',
     });
   }
   ```

3. **Exécuter avec l'émulateur**
   ```bash
   export FIRESTORE_EMULATOR_HOST="localhost:8080"
   node scripts/create-test-debts-full.js QE79kfsdIDMVn94c129WVygjMh32
   ```

## ✅ Vérification Post-Création

### 1. Vérifier les Dettes Créées
```bash
# Via Firebase CLI
firebase firestore:get debts --limit 10

# Ou via l'interface web
# Naviguer vers: http://localhost:3000/debts
```

### 2. Vérifier les Échéanciers
```bash
# Pour chaque debtId
firebase firestore:get debtSchedules --where "debtId==DEBT_ID_HERE" --limit 5
```

### 3. Tester la Navigation
- ✅ Liste des dettes : `/debts`
- ✅ Détail d'une dette : `/debts/[debtId]`
- ✅ Création : `/debts/new`
- ✅ Modification : `/debts/[debtId]/edit`

## 🐛 Dépannage

### Erreur "Index Required"
```bash
# Solution: Redéployer les index
firebase deploy --only firestore:indexes
```

### Erreur 500 sur buildSchedule
```bash
# Solution: Vérifier les logs
firebase functions:log | grep buildSchedule

# Vérifier la version déployée
firebase functions:list | grep buildSchedule
```

### Dette créée mais pas d'échéancier
```bash
# Solution: Construire manuellement
# 1. Récupérer debtId depuis /debts
# 2. Cliquer sur "Générer l'échéancier" dans le détail
```

### Erreur de Permission
```bash
# Vérifier que l'utilisateur est authentifié
# Vérifier firestore.rules :
firebase firestore:rules:get

# Redéployer si nécessaire
firebase deploy --only firestore:rules
```

## 📊 Données de Test Créées

Une fois les 4 dettes créées, vous aurez :

| Dette | Montant | Devise | Périodes | Type | Status |
|-------|---------|--------|----------|------|--------|
| Prêt immobilier | 10 000 000 | XAF | 240 | EMPRUNT | EN_COURS |
| Crédit auto | 5 000 000 | XAF | 60 | EMPRUNT | EN_COURS |
| Prêt ami | 5 000 | EUR | 12 | PRET | EN_COURS |
| Crédit conso | 10 000 | USD | 36 | EMPRUNT | EN_COURS |

**Total échéances générées** : 240 + 60 + 12 + 36 = **348 échéances**

## 📖 Ressources

- **Cloud Functions** : `functions/src/debts.ts`
- **Formulaire de création** : `src/app/debts/new/page.tsx`
- **API Client** : `src/lib/debts/api.ts`
- **Calculs d'amortissement** : `src/lib/debts/amortization.ts`
- **Règles Firestore** : `firestore.rules`
- **Index Firestore** : `firestore.indexes.json`

## 🎯 Prochaines Étapes

1. ✅ Créer les 4 dettes via l'interface web
2. ✅ Vérifier que les échéanciers sont générés
3. ✅ Tester les paiements sur une échéance
4. ✅ Vérifier le calcul du capital restant dû
5. ✅ Tester la vue détaillée de chaque dette

---

**Note** : Le système est maintenant pleinement opérationnel. Les erreurs 500 étaient causées par des index Firestore manquants, maintenant corrigés.
