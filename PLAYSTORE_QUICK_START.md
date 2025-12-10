# 🚀 PLAN D'ACTION RAPIDE - Play Store (Budget Pro)

**Date:** 10 décembre 2025  
**Status:** ✅ PRÊT À DÉPLOYER

---

## 📋 ACTIONS IMMÉDIATES (À FAIRE)

### ✅ DÉJÀ FAIT (Configuration)
- [x] Package ID: `cm.beonweb.budgetpro`
- [x] Permissions Android mises à jour
- [x] AndroidManifest configuré
- [x] App label: "Budget Pro"
- [x] Version: 1.0.0+1

---

## 🔑 ÉTAPE 1: Créer la Clé de Signature (5 minutes)

**Terminal:**

```bash
# 1. Générer le keystore
keytool -genkey -v -keystore ~/budget_pro_release.keystore \
  -keyalg RSA -keysize 2048 -validity 10950 \
  -alias budget_pro_key

# Mots de passe: [Créez un mot de passe fort - minimum 8 caractères]
# Autres infos: BioNWeb / Yaoundé / CM

# 2. Créer le fichier de configuration
cat > /Users/macbook/budget/android/key.properties << 'EOF'
storePassword=VOTRE_MOT_DE_PASSE
keyPassword=VOTRE_MOT_DE_PASSE
keyAlias=budget_pro_key
storeFile=/Users/macbook/budget_pro_release.keystore
EOF

# 3. Vérifier
keytool -list -keystore ~/budget_pro_release.keystore
```

**Important:** 
- ⚠️ Sauvegarder le mot de passe de manière SÉCURISÉE
- ⚠️ Ne JAMAIS commiter `android/key.properties` sur Git
- ⚠️ Ne JAMAIS partager le keystore

---

## 📦 ÉTAPE 2: Générer l'AAB (10 minutes)

**Terminal:**

```bash
cd /Users/macbook/budget

# 1. Nettoyer
flutter clean
flutter pub get

# 2. Analyser
flutter analyze

# 3. Générer l'AAB
flutter build appbundle \
  --release \
  --obfuscate \
  --split-debug-info=build/debug_info

# ✅ Résultat: build/app/outputs/bundle/release/app-release.aab
```

**Vérifier:**
```bash
ls -lh build/app/outputs/bundle/release/app-release.aab
# Doit afficher: XXX MB (généralement 30-50 MB)
```

---

## 🧪 ÉTAPE 3: Tester (Optional - Recommandé)

**Terminal:**

```bash
cd /Users/macbook/budget

# 1. Générer APK
flutter build apk --release --split-per-abi

# 2. Installer (si appareil connecté)
adb install -r build/app/outputs/apk/release/app-release.apk

# 3. Tester manuellement:
# - Login
# - Créer compte
# - Ajouter transaction
# - Voir budgets
# - Pas d'erreurs console
```

---

## 📸 ÉTAPE 4: Préparer les Assets (15 minutes)

**À créer/préparer:**

### 1. **Icône 512x512px**
- [ ] Créer `ic_launcher_512.png`
- Placer dans: `playstore-assets/`
- Design: Logo Budget Pro en 512x512

### 2. **Graphique Promo 1024x500px**
- [ ] Créer `feature-graphic-light-1024x500.png`
- Placer dans: `playstore-assets/`
- Contenu: Logo + "Budget Pro - Gestion Financière"

### 3. **Screenshots (5-8 images)**
Chaque image: 1080x1920px, PNG/JPG

À capturer depuis l'app en mode release:
1. Écran connexion
2. Dashboard principal
3. Poches budgétaires
4. Historique transactions
5. Ajouter transaction
6. Budgets
7. Objectifs
8. Analyses (optionnel)

**Outils recommandés:**
- Figma (designs)
- Canva (assets promo)
- Android Studio (screenshots)

---

## 🎯 ÉTAPE 5: Créer Compte Google Play (5 minutes)

**Si pas déjà fait:**

1. Aller: https://play.google.com/console
2. Cliquer: "Create app"
3. Remplir:
   ```
   App name: Budget Pro
   Default language: Français
   App type: Application
   Category: Finance
   ```
4. Accepter conditions
5. Créer

---

## 📤 ÉTAPE 6: Upload sur Play Store (10 minutes)

**Dashboard Play Console:**

### 6a. Configuration Initiale
```
Store settings:
├─ Title: Budget Pro
├─ Short description: Contrôlez vos comptes, budgets et épargne
├─ Category: Finance
├─ Package: cm.beonweb.budgetpro
└─ Contact email: support@budgetpro.app
```

### 6b. Assets
```
Store listings:
├─ Icon (512x512): playstore-assets/ic_launcher_512.png
├─ Feature graphic: playstore-assets/feature-graphic-light-1024x500.png
└─ Screenshots (5-8): playstore-assets/screenshots/fr-FR/*
```

