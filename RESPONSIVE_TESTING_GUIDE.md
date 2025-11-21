# 🧪 Guide de Test Responsive - Budget Pro

## 📋 Checklist de Validation Visuelle

Utilisez ce guide pour tester systématiquement toutes les tailles d'écran et vous assurer que le responsive design fonctionne parfaitement.

## 🔧 Outils de Test

### 1. Chrome DevTools (Recommandé)
```
1. Ouvrir Chrome DevTools (F12 ou Cmd+Option+I)
2. Cliquer sur l'icône "Toggle device toolbar" (Cmd+Shift+M)
3. Sélectionner les presets ou entrer une taille personnalisée
```

**Presets à tester** :
- iPhone SE (375x667) - Petit mobile
- iPhone 12 Pro (390x844) - Mobile standard
- iPhone 14 Pro Max (430x932) - Grand mobile
- iPad (768x1024) - Tablette portrait
- iPad Pro (1024x1366) - Tablette paysage
- Laptop (1366x768) - **RÉFÉRENCE IMPORTANTE**
- Desktop (1920x1080) - Full HD

### 2. Responsively App
Outil gratuit pour tester plusieurs tailles simultanément :
https://responsively.app/

### 3. Test en Conditions Réelles
- iPhone/Android physique
- iPad physique
- MacBook Air 13" (1366px)
- Écran externe 24" (1920px)

## 📱 Tests par Taille d'Écran

### ✅ MOBILE (320-480px)

#### Pages à tester :
- [ ] **Dashboard** (`/dashboard`)
  - [ ] Header avec menu burger visible et accessible
  - [ ] KPI cards en 1 colonne (si < 360px) ou 2 colonnes (si ≥ 360px)
  - [ ] Charts scrollables horizontalement sans déborder
  - [ ] BottomNav visible et sticky en bas
  - [ ] Safe area respectée (encoche iPhone)
  - [ ] Boutons ≥ 48x48px (touch targets)
  - [ ] Texte lisible (≥ 14px)

- [ ] **Transactions** (`/transactions`)
  - [ ] Filtres en 1 colonne
  - [ ] Table avec scroll horizontal
  - [ ] Checkbox sticky lors du scroll horizontal
  - [ ] Pagination centrée
  - [ ] Actions en 1 colonne sur mobile

- [ ] **Categories** (`/categories`)
  - [ ] Cards en 1 colonne
  - [ ] Formulaire d'ajout en 1 colonne
  - [ ] Boutons full-width sur mobile

- [ ] **Goals** (`/goals`)
  - [ ] Progress bars visibles et lisibles
  - [ ] Cards en 1 colonne
  - [ ] Charts adaptés

- [ ] **Debts** (`/debts`)
  - [ ] Liste en 1 colonne
  - [ ] Détails en stack vertical
  - [ ] Calendrier de paiements adapté

- [ ] **Settings** (`/settings`)
  - [ ] Tabs verticaux ou scroll horizontal
  - [ ] Formulaires en 1 colonne
  - [ ] Toggles et switches accessibles

#### Vérifications Globales Mobile :
- [ ] Pas de scroll horizontal indésirable
- [ ] Sidebar masquée (menu burger uniquement)
- [ ] BottomNav présente et fonctionnelle
- [ ] Tous les textes lisibles sans zoom
- [ ] Images lazy-loaded
- [ ] Transitions fluides
- [ ] Touch events réactifs
- [ ] Pas de hover states persistants

### ✅ TABLET PORTRAIT (768px)

- [ ] **Dashboard**
  - [ ] KPI cards en 2 colonnes
  - [ ] Charts + sidebar en stack vertical
  - [ ] Debt/Categories en 2 colonnes
  - [ ] Spacing plus généreux (gap-4)

- [ ] **Transactions**
  - [ ] Filtres en 2 colonnes
  - [ ] Table avec plus de colonnes visibles
  - [ ] Actions en ligne (pas stackées)

- [ ] Sidebar toujours masquée (menu burger)
- [ ] BottomNav toujours présente
- [ ] Typography légèrement plus grande
- [ ] Padding augmenté (px-6)

### ✅ TABLET LANDSCAPE (1024px)

