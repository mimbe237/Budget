# 📱 Guide Complet : Générer APK avec PWABuilder.com

## ✅ Prérequis (Tous Complétés)

- ✅ PWA fonctionnelle avec manifest.json valide
- ✅ Service Worker actif (public/service-worker.js)
- ✅ 24 icônes générées (PWA + Android + Splash screens)
- ✅ Build de production réussi
- ✅ URL Firebase active : https://studio-3821270625-cd276.web.app
- ✅ Keystore prêt : android-keys/budget-app.keystore

---

## 🚀 Étape 1 : Déployer sur Firebase

```bash
# Déployer la dernière version
firebase deploy --only hosting

# Attendre que le déploiement soit terminé (environ 1-2 min)
```

**✅ Vérifier le déploiement** :
- Visiter https://studio-3821270625-cd276.web.app
- Vérifier que les nouvelles icônes apparaissent
- Tester le splash screen en mode navigation privée

---

## 🌐 Étape 2 : Accéder à PWABuilder

1. **Ouvrir PWABuilder** : https://www.pwabuilder.com/

2. **Entrer l'URL de votre PWA** :
   ```
   https://studio-3821270625-cd276.web.app
   ```

3. **Cliquer sur "Start"**

4. **Attendre l'analyse** (30-60 secondes)
   - PWABuilder va scanner votre manifest.json
   - Vérifier le service worker
   - Analyser les icônes
   - Calculer le score PWA

---

## 📊 Étape 3 : Vérifier le Score PWA

Vous devriez voir :

✅ **Manifest** : Score élevé (icônes, nom, couleurs configurées)
✅ **Service Worker** : Actif et valide
✅ **HTTPS** : Activé via Firebase Hosting
✅ **Icônes** : 7 icônes détectées (SVG + PNG)

**Si le score est bon (>80%) :** Continuer
**Si des erreurs apparaissent :** Noter les suggestions et corriger

---

## 📦 Étape 4 : Configurer le Package Android

1. **Cliquer sur "Package for Stores"**

2. **Sélectionner "Android"**

3. **Configurer les paramètres** :

   | Champ | Valeur |
   |-------|--------|
   | **Package ID** | `com.touchpointinsights.budget` |
   | **App name** | `Budget Pro` |
   | **App version** | `1.0.0` |
   | **Version code** | `1` |
   | **Host** | `studio-3821270625-cd276.web.app` |
   | **Start URL** | `/` |
   | **Theme color** | `#4F46E5` |
   | **Background color** | `#FFFFFF` |
   | **Display mode** | `standalone` |
   | **Orientation** | `portrait` |

4. **Options avancées (Recommandées)** :
   - ✅ **Enable Notifications** : Oui
   - ✅ **Enable Location** : Non (sauf si nécessaire)
   - ✅ **Enable Camera** : Non
   - ✅ **Splash Screen** : Auto (utilise manifest.json)
   - ✅ **Full Screen** : Non (garder la barre de statut)
   - ✅ **Monochrome Icon** : Auto

---

## 🎨 Étape 5 : Vérifier les Icônes

PWABuilder devrait détecter automatiquement :

- ✅ `icon-192.png` (192×192)
- ✅ `icon-512.png` (512×512)
- ✅ `maskable-512.png` (512×512) pour icône adaptative
- ✅ `apple-touch-icon.png` (180×180)

**Si une icône manque** : PWABuilder générera une version par défaut.

---

## 📥 Étape 6 : Télécharger le Package

1. **Cliquer sur "Generate Package"**

2. **Attendre la génération** (1-2 minutes)

3. **Télécharger le fichier ZIP** :
   - Nom : `budget-pro-android-package.zip` (ou similaire)
   - Taille : Environ 5-10 MB

4. **Extraire le ZIP** :
   ```bash
   cd ~/Downloads
   unzip budget-pro-android-package.zip -d budget-pro-apk
   cd budget-pro-apk
   ```

---

## 🔐 Étape 7 : Signer l'APK

### Option A : Signature Automatique (Recommandée)

PWABuilder génère un APK **non signé**. Utiliser `jarsigner` :

```bash
# Localiser l'APK non signé
cd ~/Downloads/budget-pro-apk

# Signer avec votre keystore
jarsigner -verbose \
  -sigalg SHA256withRSA \
  -digestalg SHA-256 \
  -keystore ~/Touch-Point-Insights/Finance/Budget/android-keys/budget-app.keystore \
  app-release-unsigned.apk \
  budget-release

# Vérifier la signature
jarsigner -verify -verbose -certs app-release-unsigned.apk

# Zipalign (optimisation)
zipalign -v 4 app-release-unsigned.apk budget-pro-signed.apk
```

**Mot de passe du keystore** : `budget2024secure`

### Option B : Utiliser Android Studio

1. Ouvrir Android Studio
2. Build > Generate Signed Bundle/APK
3. Sélectionner APK
4. Choisir le keystore : `android-keys/budget-app.keystore`
5. Alias : `budget-release`
6. Mot de passe : `budget2024secure`
7. Build release

---

## 🧪 Étape 8 : Tester l'APK

### Sur Émulateur

```bash
# Lancer l'émulateur Android
emulator -avd Pixel_8_API_35

# Installer l'APK
adb install budget-pro-signed.apk

# Ou forcer la réinstallation
adb install -r budget-pro-signed.apk
```

### Sur Appareil Physique

1. **Activer le mode développeur** sur votre téléphone :
   - Paramètres > À propos du téléphone
   - Taper 7 fois sur "Numéro de build"

2. **Activer USB Debugging** :
   - Paramètres > Options pour les développeurs
   - Activer "Débogage USB"

3. **Connecter le téléphone via USB**

