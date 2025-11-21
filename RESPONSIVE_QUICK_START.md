# 🎨 Guide d'Application Rapide - Responsive Design

## 📋 Quick Start Guide

Ce guide vous montre **exactement quelles classes Tailwind utiliser** pour chaque situation courante dans le projet Budget Pro.

---

## 🏗️ 1. STRUCTURE DE PAGE STANDARD

### Layout Principal avec AppLayout

```tsx
import { AppLayout } from '@/components/dashboard/dashboard-client';

export default function MaPage() {
  return (
    <AppLayout>
      {/* Le contenu ici hérite automatiquement du système responsive */}
      <div className="flex flex-col gap-4 sm:gap-5 lg:gap-6">
        {/* Vos composants */}
      </div>
    </AppLayout>
  );
}
```

**✅ Ce que vous obtenez automatiquement :**
- Sidebar fixe sur desktop (≥1024px)
- Menu burger sur mobile (< 1024px)
- BottomNav sur mobile (< 1024px)
- Header sticky responsive
- Padding et spacing adaptatifs

---

## 📄 2. HEADER DE PAGE

```tsx
<div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6">
  {/* Titre et description */}
  <div className="space-y-1 sm:space-y-1.5">
    <h1 className="text-xl sm:text-2xl lg:text-3xl laptop:text-4xl font-semibold tracking-tight text-slate-900">
      Titre de la Page
    </h1>
    <p className="text-xs sm:text-sm lg:text-base text-muted-foreground max-w-2xl">
      Description courte et claire
    </p>
  </div>

  {/* Actions */}
  <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
    <button className="h-9 px-3 text-sm">Action 1</button>
    <button className="h-9 px-3 text-sm">Action 2</button>
  </div>
</div>
```

**📱 Résultat :**
- Mobile : Stack vertical, titre compact
- Tablet : Titre plus grand
- Desktop : Flex row avec actions à droite

---

## 📊 3. GRILLES DE CARDS (KPI, METRICS)

### 3 Colonnes Max (Dashboard, Reports)

```tsx
<div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 laptop:gap-5">
  {cards.map((card) => (
    <Card key={card.id} className="rounded-xl lg:rounded-2xl">
      <CardHeader className="p-4 lg:p-6 pb-2 lg:pb-3">
        <CardTitle className="text-sm sm:text-base lg:text-lg truncate">
          {card.title}
        </CardTitle>
        <div className="p-1.5 lg:p-2">
          <Icon className="h-4 w-4 lg:h-5 lg:w-5" />
        </div>
      </CardHeader>
      <CardContent className="p-4 lg:p-6 pt-0">
        <div className="text-xl sm:text-2xl lg:text-3xl laptop:text-4xl font-bold">
          {card.value}
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

**📱 Progression :**
- < 360px : 1 colonne
- ≥ 360px : 2 colonnes
- ≥ 1024px : 3 colonnes

### 4 Colonnes Max (Categories, Goals)

```tsx
<div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
  {items.map((item) => (
    <Card key={item.id}>...</Card>
  ))}
</div>
```

**📱 Progression :**
- < 360px : 1 colonne
- ≥ 360px : 2 colonnes
- ≥ 1024px : 3 colonnes
- ≥ 1280px : 4 colonnes

---

## 📋 4. FORMULAIRES DE FILTRES

```tsx
<Card className="rounded-xl lg:rounded-2xl p-4 sm:p-6">
  <h2 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4">
    Filtres
  </h2>

  {/* 1 → 2 → 4 colonnes */}
  <div className="grid gap-2 sm:gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
    <Input 
      placeholder="Rechercher..."
      className="h-9 sm:h-10 text-sm"
    />
    <Select className="h-9 sm:h-10">
      <SelectTrigger>
        <SelectValue placeholder="Type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tous</SelectItem>
      </SelectContent>
    </Select>
    <Select className="h-9 sm:h-10">...</Select>
    <Select className="h-9 sm:h-10">...</Select>
  </div>
</Card>
```

**📱 Progression :**
- < 768px : 1 colonne (stack vertical)
- ≥ 768px : 2 colonnes
- ≥ 1280px : 4 colonnes

---

## 📊 5. LAYOUT CHART + SIDEBAR

```tsx
<div className="grid gap-3 sm:gap-4 lg:gap-5 xl:grid-cols-[2fr_1fr]">
  {/* Chart principal */}
  <Card className="overflow-hidden rounded-xl lg:rounded-2xl">
    <CardHeader className="p-4 sm:p-6">
      <CardTitle className="text-base sm:text-lg">
        Évolution Financière
      </CardTitle>
    </CardHeader>
    <CardContent className="p-4 sm:p-6">
      <ChartComponent />
    </CardContent>
  </Card>

  {/* Sidebar Insights */}
  <div className="space-y-3 sm:space-y-4">
    <Card className="rounded-xl lg:rounded-2xl p-4 sm:p-6">
      <h3 className="text-sm sm:text-base font-semibold mb-3">
        Insights IA
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground">
        Analyse automatique...
      </p>
    </Card>
  </div>
