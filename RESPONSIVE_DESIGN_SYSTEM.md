# 🎯 Système de Responsive Design - Budget Pro

## 📐 Breakpoints Tailwind (Mobile-First)

```typescript
// tailwind.config.ts
screens: {
  'xs': '360px',      // Très petits mobiles (iPhone SE, Galaxy S8)
  'sm': '480px',      // Mobiles standards et grands mobiles
  'md': '768px',      // Tablettes portrait
  'lg': '1024px',     // Tablettes paysage / petits laptops
  'xl': '1280px',     // Laptops standards
  '2xl': '1536px',    // Desktop Full HD
  '3xl': '1920px',    // Moniteurs larges
  '4xl': '2560px',    // Ultra-wide
  'laptop': '1366px', // Breakpoint custom pour laptop 1366px (référence importante)
}
```

## 🎨 Philosophie Mobile-First

Les styles de base sont conçus pour mobile (< 360px), puis étendus progressivement :

```tsx
// ❌ MAUVAIS (Desktop-first)
<div className="w-1/2 md:w-full">

// ✅ BON (Mobile-first)
<div className="w-full md:w-1/2">
```

## 📱 Comportement par Taille d'Écran

### 1. Très Petits Mobiles (320-360px)
- ✅ **Layout** : Colonne unique, sidebar masquée
- ✅ **Navigation** : Menu burger + BottomNav
- ✅ **Typography** : Base (14-16px) avec contraste élevé
- ✅ **Spacing** : Minimal (px-3, gap-3)
- ✅ **Touch Targets** : Minimum 48x48px (Material Design 3)
- ✅ **Tables** : Scroll horizontal avec colonnes sticky

**Classes Tailwind** :
```tsx
<div className="px-3 gap-3 text-sm">
```

### 2. Mobiles Standards (375-414px) → `xs:` (≥360px)
- ✅ **Grilles** : 1-2 colonnes selon le contenu
- ✅ **Cards** : 2 colonnes pour KPI cards
- ✅ **Typography** : Légèrement plus grande
- ✅ **Spacing** : Plus généreux

**Classes Tailwind** :
```tsx
<div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
```

### 3. Grands Mobiles / Phablets (430-480px) → `sm:` (≥480px)
- ✅ **Spacing** : Padding augmenté (px-4)
- ✅ **Typography** : Base confortable
- ✅ **Headers** : Hauteur 64px (vs 56px sur mobile)

**Classes Tailwind** :
```tsx
<header className="min-h-[56px] sm:min-h-[64px] px-3 sm:px-4">
```

### 4. Tablettes Portrait (600-768px) → `md:` (≥768px)
- ✅ **Grilles** : 2 colonnes confortables
- ✅ **Sidebar** : Toujours masquée (menu burger)
- ✅ **Typography** : Augmentée (text-base → text-lg)
- ✅ **Spacing** : Padding large (px-6)

**Classes Tailwind** :
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 md:px-6">
```

### 5. Tablettes Paysage / Petits Laptops (768-1024px) → `lg:` (≥1024px)
- ✅ **Sidebar** : Apparition fixe (260px)
- ✅ **Grilles** : 3 colonnes pour dashboards
- ✅ **Layout** : Grid `[260px_1fr]`
- ✅ **BottomNav** : Masquée (navigation sidebar)
- ✅ **Headers** : Hauteur 72px

**Classes Tailwind** :
```tsx
<aside className="hidden lg:fixed lg:inset-y-0 lg:w-[260px]">
<div className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

### 6. Laptops Standards (1024-1280px) → `xl:` (≥1280px)
- ✅ **Grilles** : 4 colonnes pour filtres
- ✅ **Charts** : 2 colonnes (chart + sidebar)
- ✅ **Max-width** : 1200px centré
- ✅ **Typography** : Confortable

**Classes Tailwind** :
```tsx
<div className="grid xl:grid-cols-[2fr_1fr]">
<div className="max-w-6xl mx-auto">
```

### 7. Laptop 1366px (Référence Importante) → `laptop:` (≥1366px)
- ✅ **Sidebar** : Élargie à 280px
- ✅ **Spacing** : Padding généreux (px-10)
- ✅ **Typography** : Optimale pour lisibilité

**Classes Tailwind** :
```tsx
<aside className="lg:w-[260px] laptop:w-[280px]">
<main className="lg:px-8 laptop:px-10">
```

### 8. Desktop Full HD (1440-1920px) → `2xl:` (≥1536px)
- ✅ **Max-width** : 1440px centré
- ✅ **Grilles** : 4 colonnes avec gap large
- ✅ **Typography** : Augmentée progressivement