4. **Installer l'APK** :
   ```bash
   adb devices  # Vérifier que l'appareil est détecté
   adb install budget-pro-signed.apk
   ```

5. **Tester les fonctionnalités** :
   - ✅ Splash screen au lancement
   - ✅ Connexion Firebase
   - ✅ Navigation
   - ✅ Transactions
   - ✅ Dettes
   - ✅ Rapports
   - ✅ Mode hors ligne

---

## 📤 Étape 9 : Publier sur Google Play Store

### 9.1 Créer un Compte Développeur

- URL : https://play.google.com/console
- Coût : 25 USD (paiement unique)

### 9.2 Créer une Application

1. **Cliquer sur "Créer une application"**
2. **Remplir les informations** :
   - Nom : `Budget Pro`
   - Langue par défaut : `Français (France)`
   - Type : `Application`
   - Gratuite ou payante : `Gratuite`

### 9.3 Compléter la Fiche

#### Icône de l'application (512×512)
```bash
# Copier l'icône haute résolution
cp public/icons/icon-512.png ~/Desktop/budget-pro-icon-512.png
```

#### Feature Graphic (1024×500)
```bash
# Utiliser l'asset existant
cp playstore-assets/feature-graphic-dark-1024x500.png ~/Desktop/
```

#### Screenshots
- **Téléphone** : Au moins 2 captures (min 320px sur le côté le plus court)
- **Tablette 7 pouces** : Optionnel
- **Tablette 10 pouces** : Optionnel

**Générer des screenshots** :
```bash
# Sur émulateur ou appareil physique
adb shell screencap -p /sdcard/screenshot1.png
adb pull /sdcard/screenshot1.png ~/Desktop/

# Répéter pour 4-8 écrans différents :
# - Écran de connexion
# - Dashboard
# - Transactions
# - Dettes
# - Rapports
# - Objectifs
```

#### Description courte (80 caractères max)
```
Gérez votre budget, dettes et objectifs financiers facilement
```

#### Description complète
Copier depuis : `docs/PLAYSTORE_LISTING_FR.md`

### 9.4 Configurer la Version

1. **Production > Créer une version**

2. **Télécharger l'APK signé** :
   - Sélectionner `budget-pro-signed.apk`

3. **Nom de la version** : `1.0.0 - Version initiale`

4. **Notes de version** :
   ```
   🚀 Version initiale de Budget Pro
   
   ✅ Gestion complète des transactions
   ✅ Suivi des dettes et échéances
   ✅ Objectifs d'épargne personnalisés
   ✅ Rapports détaillés avec graphiques
   ✅ Mode hors ligne
   ✅ Sécurité Firebase
   ```

### 9.5 Classification du Contenu

1. **Compléter le questionnaire**
2. **Budget Pro est adapté à** : `Tous publics`
3. **Pas de contenu sensible**

### 9.6 Politique de Confidentialité

Créer une page avec :
- URL : Héberger sur Firebase Hosting
- Contenu : Expliquer collecte de données Firebase

### 9.7 Soumettre pour Révision

- **Cliquer sur "Envoyer pour révision"**
- **Délai d'examen** : 1-7 jours
- **Recevoir les retours** par email

---

## 🔧 Dépannage

### Problème : APK non signé refuse de s'installer

**Solution** :
```bash
jarsigner -verify -verbose -certs app-release-unsigned.apk
```

Si la signature échoue, régénérer le keystore :
```bash
keytool -genkey -v -keystore budget-app-new.keystore \
  -alias budget-release \
  -keyalg RSA -keysize 2048 -validity 10000
```

### Problème : Icônes ne s'affichent pas dans l'APK

**Solution** : Vérifier que PWABuilder a bien détecté les icônes.
Si non, télécharger manuellement les icônes dans PWABuilder (section "Icons").

### Problème : Splash screen ne fonctionne pas

**Solution** : PWABuilder génère automatiquement le splash screen depuis `manifest.json`.
Vérifier que `theme_color` et `background_color` sont définis.

### Problème : L'application ne se connecte pas à Firebase

**Solution** : Vérifier que l'URL dans PWABuilder est correcte :
```
https://studio-3821270625-cd276.web.app
```

### Problème : Mode hors ligne ne fonctionne pas

**Solution** : Vérifier que le service worker est correctement déployé :
```bash
curl https://studio-3821270625-cd276.web.app/service-worker.js
```

---

## 📋 Checklist Finale

Avant de publier sur Play Store :

- [ ] APK signé avec keystore
- [ ] Testé sur émulateur Android
- [ ] Testé sur appareil physique
- [ ] Splash screen fonctionne
- [ ] Connexion Firebase OK
- [ ] Toutes les fonctionnalités testées
- [ ] Mode hors ligne vérifié
- [ ] Screenshots générés (4-8 images)
- [ ] Icône 512×512 prête
- [ ] Feature graphic 1024×500 prêt
- [ ] Description courte et complète rédigées
- [ ] Politique de confidentialité publiée
- [ ] Compte développeur Play Store créé (25 USD)

---

## 📞 Support

**Questions PWABuilder** : https://github.com/pwa-builder/PWABuilder/issues
**Firebase Hosting** : https://firebase.google.com/support
**Play Store** : https://support.google.com/googleplay/android-developer

**Développé par** : BEONWEB  
**Contact** : contact@beonweb.cm  
**Site** : http://beonweb.cm

---

## 🎯 Prochaines Étapes (Après Publication)

1. **Monitorer les installations** via Play Console
2. **Répondre aux avis** des utilisateurs
3. **Publier des mises à jour régulières**
4. **Ajouter des fonctionnalités** basées sur les retours
5. **Optimiser le référencement** (ASO - App Store Optimization)

**Version actuelle** : 1.0.0  
**Dernière mise à jour** : 15 novembre 2025
