# Configuration Firebase Authentication

## 📋 Étapes de Configuration

### 1. Activer les Providers d'Authentification

#### A. Email/Password (Déjà activé ✅)
- Accéder à [Firebase Console](https://console.firebase.google.com)
- Projet : `studio-3821270625-cd276`
- Authentication > Sign-in method
- Email/Password : **ENABLED**

#### B. Google Sign-In
```bash
# Firebase Console > Authentication > Sign-in method > Google
1. Cliquer sur "Google"
2. Activer le toggle
3. Email d'assistance du projet : businessclubleader7@gmail.com
4. Sauvegarder
```

**Configuration OAuth Consent Screen** (si demandé):
- Nom de l'application : Budget Pro
- Email de contact : businessclubleader7@gmail.com
- Logo : Uploader le logo (512x512px)

#### C. Facebook Sign-In
```bash
# 1. Créer une application Facebook Developers
https://developers.facebook.com/apps/create/

# 2. Configuration de base
- Nom de l'application : Budget Pro
- Email de contact : businessclubleader7@gmail.com
- Catégorie : Finance

# 3. Ajouter le produit "Facebook Login"
- Web : https://studio-3821270625-cd276.web.app
- Domaines d'application : studio-3821270625-cd276.firebaseapp.com

# 4. Récupérer les credentials
App ID: [VOTRE_FACEBOOK_APP_ID]
App Secret: [VOTRE_FACEBOOK_APP_SECRET]

# 5. Firebase Console > Authentication > Sign-in method > Facebook
- App ID : Coller l'App ID
- App Secret : Coller l'App Secret
- OAuth redirect URI : Copier et ajouter dans Facebook App Settings > Facebook Login > Valid OAuth Redirect URIs
```

### 2. Variables d'Environnement

Ajouter dans `.env.local` :

```bash
# Firebase (déjà configuré)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=studio-3821270625-cd276

# OAuth Providers (si besoin de config custom)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
NEXT_PUBLIC_FACEBOOK_APP_ID=...

# Admin emails pour validation manuelle
ADMIN_EMAILS=businessclubleader7@gmail.com,contact@beonweb.cm
```

### 3. Règles Firestore pour Validation Admin

```javascript
// firestore.rules - Ajouter ces règles
match /users/{userId} {
  // Nouvel utilisateur peut créer son profil mais avec status=pending
  allow create: if isOwner(userId) &&
                request.resource.data.id == userId &&
                (!('status' in request.resource.data) || request.resource.data.status == 'pending') &&
                (!('role' in request.resource.data) || request.resource.data.role == 'user') &&
                (!('admin' in request.resource.data) || request.resource.data.admin == false);
  
  // Seul admin peut changer status de pending à active
  allow update: if isAdmin() || 
                (isOwner(userId) && !isChangingProtectedProfileFields());
}

function isChangingProtectedProfileFields() {
  return resource != null &&
    request.resource.data.diff(resource.data).changedKeys().hasAny(['role', 'admin', 'status']);
}
```

### 4. Cloud Function : Validation Admin

La fonction `onUserCreate` bloque automatiquement les nouveaux comptes :

```typescript
// functions/src/auth.ts
export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  // Créer le document user avec status=pending
  await admin.firestore().collection('users').doc(user.uid).set({
    id: user.uid,
    email: user.email,
    status: 'pending', // Attend validation admin
    emailVerified: user.emailVerified,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  // Désactiver le compte immédiatement
  await admin.auth().updateUser(user.uid, {
    disabled: true
  });

  // Notifier les admins
  // TODO: Envoyer email aux admins
});
```

### 5. Déploiement

```bash
# Déployer les règles Firestore
firebase deploy --only firestore:rules

# Déployer les Cloud Functions
cd functions
npm run build
cd ..
firebase deploy --only functions

# Déployer l'application
npm run build
firebase deploy --only hosting
```

### 6. Test de Configuration

```bash
# Tester Google Sign-In
1. Aller sur http://localhost:9002/signup
2. Cliquer sur "S'inscrire avec Google"
3. Vérifier la redirection OAuth
4. Vérifier que le compte est créé avec status=pending

# Tester Email Sign-Up
1. Remplir le formulaire d'inscription
2. Soumettre
3. Vérifier que status=pending dans Firestore
4. Vérifier que le compte est désactivé dans Firebase Auth

# Tester Validation Admin
1. Se connecter en tant qu'admin
2. Aller sur /admin/users
3. Voir les comptes en attente
4. Approuver un compte
5. Vérifier que status=active et disabled=false
```

## 📚 Documentation

- [Firebase Auth Providers](https://firebase.google.com/docs/auth/web/start)
- [Google Sign-In](https://firebase.google.com/docs/auth/web/google-signin)
- [Facebook Login](https://firebase.google.com/docs/auth/web/facebook-login)
- [Custom Claims](https://firebase.google.com/docs/auth/admin/custom-claims)

## 🔒 Sécurité

### Custom Claims pour Validation
```typescript
// Après validation admin, ajouter custom claim
await admin.auth().setCustomUserClaims(uid, {
  approved: true,
  approvedAt: Date.now()
});
```

### Middleware Next.js pour Bloquer Accès
```typescript
// middleware.ts
if (user && !user.customClaims?.approved) {
  return NextResponse.redirect('/pending-approval');
}
```

## ✅ Checklist de Configuration

- [ ] Activer Google Sign-In dans Firebase Console
- [ ] Activer Facebook Login dans Firebase Console
- [ ] Créer Facebook App et configurer OAuth
- [ ] Ajouter variables d'environnement
- [ ] Déployer règles Firestore
- [ ] Créer Cloud Function onUserCreate
- [ ] Créer page /pending-approval
- [ ] Créer interface admin pour validation
- [ ] Tester chaque provider
- [ ] Configurer emails de notification
