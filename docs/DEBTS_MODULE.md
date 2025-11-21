# Gestion des dettes (Prêt & Emprunt)

Ce module introduit la gestion complète des dettes (emprunts et prêts) dans l'application Budget Pro.
Il couvre les fonctionnalités de back-end (Cloud Functions), de stockage (Firestore/Storage) et le front-end utilisateur.

## Fonctionnalités principales

- Création d'une dette (type `EMPRUNT` ou `PRET`) avec tous les paramètres requis : montant, taux, amortissement, assurance, pénalités, etc.
- Génération d'un échéancier complet (collection `debtSchedules`) respectant le mode d'amortissement :
  - Annuité (mensualité constante)
  - Principal constant
  - Interest only
  - Balloon
- Enregistrement des paiements avec allocation automatique (frais → intérêts → assurance → principal).
- Simulation et application de remboursements anticipés (`RE-AMORTIR` ou `RACCOURCIR_DUREE`).
- Gestion des retards (tâche Cron `markLateAndPenalize`).
- Restructuration d'une dette (clôture de l'ancienne, création d'une nouvelle avec nouveaux termes).
- Téléversement sécurisé d'un contrat PDF dans Firebase Storage (`contracts/{userId}/{debtId}.pdf`).
- Récapitulatif et KPI (API `getDebtSummary`).

## Architecture technique

- **Cloud Functions (`functions/src/debts.ts`)**
  - `createDebt`, `buildSchedule`, `recordPayment`, `simulatePrepayment`, `applyPrepayment`, `markLateAndPenalize`, `restructureDebt`, `uploadContractUrl`, `getDebtSummary`.
  - Partage du moteur d'amortissement (`functions/src/lib/amortization.ts`).
- **Firestore**
  - Collections principales : `debts`, `debtSchedules`, `debtPayments`, `debtRateHistory`.
  - Règles mise à jour dans `firestore.rules`.
  - Index ajoutés dans `firestore.indexes.json`.
- **Storage**
  - Règles spécifiques (`storage.rules`) limitant l'upload PDF à 10 Mo.
- **Front-end**
  - `src/app/debts/page.tsx` : liste & KPI.
  - `src/app/debts/new/page.tsx` : assistant multi-étapes.
  - `src/app/debts/[id]/page.tsx` : détail avec onglets, paiements, simulations, contrat.
  - API client `src/lib/debts/api.ts`.
  - Navigation actualisée (`AppLayout`).
- **Tests**
  - `tests/debts/amortization.test.ts` couvre plusieurs cas d'amortissement & allocation.

## Configuration et déploiement

1. **Firestore**
   - Déployer les règles : `firebase deploy --only firestore:rules`.
   - Déployer les index (ou attendre la création automatique via console).
2. **Storage**
   - Déployer les règles : `firebase deploy --only storage`.
3. **Cloud Functions**
   - Vérifier les dépendances dans `functions` (Firebase Admin/Functions déjà installés).
   - Déployer : `firebase deploy --only functions`.
4. **Next.js**
   - Le front consomme les fonctions via `httpsCallable`; aucune configuration supplémentaire n'est requise hors des identifiants Firebase déjà utilisés.

## Commandes utiles

```bash
# Lint complet (warnings possibles existants)
npm run lint

# Tests unitaires ciblés
npm run test -- amortization
```

## Points d'attention

- Les règles Firestore interdisent l'écriture directe sur `debtSchedules` et `debtPayments` côté client ; toutes les mutations doivent passer par les Cloud Functions.
- Les taux variables nécessitent d'alimenter `debtRateHistory` pour refléter les changements ; la fonction `buildSchedule` lit les valeurs pertinentes.
- Les simulations de remboursement et la restructuration doivent être utilisées avec prudence en production (effet irréversible sur l'échéancier).

Pour toute question ou extension (ex. DTI avancé, intégration comptable), se référer à cette documentation et aux fichiers listés ci-dessus.
