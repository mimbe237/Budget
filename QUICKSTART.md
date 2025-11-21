# 🚀 Guide de Démarrage Rapide

## Bienvenue ! 👋

Ce guide vous aidera à démarrer rapidement avec votre application de gestion de budget.

## 📋 Prérequis

- ✅ Flutter SDK (≥ 3.0.0)
- ✅ Dart SDK
- ✅ Compte Firebase (gratuit)
- ✅ Éditeur de code (VS Code recommandé)

## ⚡ Installation en 5 Minutes

### Étape 1️⃣ : Cloner et Installer

```bash
# Se placer dans le dossier du projet
cd /Users/macbook/budget

# Installer les dépendances
flutter pub get
```

### Étape 2️⃣ : Configurer Firebase

**Option A : Configuration Automatique (Recommandée)**

```bash
# Installer FlutterFire CLI
dart pub global activate flutterfire_cli

# Configurer Firebase automatiquement
flutterfire configure
```

**Option B : Configuration Manuelle**

Suivez le guide détaillé : [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

### Étape 3️⃣ : Lancer l'Application

```bash
# Vérifier les appareils disponibles
flutter devices

# Lancer sur Android
flutter run

# Ou sur iOS
flutter run -d ios

# Ou sur le web
flutter run -d chrome
```

### Étape 4️⃣ : Vérifier que Tout Fonctionne

Vous devriez voir :
- ✅ Écran de bienvenue
- ✅ "Firebase initialized successfully" dans les logs
- ✅ Pas d'erreurs dans la console

## 🧪 Test du Service Firestore

Créez un fichier de test rapide :

```dart
// lib/test_firestore.dart
import 'package:flutter/material.dart';
import 'services/firestore_service.dart';
import 'models/account.dart';

void testFirestoreService() async {
  final service = FirestoreService();
  
  try {
    // 1. Connexion anonyme
    print('🔐 Connexion...');
    final userId = await service.signInAnonymously();
    print('✅ Connecté : $userId');
    
    // 2. Créer le profil
    print('👤 Création du profil...');
    await service.createUserProfile(
      userId: userId,
      displayName: 'Test User',
      currency: 'EUR',
    );
    print('✅ Profil créé');
    
    // 3. Créer un compte
    print('💳 Création du compte...');
    final accountId = await service.addAccount(
      userId: userId,
      name: 'Mon Compte',
      type: AccountType.checking,
      balance: 1000.0,
      icon: '💰',
      color: '#4CAF50',
    );
    print('✅ Compte créé : $accountId');
    
    print('\n🎉 Tous les tests sont passés !');
  } catch (e) {
    print('❌ Erreur : $e');
  }
}
```

Puis appelez cette fonction depuis votre `main.dart` :

```dart
// Dans main.dart, après Firebase.initializeApp()
if (kDebugMode) {
  testFirestoreService();
}
```

## 📱 Structure de l'Application

### Flux d'Onboarding

```
1. Écran de bienvenue
   ↓
2. Connexion anonyme
   ↓
3. Configuration du profil
   ↓
4. Création du premier compte
   ↓
5. Dashboard principal
```

### Navigation Principale

```
┌─────────────────────────┐
│       Dashboard         │  ← Accueil
│  (Soldes & Résumé)      │
└─────────────────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ Comptes│ │Transac-│
│        │ │tions   │
└────────┘ └────────┘
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│ Budget │ │ Stats  │
└────────┘ └────────┘
```

## 🎨 Personnalisation

### Changer les Couleurs

Éditez `lib/constants/app_design.dart` :

```dart
static const Color primaryIndigo = Color(0xFF6366F1); // ← Votre couleur
```

### Ajouter des Catégories

Éditez `lib/constants/default_categories.dart` :

```dart
{
  'name': 'Ma Catégorie',
  'type': CategoryType.expense,
  'icon': '🎯',
  'color': '#FF5733',
}
```

### Changer la Devise

Dans le service lors de la création du profil :

```dart
await firestoreService.createUserProfile(
  userId: userId,
  displayName: 'John',
  currency: 'USD', // ← CHF, GBP, etc.
);
```

## 🔍 Debugging

### Voir les Logs Firebase

```bash
# Activer les logs détaillés
flutter run --verbose
```

### Inspecter Firestore

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet
3. Cliquez sur **Firestore Database**
4. Vous verrez toutes vos données en temps réel

### Problèmes Courants

#### ❌ "MissingPluginException"

```bash
flutter clean
flutter pub get
flutter run
```

#### ❌ "Firebase not initialized"

Vérifiez que `Firebase.initializeApp()` est appelé dans `main()` :

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(); // ← Important !
  runApp(const BudgetApp());
}
```

#### ❌ Erreurs de build Android

```bash
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get
```

## 📚 Documentation Disponible

| Fichier | Description |
|---------|-------------|
| [README.md](./README.md) | Documentation complète |
| [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) | Configuration Firebase |
| [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) | Résumé du projet |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | Structure détaillée |

## 🎓 Apprendre Plus

### Tutoriels Recommandés

1. **Firestore Basics** : [firebase.google.com/docs/firestore](https://firebase.google.com/docs/firestore)
2. **Flutter State Management** : [docs.flutter.dev/data-and-backend/state-mgmt](https://docs.flutter.dev/data-and-backend/state-mgmt)
3. **Material Design 3** : [m3.material.io](https://m3.material.io)

### Exemples d'Utilisation

Consultez `lib/services/firestore_service_example.dart` pour des exemples complets.

## 🤝 Prochaines Étapes

### À Faire Maintenant

1. ✅ Configurer Firebase
2. ✅ Lancer l'application
3. ✅ Tester le service Firestore

### À Faire Ensuite

1. 🔜 Créer les écrans d'onboarding
2. 🔜 Implémenter le dashboard
3. 🔜 Ajouter les transactions

### Besoin d'Aide ?

- 📖 Lisez la [documentation complète](./README.md)
- 🔥 Consultez la [doc Firebase](https://firebase.google.com/docs)
- 💬 Posez des questions sur [Stack Overflow](https://stackoverflow.com/questions/tagged/flutter)

---

## ✨ Conseils Pro

### Performance

```dart
// Utiliser des streams avec limites
getTransactionsStream(userId, limit: 50) // ← Limiter les résultats
```

### Sécurité

```dart
// Toujours valider les données côté client ET serveur
if (amount <= 0) {
  throw Exception('Le montant doit être positif');
}
```

### UI/UX

```dart
// Utiliser des indicateurs de chargement
StreamBuilder(
  builder: (context, snapshot) {
    if (snapshot.connectionState == ConnectionState.waiting) {
      return CircularProgressIndicator(); // ← Feedback utilisateur
    }
    // ...
  }
)
```

---

**🎉 Vous êtes prêt à créer une application incroyable !**

Bonne chance ! 🚀
