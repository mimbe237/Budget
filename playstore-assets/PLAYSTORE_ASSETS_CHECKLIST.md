# 📦 Checklist Ressources Play Store - Budget Pro

**Version:** 1.0.0  
**Package:** cm.beonweb.budgetpro

---

## ✅ Ressources Requises

### 1. **Icône de l'App**
- [ ] Fichier: `ic_launcher_512.png`
- [ ] Taille: 512x512 pixels
- [ ] Format: PNG avec transparence
- [ ] Couleurs: Respecter le logo Budget Pro
- [ ] **Ubicación:** playstore-assets/

**À générer depuis:**
```bash
# Depuis le projet Flutter
flutter pub get flutter_launcher_icons
# Puis vérifier: android/app/src/main/res/mipmap-*/ic_launcher.png
```

### 2. **Graphique Promotionnel** 
- [ ] Fichier: `feature-graphic-light-1024x500.png`
- [ ] Taille: 1024x500 pixels (obligatoire)
- [ ] Format: PNG ou JPG
- [ ] Contenu: Logo + fonctionnalités principales
- [ ] Texte: Visible sur petit écran
- [ ] Style: Clair (light version)

**À créer:**
- Arrière-plan: Gradient bleu-violet (brand colors)
- Texte: "Budget Pro - Gérez vos finances"
- Icons: Comptes, Budgets, Objectifs, Analyses
- Dimensions: 1024x500px exactement

### 3. **Screenshots Phone (Français)**
- [ ] **5-8 screenshots minimum**
- [ ] Format: PNG ou JPG
- [ ] Résolution: 1080x1920 (ou 540x960)
- [ ] Ratio: 9:16
- [ ] Dossier: `playstore-assets/screenshots/fr-FR/`

#### Screenshots à capturer:

**1. Écran d'authentification**
- Titre: "Gestion de Budget"
- Sous-titre: "Prenez le contrôle de vos finances"
- Champs: Email, Password, "Secure connection"

**2. Dashboard principal**
- Solde total en évidence
- Synthèse par poche (Nourriture, Logement, Transport, etc.)
- Actions rapides (Ajouter transaction, Créer budget)

**3. Poches budgétaires détail**
- Affiche "Synthèse par poche"
- Barre de progression pour chaque catégorie
- Statuts (OK, À surveiller, Dépassement)

**4. Historique transactions**
- Liste des transactions récentes
- Icônes de catégories
- Montants colorés (revenu vert, dépense rouge)

**5. Formulaire transaction**
- Champs: Montant, Catégorie, Compte, Description
- Datepicker
- Boutons: Annuler, Enregistrer

**6. Planificateur budgets**
- Allocations par catégorie
- Pourcentages
- Budgets mensuels

**7. Objectifs**
- Liste des objectifs de savings
- Barres de progression
- Cibles à atteindre

**8. Analyses/Rapports** (Optionnel)
- Graphiques des dépenses
- Tendances mensuelles
- Insights intelligents

### 4. **Descriptions**

#### Titre (50 caractères max) ✅
```
Budget Pro - Gestion de finances
```

#### Sous-titre (80 caractères max) ✅
```
Contrôlez vos comptes, budgets et épargne facilement
```

#### Description courte (4000 caractères) ✅
```
[Voir PLAYSTORE_DEPLOYMENT_GUIDE.md pour le texte complet]
```

---

## 📋 Fichiers Structurés

```
playstore-assets/
├── ic_launcher_512.png                    # Icône (512x512)
├── feature-graphic-light-1024x500.png     # Graphique promo (1024x500)
├── feature-graphic-dark-1024x500.png      # Version sombre (optionnel)
├── screenshots/
│   └── fr-FR/
│       ├── 01-auth-login.png             # (1080x1920)
│       ├── 02-dashboard.png              # (1080x1920)
│       ├── 03-pocket-detail.png          # (1080x1920)
│       ├── 04-transactions.png           # (1080x1920)
│       ├── 05-add-transaction.png        # (1080x1920)
│       ├── 06-budgets.png                # (1080x1920)
│       ├── 07-goals.png                  # (1080x1920)
│       └── 08-analytics.png              # (1080x1920)
├── SCREENSHOTS_GUIDE.md                   # Guide captures
└── [Ce fichier]
```

---

## 🎨 Directives de Design

### Couleurs Primaires
```
Indigo/Bleu: #3E63DD
Bleu secondaire: #7C3AED (violet)
Teal: #00796B
Coral: #FF7A59
Vert: #4CAF50
```

### Texte sur Screenshots
- **Police:** Bold pour les titres
- **Taille:** Lisible même à 240 pixels
- **Contraste:** 4.5:1 minimum (WCAG AA)
- **Langue:** Français

### Contenu Visual
- Montrer l'interface réelle
- Pas de texte marketing trop lourd
- Flèches/annotations si utile
- Contexte: Données d'exemple crédibles

---

## 📱 Émulateur Setup

### Créer un appareil test
```bash
# List devices
emulator -list-avds

# Créer Pixel 5 (recommandé)
avdmanager create avd -n Pixel_5_API_34 \
  -k "system-images;android;34;google_apis" \
  -d "Pixel 5"

# Lancer
emulator -avd Pixel_5_API_API_34 &
```

### Populer avec données de test
1. Lancer l'app
2. S'enregistrer avec compte de test
3. Ajouter plusieurs comptes
4. Créer 2-3 budgets
5. Ajouter ~10 transactions variées
6. Créer 1-2 objectifs
7. Naviguer sur chaque écran

---

## 🔍 Vérification Pré-Upload

### Checklist Google Play Console

- [ ] **Icône:** 512x512, PNG, visible
- [ ] **Graphique:** 1024x500 exact
- [ ] **Screenshots:** 5-8 images, 1080x1920, PNG/JPG
- [ ] **Titre:** Max 50 chars, français
- [ ] **Description:** Max 4000 chars, complète
- [ ] **Catégorie:** Finance sélectionnée
- [ ] **Contenu:** Gratuit sélectionné
- [ ] **Age rating:** Validé (12+)
- [ ] **Privacy policy:** URL fournie
- [ ] **Support email:** support@budgetpro.app
- [ ] **Support WhatsApp:** À configurer
- [ ] **Website:** https://www.beonweb.cm

---

## 📤 Qualité Assets

### Icône
- ✅ Pas de coins arrondis (Play Store les ajoute)
- ✅ Logo centré
- ✅ Pas de texte
- ✅ Transparence 100%

### Graphique Promotionnel
- ✅ Texte lisible à 16pt
- ✅ Logo visible
- ✅ Pas d'éléments importants en bords (crop possible)
- ✅ Optimisé pour mobile + tablet

### Screenshots
- ✅ Vraies données (pas de lorem ipsum)
- ✅ Interface française
- ✅ Pas de debug info visible
- ✅ Éclairage naturel/cohérent
- ✅ Pas de barres systèmes visibles (si possible)

---

## 🚀 Prochaines Étapes

1. **Capturer les screenshots** (voir SCREENSHOTS_GUIDE.md)
2. **Créer le graphique promo** (Figma/Canva)
3. **Valider les icônes** depuis build Flutter
4. **Uploader tout** dans Google Play Console
5. **Vérifier avant publication**

---

## 📞 Support

**Questions Play Store:**
- Docs Google: https://support.google.com/googleplay/android-developer
- Flutter: https://flutter.dev/docs/deployment/android
- Assets: https://support.google.com/googleplay/android-developer/answer/1078870

---

**Status:** ✅ À FAIRE
**Date limite:** ASAP pour lancement
