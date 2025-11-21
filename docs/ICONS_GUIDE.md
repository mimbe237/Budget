# 🎨 Guide des Icônes Budget Pro

## 📄 Icône Source (SVG)

**Fichier principal** : `public/icons/budget-pro-icon.svg`

- **Design** : Portefeuille stylisé avec pièce de monnaie
- **Couleur primaire** : #4F46E5 (Violet indigo)
- **Badge** : Étoile verte (#10B981) pour "Pro"
- **Format** : SVG vectoriel (scalable à l'infini)

### Régénérer toutes les icônes

```bash
npm run icons:all
```

ou

```bash
node scripts/generate-all-icons.js
```

---

## 🌐 Icônes PWA (Web)

Générées dans `public/icons/`

| Fichier | Taille | Usage |
|---------|--------|-------|
| `favicon-16x16.png` | 16×16 | Favicon navigateur (petit) |
| `favicon-32x32.png` | 32×32 | Favicon navigateur (standard) |
| `apple-touch-icon.png` | 180×180 | iOS home screen |
| `icon-192.png` | 192×192 | PWA install prompt, Android Chrome |
| `icon-512.png` | 512×512 | PWA splash screen, haute résolution |
| `maskable-512.png` | 512×512 | Android adaptive icon (safe zone) |
| `budget-pro-icon.svg` | Vectoriel | Icône source, favicon moderne |

### Manifest PWA

Déclaré dans `public/manifest.json` :

```json
{
  "icons": [
    {
      "src": "/icons/budget-pro-icon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    },
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

---

## 🤖 Icônes Android

Générées dans `android/app/src/main/res/`

### Icônes d'application (mipmap)

| Dossier | Taille | Densité | Fichiers |
|---------|--------|---------|----------|
| `mipmap-ldpi` | 36×36 | ~120dpi | `ic_launcher.png`, `ic_launcher_round.png` |
| `mipmap-mdpi` | 48×48 | ~160dpi | `ic_launcher.png`, `ic_launcher_round.png` |
| `mipmap-hdpi` | 72×72 | ~240dpi | `ic_launcher.png`, `ic_launcher_round.png` |
| `mipmap-xhdpi` | 96×96 | ~320dpi | `ic_launcher.png`, `ic_launcher_round.png` |
| `mipmap-xxhdpi` | 144×144 | ~480dpi | `ic_launcher.png`, `ic_launcher_round.png` |
| `mipmap-xxxhdpi` | 192×192 | ~640dpi | `ic_launcher.png`, `ic_launcher_round.png` |

- **ic_launcher.png** : Icône carrée avec fond violet
- **ic_launcher_round.png** : Icône ronde avec fond violet

### Splash Screens (drawable)

| Dossier | Dimension | Densité | Usage |
|---------|-----------|---------|-------|
| `drawable-ldpi` | 320×480 | ~120dpi | Anciens devices |
| `drawable-mdpi` | 480×800 | ~160dpi | Devices standard |
| `drawable-hdpi` | 800×1280 | ~240dpi | Devices HD |
| `drawable-xhdpi` | 1280×1920 | ~320dpi | Devices Full HD |
| `drawable-xxhdpi` | 1600×2560 | ~480dpi | Devices QHD |
| `drawable-xxxhdpi` | 1920×2880 | ~640dpi | Devices 4K |

**Design** : Logo centré (40% de la largeur) sur fond violet #4F46E5

### Configuration Capacitor

`capacitor.config.ts` :

```typescript
{
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#4F46E5',
      androidSplashResourceName: 'splash',
      showSpinner: false
    }
  }
}
```

---

## 📱 Utilisation dans l'Application

### HTML (layout.tsx)

```tsx
<link rel="icon" type="image/svg+xml" href="/icons/budget-pro-icon.svg" />
<link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
```

### React Component (exemple)

```tsx
import Image from 'next/image';

// SVG inline
<img src="/icons/budget-pro-icon.svg" alt="Budget Pro" width={48} height={48} />

// PNG optimisé
<Image 
  src="/icons/icon-192.png" 
  alt="Budget Pro" 
  width={192} 
  height={192} 
  priority
/>
```

---

## 🎯 Checklist Qualité Icônes

### ✅ PWA

- [x] Favicon 16×16 et 32×32
- [x] Apple touch icon 180×180
- [x] Icons 192×192 et 512×512
- [x] Maskable icon 512×512
- [x] SVG pour navigateurs modernes
- [x] Déclaré dans manifest.json
- [x] Déclaré dans layout.tsx

### ✅ Android

- [x] ic_launcher pour toutes densités (ldpi à xxxhdpi)
- [x] ic_launcher_round pour toutes densités
- [x] Splash screens pour toutes résolutions
- [x] Configuré dans AndroidManifest.xml
- [x] Splash screen configuré dans capacitor.config.ts

### ✅ Design

- [x] Couleurs cohérentes avec la charte (#4F46E5)
- [x] Logo visible sur fond clair et foncé
- [x] Safe zone respectée pour maskable icon
- [x] Ratio 1:1 (carré)
- [x] Optimisé pour petites tailles (16×16)

---

## 🔄 Workflow de Mise à Jour

1. **Modifier le SVG source** : `public/icons/budget-pro-icon.svg`
2. **Régénérer toutes les icônes** :
   ```bash
   npm run icons:all
   ```
3. **Synchroniser Android** :
   ```bash
   npx cap sync android
   ```
4. **Rebuild et redéployer** :
   ```bash
   npm run build
   firebase deploy --only hosting
   ```

---

## 📊 Statistiques

- **Total icônes générées** : 24 fichiers
  - 6 icônes PWA (PNG)
  - 12 icônes Android (ic_launcher + round)
  - 6 splash screens Android
- **Format source** : SVG (512×512 viewport)
- **Taille totale** : ~2 MB (toutes icônes combinées)
- **Script** : `scripts/generate-all-icons.js` (Node.js + Sharp)

---

## 🆘 Dépannage

### Icône ne s'affiche pas dans le navigateur

1. Vider le cache : `Cmd+Shift+R` (macOS) / `Ctrl+Shift+R` (Windows)
2. Vérifier le chemin dans le code source
3. Vérifier que le fichier existe : `ls -la public/icons/`

### Icône Android ne change pas

1. Désinstaller l'app du device : `adb uninstall com.touchpointinsights.budget`
2. Régénérer les icônes : `npm run icons:all`
3. Synchroniser : `npx cap sync android`
4. Rebuild : `cd android && ./gradlew clean assembleDebug`

### Splash screen ne s'affiche pas

1. Vérifier `capacitor.config.ts` → `SplashScreen` configuration
2. Vérifier que `splash.png` existe dans tous les `drawable-*`
3. Clean build Android : `cd android && ./gradlew clean`

---

## 📚 Ressources

- **SVG Editor** : Figma, Inkscape, Adobe Illustrator
- **PWA Icon Guidelines** : https://web.dev/add-manifest/#icons
- **Android Adaptive Icons** : https://developer.android.com/guide/practices/ui_guidelines/icon_design_adaptive
- **Maskable Icons** : https://maskable.app/

---

**Dernière mise à jour** : 15 novembre 2025
**Mainteneur** : BEONWEB (contact@beonweb.cm)
