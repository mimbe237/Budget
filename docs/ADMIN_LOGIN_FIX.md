# 🔧 Fix Admin Login - Guide de dépannage

## Problème

La page admin (`/admin`) ne fonctionne pas : 
- Impossible de se connecter
- Erreur d'authentification
- Redirection infinie
- "Vous n'avez pas les droits administrateur"

## ✅ Solutions

### Solution 1: Vérifier la configuration des emails admin

1. Ouvrir `.env.local`
2. Vérifier que ces lignes existent :

```bash
ADMIN_EMAILS="admin@budget.com"
NEXT_PUBLIC_ADMIN_EMAILS="admin@budget.com"
```

3. **Important** : Remplacer `admin@budget.com` par votre vrai email
4. Si plusieurs admins, séparer par des virgules :

```bash
ADMIN_EMAILS="admin@budget.com,john@budget.com,jane@budget.com"
NEXT_PUBLIC_ADMIN_EMAILS="admin@budget.com,john@budget.com,jane@budget.com"
```

5. Redémarrer l'application :

```bash
npm run dev
```

### Solution 2: Créer un compte admin

Si vous n'avez pas encore de compte admin :

```bash
node scripts/create-admin.js admin@budget.com MotDePasse123! Admin User
```

**Syntaxe** :
```bash
node scripts/create-admin.js <email> <password> <firstName> <lastName>
```

**Exemple** :
```bash
node scripts/create-admin.js john.doe@budget.com SecurePass2024! John Doe
```

### Solution 3: Promouvoir un utilisateur existant en admin

Si vous avez déjà un compte utilisateur :

```bash
node scripts/set-admin.js john.doe@budget.com true
```

Cela va :
1. ✅ Définir les custom claims admin dans Firebase Auth
2. ✅ Mettre à jour le profil Firestore avec `role: 'admin'`
3. ✅ Donner les permissions administrateur

### Solution 4: Vérifier les credentials Firebase

Si Firebase Admin ne s'initialise pas :

1. **Option A** : Variable d'environnement

Ajouter dans `.env.local` :

```bash
GOOGLE_APPLICATION_CREDENTIALS='{"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}'
```

2. **Option B** : Fichier JSON

Télécharger le fichier de clé de service :
- Firebase Console > Project Settings > Service Accounts
- Generate new private key
- Sauvegarder comme `serviceAccountKey.json` à la racine du projet

### Solution 5: Nettoyer le cache

Parfois le problème vient du cache :

```bash
# Nettoyer le cache Next.js
rm -rf .next

# Nettoyer node_modules (si nécessaire)
rm -rf node_modules
npm install

# Redémarrer
npm run dev
```

### Solution 6: Vérifier le token Firebase

Le problème peut venir du stockage du token. J'ai corrigé ce problème en :

1. ✅ Stockant le token dans un cookie après connexion
2. ✅ Vérifiant l'email contre la liste des admins
3. ✅ Ajoutant un refresh de la page après connexion

**Changements appliqués dans** `src/app/admin/page.tsx` :

```typescript
// Après connexion réussie
const idToken = await userCredential.user.getIdToken();
document.cookie = `firebaseIdToken=${idToken}; path=/; max-age=3600; SameSite=Strict`;
router.refresh();
```

## 🧪 Tester la connexion

### 1. Vérifier l'email admin

```bash
# Dans le terminal Node.js
node -e "console.log(process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(','))"
```

Devrait afficher : `[ 'admin@budget.com' ]`

### 2. Tester la connexion

1. Ouvrir http://localhost:3000/admin
2. Entrer l'email et mot de passe
3. Cliquer "Se connecter"
4. Si succès → Dashboard admin s'affiche
5. Si erreur → Vérifier le message d'erreur

### 3. Vérifier dans Firebase Console

1. Firebase Console > Authentication
2. Vérifier que l'utilisateur existe
3. Custom Claims devrait avoir :
   ```json
   {
     "admin": true,
     "role": "admin"
   }
   ```

4. Firestore > users > {userId}
5. Vérifier les champs :
   ```json
   {
     "email": "admin@budget.com",
     "role": "admin",
     "isAdmin": true,
     "status": "active"
   }
   ```

## 🔍 Debugging

### Activer les logs

Ajouter dans `.env.local` :

```bash
NEXT_PUBLIC_DEBUG_FIREBASE=1
NEXT_PUBLIC_DEBUG_FIRESTORE=1
```

### Vérifier les logs du navigateur

1. Ouvrir DevTools (F12)
2. Onglet Console
3. Chercher :
   - ❌ Erreurs rouges Firebase
   - ⚠️  Warnings d'authentification
   - ℹ️  Messages de debug

### Vérifier les logs serveur

Dans le terminal où tourne `npm run dev`, chercher :

```
[AdminAuth] User authenticated: ...
[AdminAuth] Admin check: ...
```

## 🚨 Erreurs courantes

### "Service d'authentification indisponible"

**Cause** : Firebase Auth n'est pas initialisé

**Solution** :
1. Vérifier les variables Firebase dans `.env.local`
2. Redémarrer l'app

### "Vous n'avez pas les droits administrateur"

**Cause** : Email pas dans ADMIN_EMAILS

**Solution** :
1. Ajouter l'email dans `.env.local` :
   ```bash
   ADMIN_EMAILS="votre-email@domain.com"
   NEXT_PUBLIC_ADMIN_EMAILS="votre-email@domain.com"
   ```
2. Redémarrer l'app

### "Identifiants invalides"

**Cause** : Email ou mot de passe incorrect

**Solution** :
1. Vérifier l'email dans Firebase Console > Authentication
2. Réinitialiser le mot de passe si nécessaire
3. Ou créer un nouveau compte admin

### "auth/invalid-credential"

**Cause** : Compte n'existe pas ou mot de passe incorrect

**Solution** :
1. Créer le compte : `node scripts/create-admin.js email@domain.com Password123! First Last`
2. Ou réinitialiser le mot de passe dans Firebase Console

## ✅ Checklist de vérification

Avant de demander de l'aide, vérifier :

- [ ] `.env.local` contient ADMIN_EMAILS et NEXT_PUBLIC_ADMIN_EMAILS
- [ ] Email admin existe dans Firebase Auth
- [ ] Custom claims admin définis (via script ou console Firebase)
- [ ] Profil Firestore a `role: 'admin'` et `isAdmin: true`
- [ ] Email admin correspond exactement (case-insensitive)
- [ ] Application redémarrée après changement .env.local
- [ ] Mot de passe correct (minimum 6 caractères)
- [ ] Cache navigateur nettoyé (Ctrl+Shift+R)

## 📞 Support

Si le problème persiste :

1. **Vérifier les logs** : Copier les erreurs du navigateur et du serveur
2. **Vérifier Firebase Console** : Screenshot de l'utilisateur dans Authentication
3. **Vérifier .env.local** : Copier (sans les secrets) les variables Firebase

---

**Date** : 15 novembre 2025  
**Version** : 1.0.0  
**Status** : ✅ Fix appliqué