- [ ] **SIDEBAR APPARITION** (point critique)
  - [ ] Sidebar fixe visible à gauche (260px)
  - [ ] Logo dans le header de la sidebar
  - [ ] Navigation avec items cliquables
  - [ ] Active state visible
  - [ ] Scroll interne si nécessaire

- [ ] **Dashboard**
  - [ ] KPI cards en 3 colonnes
  - [ ] Charts + sidebar en 2 colonnes [2fr+1fr]
  - [ ] Debt/Categories en 3 colonnes
  - [ ] Spacer compensatoire pour sidebar fixe

- [ ] **Layout global**
  - [ ] Grid `[260px_1fr]` fonctionnel
  - [ ] BottomNav masquée
  - [ ] Header height 64px → 72px
  - [ ] Contenu décalé correctement

### ✅ LAPTOP 1366px (RÉFÉRENCE CRITIQUE)

**⚠️ TAILLE LA PLUS COMMUNE - PRIORITÉ MAXIMALE**

- [ ] **Sidebar**
  - [ ] Largeur augmentée à 280px
  - [ ] Tous les labels visibles sans truncate
  - [ ] Spacing confortable (gap-2)

- [ ] **Dashboard**
  - [ ] KPI cards bien proportionnées (3 cols)
  - [ ] Charts lisibles sans zoom
  - [ ] Pas de vide excessif
  - [ ] Max-width centré (max-w-7xl)

- [ ] **Transactions**
  - [ ] Filtres en 4 colonnes
  - [ ] Table complète visible sans scroll
  - [ ] Actions visibles

- [ ] Typography optimale (16-18px base)
- [ ] Padding généreux (px-10)
- [ ] Tous les éléments bien espacés

### ✅ DESKTOP FULL HD (1920px)

- [ ] **Sidebar** élargie à 300px
- [ ] **Max-width** centré (1600px)
- [ ] **Grilles** denses mais aérées
- [ ] **Typography** augmentée (18-20px base)
- [ ] **Pas de vide** sur les côtés
- [ ] Charts et graphs bien proportionnés
- [ ] Cards avec gap généreux (gap-6)

### ✅ ULTRA-WIDE (≥2560px)

- [ ] **Contenu centré** avec max-w-[1920px]
- [ ] **Sidebar** 300px
- [ ] **Grilles** jusqu'à 6 colonnes si pertinent
- [ ] **Lignes de texte** < 80 caractères
- [ ] **Pas de stretch** excessif des images
- [ ] **Spacing** maximum pour aération

## 🎯 Tests de Cas d'Usage Critiques

### 1. Connexion et Onboarding
- [ ] Formulaire de login centré sur toutes tailles
- [ ] FirstTimeSetupBanner responsive
- [ ] Pas de keyboard qui cache les inputs (mobile)

### 2. Ajout de Transaction
- [ ] Formulaire accessible sur mobile
- [ ] Clavier numérique pour montants (mobile)
- [ ] Date picker adapté
- [ ] Select de catégorie scrollable

### 3. Visualisation de Chart
- [ ] Chart lisible sur mobile (scroll horizontal ok)
- [ ] Tooltips visibles et non coupés
- [ ] Légende positionnée correctement
- [ ] Responsive resize lors du changement d'orientation

### 4. Navigation
- [ ] Burger menu fonctionnel (< 1024px)
- [ ] Sidebar fonctionnelle (≥ 1024px)
- [ ] BottomNav tactile et précise (< 1024px)
- [ ] Active states visibles
- [ ] Transitions fluides

### 5. Tableaux Longs
- [ ] Scroll horizontal sur mobile
- [ ] Colonnes sticky (checkbox, actions)
- [ ] Pagination fonctionnelle
- [ ] Sélection multiple accessible
- [ ] Sort/filter conservé lors du scroll

## 📊 Métriques de Performance

### Lighthouse Mobile (à tester sur chaque page)
```bash
# Installer Lighthouse CLI
npm install -g lighthouse

# Test Dashboard mobile
lighthouse http://localhost:9002/dashboard --preset=mobile --output=html --output-path=./lighthouse-mobile.html

# Test Dashboard desktop
lighthouse http://localhost:9002/dashboard --preset=desktop --output=html --output-path=./lighthouse-desktop.html
```

