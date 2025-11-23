# Déploiement du Panel Admin

## Option 1 : Vercel (Recommandé) ⭐

Vercel est la plateforme officielle pour Next.js avec support complet des API routes.

### Étapes :

1. **Installer Vercel CLI** :
```bash
npm i -g vercel
```

2. **Se connecter à Vercel** :
```bash
vercel login
```

3. **Déployer depuis le dossier admin_panel** :
```bash
cd admin_panel
vercel
```

4. **Configurer les variables d'environnement sur Vercel** :
   - Aller sur https://vercel.com/dashboard
   - Sélectionner votre projet
   - Settings → Environment Variables
   - Ajouter :
     - `FIREBASE_PROJECT_ID`
     - `FIREBASE_CLIENT_EMAIL`
     - `FIREBASE_PRIVATE_KEY`
     - Toutes les autres variables de `.env.local`

5. **Redéployer** :
```bash
vercel --prod
```

### URL finale :
Votre admin sera accessible sur : `https://votre-projet.vercel.app/admin/login`

---

## Option 2 : Firebase Hosting + Cloud Functions (Plus complexe)

Convertir Next.js en site statique et déployer les API routes comme Cloud Functions.

### Étapes :

1. **Modifier `next.config.ts`** :
```typescript
const nextConfig = {
  output: 'export', // Mode statique
  distDir: '../build/admin', // Output vers build/admin
  images: {
    unoptimized: true, // Désactiver l'optimisation d'images
  },
  trailingSlash: true, // Ajouter / à la fin des URLs
};
```

2. **Build statique** :
```bash
cd admin_panel
npm run build
```

3. **Modifier `firebase.json`** pour inclure le dossier admin :
```json
{
  "hosting": {
    "public": "build/web",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "/admin/**",
        "destination": "/admin/index.html"
      },
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

4. **Déployer** :
```bash
firebase deploy --only hosting
```

⚠️ **Limitations** :
- Les API routes (`/api/*`) ne fonctionneront pas
- Pas de génération côté serveur (SSR)
- Pas d'agrégation de statistiques serveur

---

## Option 3 : Héberger sur un VPS/Cloud (Production)

Pour un environnement de production complet :

1. **DigitalOcean App Platform** (Recommandé)
2. **AWS Amplify**
3. **Google Cloud Run**
4. **Heroku**

---

## Recommandation

**Pour le développement et la production** : **Vercel** ⭐

- Gratuit pour les projets personnels
- Support natif Next.js
- Déploiement automatique depuis GitHub
- API routes fonctionnelles
- SSL automatique
- CDN mondial

**Commandes rapides** :
```bash
cd /Users/macbook/budget/admin_panel
vercel login
vercel --prod
```

Votre panel admin sera accessible sur une URL comme :
`https://budget-admin-xxxx.vercel.app/admin/login`

Vous pouvez ensuite configurer un sous-domaine personnalisé :
`https://admin.votredomaine.com`
