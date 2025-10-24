# Pagination des Transactions

## Vue d'ensemble

Le système de pagination permet de gérer efficacement de grandes listes de transactions en divisant les données en pages navigables. Cette implémentation est optimisée pour :
- ✅ **Grandes listes** (1000+ transactions)
- ✅ **Performance optimale** (pagination côté client)
- ✅ **UX moderne** (ellipsis, navigation rapide)
- ✅ **Responsive** (adapté mobile/desktop)
- ✅ **Accessibilité** (ARIA labels, navigation au clavier)

## Architecture

### Composant Pagination

**Fichier:** `/src/components/ui/pagination.tsx`

**Props:**
```typescript
interface PaginationProps {
  currentPage: number;        // Page actuelle (1-indexed)
  totalPages: number;          // Nombre total de pages
  onPageChange: (page: number) => void;  // Callback de changement de page
  showFirstLast?: boolean;     // Afficher boutons première/dernière page (défaut: true)
  maxVisiblePages?: number;    // Nombre max de boutons visibles (défaut: 7)
}
```

**Fonctionnalités:**
- 🎯 Navigation par pages numérotées
- ⏭️ Boutons Précédent/Suivant
- ⏮️ Boutons Première/Dernière page
- ⋯ Ellipsis pour grandes listes (ex: 1 ... 5 6 7 ... 100)
- 📱 Affichage responsive (numéros cachés sur mobile)
- ♿ Accessible (ARIA labels, navigation clavier)
- 🎨 Design cohérent avec shadcn/ui

### Logique de Pagination

**Fichier:** `/src/app/transactions/page.tsx`

```typescript
// Configuration
const [pageExpense, setPageExpense] = useState(1);
const [pageIncome, setPageIncome] = useState(1);
const rowsPerPage = 10;

// Filtrage des données
const filteredExpenses = transactions
  .filter(t => t.type === 'expense')
  .filter(t => t.description.toLowerCase().includes(search.toLowerCase()));

// Calcul du nombre de pages
const totalExpensePages = Math.ceil(filteredExpenses.length / rowsPerPage);

// Extraction des données pour la page courante
const paginatedExpenses = filteredExpenses
  .slice((pageExpense - 1) * rowsPerPage, pageExpense * rowsPerPage);

// Reset de la page lors d'une recherche
useEffect(() => {
  setPageExpense(1);
  setPageIncome(1);
}, [search]);
```

## Utilisation

### Implémentation de base

```typescript
import { Pagination } from '@/components/ui/pagination';
import { useState } from 'react';

function MyList() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const allItems = [...]; // Vos données
  
  // Calculer le nombre total de pages
  const totalPages = Math.ceil(allItems.length / itemsPerPage);
  
  // Extraire les items pour la page courante
  const paginatedItems = allItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  return (
    <>
      {/* Afficher les items paginés */}
      {paginatedItems.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
      
      {/* Contrôles de pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  );
}
```

### Avec recherche et filtrage

```typescript
function FilterableList() {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const allItems = [...];
  
  // Filtrer les données
  const filteredItems = allItems.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );
  
  // Reset page on search change
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);
  
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  
  return (
    <>
      <Input
        placeholder="Rechercher..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      
      {paginatedItems.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </>
  );
}
```

### Personnalisation

```typescript
// Sans boutons première/dernière page
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  showFirstLast={false}
/>

// Moins de pages visibles (pour mobile)
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
  maxVisiblePages={5}
/>
```

## Comportement de l'Ellipsis

### Cas 1: Peu de pages (≤7)
```
[1] [2] [3] [4] [5] [6] [7]
```
Toutes les pages affichées, pas d'ellipsis.

### Cas 2: Page courante au début
```
[1] [2] [3] ... [50]
```
Ellipsis à droite uniquement.

### Cas 3: Page courante au milieu
```
[1] ... [24] [25] [26] ... [50]
```
Ellipsis des deux côtés.

### Cas 4: Page courante à la fin
```
[1] ... [48] [49] [50]
```
Ellipsis à gauche uniquement.

## Performance

### Optimisations implémentées

✅ **Pagination côté client:**
- Toutes les données chargées une fois
- Slicing rapide en JavaScript
- Pas de requêtes réseau supplémentaires

✅ **Mémoization:**
- `useMemoFirebase` pour éviter recréer les queries
- Filtrage uniquement au changement de données

✅ **Reset intelligent:**
- Page reset uniquement lors du changement de recherche
- Conservation de la page lors du changement de tri

### Comparaison avec pagination serveur

