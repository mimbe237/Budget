## Mode offline & performance

L’application fonctionne en mode offline-first grâce à un service worker custom :

- **Pré-cache** : les routes critiques (`/`, `/dashboard`, `/transactions`, `/goals`, `/offline`) sont pré-cachées à l’installation.
- **Cache runtime** : les assets statiques (JS, CSS, images, polices) sont servis en cache-first, les pages en network-first avec fallback offline.
- **Requêtes Firestore** : toujours online pour garantir la fraîcheur des données dynamiques.
- **Page offline** : une page `/offline` s’affiche si l’utilisateur est hors-ligne et qu’aucun cache n’est disponible.
- **Mise à jour** : le service worker gère le skipWaiting et le nettoyage des anciens caches.

### Lazy-loading des images

Les images d’avatar utilisateur utilisent le lazy-loading natif (`loading="lazy"`) pour optimiser le chargement et la performance, notamment sur mobile.

# Budget App (Next.js + Firebase)

Cette application fonctionne uniquement avec Next.js et Firebase (Firestore/Auth). Aucun serveur NestJS n'est requis.

## Démarrage en local

Prérequis: Node.js 18+, npm.

1. Installer les dépendances:
	```bash
	npm install
	```
2. Lancer le serveur de développement Next.js:
	```bash
	npm run dev
	```
3. Ouvrir l'application:
	- http://localhost:9002

## Fonctionnalités clés

- Transactions avec pagination et recherche
- Catégories (dépenses et revenus) stockées dans Firestore
- Initialisation automatique des catégories par défaut à la première utilisation
- Rapports enrichis (KPIs dettes, graphique multi-séries, exports CSV/Excel étendus)
- Gestion complète des dettes (emprunts & prêts) : création, échéanciers, paiements, simulations (voir `docs/DEBTS_MODULE.md`)
- Analyse IA dédiée avec aperçu sur le tableau de bord et page complète `/ai-insights`

## Configuration Firebase

- Variables d'environnement: `.env.local`
- Firestore Rules: `firestore.rules`
- Config Firebase: `firebase.json`, `apphosting.yaml`

## Déploiement

Déploiement via Firebase Hosting / App Hosting:

1. Build de l'app:
	```bash
	npm run build
	```
2. Déploiement avec Firebase CLI:
	```bash
	firebase deploy
	```


## Stratégie de cache et React Query

Depuis octobre 2025, l’application utilise [React Query](https://tanstack.com/query/latest) pour la gestion du cache Firestore côté client :

- **Stale-while-revalidate** : les données sont servies instantanément depuis le cache, puis rafraîchies en arrière-plan.
- **Déduplication** : plusieurs composants utilisant la même requête partagent le cache et évitent les appels Firestore redondants.
- **Prefetch** : le bouton « Charger plus » précharge la page suivante au survol (hover) pour une expérience fluide.
- **Invalidation** : après une mutation (ajout, édition, suppression), le cache React Query est invalidé pour garantir la fraîcheur des données.

### Exemple d’utilisation

```tsx
import { useFirestoreInfiniteQuery } from '@/hooks/use-firestore-infinite-query';
import { useFirestore } from '@/firebase';

const firestore = useFirestore();
const { data, fetchNextPage, hasNextPage, isLoading } = useFirestoreInfiniteQuery(
	firestore,
	`users/${user?.uid}/budgetGoals`,
	{ pageSize: 20, orderByField: 'createdAt', orderDirection: 'desc' }
);

// Pour précharger la page suivante au hover :
import { useQueryClient } from '@tanstack/react-query';
const queryClient = useQueryClient();
const handlePrefetchNextPage = () => {
	if (hasNextPage) {
		queryClient.prefetchInfiniteQuery({
			queryKey: [`users/${user?.uid}/budgetGoals`, 20, 'createdAt', 'desc'],
			initialPageParam: undefined,
		});
	}
};
```

### Migration

L'ancien cache custom (`use-firestore-cache`) a été remplacé par React Query pour une gestion centralisée, performante et fiable du cache Firestore.

## Tests automatisés

L'application utilise **Vitest** pour les tests unitaires et **Playwright** pour les tests end-to-end (e2e).

### Tests unitaires (Vitest)

Les tests unitaires couvrent les helpers et utilitaires (formatage monétaire, etc.) :

```bash
npm test                  # Lance les tests unitaires
npm run test:watch        # Lance les tests en mode watch
```

Exemple de test :

```typescript
// src/lib/__tests__/format.test.ts
import { describe, it, expect } from 'vitest';
import { formatMoneyFromCents } from '../format';

describe('formatMoneyFromCents', () => {
  it('formate correctement les montants en USD', () => {
    expect(formatMoneyFromCents(12345, 'USD', 'en-US')).toBe('$123.45');
  });
});
```

### Tests end-to-end (Playwright)

Les tests e2e valident les flows CRUD critiques (transactions, objectifs) et la navigation :

```bash
npm run test:e2e          # Lance les tests Playwright
npm run test:e2e:ui       # Lance les tests en mode UI interactive
```

Les tests se trouvent dans le dossier `e2e/` et couvrent :
- Navigation de base (login, pages principales)
- CRUD Transactions (ajout, édition, suppression, pagination)
- CRUD Objectifs (création, contribution, archivage, historique)

**Note** : Les tests e2e nécessitent un serveur de développement en cours d'exécution (`npm run dev`) et des credentials de test Firebase configurés dans les variables d'environnement :
- `TEST_USER_EMAIL`
- `TEST_USER_PASSWORD`

---

- L'application ne dépend pas d'un backend NestJS. Les besoins d'API supplémentaires peuvent être couverts via des Route Handlers Next.js (`src/app/api/.../route.ts`).
