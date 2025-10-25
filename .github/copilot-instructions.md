# Copilot Instructions for Budget App (Next.js + Firebase)

## Architecture & Structure
- **Stack** : Next.js (React), Firebase (Firestore/Auth), React Query, TailwindCSS.
- **Pas de backend NestJS** : Toute la logique serveur est gérée via Next.js API routes (`src/app/api/.../route.ts`) et Firebase Functions.
- **Données** : Firestore est la source unique de vérité. Les requêtes sont toujours online pour garantir la fraîcheur.
- **Cache** : React Query gère le cache client Firestore (stale-while-revalidate, déduplication, invalidation après mutation).
- **Service Worker** : Gère le pré-cache des routes critiques, le cache runtime des assets, la page offline (`/offline`) et le skipWaiting.

## Workflows Développeur
- **Installation** :
  ```bash
  npm install
  ```
- **Développement local** :
  ```bash
  npm run dev
  # Ouvre sur http://localhost:3000
  ```
- **Build** :
  ```bash
  npm run build
  ```
- **Déploiement** :
  ```bash
  firebase deploy --only hosting
  firebase deploy --only firestore:rules
  ```
- **Tests unitaires** :
  ```bash
  npm run test
  # Utilise Vitest, couvre src/lib et helpers
  ```
- **Tests e2e** :
  ```bash
  npx playwright test
  # Scénarios dans e2e/
  ```

## Conventions & Patterns
- **Firestore** : Les chemins sont du type `users/${user?.uid}/budgetGoals`.
- **React Query** : Utiliser `queryClient.prefetchInfiniteQuery` pour le préchargement, et invalider le cache après mutation.
- **Lazy loading** : Les images d’avatar utilisent `loading="lazy"`.
- **Variables d’environnement** : `.env.local` pour les secrets et config locales.
- **Tests** : Les helpers sont testés dans `src/lib/__tests__/`.
- **Scripts d’admin** : Scripts JS dans `scripts/` pour la gestion des utilisateurs/admins.

## Points d’intégration
- **Firebase** : Config dans `firebase.json`, `apphosting.yaml`, règles dans `firestore.rules`.
- **Service Worker** : Fichiers dans `public/service-worker.js`, `public/firebase-messaging-sw.js`.
- **Styles** : Config Tailwind dans `tailwind.config.ts`, PostCSS dans `postcss.config.mjs`.

## Exemples de fichiers clés
- `src/app/api/.../route.ts` : Endpoints API custom.
- `src/lib/format.ts` : Helpers monétaires.
- `src/components/` : Composants UI réutilisables.
- `e2e/` : Tests end-to-end Playwright.
- `scripts/` : Scripts d’administration.

## Conseils pour agents AI
- Respecter les conventions de cache et d’invalidation React Query.
- Toujours privilégier Firestore online pour les données dynamiques.
- Utiliser les scripts existants pour la gestion des utilisateurs/admins.
- Se référer au README.md pour les workflows et configurations spécifiques.

---

Pour toute ambiguïté ou workflow non documenté, demander une clarification à l’utilisateur.
