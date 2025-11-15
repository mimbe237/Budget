# 🎨 Logos et Icônes Budget Pro

## 📱 Versions Disponibles

### 1. Icône Portefeuille (Icon Only)
**Fichier** : `public/icons/budget-pro-icon.svg`

**Usage** :
- Favicon
- Icône d'application (PWA/Android/iOS)
- Splash screen
- App stores

**Caractéristiques** :
- 💼 Symbole du portefeuille avec fermoir
- 🎨 Fond violet (#4F46E5)
- 📐 Format carré (512×512)
- ✨ Détails : rabat supérieur, lignes de cartes, bouton circulaire

**Où l'utiliser** :
```tsx
// React/Next.js
<img src="/icons/budget-pro-icon.svg" alt="Budget Pro" width={48} height={48} />

// HTML
<link rel="icon" href="/icons/budget-pro-icon.svg" type="image/svg+xml" />
```

---

### 2. Logo Complet (Icon + Text)
**Fichier** : `public/icons/budget-pro-logo-full.svg`

**Usage** :
- En-têtes de site
- Landing pages
- Documentation
- Emails
- Présentations

**Caractéristiques** :
- 💼 Icône portefeuille + texte "Budget Pro"
- 📐 Format horizontal (512×200)
- 🎨 Couleur texte : Violet (#4F46E5)
- ✨ Police : Arial Bold 48px

**Où l'utiliser** :
```tsx
// Header
<img 
  src="/icons/budget-pro-logo-full.svg" 
  alt="Budget Pro" 
  style={{ height: '40px', width: 'auto' }}
/>

// Landing page hero
<div className="flex items-center gap-4">
  <img src="/icons/budget-pro-logo-full.svg" alt="Budget Pro" height={60} />
</div>
```

---

## 🎯 Guide d'Utilisation

### Navigation / Header
✅ **Recommandé** : Logo complet
```tsx
<header>
  <img src="/icons/budget-pro-logo-full.svg" alt="Budget Pro" height={40} />
</header>
```

### Favicon
✅ **Recommandé** : Icône seule (SVG ou PNG)
```html
<link rel="icon" type="image/svg+xml" href="/icons/budget-pro-icon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
```

### App Mobile (Icône lanceur)
✅ **Automatique** : Icône seule générée en PNG
- Android : `android/app/src/main/res/mipmap-*/ic_launcher.png`
- iOS : Généré par Capacitor

### Splash Screen
✅ **Automatique** : Icône seule centrée sur fond violet
- Android : `android/app/src/main/res/drawable-*/splash.png`

### PWA Manifest
✅ **Automatique** : Déclaré dans `manifest.json`

### Email Signatures
✅ **Recommandé** : Logo complet
```html
<img src="https://studio-3821270625-cd276.web.app/icons/budget-pro-logo-full.svg" 
     alt="Budget Pro" 
     height="30" />
```

### Réseaux Sociaux
✅ **Recommandé** : Icône seule en PNG haute résolution
- Utiliser : `icon-512.png` ou `icon-192.png`

---

## 🎨 Charte Graphique

### Couleurs Principales
| Usage | Hex | RGB | Nom |
|-------|-----|-----|-----|
| Primaire | `#4F46E5` | rgb(79, 70, 229) | Indigo 600 |
| Fond clair | `#FFFFFF` | rgb(255, 255, 255) | Blanc |
| Fond sombre | `#1F2937` | rgb(31, 41, 55) | Gray 800 |
| Accent vert | `#10B981` | rgb(16, 185, 129) | Emerald 500 |

### Espacement Safe Zone
- **Icône carrée** : Garder 10% de marge sur tous les côtés
- **Logo horizontal** : Garder 15% de marge verticale

### Tailles Minimales
- **Favicon** : 16×16px (visible et reconnaissable)
- **Mobile** : 48×48px minimum
- **Desktop** : 32×32px minimum
- **Print** : Vectoriel (SVG) recommandé

---

## 📦 Fichiers Générés

### PWA (6 fichiers)
```
public/icons/
├── favicon-16x16.png      (16×16)
├── favicon-32x32.png      (32×32)
├── apple-touch-icon.png   (180×180)
├── icon-192.png           (192×192)
├── icon-512.png           (512×512)
└── maskable-512.png       (512×512)
```

### Android (18 fichiers)
```
android/app/src/main/res/
├── mipmap-ldpi/
│   ├── ic_launcher.png       (36×36)
│   └── ic_launcher_round.png (36×36)
├── mipmap-mdpi/
│   ├── ic_launcher.png       (48×48)
│   └── ic_launcher_round.png (48×48)
├── mipmap-hdpi/
│   ├── ic_launcher.png       (72×72)
│   └── ic_launcher_round.png (72×72)
├── mipmap-xhdpi/
│   ├── ic_launcher.png       (96×96)
│   └── ic_launcher_round.png (96×96)
├── mipmap-xxhdpi/
│   ├── ic_launcher.png       (144×144)
│   └── ic_launcher_round.png (144×144)
├── mipmap-xxxhdpi/
│   ├── ic_launcher.png       (192×192)
│   └── ic_launcher_round.png (192×192)
├── drawable-ldpi/splash.png     (320×480)
├── drawable-mdpi/splash.png     (480×800)
├── drawable-hdpi/splash.png     (800×1280)
├── drawable-xhdpi/splash.png    (1280×1920)
├── drawable-xxhdpi/splash.png   (1600×2560)
└── drawable-xxxhdpi/splash.png  (1920×2880)
```

---

## 🔄 Régénération

```bash
# Régénérer toutes les icônes
npm run icons:all

# Synchroniser avec Android
npx cap sync android

# Préparation complète APK
npm run apk:prepare
```

---

## 🎭 Variantes

### Icône Seule
- ✅ Fond violet
- ✅ Portefeuille blanc avec détails
- ✅ Format : SVG 512×512

### Logo Complet
- ✅ Icône + texte "Budget Pro"
- ✅ Format horizontal
- ✅ Idéal pour en-têtes

### Versions Futures (optionnel)
- 🔲 Version monochrome (noir/blanc)
- 🔲 Version outline (contour seulement)
- 🔲 Version miniature (simplified pour très petites tailles)

---

## 📞 Contact

**Designer** : BEONWEB  
**Email** : contact@beonweb.cm  
**Site** : http://beonweb.cm

**Dernière mise à jour** : 15 novembre 2025
