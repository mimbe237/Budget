# 🎯 Quick Start - Panel Admin React/Next.js

## Installation Rapide (5 minutes)

### Option 1 : Installation automatique (Recommandé)

```bash
# Depuis la racine du projet
./scripts/setup-admin-panel.sh
```

### Option 2 : Installation manuelle

```bash
# 1. Créer le projet Next.js
npx create-next-app@latest admin_panel --typescript --tailwind --src-dir --app

# 2. Installer les dépendances
cd admin_panel
npm install firebase firebase-admin react-firebase-hooks recharts xlsx zod

# 3. Configurer Firebase
cp ../.env.local.example .env.local
# Éditer .env.local avec vos credentials Firebase
```

## Configuration Firebase (3 minutes)

### 1. Obtenir les credentials Client

1. Aller sur [Firebase Console](https://console.firebase.google.com)
2. Sélectionner votre projet
3. **Project Settings** → **General** → **Your apps**
4. Cliquer sur l'icône Web `</>`
5. Copier les valeurs dans `admin_panel/.env.local`

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=budget-xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=budget-xxx
# etc...
```

### 2. Obtenir les credentials Admin SDK

1. **Project Settings** → **Service Accounts**
2. Cliquer **"Generate new private key"**
3. Télécharger le fichier JSON
4. Extraire et copier dans `.env.local` :

```env
FIREBASE_PROJECT_ID=budget-xxx
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@budget-xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

⚠️ **Important**: Remplacez les vrais retours à la ligne par `\n` dans la clé privée.

### 3. Configurer les admins autorisés

Dans `.env.local` :

```env
NEXT_PUBLIC_ADMIN_EMAILS=admin@budget.com,admin2@budget.com
```

## Créer un compte admin (1 minute)

### Méthode 1 : Script automatique

```bash
cd admin_panel
node scripts/create-admin.js admin@budget.com MySecurePassword123 "Admin User"
```

### Méthode 2 : Firebase Console

1. **Authentication** → **Users** → **Add user**
2. Créer avec email/password
3. Noter le **UID** de l'utilisateur
4. **Authentication** → Cliquer sur l'utilisateur → **Custom Claims**
5. Ajouter :
```json
{
  "admin": true,
  "role": "admin"
}
```

### Méthode 3 : Firebase CLI

```bash
firebase functions:shell
admin.auth().setCustomUserClaims('USER_UID', { admin: true, role: 'admin' })
```

## Lancer le panel admin (30 secondes)

```bash
cd admin_panel
npm run dev
```

Ouvrir : **http://localhost:3000/admin/login**

## Structure du projet

```
admin_panel/
├── src/
│   ├── app/
│   │   ├── admin/
│   │   │   ├── login/              # Page de connexion admin
│   │   │   ├── dashboard/          # Dashboard principal
│   │   │   └── users/              # Gestion des utilisateurs
│   │   └── layout.tsx
│   ├── components/
│   │   └── ui/                     # Composants UI réutilisables
│   ├── lib/
│   │   ├── firebase.ts             # Config Firebase Client
│   │   ├── firebaseAdmin.ts        # Config Firebase Admin
│   │   └── adminAuth.ts            # Guards d'authentification
│   └── types/
│       └── index.ts                # Types TypeScript
├── public/
├── scripts/
│   └── create-admin.js             # Script création admin
├── .env.local                      # Configuration (ne pas commit!)
├── .env.local.example              # Template de config
└── package.json
```

## Pages principales

### 🔐 Login (`/admin/login`)
- Authentification email/password
- Vérification du rôle admin
- Redirection automatique si déjà connecté

### 📊 Dashboard (`/admin/dashboard`)
- Stats globales (users, transactions, solde)
- Graphiques KPI
- Navigation vers les autres sections

### 👥 Utilisateurs (`/admin/users`)
- Liste avec recherche et filtres
- Détails utilisateur (transactions, objectifs)
- Actions: suspendre, modifier, supprimer
- Export CSV/Excel

## Fonctionnalités principales

✅ **Authentification sécurisée**
- Custom claims Firebase
- Session management
- Logout automatique après inactivité

✅ **Gestion des utilisateurs**
- Voir tous les utilisateurs
- Rechercher par nom, email, pays
- Filtrer par statut, langue, période
- Suspendre/Activer des comptes
- Supprimer avec confirmation

✅ **Analytics en temps réel**
- Total utilisateurs
- Utilisateurs actifs (30j)
- Total transactions
- Solde plateforme
- Graphiques de répartition

✅ **Exports de données**
- Export CSV pour analyse
- Export Excel formaté
- Filtres appliqués aux exports

## Développement

### Commandes utiles

```bash
# Lancer le serveur de développement
npm run dev

# Build de production
npm run build

# Lancer en production
npm start

# Linter
npm run lint

# Formatter le code
npm run format
```

### Hot Reload

Le serveur Next.js recharge automatiquement lors de modifications du code.

### TypeScript

Tous les fichiers sont en TypeScript pour une meilleure sécurité du code.

## Déploiement

### Option 1 : Vercel (Recommandé)

```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer
vercel

# Déployer en production
vercel --prod
```

### Option 2 : Firebase Hosting

```bash
# Build
npm run build

# Configurer Firebase Hosting
firebase init hosting

# Déployer
firebase deploy --only hosting
```

### Option 3 : Docker

```bash
# Build l'image
docker build -t budget-admin .

# Run le container
docker run -p 3000:3000 budget-admin
```

## Variables d'environnement en production

⚠️ **Important**: En production, configurez ces variables dans votre plateforme de déploiement :

- **Vercel**: Settings → Environment Variables
- **Firebase**: Firebase Console → Functions → Environment variables
- **Docker**: fichier `.env` ou `-e` flags

## Sécurité

### Best Practices

1. ✅ Ne jamais commit `.env.local`
2. ✅ Utiliser des mots de passe forts pour les admins
3. ✅ Limiter les emails autorisés dans `ADMIN_EMAILS`
4. ✅ Activer 2FA pour les comptes Firebase
5. ✅ Restreindre les IPs dans Firebase si possible
6. ✅ Logger toutes les actions admin
7. ✅ Faire des sauvegardes régulières de Firestore

### Firestore Rules

Assurez-vous que vos rules Firestore vérifient le rôle admin :

```javascript
function isAdmin() {
  return request.auth != null && 
         (request.auth.token.admin == true || 
          request.auth.token.role == 'admin');
}

match /users/{userId} {
  allow read: if isAdmin() || request.auth.uid == userId;
  allow write: if isAdmin();
}
```

## Troubleshooting

### Erreur: "Non authentifié"
→ Vérifiez que l'utilisateur a bien le custom claim `admin: true`

### Erreur: "Accès refusé"
→ Vérifiez que l'email est dans `NEXT_PUBLIC_ADMIN_EMAILS`

### Erreur: Firebase initialization
→ Vérifiez que toutes les variables d'environnement sont correctes

### Les stats ne se chargent pas
→ Vérifiez les Firestore Rules et les permissions

### Impossible de se connecter
→ Vérifiez que le compte existe dans Firebase Authentication

## Support

### Documentation complète
- `ADMIN_PANEL_SETUP.md` - Setup détaillé
- `ADMIN_USERS_README.md` - Gestion des utilisateurs
- `docs/admin-debugging.md` - Debugging

### Ressources
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Questions fréquentes

**Q: Puis-je avoir plusieurs admins?**  
R: Oui, ajoutez tous les emails dans `NEXT_PUBLIC_ADMIN_EMAILS` séparés par des virgules.

**Q: Comment réinitialiser le mot de passe d'un admin?**  
R: Via Firebase Console → Authentication → Users → Reset password

**Q: Les données sont-elles partagées avec l'app Flutter?**  
R: Oui, les deux apps utilisent le même Firebase, donc les mêmes données.

**Q: Puis-je personnaliser le design?**  
R: Oui, modifiez les composants dans `src/components/` et les styles Tailwind.

---

**🎉 Vous êtes prêt!** Lancez `npm run dev` et connectez-vous sur http://localhost:3000/admin/login