### 6c. AAB
```
Release management:
├─ Production > Release
├─ Create release
├─ Upload: app-release.aab
├─ Version: 1.0.0
└─ Notes: Version initiale
```

### 6d. Classification Âge
```
Content ratings:
├─ Remplir formulaire IARC
├─ Âge minimum: 12+
└─ Valider
```

### 6e. Publish
```
Review and publish:
├─ Vérifier tous les champs
├─ Vérifier assets
└─ Cliquer: PUBLISH
```

---

## ⏱️ TIMELINE RÉVISION

```
Upload               → Immediately "Reviewing"
                     ↓
Révision Google      → 4-24 heures
                     ↓
Approuvé/Rejeté      → Notification email
                     ↓
Si approuvé:
  → 2-4h après       → "Ready for publishing"
  → Cliquer "Publish" → LIVE immédiatement
```

---

## ✅ CHECKLIST FINAL

Avant de cliquer "Publish":

### Code
- [ ] Flutter 3.10+
- [ ] Android SDK 34+
- [ ] Pas d'erreurs `flutter analyze`
- [ ] Version: 1.0.0+1

### Signature
- [ ] Keystore créé
- [ ] key.properties rempli
- [ ] Mot de passe sécurisé

### AAB
- [ ] `app-release.aab` généré
- [ ] Taille < 150 MB
- [ ] Signé correctement

### Assets
- [ ] Icône 512x512 ✓
- [ ] Graphique promo 1024x500 ✓
- [ ] 5-8 screenshots 1080x1920 ✓

### Store
- [ ] Title: Budget Pro
- [ ] Description complète
- [ ] Email support: support@budgetpro.app
- [ ] Package: cm.beonweb.budgetpro
- [ ] Catégorie: Finance
- [ ] Privacy policy URL: [À ajouter]

### Functional
- [ ] App se lance sans crash
- [ ] Login fonctionne
- [ ] Transactions s'ajoutent
- [ ] Pas d'erreurs console

---

## 📞 EN CAS DE PROBLÈME

### AAB ne se génère pas
```bash
# Vérifier key.properties existe
cat /Users/macbook/budget/android/key.properties

# Vérifier mot de passe correct
# Tester: flutter build appbundle --verbose
```

### Keystore introuvable
```bash
# Vérifier fichier existe
ls -la ~/budget_pro_release.keystore

# Recréer si nécessaire
# ATTENTION: Utilisera une nouvelle clé!
```

### Play Console refuse l'AAB
- Vérifier signature: `jarsigner -verify app-release.aab`
- Vérifier size < 150 MB
- Vérifier format: Doit être .aab (pas .apk)

### App crashe au démarrage
```bash
# Tester localement d'abord
flutter build apk --release
adb install -r build/app/outputs/apk/release/app-release.apk

# Vérifier logs:
adb logcat | grep -i flutter
```

---

## 📚 DOCUMENTATION COMPLÈTE

Pour plus de détails, voir:

1. **`PLAYSTORE_DEPLOYMENT_GUIDE.md`** - Guide complet (4000+ mots)
2. **`PLAYSTORE_BUILD_RELEASE_GUIDE.md`** - Build release détaillé
3. **`playstore-assets/PLAYSTORE_ASSETS_CHECKLIST.md`** - Assets checklist
4. **`android/KEY_SETUP_INSTRUCTIONS.md`** - Instructions clé

---

## 🎯 RÉSUMÉ FINAL

```
┌─────────────────────────────────────────┐
│ PRÉPARATION PLAY STORE - STATUS         │
├─────────────────────────────────────────┤
│ ✅ Configuration Android                 │
│ ✅ Permissions                           │
│ ✅ Package ID: cm.beonweb.budgetpro     │
│ ✅ Version: 1.0.0+1                     │
│ ⏳ Keystore: À générer (5 min)          │
│ ⏳ AAB: À générer (10 min)              │
│ ⏳ Assets: À préparer (15 min)          │
│ ⏳ Upload: À faire (10 min)             │
├─────────────────────────────────────────┤
│ TEMPS TOTAL: ~40 minutes                │
│ REVUE GOOGLE: 4-24 heures               │
│ LIVE: Immédiatement après approbation  │
└─────────────────────────────────────────┘
```

---

## 🚀 PROCHAINES ÉTAPES

1. ✅ Lire ce guide
2. 🔑 Générer keystore (Étape 1)
3. 📦 Générer AAB (Étape 2)
4. 🧪 Tester (Étape 3)
5. 📸 Préparer assets (Étape 4)
6. 📤 Upload Play Store (Étape 6)
7. ⏳ Attendre approbation (4-24h)
8. 🎉 Publier!

---

**Bon lancement! 🚀**

Questions? Voir la documentation complète ou contacter: support@budgetpro.app
