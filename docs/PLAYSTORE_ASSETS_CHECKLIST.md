# Play Store Assets - Checklist & Spécifications

## 📱 Screenshots Requis

### Téléphone (OBLIGATOIRE)

**Spécifications** :
- Minimum : 2 screenshots
- Maximum : 8 screenshots
- Format : PNG ou JPEG
- Résolution recommandée : **1080 x 1920 px** (portrait)
- Ou : **1920 x 1080 px** (paysage)
- Taille max : 8 MB par fichier

**Pages à capturer** :
1. ✅ **Dashboard** - Vue d'ensemble avec graphiques
2. ✅ **Transactions** - Liste des transactions récentes
3. ✅ **Objectifs** - Progression des objectifs d'épargne
4. ✅ **Rapports** - Graphiques détaillés
5. ✅ **Ajout Transaction** - Formulaire d'ajout
6. ⭐ **Mode Sombre** - Une capture en dark mode
7. ⭐ **Gestion Dettes** - Vue des dettes
8. ⭐ **Profil/Paramètres** - Page de configuration

**Comment capturer** :
```bash
# Avec Chrome DevTools
1. Ouvrir http://localhost:3000
2. F12 → Toggle Device Toolbar (Cmd+Shift+M)
3. Sélectionner "Pixel 5" (1080 x 2340)
4. Naviguer vers chaque page
5. Cmd+Shift+P → "Capture screenshot"
6. Renommer : screenshot-01-dashboard.png, etc.
```

---

### Tablette 7 pouces (RECOMMANDÉ)

**Spécifications** :
- Minimum : 2 screenshots
- Format : PNG ou JPEG
- Résolution recommandée : **1536 x 2048 px** (portrait)
- Ou : **2048 x 1536 px** (paysage)

**Appareil à émuler** :
- iPad Mini (1536 x 2048)
- Nexus 7 (1200 x 1920)

---

### Tablette 10 pouces (OPTIONNEL)

**Spécifications** :
- Format : PNG ou JPEG
- Résolution recommandée : **2048 x 2732 px** (portrait)
- Ou : **2732 x 2048 px** (paysage)

---

## 🎨 Feature Graphic (OBLIGATOIRE)

**Spécifications** :
- Dimensions exactes : **1024 x 500 px**
- Format : PNG ou JPEG
- Taille max : 1 MB
- Pas de transparence
- Pas de bordure

**Contenu recommandé** :
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  [Logo]    Budget Pro                               │
│                                                     │
│            Gérez votre argent intelligemment        │
│            📊 Budget  💰 Transactions  🎯 Objectifs │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Outils de création** :
- Figma : https://figma.com
- Canva : https://canva.com
- Photoshop
- GIMP (gratuit)

**Template** :
```
Fond : Dégradé bleu (#4F46E5) → violet (#7C3AED)
Logo : Centré à gauche (200x200 px)
Titre : "Budget Pro" - Poppins Bold 72px - Blanc
Slogan : "Gérez votre argent intelligemment" - PT Sans 36px - Blanc 80%
Icônes : 3 émojis espacés - 48px
```

---

## 🔲 Icône Application (OBLIGATOIRE)

**Spécifications** :
- Dimensions exactes : **512 x 512 px**
- Format : PNG (32 bits)
- Sans transparence (fond opaque)
- Taille max : 1 MB

**Fichier existant** :
✅ `/public/icons/icon-512.png` (déjà prêt)

**Vérification** :
```bash
# Vérifier les dimensions
file public/icons/icon-512.png
# Output attendu : PNG image data, 512 x 512, 8-bit/color RGBA
```

---

## 📝 Textes & Descriptions

### Titre de l'application (OBLIGATOIRE)
**Limite** : 50 caractères

**Proposition** :
```
Budget Pro - Gestion Budget
```
(30 caractères)

---

### Description courte (OBLIGATOIRE)
**Limite** : 80 caractères

**Proposition** :
```
Suivez vos dépenses, atteignez vos objectifs et maîtrisez votre budget
```
(69 caractères)

---

### Description complète (OBLIGATOIRE)
**Limite** : 4000 caractères
**Actuel** : ~2500 caractères ✅

Voir fichier : `docs/TWA_PLAYSTORE_GUIDE.md` section "Description complète"

---

## 🎬 Vidéo Promo (OPTIONNEL)

**Spécifications** :
- Durée : 30 secondes à 2 minutes
- Format : MP4
- Résolution : 1080p minimum
- URL YouTube

**Contenu suggéré** :
1. Intro (5s) : Logo + slogan
2. Dashboard (10s) : Vue d'ensemble
3. Transactions (10s) : Ajout rapide
4. Objectifs (10s) : Progression visuelle
5. Rapports (10s) : Graphiques
6. Outro (5s) : CTA "Télécharger maintenant"

