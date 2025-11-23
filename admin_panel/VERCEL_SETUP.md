# Configuration Vercel - Admin Panel

## Fichiers créés

### 1. `.vercelignore` (racine du projet)
Exclut les dossiers Flutter/natifs pour accélérer les déploiements depuis la racine.

### 2. `admin_panel/vercel.json`
Configuration explicite Next.js pour Vercel.

### 3. `admin_panel/middleware.ts`
Protection des routes `/admin/*` (sauf `/admin/login`).
- Vérifie la présence du cookie `auth-token`
- Redirige vers login si non authentifié

## Variables d'environnement à configurer sur Vercel

Va sur https://vercel.com/mimbe237s-projects/admin-panel/settings/environment-variables

Ajoute ces variables (valeurs depuis `.env.local`) :

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

**Important** : Après avoir ajouté les variables, redéploie avec :
```bash
cd ~/budget/admin_panel
vercel --prod
```

## Commandes de déploiement recommandées

**Depuis le dossier admin_panel** :
```bash
cd ~/budget/admin_panel
vercel --prod
```

**Depuis la racine** (avec .vercelignore) :
```bash
cd ~/budget
vercel --prod
```

## Vérifications post-déploiement

1. ✅ Tester l'URL de production
2. ✅ Connexion admin fonctionne
3. ✅ Actions CRUD (créer/suspendre/promouvoir)
4. ✅ Refresh automatique après modifications
5. ✅ Redirection login si non authentifié

## Sécurité actuelle

- Middleware bloque l'accès aux routes admin sans token
- Variables Firebase en environment variables (non exposées)
- Cookie-based auth check

## Améliorations futures suggérées

- [ ] Vérifier les claims admin côté serveur dans le middleware
- [ ] Ajouter rate limiting sur les API routes
- [ ] Monitoring avec Vercel Analytics
- [ ] Logs d'audit pour actions admin
