# 🔥 Guide de Configuration Firebase

Ce guide vous aidera à configurer Firebase pour votre application de budget.

## Étape 1 : Créer un Projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur "Ajouter un projet"
3. Nommez votre projet (ex: "budget-app")
4. Suivez les étapes de création

## Étape 2 : Activer les Services Firebase

### 2.1 Activer l'Authentification

1. Dans la console Firebase, allez dans **Authentication**
2. Cliquez sur "Commencer"
3. Dans l'onglet **Sign-in method**, activez :
   - ✅ **Anonyme** (requis pour l'onboarding)
   - ✅ **E-mail/Mot de passe** (optionnel)
   - ✅ **Google** (optionnel)

### 2.2 Activer Firestore Database

1. Allez dans **Firestore Database**
2. Cliquez sur "Créer une base de données"
3. Choisissez **Mode Production**
4. Sélectionnez une région (ex: europe-west1)
5. Cliquez sur "Activer"

### 2.3 Configurer les Règles de Sécurité

1. Dans Firestore, allez dans l'onglet **Règles**
2. Copiez-collez le contenu du fichier `firestore.rules` de ce projet
3. Cliquez sur "Publier"

## Étape 3 : Ajouter Firebase à votre Application Flutter

### 3.1 Installer Firebase CLI

**Option A : Via npm (si Node.js est installé)**

```bash
# Vérifier si npm est installé
npm --version

# Si npm est installé, installer Firebase CLI
npm install -g firebase-tools

# Se connecter à Firebase
firebase login
```

**Option B : Via Homebrew (recommandé sur macOS)**

```bash
# Installer Firebase CLI via Homebrew
brew install firebase-cli

# Se connecter à Firebase
firebase login
```

**Option C : Via curl (alternative)**

```bash
# Télécharger et installer Firebase CLI
curl -sL https://firebase.tools | bash

# Se connecter à Firebase
firebase login
```

### 3.2 Installer FlutterFire CLI

```bash
# Installer FlutterFire CLI
dart pub global activate flutterfire_cli

# Vérifier que le PATH est configuré
export PATH="$PATH":"$HOME/.pub-cache/bin"

# Ajouter au .zshrc pour permanence
echo 'export PATH="$PATH":"$HOME/.pub-cache/bin"' >> ~/.zshrc
source ~/.zshrc

# Vérifier l'installation
flutterfire --version
```

### 3.3 Configurer Firebase pour Flutter

```bash
# À la racine de votre projet Flutter
cd /Users/macbook/budget

# Lancer la configuration
Cette commande va :
- Créer automatiquement les configurations iOS et Android
- Générer le fichier `lib/firebase_options.dart`
- Télécharger les fichiers de configuration nécessaires

### 3.3 Sélectionner votre Projet

1. Choisissez votre projet Firebase dans la liste
2. Sélectionnez les plateformes (iOS, Android, Web, etc.)
3. Le CLI va automatiquement configurer votre projet

## Étape 4 : Vérifier la Configuration

### Android

Vérifiez que `android/app/google-services.json` existe.

Si besoin de le télécharger manuellement :
1. Console Firebase > Paramètres du projet > Vos applications
2. Sélectionnez votre app Android
3. Téléchargez `google-services.json`
4. Placez-le dans `android/app/`

### iOS

Vérifiez que `ios/Runner/GoogleService-Info.plist` existe.

Si besoin de le télécharger manuellement :
1. Console Firebase > Paramètres du projet > Vos applications
2. Sélectionnez votre app iOS
3. Téléchargez `GoogleService-Info.plist`
4. Placez-le dans `ios/Runner/`

## Étape 5 : Tester la Configuration

### 5.1 Installer les Dépendances

```bash
flutter pub get
```

### 5.2 Lancer l'Application

```bash
# Android
flutter run

# iOS
flutter run -d ios
```

### 5.3 Vérifier la Connexion

Dans les logs, vous devriez voir :
```
✓ Firebase initialized successfully
```

## Étape 6 : Indexation Firestore (Optionnel mais Recommandé)

Pour des requêtes plus rapides, créez des index :


### Index pour Transactions
- Collection : `users/{userId}/transactions`
  - `date` (Descending)
  
- Collection : `users/{userId}/transactions`
- Champs :

### Index pour Comptes
- Collection : `users/{userId}/accounts`
- Champs :
  - `isActive` (Ascending)
  - `createdAt` (Ascending)

## Dépannage

### Erreur : "Unable to resolve dependency"

```bash
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get
```

### Erreur : "Firebase not initialized"

Vérifiez que `Firebase.initializeApp()` est appelé dans `main()` :

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );
  runApp(const BudgetApp());
}
```

### Erreur iOS : "GoogleService-Info.plist not found"

1. Ouvrez le projet iOS dans Xcode : `open ios/Runner.xcworkspace`
2. Glissez-déposez `GoogleService-Info.plist` dans le projet

- [Documentation Firebase](https://firebase.google.com/docs)
- [FlutterFire Documentation](https://firebase.flutter.dev/)
- [Firestore Data Modeling](https://firebase.google.com/docs/firestore/data-model)

# 🔥 Guide de Configuration Firebase

## Étape 1 : Installation de Flutter

### Via Homebrew (recommandé)
```bash
brew install --cask flutter
```

### Ou téléchargement manuel
1. Téléchargez Flutter : https://docs.flutter.dev/get-started/install/macos
2. Extrayez l'archive dans votre dossier utilisateur
3. Ajoutez Flutter au PATH :
```bash
export PATH="$PATH:`pwd`/flutter/bin"
```

### Vérification
```bash
flutter doctor
flutter --version
```

---

## Étape 2 : Création du Projet Firebase

### 2.1 Console Firebase
1. Allez sur https://console.firebase.google.com/
2. Cliquez sur **"Ajouter un projet"**
3. Nom du projet : `budget-personnel` (ou votre choix)
4. Activez Google Analytics (optionnel)
5. Cliquez sur **"Créer un projet"**

### 2.2 Ajouter les applications
#### Application iOS
1. Dans la console Firebase, cliquez sur l'icône iOS
2. Bundle ID : `com.votreentreprise.budget` (à personnaliser)
3. Téléchargez `GoogleService-Info.plist`
4. Placez-le dans `ios/Runner/`

#### Application Android
1. Cliquez sur l'icône Android
2. Package name : `com.votreentreprise.budget`
3. Téléchargez `google-services.json`
4. Placez-le dans `android/app/`

---

## Étape 3 : Installation de FlutterFire CLI

```bash
# Installer Firebase CLI
curl -sL https://firebase.tools | bash

# Installer FlutterFire CLI
dart pub global activate flutterfire_cli

# Ajouter au PATH si nécessaire
export PATH="$PATH":"$HOME/.pub-cache/bin"
```

---

## Étape 4 : Configuration Automatique avec FlutterFire

### Dans le dossier du projet
```bash
cd /Users/macbook/budget

# Configurer Firebase (génère firebase_options.dart)
flutterfire configure
```

### Sélections recommandées :
- **Project** : Sélectionnez votre projet Firebase
- **Platforms** : iOS, Android, macOS, Web (selon vos besoins)
- Le fichier `lib/firebase_options.dart` sera créé automatiquement

---

## Étape 5 : Activation des Services Firebase

### 5.1 Firestore Database
1. Dans la console Firebase : **Build > Firestore Database**
2. Cliquez sur **"Créer une base de données"**
3. Mode : **"Commencer en mode test"** (pour développement)
4. Région : `europe-west1` (ou la plus proche)

### 5.2 Authentication
1. Dans la console Firebase : **Build > Authentication**
2. Cliquez sur **"Commencer"**
3. Activez les méthodes :
   - ✅ **E-mail/Mot de passe**
   - ✅ **Google** (optionnel)
   - ✅ **Apple** (optionnel pour iOS)

---

## Étape 6 : Firestore Security Rules

Dans la console Firebase > **Firestore Database > Règles**, collez :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return request.auth.uid == userId;
    }
    
    function isAdmin() {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow create: if isAuthenticated() && isOwner(userId);
      allow update: if isAuthenticated() && (isOwner(userId) || isAdmin());
      allow delete: if isAdmin();
    }
    
    // Transactions collection
    match /users/{userId}/transactions/{transactionId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }
    
    // Accounts collection
    match /users/{userId}/accounts/{accountId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }
    
    // Budgets collection
    match /users/{userId}/budgets/{budgetId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }
    
    // Goals collection
    match /users/{userId}/goals/{goalId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }
    
    // IOUs collection
    match /users/{userId}/ious/{iouId} {
      allow read, write: if isAuthenticated() && isOwner(userId);
    }