**Classes Tailwind** :
```tsx
<div className="max-w-7xl 2xl:max-w-8xl mx-auto">
```

### 9. Moniteurs Larges (1920-2560px) → `3xl:` (≥1920px)
- ✅ **Sidebar** : 300px pour utiliser l'espace
- ✅ **Max-width** : 1600-1800px centré
- ✅ **Grilles** : 5-6 colonnes possibles
- ✅ **Spacing** : Maximum pour aération

**Classes Tailwind** :
```tsx
<aside className="3xl:w-[300px]">
<div className="3xl:max-w-[1800px]">
```

### 10. Ultra-Wide / 4K (≥2560px) → `4xl:` (≥2560px)
- ✅ **Max-width** : 1920px centré (éviter lignes trop longues)
- ✅ **Grilles** : Dense mais espacée
- ✅ **Typography** : Maximale avec line-height augmenté

**Classes Tailwind** :
```tsx
<div className="4xl:max-w-[1920px]">
```

## 🧱 Classes Utilitaires Custom

### Containers Responsive
```css
/* globals.css - Déjà implémenté */
.container-responsive {
  width: 100%;
  margin: 0 auto;
  /* Max-width adaptatif selon breakpoint */
}
```

### Grilles Adaptatives
```css
/* 1→2 colonnes */
.grid-responsive-1-2 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}
@media (min-width: 768px) {
  .grid-responsive-1-2 {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 1→2→3 colonnes */
.grid-responsive-1-3 {
  grid-template-columns: 1fr;
}
@media (min-width: 768px) {
  .grid-responsive-1-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (min-width: 1024px) {
  .grid-responsive-1-3 {
    grid-template-columns: repeat(3, 1fr);
  }
}

/* 1→2→3→4 colonnes */
.grid-responsive-1-4 {
  /* Mobile → Tablet → Desktop → Large Desktop */
}
```

### Typography Responsive
```css
/* Text sizes adaptatifs */
.text-responsive-xs   /* 0.75rem → 0.8125rem */
.text-responsive-sm   /* 0.875rem → 0.9375rem */
.text-responsive-base /* 0.9375rem → 1rem */
.text-responsive-lg   /* 1.125rem → 1.25rem */
.text-responsive-xl   /* 1.25rem → 1.5rem → 1.75rem */
.text-responsive-2xl  /* 1.5rem → 1.875rem → 2.25rem */
```

## 📋 Exemples Pratiques

### Layout Principal (dashboard-client.tsx)
```tsx
<div className="lg:grid lg:grid-cols-[260px_1fr] laptop:grid-cols-[280px_1fr] 3xl:grid-cols-[300px_1fr]">
  {/* Sidebar - fixe sur desktop, masquée sur mobile */}
  <aside className="hidden lg:fixed lg:w-[260px] laptop:w-[280px] 3xl:w-[300px]">
    {/* Navigation avec scroll interne */}
    <nav className="text-sm lg:text-base">
      <Link className="px-3 lg:px-4 py-2.5 lg:py-3">
        <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
        <span className="truncate">Label</span>
      </Link>
    </nav>
  </aside>

  {/* Spacer pour compenser sidebar fixe */}
  <div className="hidden lg:block lg:w-[260px] laptop:w-[280px] 3xl:w-[300px]" />

  {/* Main content */}
  <main className="px-3 sm:px-4 md:px-6 lg:px-8 laptop:px-10 xl:px-12">
    <div className="max-w-full lg:max-w-6xl laptop:max-w-7xl 3xl:max-w-[1800px] mx-auto">
      {children}
    </div>
  </main>
</div>
```

### Header Responsive
```tsx
<header className="sticky top-0 min-h-[56px] sm:min-h-[64px] laptop:min-h-[72px] px-3 sm:px-4 lg:px-8">
  <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
    {/* Menu burger - mobile uniquement */}
    <Button className="lg:hidden">
      <Menu />
    </Button>

    {/* Spacer */}
    <div className="flex-1" />

    {/* Actions - visibilité progressive */}
    <div className="hidden md:block">
      <ThemeToggle />
    </div>
    <Button className="hidden lg:flex text-xs laptop:text-sm">
      <span className="hidden laptop:inline">Déconnexion</span>
    </Button>
    <UserNav />
  </div>
</header>
```

