# 🚀 Guide de Démarrage Rapide - Connexion Firebase

## ⚡ Configuration Rapide (5 minutes)

### Étape 1 : Vérifier Flutter
```bash
# Si Flutter n'est pas installé, essayez :
brew install --cask flutter

# Vérifiez l'installation
flutter doctor
```

### Étape 2 : Installer Firebase CLI
```bash
# Installer Firebase CLI
curl -sL https://firebase.tools | bash

# Se connecter à Firebase
firebase login
```

### Étape 3 : Installer FlutterFire CLI
```bash
# Installer FlutterFire CLI
dart pub global activate flutterfire_cli

# Ajouter au PATH
export PATH="$PATH":"$HOME/.pub-cache/bin"
echo 'export PATH="$PATH":"$HOME/.pub-cache/bin"' >> ~/.zshrc
```

### Étape 4 : Créer le Projet Firebase
1. Allez sur https://console.firebase.google.com/
2. Créez un nouveau projet nommé `budget-personnel`
3. Activez **Firestore** (mode test)
4. Activez **Authentication** (Email/Password)

### Étape 5 : Configurer l'App Flutter
```bash
cd /Users/macbook/budget

# Configurer Firebase automatiquement
flutterfire configure

# Sélectionnez votre projet et les plateformes (iOS, Android, macOS)
```

### Étape 6 : Installer les Dépendances
```bash
flutter pub get
```

### Étape 7 : Déployer les Règles Firestore
```bash
# Initialiser Firebase dans le projet
firebase init firestore

# Quand on vous demande le fichier de règles, gardez "firestore.rules"
# Déployer les règles
firebase deploy --only firestore:rules
```

### Étape 8 : Lancer l'App
```bash
flutter run
```

---

## 🎯 Création du Premier Utilisateur Admin

### Option A : Via l'Application
1. Lancez l'app
2. Inscrivez-vous avec un email/mot de passe
3. Notez votre UID

### Option B : Ajouter le Rôle Admin Manuellement
1. Allez dans la console Firebase > Firestore
2. Trouvez la collection `users`
3. Sélectionnez votre utilisateur
4. Ajoutez le champ : `role: "admin"`

---

## 📝 Commandes Utiles

```bash
# Voir vos projets Firebase
firebase projects:list

# Reconfigurer Firebase
flutterfire configure

# Redéployer les règles Firestore
./deploy_firestore_rules.sh

# Nettoyer et reconstruire
flutter clean && flutter pub get && flutter run

# Lancer sur une plateforme spécifique
flutter run -d chrome    # Web
flutter run -d macos     # macOS
flutter run -d ios       # iOS
```

---

## 🔧 Résolution de Problèmes

### L'app ne se connecte pas à Firebase
```bash
# Vérifiez que firebase_options.dart existe
ls -la lib/firebase_options.dart

# Si absent, reconfigurez
flutterfire configure
```

### Erreur de permissions Firestore
- Vérifiez que les règles sont déployées
- Mode test : toutes les opérations autorisées pendant 30 jours
- Mode production : utilisez les règles dans `firestore.rules`

### Erreur d'authentification
- Vérifiez que Authentication est activé dans Firebase Console
- Activez la méthode "Email/Password"

---

## ✅ Checklist Rapide

- [ ] Flutter installé
- [ ] Firebase CLI installé et connecté (`firebase login`)
- [ ] FlutterFire CLI installé
- [ ] Projet Firebase créé sur console.firebase.google.com
- [ ] Firestore activé (mode test)
- [ ] Authentication activée (Email/Password)
- [ ] `flutterfire configure` exécuté
- [ ] `flutter pub get` exécuté
- [ ] Règles Firestore déployées
- [ ] App lance sans erreur
- [ ] Utilisateur admin créé

---

## 🎉 Prêt !

Une fois toutes les étapes complétées, vous pouvez :
- ✅ Vous connecter avec email/mot de passe
- ✅ Créer des transactions, comptes, budgets
- ✅ Utiliser le dashboard admin (si rôle = admin)
- ✅ Recevoir des notifications
- ✅ Voir les analyses AI

Pour plus de détails, consultez `FIREBASE_SETUP.md`