**Cibles minimum** :
- Performance: ≥ 90
- Accessibility: ≥ 95
- Best Practices: ≥ 95
- SEO: ≥ 90

### Core Web Vitals
- **LCP (Largest Contentful Paint)** : < 2.5s
- **FID (First Input Delay)** : < 100ms
- **CLS (Cumulative Layout Shift)** : < 0.1

## 🐛 Bugs Courants à Vérifier

### Layout
- [ ] Pas de scroll horizontal non intentionnel
- [ ] Sidebar ne chevauche pas le contenu
- [ ] Header sticky fonctionne
- [ ] Footer toujours en bas (pas au milieu)
- [ ] Safe areas respectées (iPhone X+)

### Typography
- [ ] Pas de text-truncate non souhaité
- [ ] Line-height suffisant pour lisibilité
- [ ] Pas de typo trop petite (< 12px)
- [ ] Contraste suffisant (WCAG AA)

### Interactivité
- [ ] Tous les boutons cliquables
- [ ] Touch targets ≥ 48x48px
- [ ] Pas de hover states bloqués sur mobile
- [ ] Focus visible au clavier
- [ ] Pas de click delay (300ms)

### Images & Media
- [ ] Images responsive (srcset si applicable)
- [ ] Lazy loading fonctionnel
- [ ] Pas de stretch/distorsion
- [ ] Alt text présent
- [ ] Placeholder visible pendant chargement

### Forms
- [ ] Labels visibles
- [ ] Validation visible
- [ ] Keyboard approprié (tel, email, number)
- [ ] Autocomplete fonctionnel
- [ ] Submit en Enter

## 📸 Screenshots de Référence

### À capturer pour chaque page :
1. **Mobile 375px** (iPhone)
2. **Tablet 768px** (iPad Portrait)
3. **Laptop 1366px** (Référence)
4. **Desktop 1920px** (Full HD)

```bash
# Script de capture automatique (Playwright)
# À créer dans e2e/screenshots.spec.ts
```

## 🔄 Test de Rotation (Mobile/Tablet)

- [ ] **Portrait → Paysage**
  - [ ] Layout s'adapte sans reload
  - [ ] Pas de contenu coupé
  - [ ] Navigation reste accessible

- [ ] **Paysage → Portrait**
  - [ ] Retour au layout portrait
  - [ ] Pas de layout cassé

## 🌐 Tests Multi-Navigateurs

### Desktop
- [ ] Chrome (dernier)
- [ ] Firefox (dernier)
- [ ] Safari (dernier)
- [ ] Edge (dernier)

### Mobile
- [ ] Safari iOS (iPhone)
- [ ] Chrome Android
- [ ] Samsung Internet

## 📝 Template de Rapport de Bug

```markdown
## 🐛 Bug Responsive

**Page** : /dashboard
**Taille d'écran** : 1366x768 (Laptop)
**Navigateur** : Chrome 120
**OS** : macOS Sonoma

**Description** :
Les KPI cards débordent sur la droite et causent un scroll horizontal.

**Steps to reproduce** :
1. Aller sur /dashboard
2. Resize à 1366px de large
3. Observer le débordement

**Screenshot** :
[Ajouter screenshot]

**Fix suggéré** :
Ajouter `overflow-hidden` ou ajuster le max-width du container.
```

## ✅ Checklist Finale de Release

Avant de déployer en production :

- [ ] Tous les tests mobile passés (320-480px)
- [ ] Tous les tests tablet passés (768-1024px)
- [ ] **Test laptop 1366px validé** (CRITIQUE)
- [ ] Tous les tests desktop passés (1920px+)
- [ ] Lighthouse mobile > 90 sur toutes les pages
- [ ] Lighthouse desktop > 95 sur toutes les pages
- [ ] Pas de console errors
- [ ] Pas de scroll horizontal indésirable
- [ ] Navigation fluide sur toutes tailles
- [ ] Forms utilisables sur mobile
- [ ] Images optimisées et responsive
- [ ] Safe areas iOS respectées
- [ ] Tests multi-navigateurs OK

---

**Dernière mise à jour** : 16 novembre 2025  
**Responsable** : Budget Pro Team  
**Version** : 1.0.0
