# 🚀 Guide Complet - Build Release pour Play Store

**Date:** 10 décembre 2025  
**Version:** 1.0.0+1  
**Package:** cm.beonweb.budgetpro

---

## 📋 Pré-requis

```bash
# Vérifier les installations
flutter --version
gradle --version  # ou ./gradlew --version
keytool -version
```

**Versions minimales:**
- Flutter: 3.10+
- Gradle: 7.0+
- JDK: 17 LTS
- Android SDK: 34+

---

## 🔐 Étape 1: Configuration Sécurité (IMPORTANTE!)

### 1a. Générer le Keystore

```bash
# Créer le keystore (une fois seulement!)
keytool -genkey -v \
  -keystore ~/budget_pro_release.keystore \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10950 \
  -alias budget_pro_key

# Répondre aux prompts:
# - Keystore password: [MOT_DE_PASSE_FORT]
# - First and last name: BudgetPro Team
# - Organizational unit: Development
# - Organization: BeoNWeb
# - City: Yaoundé
# - State/Province: Centre
# - Country: CM
# - Key password: [MÊME_MOT_DE_PASSE]
```

### 1b. Vérifier le Keystore

```bash
keytool -list -v -keystore ~/budget_pro_release.keystore

# Affichera:
# Alias name: budget_pro_key
# Creation date: [DATE]
# Entry type: PrivateKeyEntry
# Certificate fingerprint (SHA-256): [HASH]
```

### 1c. Créer android/key.properties

```bash
cat > /Users/macbook/budget/android/key.properties << 'EOF'
storePassword=MOT_DE_PASSE_ICI
keyPassword=MOT_DE_PASSE_ICI
keyAlias=budget_pro_key
storeFile=/Users/macbook/budget_pro_release.keystore
EOF

# Vérifier:
ls -la /Users/macbook/budget/android/key.properties
```

### 1d. Ajouter à .gitignore (CRITIQUE!)

```bash
# Vérifier que key.properties est dans .gitignore
grep "key.properties" /Users/macbook/budget/.gitignore

# Si absent, ajouter:
echo "android/key.properties" >> /Users/macbook/budget/.gitignore
echo "*.keystore" >> /Users/macbook/budget/.gitignore
```

---

## ⚙️ Étape 2: Configuration build.gradle.kts

Fichier: `/Users/macbook/budget/android/app/build.gradle.kts`

```kotlin
// ========= À AJOUTER EN HAUT DU FICHIER =========

import java.io.FileInputStream
import java.util.Properties

// Charger les propriétés du keystore
val keystorePropertiesFile = rootProject.file("android/key.properties")
val keystoreProperties = Properties()

if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(FileInputStream(keystorePropertiesFile))
}

// ========= DANS LE BLOC android {} =========

signingConfigs {
    create("release") {
        keyAlias = keystoreProperties["keyAlias"] as String? ?: ""
        keyPassword = keystoreProperties["keyPassword"] as String? ?: ""
        storeFile = file(keystoreProperties["storeFile"] as String? ?: "")
        storePassword = keystoreProperties["storePassword"] as String? ?: ""
    }
    
    named("debug") {
        keyAlias = "androiddebugkey"
        keyPassword = "android"
        storeFile = file("${System.getProperty("user.home")}/.android/debug.keystore")
        storePassword = "android"
    }
}

buildTypes {
    release {
        signingConfig = signingConfigs.getByName("release")
        isMinifyEnabled = true
        shrinkResources = true
        proguardFiles(
            getDefaultProguardFile("proguard-android-optimize.txt"),
            "proguard-rules.pro"
        )
    }
}
```

---

## 🏗️ Étape 3: Préparation Projet Flutter

### 3a. Nettoyer et Mettre à Jour

```bash
cd /Users/macbook/budget

# Nettoyer complètement
flutter clean

# Récupérer dépendances
flutter pub get

# Vérifier erreurs
flutter analyze

# Vérifier format
dart format --set-exit-if-changed .
```

### 3b. Vérifier pubspec.yaml

```bash
grep "version:" pubspec.yaml

# Doit afficher: version: 1.0.0+1
# Pour les futures versions:
# - Patch: 1.0.1+2 
# - Minor: 1.1.0+3
# - Major: 2.0.0+4
```

---

## 📦 Étape 4: Générer l'Android App Bundle (AAB)

### 4a. Build AAB (Recommandé pour Play Store)