| Critère | Client-side | Server-side |
|---------|-------------|-------------|
| **Données initiales** | Toutes | Première page |
| **Navigation** | Instantanée | Requête réseau |
| **Recherche** | Immédiate | Requête réseau |
| **Performance** | Excellente (<10k items) | Toujours rapide |
| **Complexité** | Simple | Requiert cursors |

**Recommandation:**
- **<5000 transactions:** Client-side (actuel) ✅
- **>5000 transactions:** Envisager server-side

## Migration vers Pagination Serveur

Si nécessaire (>5000 transactions), voici comment implémenter:

### 1. Cursor-based Pagination (Firestore)

```typescript
import { query, limit, startAfter, getDocs } from 'firebase/firestore';

async function fetchTransactionsPage(lastDoc?: any) {
  let q = query(
    collection(firestore, `users/${userId}/expenses`),
    orderBy('date', 'desc'),
    limit(20)
  );
  
  if (lastDoc) {
    q = query(q, startAfter(lastDoc));
  }
  
  const snapshot = await getDocs(q);
  const transactions = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  const lastVisible = snapshot.docs[snapshot.docs.length - 1];
  
  return { transactions, lastVisible };
}
```

### 2. Hook personnalisé

```typescript
function usePaginatedTransactions(userId: string, pageSize = 20) {
  const [pages, setPages] = useState<any[][]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [cursors, setCursors] = useState<any[]>([]);
  
  const fetchNextPage = async () => {
    const lastCursor = cursors[currentPage];
    const { transactions, lastVisible } = await fetchTransactionsPage(lastCursor);
    
    setPages(prev => [...prev, transactions]);
    setCursors(prev => [...prev, lastVisible]);
    setCurrentPage(prev => prev + 1);
  };
  
  const goToPage = (page: number) => {
    if (page < pages.length) {
      setCurrentPage(page);
    } else {
      fetchNextPage();
    }
  };
  
  return {
    transactions: pages[currentPage] || [],
    currentPage,
    goToPage,
    hasNextPage: true // Déterminer via count ou watermark
  };
}
```

## Accessibilité

### ARIA Labels

```typescript
// Boutons de navigation
aria-label="Première page"
aria-label="Page précédente"
aria-label="Page suivante"
aria-label="Dernière page"
aria-label="Page 5"

// Page courante
aria-current="page"

// Container
<nav aria-label="Pagination">
```

### Navigation au clavier

- **Tab:** Focus sur les boutons
- **Enter/Space:** Activer le bouton focalisé
- **Flèches:** Navigation entre boutons (native)

### Tests d'accessibilité

```bash
# Lighthouse
npm run lighthouse

# Axe DevTools
npm install -D @axe-core/react
```

## Exemples Avancés

### Pagination avec tri

```typescript
function SortableList() {
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  
  const sortedItems = [...items].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
  });
  
  // Garder la page courante lors du tri
  // (ne pas reset comme pour la recherche)
  
  const totalPages = Math.ceil(sortedItems.length / itemsPerPage);
  const paginatedItems = sortedItems.slice(...);
  
  return (
    <>
      <SortControls
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(by, order) => {
          setSortBy(by);
          setSortOrder(order);
        }}
      />
      
      {/* Liste + Pagination */}
    </>
  );
}
```

### Pagination avec sélection

```typescript
function SelectableList() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  
  const selectAll = () => {
    // Sélectionner toutes les pages ou juste la page courante ?
    const ids = new Set(paginatedItems.map(item => item.id));
    setSelectedIds(ids);
  };
  
  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Checkbox
          checked={selectedIds.size === paginatedItems.length}
          onCheckedChange={selectAll}
        />
        <span>{selectedIds.size} sélectionnés</span>
      </div>
      
      {paginatedItems.map(item => (
        <div key={item.id}>
          <Checkbox
            checked={selectedIds.has(item.id)}
            onCheckedChange={() => {
              const newSet = new Set(selectedIds);
              if (newSet.has(item.id)) {
                newSet.delete(item.id);
              } else {
                newSet.add(item.id);
              }
              setSelectedIds(newSet);
            }}
          />
          {item.name}
        </div>
      ))}
      
      <Pagination {...} />
    </>
  );
}
```

### Pagination avec URL sync

```typescript
import { useSearchParams, useRouter } from 'next/navigation';

function URLSyncedPagination() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const currentPage = parseInt(searchParams.get('page') || '1');
  
  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };
  
  return (
    <Pagination
      currentPage={currentPage}
      totalPages={totalPages}
      onPageChange={handlePageChange}
    />
  );
}
```

## Styling

### Personnalisation des couleurs

