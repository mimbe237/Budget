# Play Store Screenshots Guide

## Méthode Manuelle Simple (Recommandée)

### 1. Lancer l'app sur émulateur

```bash
# Démarrer un émulateur (ajuster le nom selon vos AVDs)
emulator -avd Pixel_5_API_34 -netdelay none -netspeed full &

# Ou via Android Studio > Device Manager > Play button

# Builder et lancer l'app
cd /Users/macbook/budget
flutter run
```

### 2. Capturer manuellement les écrans

Une fois l'app lancée, naviguez et capturez:

- **01_auth_login** - Écran de connexion
- **02_auth_signup** - Onglet inscription
- **03_dashboard** - Dashboard après connexion démo
- **04_transactions_list** - Liste des transactions
- **05_transaction_form** - Formulaire d'ajout
- **06_budget_planner** - Planificateur budget
- **07_goals** - Objectifs
- **08_iou** - Dettes/IOU
- **09_settings** - Paramètres

**Capture via terminal:**
```bash
# Pour chaque écran après navigation
adb exec-out screencap -p > playstore-assets/screenshots/fr-FR/01_auth_login.png
adb exec-out screencap -p > playstore-assets/screenshots/fr-FR/03_dashboard.png
# etc.
```

**Ou via Android Studio:**
- Fenêtre Running Devices > Camera icon
- Sauvegardez dans `playstore-assets/screenshots/`

### 3. Formats requis Play Console

**Phone (minimum 2, maximum 8):**
- Résolution min: 320px
- Résolution max: 3840px  
- Ratio: 16:9 ou 9:16
- Format: PNG ou JPG (24-bit, sans alpha)

**Tablet 7" (optionnel, 1-8):**
- Résolution min: 1024px
- Format: PNG ou JPG

**Tablet 10" (optionnel, 1-8):**
- Résolution min: 1280px
- Format: PNG ou JPG

### 4. Feature Graphic (obligatoire)

Créez une image 1024 × 500 px avec:
- Logo de l'app
- Nom "Budget Pro"
- Slogan court
- Fond aux couleurs de la marque

Outils: Canva, Figma, ou Photoshop

## Structure du dossier

```
playstore-assets/
└── screenshots/
    ├── fr-FR/
    │   ├── 01_auth_login.png
    │   ├── 03_dashboard.png
    │   ├── 04_transactions_list.png
    │   ├── 06_budget_planner.png
    │   ├── 07_goals.png
    │   └── 08_iou.png
    ├── en-US/
    │   └── (same structure)
    └── feature_graphic.png (1024×500)
```

## Upload sur Play Console

1. Google Play Console > Votre app > Fiche Play Store
2. Section "Graphiques" > Upload screenshots par type d'appareil
3. Upload Feature Graphic
4. Enregistrer

## Notes

- Minimum 2 screenshots phone requis pour publier
- Les screenshots peuvent être dans n'importe quelle langue au début
- Vous pouvez ajouter d'autres locales (en-US, etc.) plus tard
- La feature graphic est obligatoire