```bash
cd /Users/macbook/budget

# Générer l'AAB avec obfuscation
flutter build appbundle \
  --release \
  --target-platform android-arm64,android-arm \
  --obfuscate \
  --split-debug-info=build/debug_info \
  --verbose

# Sortie attendue:
# ✓ Built build/app/outputs/bundle/release/app-release.aab (XX.X MB)
```

**Explications des flags:**
- `--release`: Mode production
- `--target-platform`: Support ARM64 (tous les téléphones modernes) + ARM (legacy)
- `--obfuscate`: Obfusquer le code Dart (sécurité)
- `--split-debug-info`: Symboles séparés (plus petit APK)

### 4b. Verifier l'AAB

```bash
# Vérifier le fichier existe
ls -lh /Users/macbook/budget/build/app/outputs/bundle/release/app-release.aab

# Extraire et inspecter
cd /Users/macbook/budget/build/app/outputs/bundle/release/
unzip -l app-release.aab | head -20

# Vérifier signature
jarsigner -verify -verbose app-release.aab
```

---

## 🧪 Étape 5: Tester Avant Upload

### 5a. Test sur Appareil/Émulateur

```bash
# Option 1: Test via APK
cd /Users/macbook/budget

# Générer APK (plus facile à tester)
flutter build apk --release --split-per-abi

# Installer sur appareil
adb install -r build/app/outputs/apk/release/app-release.apk

# Lancer et tester:
# - Login/Signup
# - Ajouter compte
# - Ajouter transaction
# - Budgets
# - Navigation complète
```

### 5b. Vérifier Erreurs Courantes

```bash
# Vérifier les logs
adb logcat | grep -i flutter

# Chercher des crash:
adb logcat | grep -i crash

# Vérifier Firebase connectivity:
# - Ouvrir Settings
# - Vérifier paramètres visibles
```

---

## 📊 Étape 6: Vérifications Pré-Upload

### Checklist Technique

- [ ] AAB généré sans erreurs
- [ ] Taille < 150 MB (Play Store max)
- [ ] Pas d'erreurs analytiques Dart
- [ ] Version correct dans pubspec.yaml
- [ ] Package correct: `cm.beonweb.budgetpro`
- [ ] Permissions minimales dans AndroidManifest
- [ ] Firebase services accessible
- [ ] Pas de secrets/tokens exposés
- [ ] Keystore sécurisé (pas sur Git)

### Vérifience Fonctionnelle

- [ ] App se lance sans crash
- [ ] Login/Signup fonctionne
- [ ] Comptes peuvent être créés
- [ ] Transactions s'ajoutent
- [ ] Budgets s'affichent
- [ ] Objectifs visibles
- [ ] Navigation fluide
- [ ] Pas de avertissements console

---

## 📤 Étape 7: Upload sur Google Play Console

### 7a. Créer l'Application

1. Aller à: **https://play.google.com/console**
2. Cliquer: **Create app**
3. Entrer:
   ```
   App name: Budget Pro
   Default language: Français
   App type: Application
   Category: Finance
   ```
4. Accepter conditions
5. Cliquer: **Create app**

### 7b. Remplir Configuration

**Lieu:** Dashboard > App settings

```
Application name: Budget Pro
Package name: cm.beonweb.budgetpro
Contact details:
  - Email: support@budgetpro.app
  - WhatsApp: À ajouter depuis Paramètres Admin
```

### 7c. Remplir Informations Produit

**Lieu:** Store settings

```
Title: Budget Pro
Short description: Contrôlez vos comptes, budgets et épargne
Description: [Voir PLAYSTORE_DEPLOYMENT_GUIDE.md]
Category: Finance
Developer contact:
  - Name: BeoNWeb
  - Email: support@budgetpro.app
  - Website: https://www.beonweb.cm
```

### 7d. Classification Age (IARC)

**Lieu:** Content rating

1. Remplir formulaire IARC:
   - Apps/Games: Finance
   - Données sensibles: None
   - Âge minimum: 12+
2. Soumettre
3. Recevoir certificat

### 7e. Télécharger l'AAB

**Lieu:** Production > Release

1. Cliquer: **Create release**
2. Cliquer: **Browse files**
3. Sélectionner: `app-release.aab`
4. Attendre vérification
5. Ajouter notes de version:
   ```
   Version 1.0.0 - Lancement initial
   - Gestion comptes et budgets
   - Suivi transactions
   - Objectifs d'épargne
   - Analyses financières
   ```