```typescript
// Dans tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        'pagination-active': 'hsl(var(--primary))',
        'pagination-hover': 'hsl(var(--accent))',
      }
    }
  }
}

// Utilisation dans pagination.tsx
<Button
  className="hover:bg-pagination-hover"
  variant={page === currentPage ? 'default' : 'outline'}
  // ...
/>
```

### Variantes de taille

```typescript
interface PaginationProps {
  // ... autres props
  size?: 'sm' | 'md' | 'lg';
}

export const Pagination: React.FC<PaginationProps> = ({
  size = 'md',
  // ...
}) => {
  const buttonSize = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  }[size];
  
  return (
    <Button className={buttonSize} />
  );
};
```

## Tests

### Test unitaire (Jest/Vitest)

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from './pagination';

describe('Pagination', () => {
  it('should call onPageChange when clicking next', () => {
    const handlePageChange = jest.fn();
    
    render(
      <Pagination
        currentPage={1}
        totalPages={10}
        onPageChange={handlePageChange}
      />
    );
    
    fireEvent.click(screen.getByLabelText('Page suivante'));
    expect(handlePageChange).toHaveBeenCalledWith(2);
  });
  
  it('should disable previous button on first page', () => {
    render(
      <Pagination
        currentPage={1}
        totalPages={10}
        onPageChange={jest.fn()}
      />
    );
    
    expect(screen.getByLabelText('Page précédente')).toBeDisabled();
  });
  
  it('should show ellipsis for large page count', () => {
    render(
      <Pagination
        currentPage={50}
        totalPages={100}
        onPageChange={jest.fn()}
      />
    );
    
    expect(screen.getAllByTestId('ellipsis')).toHaveLength(2);
  });
});
```

### Test E2E (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test('pagination navigation', async ({ page }) => {
  await page.goto('/transactions');
  
  // Vérifier la page initiale
  await expect(page.locator('text=Page 1 sur')).toBeVisible();
  
  // Cliquer sur page suivante
  await page.click('button[aria-label="Page suivante"]');
  
  // Vérifier le changement
  await expect(page.locator('text=Page 2 sur')).toBeVisible();
  
  // Vérifier le contenu changé
  const firstRow = page.locator('table tbody tr').first();
  await expect(firstRow).toBeVisible();
});
```

## Bonnes Pratiques

### ✅ À faire

1. **Reset page lors de la recherche:**
   ```typescript
   useEffect(() => {
     setCurrentPage(1);
   }, [search]);
   ```

2. **Afficher le nombre total:**
   ```typescript
   <div>Page {current} sur {total}</div>
   ```

3. **Désactiver les boutons appropriés:**
   ```typescript
   disabled={currentPage === 1}
   disabled={currentPage === totalPages}
   ```

4. **Gérer le cas 0 résultat:**
   ```typescript
   if (totalPages === 0) return <div>Aucun résultat</div>;
   ```

5. **Limiter les pages visibles sur mobile:**
   ```typescript
   <div className="hidden sm:flex">
     {/* Page numbers */}
   </div>
   ```

### ❌ À éviter

1. **Ne pas valider la page:**
   ```typescript
   // Mauvais
   onPageChange(page);
   
   // Bon
   onPageChange(Math.max(1, Math.min(page, totalPages)));
   ```

2. **Oublier le loading state:**
   ```typescript
   {isLoading ? <Skeleton /> : <Pagination />}
   ```

3. **Charger toutes les pages d'un coup:**
   ```typescript
   // Pour grandes listes (>5000), utiliser lazy loading
   ```

## Métriques

### Performance cible

- **Temps de rendu:** <100ms
- **Temps de navigation:** <50ms (client-side)
- **Taille bundle:** ~2KB (component + icons)
- **Nombre max items:** 10,000 (client-side)

### Monitoring

```typescript
// Mesurer le temps de pagination
const startTime = performance.now();
onPageChange(newPage);
const endTime = performance.now();

console.log(`Pagination took ${endTime - startTime}ms`);
```

## Résumé

✅ **Implémenté:**
- Composant Pagination moderne avec ellipsis
- Intégration dans page transactions (dépenses + revenus)
- Support recherche avec reset automatique
- Navigation rapide (première/dernière page)
- Design responsive et accessible
- Documentation complète

🎯 **Avantages:**
- Performance optimale pour <5000 transactions
- UX fluide (pas de rechargement)
- Code maintenable et réutilisable
- Prêt pour l'évolution (server-side si nécessaire)

📈 **Évolutions possibles:**
- Pagination serveur (Firestore cursors)
- Infinite scroll en alternative
- Sélection multi-pages
- Export de pages spécifiques
- Tri persistant dans URL
