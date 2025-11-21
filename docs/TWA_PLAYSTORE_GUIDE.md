# Guide TWA (Trusted Web Activity) - Publication Play Store

## 📋 Vue d'ensemble

Budget Pro sera publié sur le Google Play Store via une **Trusted Web Activity (TWA)**. C'est une technique qui permet d'emballer une PWA dans une app Android native, en utilisant Chrome Custom Tabs pour afficher le contenu.

**Avantages** :
- ✅ Pas de code Android natif à maintenir
- ✅ Mise à jour instantanée (via web)
- ✅ Accès aux APIs web avancées
- ✅ Performance native (Chrome engine)
- ✅ Distribution via Play Store

---

## 🛠️ Prérequis

### 1. Installation des outils

```bash
# Bubblewrap CLI (outil officiel Google)
npm install -g @bubblewrap/cli

# Android Studio (pour signer l'APK)
# Télécharger : https://developer.android.com/studio

# Java JDK 17+ (requis pour Android build)
# Vérifier : java -version
```

### 2. Fichiers de configuration

- ✅ `twa-manifest.json` : Configuration TWA
- ✅ `public/.well-known/assetlinks.json` : Digital Asset Links
- ✅ `public/manifest.webmanifest` : PWA manifest
- ✅ `public/icons/*.png` : Icônes optimisées

---

## 🔐 Étape 1 : Créer le Keystore Android

Le keystore sert à signer l'app pour le Play Store.

```bash
# Créer le keystore (à faire UNE SEULE FOIS)
keytool -genkey -v -keystore android.keystore -alias budget-key \
  -keyalg RSA -keysize 2048 -validity 10000

# Informations à fournir :
# - Password: [CHOISIR UN MOT DE PASSE FORT]
# - Nom: Touch Point Insights
# - Organisation: Touch Point Insights
# - Ville: [Votre ville]
# - État: [Votre région]
# - Code pays: CM (ou votre pays)

# ⚠️ IMPORTANT : Sauvegarder le keystore et le mot de passe !
# Si perdus = impossible de mettre à jour l'app sur le Play Store
```

**Backup recommandé** :
```bash
# Copier le keystore dans un endroit sûr
cp android.keystore ~/Documents/Backups/budget-keystore-backup.keystore

# Ajouter au .gitignore (NE PAS commit le keystore)
echo "android.keystore" >> .gitignore
```

---

## 🔗 Étape 2 : Configurer Digital Asset Links

Les Digital Asset Links prouvent que vous possédez le domaine ET l'app Android.

### 2.1 Obtenir le SHA-256 du certificat

```bash
# Extraire le SHA-256 du keystore
keytool -list -v -keystore android.keystore -alias budget-key | grep SHA256

# Exemple de sortie :
# SHA256: 14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B1:3F:CF:44:E5
```

### 2.2 Mettre à jour assetlinks.json

Copier le SHA256 (avec les `:` enlevés) dans `public/.well-known/assetlinks.json` :

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.touchpointinsights.budget",
      "sha256_cert_fingerprints": [
        "14:6D:E9:83:C5:73:06:50:D8:EE:B9:95:2F:34:FC:64:16:A0:83:42:E6:1D:BE:A8:8A:04:96:B1:3F:CF:44:E5"
      ]
    }
  }
]
```

### 2.3 Déployer sur Firebase

```bash
# Build production
npm run build

# Déployer sur Firebase Hosting
firebase deploy --only hosting

# Vérifier que assetlinks.json est accessible
curl https://budget-app.web.app/.well-known/assetlinks.json
```

**Important** : Le fichier doit être accessible à l'URL exacte :
`https://[VOTRE_DOMAINE]/.well-known/assetlinks.json`

---

## 📦 Étape 3 : Initialiser le projet TWA

```bash
# Initialiser avec Bubblewrap
bubblewrap init --manifest https://budget-app.web.app/manifest.webmanifest

# Répondre aux questions :
# - Package ID: com.touchpointinsights.budget
# - App name: Budget Pro
# - Host: budget-app.web.app
# - Start URL: /
# - Keystore path: ./android.keystore
# - Key alias: budget-key
# - Key password: [VOTRE MOT DE PASSE]
```

Cela crée un dossier `android/` avec le projet Android.

---

## 🏗️ Étape 4 : Build de l'APK/AAB

### Option A : APK (pour tests)

```bash
# Build APK de debug
bubblewrap build

# L'APK se trouve dans : android/app/build/outputs/apk/release/
```

