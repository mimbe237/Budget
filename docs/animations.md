# Guide des Animations - Budget Pro

## Vue d'ensemble

Le projet utilise une combinaison de **CSS animations** (micro-interactions) et **Framer Motion** (transitions complexes) pour une expérience utilisateur fluide et engageante.

## Animations CSS (@keyframes)

### 1. Fade In
```css
.animate-fade-in
```
**Usage**: Entrée de pages, cartes, dialogues
**Durée**: 300ms
**Effet**: Opacity 0→1 + translateY(10px→0)

**Exemple**:
```tsx
<div className="animate-fade-in">
  <Card>...</Card>
</div>
```

### 2. Slide In (Left/Right)
```css
.animate-slide-in-left
.animate-slide-in-right
```
**Usage**: Entrée latérale de panels, notifications
**Durée**: 400ms
**Effet**: TranslateX(±20px→0) + Opacity

### 3. Scale Up
```css
.animate-scale-up
```
**Usage**: Apparition de modales, popovers
**Durée**: 200ms
**Effet**: Scale(0.95→1) + Opacity

### 4. Shimmer Effect
```css
.animate-shimmer
```
**Usage**: Skeleton loaders (remplacement de `animate-pulse`)
**Durée**: 2s (infinite)
**Effet**: Gradient linéaire qui se déplace

**Exemple**:
```tsx
<Skeleton className="h-4 w-full" />
// Utilise automatiquement animate-shimmer
```

### 5. Bounce Subtle
```css
.animate-bounce-subtle
```
**Usage**: Feedback de succès, confirmations
**Durée**: 600ms
**Effet**: TranslateY(0→-5px→0)

### 6. Progress Fill
```css
.animate-progress
```
**Usage**: Barres de progression au chargement initial
**Durée**: 1s
**Effet**: TranslateX(-100%→0)

## Micro-interactions CSS

### Hover Lift
```css
.hover-lift
```
**Usage**: Cartes cliquables, éléments interactifs
**Effet**: TranslateY(-2px) + Box-shadow augmentée

**Exemple**:
```tsx
<Card className="hover-lift">...</Card>
```

### Button Press
```css
.btn-press
```
**Usage**: Tous les boutons (déjà intégré dans Button component)
**Effet**: Scale(0.97) au `active`

### Active Press
```css
.active-press
```
**Usage**: Éléments interactifs mobiles
**Effet**: Scale(0.95) au `active`

## Composants Framer Motion

### PageTransition
**Fichier**: `src/components/page-transition.tsx`

Transitions entre pages avec spring animation.

**Usage**:
```tsx
import { PageTransition } from "@/components/page-transition";

export default function Page() {
  return (
    <PageTransition>
      <YourContent />
    </PageTransition>
  );
}
```

**Animation**: 
- Enter: opacity 0→1, y 10→0
- Exit: opacity 1→0, y 0→-10
- Spring: stiffness=380, damping=30

### AnimatedCard
**Fichier**: `src/components/ui/animated-card.tsx`

Carte avec entrée animée et hover effect.

**Props**:
- `delay?: number` - Délai avant animation (pour stagger)
- `hover?: boolean` - Active hover effect (défaut: true)

**Usage**:
```tsx
<AnimatedCard delay={0.1} hover>
  <CardContent>...</CardContent>
</AnimatedCard>
```

**Animations**:
- Initial: opacity 0, y 20
- Animate: opacity 1, y 0
- Hover: y -4, box-shadow augmentée

### AnimatedNumber
**Fichier**: `src/components/ui/animated-number.tsx`

Compteur animé avec spring physics.

**Props**:
- `value: number` - Valeur à afficher
- `decimals?: number` - Nombre de décimales (défaut: 0)
- `prefix?: string` - Préfixe (ex: "$")
- `suffix?: string` - Suffixe (ex: "€")

**Usage**:
```tsx
<AnimatedNumber 
  value={totalAmount} 
  decimals={2}
  prefix="$"
/>
```

## Composants Améliorés

### Button
**Améliorations**:
- `transition-all duration-200` (au lieu de `transition-colors`)
- `active:scale-[0.98]` - Press effect
- `hover:shadow-md` - Élévation sur hover (variant default/destructive)
- `hover:shadow-sm` - Élévation légère (variant secondary)