</div>
```

**📱 Comportement :**
- < 1280px : Stack vertical (chart puis sidebar)
- ≥ 1280px : 2 colonnes [2fr + 1fr]

---

## 📋 6. TABLES RESPONSIVES

```tsx
<Card className="rounded-xl lg:rounded-2xl overflow-hidden">
  <CardHeader className="p-4 sm:p-6 border-b">
    <CardTitle className="text-base sm:text-lg">
      Transactions
    </CardTitle>
    <CardDescription className="text-xs sm:text-sm">
      {data.length} résultats
    </CardDescription>
  </CardHeader>

  {/* Scroll horizontal sur mobile */}
  <div className="overflow-x-auto -mx-px">
    <Table className="min-w-[800px]">
      <TableHeader>
        <TableRow>
          {/* Checkbox sticky */}
          <TableHead className="w-12 sticky left-0 bg-background z-10">
            <Checkbox />
          </TableHead>
          <TableHead className="text-xs sm:text-sm">Date</TableHead>
          <TableHead className="text-xs sm:text-sm">Description</TableHead>
          <TableHead className="text-xs sm:text-sm hidden md:table-cell">
            Catégorie
          </TableHead>
          <TableHead className="text-xs sm:text-sm text-right">
            Montant
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((row) => (
          <TableRow key={row.id} className="hover:bg-muted/40">
            <TableCell className="sticky left-0 bg-background z-10">
              <Checkbox />
            </TableCell>
            <TableCell className="text-xs sm:text-sm">
              {row.date}
            </TableCell>
            <TableCell className="text-xs sm:text-sm font-medium">
              {row.description}
            </TableCell>
            <TableCell className="text-xs sm:text-sm hidden md:table-cell">
              <Badge variant="outline">{row.category}</Badge>
            </TableCell>
            <TableCell className="text-xs sm:text-sm text-right font-semibold">
              {row.amount}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>

  {/* Pagination */}
  <div className="p-4 sm:p-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3">
    <p className="text-xs sm:text-sm text-muted-foreground">
      Page 1 sur 5
    </p>
    <div className="flex gap-2">
      <Button variant="outline" size="sm">Précédent</Button>
      <Button variant="outline" size="sm">Suivant</Button>
    </div>
  </div>
</Card>
```

**📱 Comportement :**
- Mobile : Scroll horizontal, checkbox sticky
- Tablet : Plus de colonnes visibles
- Desktop : Table complète sans scroll

---

## 🎯 7. SECTIONS AVEC GRILLES MULTIPLES

### Exemple : Page Debts

```tsx
export default function DebtsPage() {
  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl laptop:text-4xl font-semibold">
            Gestion des Dettes
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
            Vue d'ensemble et suivi de remboursement
          </p>
        </div>
        <Button className="h-9 px-3 text-sm">
          + Nouvelle Dette
        </Button>
      </div>

      {/* KPI Cards - 1 → 2 → 3 colonnes */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 mb-4 sm:mb-6">
        <Card>...</Card>
        <Card>...</Card>
        <Card>...</Card>
      </div>

      {/* Chart + Infos - Stack → 2 cols */}
      <div className="grid gap-3 sm:gap-4 xl:grid-cols-[2fr_1fr] mb-4 sm:mb-6">
        <Card>
          <DebtRepaymentChart />
        </Card>
        <Card>
          <DebtSummary />
        </Card>
      </div>

      {/* Liste des dettes */}
      <Card>
        <DebtsList />
      </Card>
    </AppLayout>
  );
}
```

---

## 🎨 8. CLASSES UTILITAIRES COURANTES

### Spacing Progressif

```tsx
// Padding de card
className="p-4 sm:p-6 lg:p-8"

// Gap entre éléments
className="gap-3 sm:gap-4 lg:gap-5 laptop:gap-6"

// Margin bottom
className="mb-4 sm:mb-6 lg:mb-8"
```

### Typography Responsive

```tsx
// Titres H1
className="text-xl sm:text-2xl lg:text-3xl laptop:text-4xl"

// Titres H2
className="text-lg sm:text-xl lg:text-2xl laptop:text-3xl"

// Titres H3
className="text-base sm:text-lg lg:text-xl"

// Body text
className="text-sm sm:text-base lg:text-lg"

// Small text
className="text-xs sm:text-sm"
```

### Border Radius

```tsx
// Cards
className="rounded-xl lg:rounded-2xl"

// Buttons
className="rounded-lg"

// Inputs
className="rounded-md"
```

### Icons

```tsx
// Petits icons (mobile)
className="h-4 w-4 lg:h-5 lg:w-5"

// Icons moyens
className="h-5 w-5 lg:h-6 lg:w-6"

// Grands icons
className="h-6 w-6 lg:h-8 lg:w-8"
```

---

## 🚀 9. TEMPLATES PRÊTS À L'EMPLOI

### Page Categories

```tsx
export default function CategoriesPage() {
  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl laptop:text-4xl font-semibold">
            Catégories
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
            Organisez vos dépenses par catégorie
          </p>
        </div>
        <Button>+ Nouvelle Catégorie</Button>
      </div>

      {/* Grille 1 → 2 → 4 colonnes */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {categories.map((cat) => (
          <Card key={cat.id} className="rounded-xl lg:rounded-2xl p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-semibold truncate">
                  {cat.name}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {cat.count} transactions
                </p>
              </div>
            </div>
            <Progress value={cat.progress} />
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
```

### Page Goals

```tsx
export default function GoalsPage() {
  return (
    <AppLayout>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between mb-4 sm:mb-6">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl laptop:text-4xl font-semibold">
            Objectifs Financiers
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
            Suivez vos progrès vers vos objectifs
          </p>
        </div>
        <Button>+ Nouvel Objectif</Button>
      </div>

      {/* Chart + Stats */}
      <div className="grid gap-3 sm:gap-4 xl:grid-cols-[2fr_1fr] mb-4 sm:mb-6">
        <Card className="rounded-xl lg:rounded-2xl p-4 sm:p-6">
          <GoalsProgressChart />
        </Card>
        <Card className="rounded-xl lg:rounded-2xl p-4 sm:p-6">
          <GoalsStats />
        </Card>
      </div>

      {/* Liste des objectifs - 1 → 2 → 3 colonnes */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => (
          <Card key={goal.id} className="rounded-xl lg:rounded-2xl p-4 sm:p-6">
            <h3 className="text-sm sm:text-base font-semibold mb-2">
              {goal.name}
            </h3>
            <Progress value={goal.progress} className="mb-2" />
            <div className="flex justify-between text-xs sm:text-sm">
              <span>{goal.current} / {goal.target}</span>
              <span>{goal.progress}%</span>
            </div>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
}
```

---

## ✅ CHECKLIST RAPIDE

Avant de soumettre une nouvelle page/composant :

- [ ] Testé sur mobile 375px
- [ ] Testé sur laptop 1366px (**CRITIQUE**)
- [ ] Testé sur desktop 1920px
- [ ] Pas de scroll horizontal indésirable
- [ ] Texte lisible (≥ 14px sur mobile)
- [ ] Touch targets ≥ 48x48px
- [ ] Spacing progressif appliqué
- [ ] Typography responsive utilisée
- [ ] Cards avec border-radius adaptatif
- [ ] Tables scrollables sur mobile

---

## 🎓 RÈGLES D'OR

1. **Toujours mobile-first** : Commencez par les styles de base (mobile), puis ajoutez les breakpoints
2. **Utilisez les breakpoints standards** : `xs:`, `sm:`, `md:`, `lg:`, `xl:`, `laptop:`, `2xl:`, `3xl:`
3. **Gap progressif** : `gap-3 sm:gap-4 lg:gap-5 laptop:gap-6`
4. **Padding progressif** : `p-4 sm:p-6 lg:p-8`
5. **Typography progressive** : Augmentez la taille de texte avec les breakpoints
6. **Grilles adaptatives** : Commencez à 1 colonne, augmentez progressivement
7. **Max-width pour grands écrans** : Évitez le vide avec `max-w-6xl`, `max-w-7xl`, etc.
8. **Truncate intelligemment** : Utilisez `truncate` sur les labels longs dans les grilles denses

---

**📚 Ressources Complémentaires :**
- `RESPONSIVE_DESIGN_SYSTEM.md` : Documentation complète
- `RESPONSIVE_TESTING_GUIDE.md` : Guide de test
- `src/components/responsive-patterns.tsx` : Composants réutilisables

**Dernière mise à jour** : 16 novembre 2025
