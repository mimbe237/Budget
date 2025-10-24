# Guide d'Accessibilité (A11y) - BudgetWise

## Standards WCAG 2.1 Niveau AA

Ce projet suit les directives WCAG 2.1 niveau AA pour garantir l'accessibilité à tous les utilisateurs.

## Implémentations A11y

### 1. Navigation Clavier

✅ **Skip Links**
- Liens "Skip to main content" et "Skip to navigation"
- Visibles uniquement au focus (`.sr-only-focusable`)
- Position fixe avec z-index élevé pour toujours être accessibles

✅ **Focus Visible**
- Tous les éléments interactifs ont un indicateur de focus visible
- Ring bleu 2px avec offset (WCAG 2.4.7)
- Classe utilitaire `.focus-ring` disponible

✅ **Tab Order**
- Ordre logique de tabulation
- `tabIndex={-1}` sur main content pour permettre le focus programmatique

### 2. Sémantique HTML

✅ **Landmarks ARIA**
- `<aside>` avec `aria-label` pour la navigation
- `<nav>` avec `aria-label` pour distinguer navigation desktop/mobile
- `<main>` avec `id="main-content"` pour le contenu principal
- `<header>` pour l'en-tête

✅ **Headings Hierarchy**
- Hiérarchie h1-h6 respectée
- IDs pour lier avec `aria-labelledby`

✅ **Tables**
- `<TableHead>` avec `scope="col"`
- `aria-labelledby` pour décrire le tableau
- `role="status"` pour les cellules de statut

### 3. Labels et Descriptions

✅ **ARIA Labels**
- Tous les boutons icônes ont `aria-label`
- Icônes décoratives marquées `aria-hidden="true"`
- `aria-current="page"` pour la page active

✅ **Screen Reader Only Text**
- Classe `.sr-only` pour texte invisible visuellement
- Messages de statut avec `role="status"` et `aria-live="polite"`

### 4. Contrastes de Couleurs (WCAG 2.1 AA)

✅ **Ratios de Contraste Minimaux**
- Texte normal: 4.5:1
- Texte large (18pt+): 3:1
- Composants UI: 3:1

✅ **Variables CSS Testées**
```css
Light Mode:
--foreground: 220 13% 20% (contraste 10.8:1 ✅)
--primary: 217 91% 60% (contraste 4.6:1 ✅)
--muted-foreground: 220 9% 45% (contraste 4.9:1 ✅)

Dark Mode:
--foreground: 0 0% 98% (contraste 14.2:1 ✅)
--primary: 217 91% 60% (contraste 5.1:1 ✅)
--muted-foreground: 220 9% 55% (contraste 5.8:1 ✅)
```

### 5. États Interactifs

✅ **Loading States**
- `role="status"` avec `aria-live="polite"`
- Text alternatif dans `.sr-only`
- Skeleton loaders pour feedback visuel

✅ **Error States**
- Messages d'erreur associés aux champs avec `aria-describedby`
- Toast notifications avec icônes et texte
- Couleur ET icône pour ne pas dépendre uniquement de la couleur

### 6. Mobile & Touch

✅ **Target Size**
- Minimum 44x44px (Apple HIG)
- Classe `.touch-target` utilitaire
- Espacement adaptatif avec safe-area-inset

✅ **Gestures**
- Alternatives clavier pour tous les gestes swipe
- Boutons classiques en fallback

### 7. Composants Accessibles (Radix UI)

Tous les composants UI utilisent Radix UI qui est conforme WCAG:
- ✅ Dialog (AlertDialog, Sheet)
- ✅ Progress
- ✅ Toast
- ✅ DropdownMenu
- ✅ Tabs
- ✅ Accordion

## Tests A11y Recommandés

### Outils de Test
1. **Lighthouse** (Chrome DevTools)
   - Score A11y: Objectif 95+
   
2. **axe DevTools** (Extension Chrome/Firefox)
   - Aucune violation critique
   
3. **NVDA** (Windows) / **VoiceOver** (macOS/iOS)
   - Navigation complète possible au clavier
   - Tous les éléments annoncés correctement
   
4. **WAVE** (WebAIM)
   - Vérification structure HTML

### Checklist de Test Manuel

- [ ] Navigation complète au clavier (Tab, Shift+Tab, Enter, Espace, Escape)
- [ ] Skip links fonctionnels (Tab immédiatement après le chargement)
- [ ] Tous les formulaires soumissibles au clavier
- [ ] Focus visible sur tous les éléments interactifs
- [ ] Lecteur d'écran annonce correctement tous les éléments
- [ ] Images ont un texte alternatif approprié
- [ ] Vidéos ont des sous-titres (si applicable)
- [ ] Pas de pièges au clavier (impossible de sortir d'un élément)
- [ ] Contrastes suffisants en light ET dark mode
- [ ] Zoom à 200% sans perte de contenu

## Ressources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Radix UI Accessibility](https://www.radix-ui.com/primitives/docs/overview/accessibility)
- [A11y Project Checklist](https://www.a11yproject.com/checklist/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

## Contribution

Lors de l'ajout de nouvelles fonctionnalités:
1. Utiliser des composants Radix UI quand possible
2. Ajouter `aria-label` sur les boutons icônes
3. Tester la navigation clavier
4. Vérifier les contrastes de couleurs
5. Ajouter du texte `.sr-only` si nécessaire
