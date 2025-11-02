# 📋 Guide de Déploiement - Budget Pro

## ⚠️ Problème Actuel
Le déploiement via Firebase CLI échoue en raison de problèmes de connectivité réseau avec les APIs Google Cloud.

## 🔧 Solution : Déploiement Manuel

### 1️⃣ Déployer les Règles Firestore

#### Étape 1 : Accéder à la Console
Ouvrez ce lien : [Console Firestore Rules](https://console.firebase.google.com/project/studio-3821270625-cd276/firestore/rules)

#### Étape 2 : Copier les Règles
Les règles mises à jour se trouvent dans le fichier `firestore.rules` à la racine du projet.

**Règles importantes ajoutées :**
- ✅ `/users/{userId}/goals/{goalId}` - Collection des objectifs financiers
- ✅ `/users/{userId}/categories/{categoryId}` - Catégories de budget
- ✅ `/users/{userId}/expenses/{expenseId}` - Transactions
- ✅ `/users/{userId}/budgetGoals/{budgetGoalId}` - Anciens objectifs (rétrocompatibilité)

#### Étape 3 : Publier
1. Sélectionnez tout le contenu de `firestore.rules`
2. Copiez-le (Cmd+C ou Ctrl+C)
3. Collez dans l'éditeur de la console Firebase
4. Cliquez sur **"Publier"** (Publish)
5. Confirmez la publication

#### Étape 4 : Vérifier
Après publication, rafraîchissez votre application locale. L'erreur "Missing or insufficient permissions" pour la collection `goals` devrait disparaître.

---

### 2️⃣ Déployer l'Application sur Firebase Hosting

#### Option A : Via la Console Firebase (Recommandé si problèmes réseau)

1. **Build de production**
   ```bash
   cd /Users/macbook/Touch-Point-Insights/Finance/Budget
   npm run build
   ```

2. **Créer une archive du build**
   ```bash
   cd .next
   zip -r ../nextjs-build.zip .
   cd ..
   ```

3. **Upload manuel**
   - Accédez à [Firebase Hosting Console](https://console.firebase.google.com/project/studio-3821270625-cd276/hosting)
   - Suivez les instructions pour un déploiement manuel

#### Option B : Via Firebase CLI (quand le réseau est stable)

```bash
cd /Users/macbook/Touch-Point-Insights/Finance/Budget
firebase deploy --only hosting
```

Ou déploiement complet :
```bash
firebase deploy
```

---

## 🎯 Nouvelles Fonctionnalités Déployées

### 1. Système de Gestion d'Objectifs Financiers
- **Page :** `/goals`
- **Fonctionnalités :**
  - Création d'objectifs (épargne, achat, dette, plafond)
  - Ajout rapide de contributions (+1k, +5k, +10k CFA)
  - Barres de progression visuelles
  - Historique des contributions
  - Pause/activation des objectifs
  - Priorités configurables

### 2. Interface d'Ajout de Transaction Améliorée
- **Page :** `/transactions/add`
- **Améliorations :**
  - 🔴 Bouton Dépense (rouge) avec icône TrendingDown
  - 🟢 Bouton Revenu (vert) avec icône TrendingUp
  - Plus de liste déroulante - sélection directe et visuelle
  - Formulaire responsive et moderne
  - Catégories filtrées automatiquement selon le type

### 3. Répartition Automatique des Budgets
- **Page :** `/categories`
- **Fonctionnalités :**
  - Suggestions de répartition des charges modifiables
  - Suggestions de répartition des revenus modifiables
  - Budget mensuel global avec calcul du reste à allouer
  - Avertissement de dépassement en temps réel
  - Création/modification/suppression de catégories personnalisées

### 4. Mode Offline Firestore
- **Fonctionnalité globale :**
  - Persistance offline activée (IndexedDB multi-onglets)
  - Indicateur visuel de statut de connexion
  - 🟠 Badge orange en mode offline
  - 🟢 Badge vert quand connexion rétablie
  - Synchronisation automatique des données

---

## 🔍 Vérification Post-Déploiement

### Checklist
- [ ] Règles Firestore publiées
- [ ] Build de production réussi (`npm run build`)
- [ ] Application déployée sur Firebase Hosting
- [ ] URL de production fonctionnelle
- [ ] Connexion Firebase active
- [ ] Objectifs créables et modifiables
- [ ] Transactions ajoutables
- [ ] Catégories personnalisables
- [ ] Mode offline fonctionnel

### URLs à Vérifier
- **Console Firebase :** https://console.firebase.google.com/project/studio-3821270625-cd276
- **Firestore Rules :** https://console.firebase.google.com/project/studio-3821270625-cd276/firestore/rules
- **Hosting :** https://console.firebase.google.com/project/studio-3821270625-cd276/hosting
- **Application Locale :** http://localhost:9002

---

## 🐛 Dépannage

### Erreur "Missing or insufficient permissions"
- ✅ **Solution :** Vérifiez que les règles Firestore incluent bien la collection `/users/{userId}/goals/{goalId}`
- 📋 **Action :** Re-déployer les règles via la console Firebase

### Erreur "EADDRINUSE: address already in use"
```bash
lsof -ti:9002 | xargs kill -9
npm run dev
```

### Erreur de build
```bash
# Nettoyer le cache
rm -rf .next node_modules
npm install
npm run build
```

### Problème de connexion Firebase
- Vérifiez votre connexion Internet
- Testez : `ping firestore.googleapis.com`
- Vérifiez les variables d'environnement dans `.env.local`

---

## 📝 Notes Importantes

1. **Fichiers sensibles :** Le fichier `.env.local` contient des clés API. Ne JAMAIS le commiter sur Git.
2. **Node version :** Le projet nécessite Node.js version 20 (actuellement 22, peut causer des avertissements).
3. **Build warnings :** Les avertissements EBADENGINE sont normaux et n'affectent pas le fonctionnement.
4. **Mode Offline :** L'application fonctionne en mode offline grâce à IndexedDB - les modifications sont synchronisées automatiquement.

---

## 🚀 Commandes Rapides

```bash
# Développement local
npm run dev

# Build de production
npm run build

# Déploiement complet (quand réseau stable)
firebase deploy

# Déploiement règles seulement
firebase deploy --only firestore:rules

# Déploiement hosting seulement
firebase deploy --only hosting

# Voir les projets Firebase
firebase projects:list

# Changer de projet
firebase use studio-3821270625-cd276
```

---

## ✅ Prochaines Étapes

1. Déployer les règles Firestore manuellement via la console
2. Vérifier que l'application locale fonctionne sans erreurs de permissions
3. Tester toutes les nouvelles fonctionnalités
4. Créer un build de production
5. Déployer sur Firebase Hosting (manuel ou CLI selon réseau)
6. Tester l'application en production

---

**Date de mise à jour :** 20 octobre 2025  
**Version :** 1.0.0  
**Projet :** Budget Pro - Budget Management Application