### Grilles de Cards (Dashboard)
```tsx
{/* KPI Cards - 1 → 2 → 3 colonnes */}
<div className="grid gap-3 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 laptop:gap-4 xl:gap-5">
  <Card className="rounded-xl lg:rounded-2xl">
    <CardHeader className="p-4 lg:p-6">
      <CardTitle className="text-sm sm:text-base lg:text-lg truncate">
        Titre
      </CardTitle>
      <div className="p-1.5 lg:p-2">
        <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
      </div>
    </CardHeader>
    <CardContent className="p-4 lg:p-6">
      <div className="text-xl sm:text-2xl lg:text-3xl laptop:text-4xl font-bold">
        Montant
      </div>
    </CardContent>
  </Card>
</div>

{/* Charts & Insights - Stack → 2 cols */}
<div className="grid gap-3 sm:gap-4 xl:grid-cols-[2fr_1fr]">
  <div className="overflow-hidden">
    <Chart />
  </div>
  <div className="space-y-3 sm:space-y-4">
    <Alerts />
  </div>
</div>
```

### Tables Responsives
```tsx
<div className="overflow-x-auto -mx-px">
  <Table className="min-w-[800px]">
    <TableHeader>
      <TableRow>
        {/* Sticky checkbox sur mobile */}
        <TableHead className="w-[40px] sticky left-0 bg-background z-10">
          <Checkbox />
        </TableHead>
        <TableHead>Date</TableHead>
        <TableHead className="hidden md:table-cell">Catégorie</TableHead>
        <TableHead className="text-right">Montant</TableHead>
      </TableRow>
    </TableHeader>
  </Table>
</div>
```

### Formulaires de Filtres
```tsx
{/* 1 → 2 → 4 colonnes */}
<CardContent className="grid gap-2 sm:gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 p-4 sm:p-6">
  <Input className="h-9 sm:h-10 text-sm" />
  <Select>...</Select>
  <Select>...</Select>
  <Select>...</Select>
</CardContent>
```

## 🎯 Checklist de Validation Responsive

### Mobile (< 640px)
- [ ] Menu burger accessible et fonctionnel
- [ ] BottomNav visible et sticky
- [ ] Touch targets ≥ 48x48px
- [ ] Texte lisible (≥ 14px)
- [ ] Formulaires à 1 colonne
- [ ] Tables scrollables horizontalement
- [ ] Images optimisées (lazy loading)
- [ ] Safe areas iOS/Android respectées

### Tablet (640-1024px)
- [ ] Grilles 2 colonnes confortables
- [ ] Spacing augmenté
- [ ] Typography plus grande
- [ ] Menu burger toujours présent
- [ ] Cards bien espacées

### Desktop (≥1024px)
- [ ] Sidebar fixe visible
- [ ] Grilles 3-4 colonnes
- [ ] Max-width centré (éviter vide)
- [ ] Hover states fonctionnels
- [ ] Scrollbar personnalisée
- [ ] BottomNav masquée

### Ultra-Wide (≥1920px)
- [ ] Contenu centré avec max-width
- [ ] Pas de lignes de texte > 80 caractères
- [ ] Grilles denses mais aérées
- [ ] Sidebar élargie (300px)
- [ ] Typography optimale

## 🔧 Outils de Debug

### Chrome DevTools Responsive
```
Cmd/Ctrl + Shift + M → Mode responsive
Presets: iPhone SE, iPad, Desktop HD
```

### Breakpoints CSS Debug
```css
/* Ajouter temporairement pour debug */
body::before {
  content: "xs";
  position: fixed;
  top: 0;
  right: 0;
  background: red;
  color: white;
  padding: 4px 8px;
  z-index: 9999;
}

@media (min-width: 480px) {
  body::before { content: "sm"; background: orange; }
}
@media (min-width: 768px) {
  body::before { content: "md"; background: yellow; color: black; }
}
@media (min-width: 1024px) {
  body::before { content: "lg"; background: green; }
}
@media (min-width: 1366px) {
  body::before { content: "laptop"; background: blue; }
}
@media (min-width: 1536px) {
  body::before { content: "2xl"; background: indigo; }
}
@media (min-width: 1920px) {
  body::before { content: "3xl"; background: purple; }
}
```

## 📚 Ressources

- **Tailwind Docs** : https://tailwindcss.com/docs/responsive-design
- **Material Design 3** : https://m3.material.io/foundations/layout/understanding-layout/spacing
- **Responsive Testing** : https://responsively.app/

---

**Dernière mise à jour** : 16 novembre 2025  
**Version** : 1.0.0  
**Auteur** : Budget Pro Team