### Option B : AAB (pour Play Store)

```bash
# Build Android App Bundle (format requis par Play Store)
bubblewrap build --skipPwaValidation

# L'AAB se trouve dans : android/app/build/outputs/bundle/release/app-release.aab
```

**Taille attendue** :
- APK : ~3-5 MB
- AAB : ~2-3 MB (plus petit grâce à la compression)

---

## 🧪 Étape 5 : Tester l'APK

### Installation sur appareil Android

```bash
# Installer l'APK sur un appareil connecté via USB
adb install android/app/build/outputs/apk/release/app-release.apk

# Ou glisser-déposer l'APK sur un émulateur Android Studio
```

### Tests à effectuer

- ✅ L'app s'ouvre en mode standalone (pas de barre d'URL)
- ✅ Icône correcte sur l'écran d'accueil
- ✅ Navigation fonctionne
- ✅ Service Worker actif
- ✅ Mode offline fonctionne
- ✅ Shortcuts (long press) affichés
- ✅ Theme color appliqué (status bar)

---

## 🎨 Étape 6 : Préparer les Assets Play Store

### 6.1 Screenshots requis

**Téléphone (obligatoire)** :
- Minimum 2, maximum 8 screenshots
- Résolution : 1080x1920 (portrait) ou 1920x1080 (paysage)
- Format : PNG ou JPEG

**Tablette (recommandé)** :
- Résolution : 1536x2048 (portrait) ou 2048x1536 (paysage)

**Créer les screenshots** :
```bash
# Utiliser Chrome DevTools
1. F12 → Toggle Device Toolbar
2. Sélectionner "Pixel 5" (1080x2340)
3. Visiter les pages clés :
   - Dashboard
   - Transactions
   - Goals
   - Reports
   - Debts
4. Prendre des screenshots (Cmd+Shift+P → "Capture screenshot")
```

### 6.2 Feature Graphic (obligatoire)

- Dimensions : **1024 x 500 px**
- Format : PNG ou JPEG
- Contenu : Logo + slogan + visuel attractif

**Création avec Figma/Canva** :
```
[Logo Budget Pro]     Gérez votre argent intelligemment
                      📊 Budget | 💰 Transactions | 🎯 Objectifs
```

### 6.3 Icône Play Store (obligatoire)

- Dimensions : **512 x 512 px**
- Format : PNG (32 bits)
- Sans transparence
- Contenu : Icône de l'app (déjà disponible dans `/icons/icon-512.png`)

### 6.4 Description Play Store

**Titre court** (max 30 caractères) :
```
Budget Pro - Gestion Budget
```

**Description courte** (max 80 caractères) :
```
Suivez vos dépenses, atteignez vos objectifs et maîtrisez votre budget
```

**Description complète** (max 4000 caractères) :
```markdown
📊 Budget Pro - Votre Assistant Financier Personnel

Prenez le contrôle de vos finances avec Budget Pro, l'application de gestion budgétaire moderne et intuitive.

✨ FONCTIONNALITÉS PRINCIPALES

💰 Suivi des Transactions
• Enregistrez vos revenus et dépenses en quelques secondes
• Catégorisez automatiquement vos transactions
• Ajoutez des reçus photo pour vos justificatifs
• Filtrez et recherchez vos transactions facilement

🎯 Objectifs d'Épargne
• Définissez vos objectifs financiers
• Suivez votre progression en temps réel
• Recevez des conseils personnalisés IA
• Célébrez vos réussites avec des animations

📈 Rapports Détaillés
• Visualisez vos dépenses avec des graphiques interactifs
• Analysez vos habitudes financières
• Comparez vos performances mois par mois
• Exportez vos données pour analyse

💳 Gestion des Dettes
• Suivez vos prêts et dettes
• Planifiez vos remboursements
• Visualisez l'évolution de vos dettes
• Calculez les intérêts automatiquement

🌙 Interface Moderne
• Mode sombre pour ménager vos yeux
• Design Material 3 (Material You)
• Navigation intuitive
• Animations fluides

🔒 Sécurité & Confidentialité
• Authentification Firebase sécurisée
• Données chiffrées
• Aucune publicité
• Conforme RGPD

📱 Fonctionnement Hors Ligne
• Consultez vos données sans connexion
• Synchronisation automatique au retour en ligne
• Service Worker pour performance optimale

🌍 Multilingue
• Français et Anglais
• Plus de langues à venir

💡 Intelligence Artificielle
• Conseils personnalisés pour atteindre vos objectifs
• Analyse de vos habitudes de dépenses
• Suggestions d'optimisation budgétaire

🎨 POURQUOI BUDGET PRO ?

✅ Gratuit et sans publicité
✅ Interface intuitive et moderne
✅ Données sécurisées dans le cloud
✅ Mises à jour régulières
✅ Support réactif

📞 SUPPORT

Des questions ? Contactez-nous :
• Email : support@touchpointinsights.com
• Site web : https://budget-app.web.app

⭐ Rejoignez des milliers d'utilisateurs qui ont repris le contrôle de leurs finances !
```

---

## 🚀 Étape 7 : Publication sur Play Store

### 7.1 Créer un compte Google Play Console

1. Se rendre sur : https://play.google.com/console
2. Créer un compte développeur (25$ one-time fee)
3. Accepter les conditions

### 7.2 Créer l'application

1. Console → "Créer une application"
2. Nom : **Budget Pro**
3. Langue par défaut : **Français**
4. Type : **Application**
5. Gratuite ou payante : **Gratuite**

### 7.3 Configurer la fiche du Store

**Onglet "Contenu de l'application"** :
- ✅ Catégorie : Finance
- ✅ Public cible : Tous (13+)
- ✅ Coordonnées développeur
- ✅ Politique de confidentialité (URL)

**Onglet "Fiche du Store"** :
- ✅ Titre
- ✅ Description courte
- ✅ Description complète
- ✅ Screenshots (min 2)
- ✅ Feature graphic
- ✅ Icône

### 7.4 Upload de l'AAB

1. Onglet "Version de production"
2. "Créer une version"
3. Upload `app-release.aab`
4. Nom de version : **1.0.0**
5. Code de version : **1**
6. Notes de version :
```
🎉 Première version de Budget Pro !

✨ Fonctionnalités :
• Suivi des transactions
• Objectifs d'épargne
• Rapports détaillés
• Gestion des dettes
• Mode hors ligne
• Intelligence artificielle
```

### 7.5 Lancer la révision

1. Vérifier tous les onglets (✅ verts)
2. "Envoyer pour examen"
3. Attendre validation Google (1-3 jours)

---

## 📊 Suivi Post-Publication

### Analytics
- Google Play Console : Téléchargements, notes, crashs
- Firebase Analytics : Utilisation in-app
- Lighthouse : Performance web

### Mises à jour
```bash
# Incrémenter la version dans twa-manifest.json
{
  "appVersionName": "1.1.0",
  "appVersionCode": 2
}

# Rebuild
bubblewrap build

# Upload nouvel AAB sur Play Console
```

---

## 🔧 Troubleshooting

### Erreur : "Digital Asset Links verification failed"
```bash
# Vérifier que assetlinks.json est accessible
curl https://budget-app.web.app/.well-known/assetlinks.json

# Vérifier le SHA256
keytool -list -v -keystore android.keystore -alias budget-key
```

### Erreur : "Package name already exists"
```bash
# Changer le package ID dans twa-manifest.json
"packageId": "com.touchpointinsights.budget.v2"
```

### App ouvre dans le navigateur au lieu de standalone
```bash
# Vérifier le manifest.webmanifest
curl https://budget-app.web.app/manifest.webmanifest | jq .display
# Doit être "standalone"
```

---

## 📚 Ressources

- [Bubblewrap CLI Documentation](https://github.com/GoogleChromeLabs/bubblewrap)
- [TWA Quick Start Guide](https://developers.google.com/web/android/trusted-web-activity/quick-start)
- [Play Console Help](https://support.google.com/googleplay/android-developer)
- [Digital Asset Links](https://developers.google.com/digital-asset-links/v1/getting-started)

---

## ✅ Checklist Finale

- [ ] Keystore créé et sauvegardé
- [ ] SHA256 extrait et dans assetlinks.json
- [ ] assetlinks.json déployé sur Firebase
- [ ] TWA initialisé avec Bubblewrap
- [ ] AAB buildé avec succès
- [ ] APK testé sur appareil Android
- [ ] Screenshots (min 2) créés
- [ ] Feature graphic créé (1024x500)
- [ ] Description Play Store rédigée
- [ ] Compte Play Console créé ($25)
- [ ] Application créée dans Console
- [ ] AAB uploadé
- [ ] Toutes les infos remplies (✅ verts)
- [ ] Soumis pour révision
- [ ] Publication validée par Google 🎉