### 7f. Ajouter Assets

**Lieu:** Store settings > App details

1. **Icône (512x512):**
   - Upload: `playstore-assets/ic_launcher_512.png`

2. **Graphique promotionnel (1024x500):**
   - Upload: `playstore-assets/feature-graphic-light-1024x500.png`

3. **Screenshots (5-8):**
   - Upload: `playstore-assets/screenshots/fr-FR/*`

### 7g. Politique Confidentialité

1. Créer/avoir une Privacy Policy URL
2. Entrer dans: Store settings > App details > Privacy policy
3. Format: Doit être HTTPS

---

## ⏰ Déroulement Révision

```
État          Durée            Action
─────────────────────────────────────────
Drafts        Immédiat         Sauvegardé
Reviewing     4-24h             Attendre
Approved      2-4h après        Publié automatiquement
Rejected      4-12h après       Lire les raisons
Ready for     Immédiat          Cliquer "Publish"
publishing
```

### Motifs Refus Courants

❌ **Firebase rules non sécurisées**
- Vérifier: firestore.rules dans Firebase
- Solution: Ajouter authentification requise

❌ **Permissions non justifiées**
- Vérifier: AndroidManifest.xml
- Solution: Supprimer permissions inutiles

❌ **Crash au démarrage**
- Vérifier: adb logcat
- Solution: Tester localement avant upload

❌ **Données non chiffrées**
- Firebase cloud messaging?
- Solution: Utiliser HTTPS + Firebase

---

## ✅ Après Publication

### 1. Configurer Monitoring

```bash
# Vérifier Play Console Analytics
# Aller à: Analytics > Crash analytics
# Ajouter Firebase Crashlytics
```

### 2. Collecter Feedback

- Répondre aux reviews
- Corriger bugs signalés
- Mettre à jour régulièrement

### 3. Mettre à Jour

Pour la v1.0.1:

```bash
# 1. Modifier pubspec.yaml
version: 1.0.1+2

# 2. Commit et push
git add -A
git commit -m "v1.0.1: Bug fixes"
git push

# 3. Rebuild
flutter build appbundle --release

# 4. Upload nouveau AAB
# Google Play Console > Production > Release > Create release
```

---

## 🆘 Dépannage

### Erreur: Keystore not found
```bash
# Vérifier le chemin dans key.properties
grep storeFile /Users/macbook/budget/android/key.properties

# Doit être: /Users/macbook/budget_pro_release.keystore
# Vérifier fichier existe:
ls -la ~/budget_pro_release.keystore
```

### Erreur: Invalid password
```bash
# Vérifier le mot de passe dans key.properties
# Essayer de lister le keystore:
keytool -list -keystore ~/budget_pro_release.keystore

# Si erreur, recréer le keystore
```

### Erreur: Package already exists
- Changer `applicationId` dans build.gradle.kts
- Nouveau nom: `cm.beonweb.budgetpro` (recommandé)

### Erreur: minSdk too low
- Vérifier pubspec.yaml
- Vérifier build.gradle.kts: minSdk >= 21

---

## 📚 Ressources Complètes

| Lien | Description |
|------|-------------|
| [Flutter Deployment](https://flutter.dev/docs/deployment/android) | Guide officiel |
| [Play Console Help](https://support.google.com/googleplay/android-developer) | Support Google |
| [App Signing](https://developer.android.com/studio/publish/app-signing) | Détails keystore |
| [Policy Center](https://play.google.com/about/play-policies) | Politiques Play Store |

---

## 🎯 Résumé Commandes Essentielles

```bash
# Complet du début à la fin:
cd /Users/macbook/budget

# 1. Préparer
flutter clean && flutter pub get

# 2. Vérifier
flutter analyze

# 3. Tester
flutter build apk --release --split-per-abi
adb install -r build/app/outputs/apk/release/app-release.apk

# 4. Builder AAB
flutter build appbundle --release --obfuscate

# 5. Vérifier AAB
ls -lh build/app/outputs/bundle/release/app-release.aab

# 6. Upload
# → Aller Google Play Console
# → Sélectionner app-release.aab
# → Ajouter assets
# → Publier
```

---

**Status:** ✅ PRÊT À DÉPLOYER  
**Prochaine étape:** Upload sur Play Store Console