### Progress
**Améliorations**:
- `transition-all duration-500 ease-out` - Animation fluide
- Progression smooth lors des mises à jour de valeur

### Skeleton
**Améliorations**:
- `animate-shimmer` (remplace `animate-pulse`)
- `aria-busy="true"` - Accessibilité
- `aria-live="polite"` - Annonce aux lecteurs d'écran

## Configuration Tailwind

### Animations Personnalisées
Définies dans `tailwind.config.ts`:

```typescript
theme: {
  extend: {
    animation: {
      "fade-in": "fadeIn 0.3s ease-out",
      "slide-in-left": "slideInLeft 0.4s ease-out",
      "scale-up": "scaleUp 0.2s ease-out",
      "shimmer": "shimmer 2s infinite linear",
    },
    keyframes: {
      fadeIn: { /* ... */ },
      slideInLeft: { /* ... */ },
      // ...
    }
  }
}
```

## Transitions Globales

### Theme Transitions
```css
* {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-duration: 200ms;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
```

Appliqué à tous les éléments pour des changements de thème fluides.

## Performance

### Optimisations

1. **Propriétés Performantes**
   - Privilégier `transform` et `opacity` (GPU accelerated)
   - Éviter `width`, `height`, `margin` (reflow)

2. **Will-Change**
   ```css
   .hover-lift:hover {
     will-change: transform, box-shadow;
   }
   ```

3. **Reduce Motion**
   Respecte la préférence utilisateur:
   ```css
   @media (prefers-reduced-motion: reduce) {
     * {
       animation-duration: 0.01ms !important;
       transition-duration: 0.01ms !important;
     }
   }
   ```

## Best Practices

### ✅ À Faire

1. **Durées Appropriées**
   - Micro-interactions: 100-200ms
   - Transitions normales: 200-400ms
   - Entrées de page: 300-600ms
   - ❌ Jamais > 1s sauf cas spéciaux

2. **Easing Functions**
   - Entrées: `ease-out` (rapide puis ralentit)
   - Sorties: `ease-in` (lent puis accélère)
   - Interactions: `ease-in-out` (smooth)

3. **Stagger Animations**
   ```tsx
   {items.map((item, i) => (
     <AnimatedCard key={item.id} delay={i * 0.05}>
       {item.content}
     </AnimatedCard>
   ))}
   ```

4. **Loading States**
   - Skeleton avec shimmer > Spinner
   - Progress bar pour opérations longues
   - Pulse subtil pour attentes courtes

### ❌ À Éviter

1. **Animations Excessives**
   - Pas d'animations sur chaque hover
   - Limiter les animations simultanées
   - Respecter prefers-reduced-motion

2. **Durées Longues**
   - Rien > 600ms pour interactions
   - Exception: Loaders (infinite)

3. **Propriétés Coûteuses**
   - Éviter animer: width, height, margin, padding
   - Préférer: transform, opacity

4. **Animations Sur Scroll**
   - Utiliser `IntersectionObserver`
   - Lazy-load Framer Motion si nécessaire

## Composants à Animer (Roadmap)

### Implémenté ✅
- [x] Button (hover, active states)
- [x] Progress (smooth fill)
- [x] Skeleton (shimmer effect)
- [x] Page entrances (fade-in)
- [x] Theme toggle (rotate sun/moon)

### À Implémenter
- [ ] List items (stagger animation)
- [ ] Dialog open/close (scale + fade)
- [ ] Toast notifications (slide-in)
- [ ] Table rows (fade-in on load)
- [ ] Charts (progressive reveal)
- [ ] Form validation errors (shake)

## Ressources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [CSS Animations Guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)
- [Material Motion Guidelines](https://material.io/design/motion/)
- [Reduced Motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)

## Debugging

### Animation Ne Se Déclenche Pas
```bash
# Vérifier que la classe est appliquée
document.querySelector('.animate-fade-in')

# Vérifier les styles calculés
getComputedStyle(element).animation

# Vérifier les conflits de classes
# (animate-* doit être après d'autres classes)
```

### Performance Lente
```bash
# Chrome DevTools → Performance
# Chercher "Layout" et "Paint" (devrait être minimal)
# Privilégier "Composite" (GPU)
```

### Framer Motion Bundle Size
```bash
# Import sélectif si nécessaire
import { motion } from "framer-motion/dom"
# au lieu de
import { motion } from "framer-motion"
```
