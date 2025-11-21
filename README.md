# 💰 Application de Gestion de Budget Personnel

Application Flutter moderne de gestion de budget avec Firebase Firestore.

## 🏗️ Architecture

### Structure de la Base de Données Firestore

```
users/
  {userId}/
    - displayName: string
    - email: string
    - currency: string
    - createdAt: timestamp
    - updatedAt: timestamp
    
    accounts/
      {accountId}/
        - name: string
        - type: enum (checking, savings, cash, creditCard, investment, other)
        - balance: number
        - currency: string
        - icon: string
        - color: string
        - isActive: boolean
        - createdAt: timestamp
        - updatedAt: timestamp
    
    transactions/
      {transactionId}/
        - accountId: string
        - categoryId: string
        - type: enum (income, expense, transfer)
        - amount: number
        - description: string
        - note: string
        - date: timestamp
        - toAccountId: string (pour transferts)
        - tags: array
        - receiptUrl: string
        - createdAt: timestamp
        - updatedAt: timestamp
    
    categories/
      {categoryId}/
        - name: string
        - type: enum (income, expense)
        - icon: string
        - color: string
        - isDefault: boolean
        - isActive: boolean
        - createdAt: timestamp
        - updatedAt: timestamp
    
    goals/
      {goalId}/
        - name: string
        - description: string
        - targetAmount: number
        - currentAmount: number
        - targetDate: timestamp
        - icon: string
        - color: string
        - status: enum (active, completed, cancelled)
        - createdAt: timestamp
        - updatedAt: timestamp
    
    ious/
      {iouId}/
        - type: enum (iOwe, owedToMe)
        - personName: string
        - personEmail: string
        - personPhone: string
        - amount: number
        - paidAmount: number
        - description: string
        - dueDate: timestamp
        - status: enum (pending, partiallyPaid, paid, cancelled)
        - createdAt: timestamp
        - updatedAt: timestamp
```

### Structure du Projet

```
lib/
├── models/                      # Modèles de données
│   ├── user_profile.dart       # Profil utilisateur
│   ├── account.dart            # Compte bancaire
│   ├── transaction.dart        # Transaction financière
│   ├── category.dart           # Catégorie
│   ├── goal.dart               # Objectif d'épargne
│   └── iou.dart                # Dette/Créance
│
├── services/                    # Services
│   ├── firestore_service.dart  # Service Firestore (Singleton)
│   └── firestore_service_example.dart  # Exemples d'utilisation
│
├── screens/                     # Écrans (à créer)
│   ├── onboarding/
│   ├── home/
│   ├── transactions/
│   ├── budget/
│   └── admin/
│
└── widgets/                     # Widgets réutilisables (à créer)
```

## ✨ Fonctionnalités du Service Firestore

### 🔐 Authentification & Profil
- ✅ `signInAnonymously()` - Connexion anonyme
- ✅ `createUserProfile()` - Créer un profil utilisateur
- ✅ `getUserProfile()` - Récupérer le profil
- ✅ `getUserProfileStream()` - Stream du profil en temps réel
- ✅ `updateUserProfile()` - Mettre à jour le profil

### 💳 Comptes
- ✅ `addAccount()` - Ajouter un compte
- ✅ `getAccountsStream()` - Stream des comptes en temps réel
- ✅ `getAccount()` - Récupérer un compte
- ✅ `updateAccount()` - Mettre à jour un compte
- ✅ `deleteAccount()` - Désactiver un compte

### 💸 Transactions
- ✅ `addTransaction()` - **Ajouter une transaction avec mise à jour atomique du solde**
- ✅ `getTransactionsStream()` - Stream des transactions avec filtres
- ✅ `getTransaction()` - Récupérer une transaction
- ✅ `deleteTransaction()` - Supprimer avec restauration du solde

**Points Clés:**
- Utilise des **Transactions Firestore** pour garantir l'atomicité
- Met à jour automatiquement le solde du compte
- Gère les transferts entre comptes
- Restaure le solde lors de la suppression

### 📁 Catégories
- ✅ `addCategory()` - Ajouter une catégorie
- ✅ `getCategoriesStream()` - Stream des catégories

### 🎯 Objectifs
- ✅ `addGoal()` - Ajouter un objectif
- ✅ `getGoalsStream()` - Stream des objectifs
- ✅ `updateGoalProgress()` - Mettre à jour la progression

### 💰 Dettes/Créances (IOUs)
- ✅ `addIOU()` - Ajouter une dette/créance
- ✅ `getIOUsStream()` - Stream des IOUs
- ✅ `recordIOUPayment()` - Enregistrer un paiement

## 🚀 Utilisation

### Installation

```bash
# Installer les dépendances
flutter pub get

# Configurer Firebase
# 1. Créer un projet Firebase sur console.firebase.google.com
# 2. Ajouter votre application Flutter
# 3. Télécharger google-services.json (Android) et GoogleService-Info.plist (iOS)
# 4. Suivre les instructions de configuration Firebase
```

### Exemple d'Utilisation

```dart
import 'package:budget/services/firestore_service.dart';
import 'package:budget/models/account.dart';
import 'package:budget/models/transaction.dart' as app_transaction;

// Obtenir l'instance du service (Singleton)
final firestoreService = FirestoreService();

// 1. Onboarding
final userId = await firestoreService.signInAnonymously();
await firestoreService.createUserProfile(
  userId: userId,
  displayName: 'John Doe',
  currency: 'EUR',
);

// 2. Créer un compte
final accountId = await firestoreService.addAccount(
  userId: userId,
  name: 'Compte Courant',
  type: AccountType.checking,
  balance: 1000.0,
  icon: '💳',
  color: '#4CAF50',
);

// 3. Ajouter une transaction (le solde est mis à jour automatiquement)
final transactionId = await firestoreService.addTransaction(
  userId: userId,
  accountId: accountId,
  type: app_transaction.TransactionType.expense,
  amount: 50.0,
  description: 'Courses',
);

// 4. Écouter les comptes en temps réel
firestoreService.getAccountsStream(userId).listen((accounts) {
  for (var account in accounts) {
    print('${account.name}: ${account.balance}€');
  }
});
```

## 🎨 Design UI

L'application utilise un design moderne avec:
- **Couleurs vives** et dynamiques
- **Coins arrondis** pour une apparence douce
- **Transitions fluides** avec flutter_animate
- **Google Fonts** pour une typographie élégante

## 📦 Dépendances

- `firebase_core` - Core Firebase
- `firebase_auth` - Authentification
- `cloud_firestore` - Base de données
- `provider` - State management
- `google_fonts` - Polices personnalisées
- `flutter_animate` - Animations fluides
- `intl` - Internationalisation et formatage
- `uuid` - Génération d'IDs uniques

## 🔒 Sécurité

⚠️ **Important:** Configurez les règles de sécurité Firestore pour protéger vos données:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

## 📝 Prochaines Étapes

1. ✅ Modèles de données créés
2. ✅ Service Firestore implémenté
3. 🔜 Créer les écrans d'onboarding
4. 🔜 Implémenter l'écran d'accueil
5. 🔜 Créer le module de transactions
6. 🔜 Implémenter le module budget
7. 🔜 Créer le module admin

## 📄 Licence

MIT
