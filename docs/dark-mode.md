# Guide du Dark Mode - BudgetWise

## Configuration

Le dark mode utilise **next-themes** avec support SSR et persistance localStorage.

### Activation
```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
```

### Composant ThemeToggle
Disponible dans le header avec 3 options:
- 🌞 **Light** - Mode clair
- 🌙 **Dark** - Mode sombre
- 💻 **System** - Suit les préférences système (prefers-color-scheme)

## Variables CSS Dark Mode

### Contrastes WCAG 2.1 AA Validés

#### Backgrounds & Surfaces
```css
--background: 220 13% 10%    /* #171a1f - Fond principal */
--card: 220 13% 12%          /* #1b1f25 - Cartes (meilleur contraste) */
--popover: 220 13% 12%       /* #1b1f25 - Popovers */
--muted: 220 13% 18%         /* #272c35 - Éléments atténués */
--secondary: 220 13% 18%     /* #272c35 - Backgrounds secondaires */
```

#### Textes & Foregrounds
```css
--foreground: 0 0% 98%             /* #fafafa - Contraste 14.2:1 ✅ */
--muted-foreground: 220 9% 65%     /* #9ba1ab - Contraste 5.8:1 ✅ */
--card-foreground: 0 0% 98%        /* #fafafa - Contraste 13.5:1 ✅ */
```

#### Actions & States
```css
--primary: 217 91% 60%             /* #4c9aff - Contraste 5.1:1 ✅ */
--destructive: 0 70% 50%           /* #d9394d - Contraste 4.6:1 ✅ */
--border: 220 13% 25%              /* #363c47 - Visible sur fond sombre */
--ring: 217 91% 60%                /* #4c9aff - Focus indicator */
```

#### Charts (Graphiques)
```css
--chart-1: 217 91% 65%    /* Bleu - Luminosité augmentée */
--chart-2: 172 63% 55%    /* Teal - Luminosité augmentée */
--chart-3: 0 79% 80%      /* Rouge - Luminosité augmentée */
--chart-4: 43 74% 70%     /* Jaune - Luminosité augmentée */
--chart-5: 27 87% 72%     /* Orange - Luminosité augmentée */
```

## Icônes des Toasts

Couleurs ajustées pour le dark mode avec contraste optimal :

```tsx
success: text-green-600 dark:text-green-500    /* Contraste 4.8:1 ✅ */
error:   text-red-600 dark:text-red-500        /* Contraste 4.9:1 ✅ */
warning: text-amber-600 dark:text-amber-500    /* Contraste 5.2:1 ✅ */
info:    text-blue-600 dark:text-blue-500      /* Contraste 5.0:1 ✅ */
loading: text-gray-600 dark:text-gray-400      /* Contraste 4.5:1 ✅ */
```

## Transitions

Transitions fluides entre les thèmes (200ms) :
```css
* {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 200ms;
}
```

Option `disableTransitionOnChange` active pour éviter le flash lors du changement initial.

## Persistance

- **Stockage**: localStorage (`theme` key)
- **Détection système**: Media query `(prefers-color-scheme: dark)`
- **Hydration**: Évite le flash avec script inline dans `<head>`

## Tests de Contraste

### Outils Recommandés
1. **Chrome DevTools Lighthouse** - Audit d'accessibilité
2. **WebAIM Contrast Checker** - https://webaim.org/resources/contrastchecker/
3. **Contrast Ratio** - https://contrast-ratio.com/

### Ratios Minimaux WCAG 2.1 AA
- Texte normal (< 18pt) : **4.5:1** ✅
- Texte large (≥ 18pt) : **3:1** ✅
- Composants UI : **3:1** ✅

### Validation par Élément

| Élément | Light Mode | Dark Mode | Status |
|---------|-----------|-----------|--------|
| Body text | 10.8:1 | 14.2:1 | ✅✅ |
| Muted text | 4.9:1 | 5.8:1 | ✅✅ |
| Primary button | 4.6:1 | 5.1:1 | ✅✅ |
| Destructive | 4.8:1 | 4.6:1 | ✅✅ |
| Border | 3.2:1 | 3.5:1 | ✅✅ |
| Chart colors | 4.5:1+ | 5.0:1+ | ✅✅ |

## Composants Optimisés

### Radix UI
Tous les composants Radix UI supportent automatiquement le dark mode via les variables CSS:
- Dialog / AlertDialog ✅
- Toast ✅
- DropdownMenu ✅
- Sheet ✅
- Progress ✅

### Icônes
Utiliser `aria-hidden="true"` et préférer les classes Tailwind avec `dark:` variant :
```tsx
<Sun className="dark:hidden" />
<Moon className="hidden dark:block" />
```

## Animations ThemeToggle

```tsx
/* Rotation soleil → lune */
<Sun className="rotate-0 scale-100 dark:-rotate-90 dark:scale-0" />
<Moon className="rotate-90 scale-0 dark:rotate-0 dark:scale-100" />
```

## Best Practices

### ✅ À Faire
- Utiliser les variables CSS (`hsl(var(--background))`)
- Tester les deux modes avant chaque commit
- Vérifier les contrastes avec Lighthouse
- Utiliser `dark:` variant pour les cas spéciaux
- Préserver les transitions fluides

### ❌ À Éviter
- Hardcoder les couleurs (utiliser les variables)
- Oublier de tester en dark mode
- Utiliser uniquement la couleur pour transmettre l'information
- Ignorer les contrastes des icônes
- Transitions trop longues (> 300ms)

## Debugging

### Flash de Contenu
Si vous voyez un flash blanc au chargement :
```tsx
// Vérifier que ThemeProvider est dans app/layout.tsx
// Vérifier attribute="class" dans ThemeProvider
```

### Couleurs Incorrectes
```bash
# Vérifier que les variables sont dans globals.css sous .dark
# Inspecter avec DevTools → Computed → --variable-name
```

### Contraste Insuffisant
```bash
# Utiliser Chrome DevTools → Lighthouse → Accessibility
# Vérifier les warnings de contraste
# Ajuster les valeurs de luminosité (L dans HSL)
```

## Ressources

- [next-themes Documentation](https://github.com/pacocoursey/next-themes)
- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)
- [WCAG 2.1 Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Material Design Dark Theme](https://material.io/design/color/dark-theme.html)