---

## 🌍 Localisation

### Langues à supporter

**Priorité 1 (Lancement)** :
- ✅ Français (fr-FR)
- ✅ Anglais (en-US)

**Priorité 2 (Post-lancement)** :
- Espagnol (es-ES)
- Allemand (de-DE)
- Italien (it-IT)

**Pour chaque langue** :
- Titre (50 car)
- Description courte (80 car)
- Description complète (4000 car)
- Screenshots avec UI traduite

---

## 📊 Catégorie & Classification

### Catégorie primaire
**Finance** ✅

### Catégorie secondaire (optionnelle)
**Productivité**

### Tags
- Budget
- Dépenses
- Épargne
- Comptabilité
- Finance personnelle
- Gestion d'argent

### Classification du contenu
- Public cible : **Tous (13+)**
- Contient des achats intégrés : **Non**
- Contient des publicités : **Non**

---

## 🔗 Liens & Informations

### Site Web (OBLIGATOIRE)
```
https://budget-app.web.app
```

### Email de contact (OBLIGATOIRE)
```
support@touchpointinsights.com
```

### Politique de confidentialité (OBLIGATOIRE)
```
https://budget-app.web.app/privacy-policy
```
⚠️ À créer si n'existe pas

### Conditions d'utilisation (OPTIONNEL)
```
https://budget-app.web.app/terms-of-service
```

---

## 📋 Checklist Finale

### Assets Graphiques
- [ ] 2+ screenshots téléphone (1080x1920)
- [ ] 2+ screenshots tablette 7" (1536x2048) - optionnel
- [ ] Feature graphic (1024x500)
- [ ] Icône app (512x512) - ✅ Déjà prêt
- [ ] Vidéo promo (optionnel)

### Textes
- [ ] Titre app (max 50 car)
- [ ] Description courte (max 80 car)
- [ ] Description complète (max 4000 car)
- [ ] Notes de version

### Informations Légales
- [ ] Site web
- [ ] Email de contact
- [ ] Politique de confidentialité
- [ ] Classification du contenu

### Fichiers Techniques
- [ ] AAB signé (app-release.aab)
- [ ] Keystore sauvegardé
- [ ] assetlinks.json déployé
- [ ] Digital Asset Links vérifié

### Configuration Play Console
- [ ] Compte développeur créé ($25)
- [ ] Application créée
- [ ] Fiche Store complétée
- [ ] AAB uploadé
- [ ] Tests internes passés
- [ ] Soumis pour révision

---

## 🎨 Création des Assets - Script Automatisé

```bash
#!/bin/bash
# Script de capture de screenshots

# Configuration
URL="http://localhost:3000"
OUTPUT_DIR="./play-store-assets/screenshots"
mkdir -p "$OUTPUT_DIR"

# Pages à capturer
declare -a PAGES=(
  "dashboard:Dashboard"
  "transactions:Transactions"
  "goals:Objectifs"
  "reports:Rapports"
  "debts:Dettes"
  "transactions/add:Ajouter"
  "settings:Paramètres"
)

echo "📸 Capture des screenshots..."
echo "Ouvrir Chrome DevTools et configurer:"
echo "  - Device: Pixel 5 (1080 x 2340)"
echo "  - Zoom: 100%"
echo ""
read -p "Appuyez sur Entrée quand prêt..."

for page in "${PAGES[@]}"; do
  IFS=':' read -r path name <<< "$page"
  echo "Visitez: $URL/$path"
  echo "Capture: screenshot-${name}.png"
  read -p "Appuyez sur Entrée après capture..."
done

echo "✅ Screenshots capturés dans: $OUTPUT_DIR"
```

---

## 📚 Ressources

- [Play Console Guidelines](https://support.google.com/googleplay/android-developer/answer/9866151)
- [Store Listing Best Practices](https://developer.android.com/distribute/google-play/resources/store-listing)
- [Graphic Asset Specs](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en)

---

## 💡 Conseils

### Screenshots
- ✅ Utiliser des données réalistes (pas de lorem ipsum)
- ✅ Montrer les fonctionnalités clés
- ✅ Varier les écrans (pas 8x la même chose)
- ✅ Inclure du texte explicatif si possible
- ✅ Tester en portrait ET paysage

### Feature Graphic
- ✅ Éviter trop de texte (max 3 lignes)
- ✅ Utiliser les couleurs de la marque
- ✅ Logo visible et reconnaissable
- ✅ Contraste élevé pour lisibilité

### Description
- ✅ Commencer par les bénéfices (pas les fonctionnalités)
- ✅ Utiliser des émojis avec parcimonie
- ✅ Structurer avec des sections
- ✅ Inclure des mots-clés pour SEO
- ✅ Terminer par un CTA (Call To Action)

