# Configuration de l'Authentification Sociale

## Vue d'ensemble

L'authentification sociale permet aux utilisateurs de se connecter rapidement avec leurs comptes Google, Facebook ou Apple, éliminant le besoin de créer et mémoriser un nouveau mot de passe.

## Implémentation Technique

### Composant `SocialAuthButtons`
- **Fichier**: `src/components/auth/social-auth-buttons.tsx`
- **Providers**: Google, Facebook, Apple
- **Gestion des popups**: Détection automatique du blocage des popups
- **Gestion d'erreurs**: Messages d'erreur localisés en français
- **Loading states**: Spinners animés pendant l'authentification

### Intégration Pages

#### Page Login (`src/app/login/page.tsx`)
- Boutons sociaux en haut
- Séparateur "Ou continuer avec"
- Formulaire email/password en dessous

#### Page Signup (`src/app/signup/page.tsx`)
- Boutons sociaux avant le formulaire multi-étapes
- Séparateur "Ou créer un compte avec email"
- Maintien du flux existant

## Configuration Firebase

### ⚠️ Configuration Requise

Avant que l'authentification sociale ne fonctionne, vous devez activer et configurer chaque fournisseur dans Firebase Console.

### 1. Google Sign-In

**Étapes de configuration:**

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet: `studio-3821270625-cd276`
3. Menu **Authentication** → **Sign-in method**
4. Cliquez sur **Google**
5. **Activer** le fournisseur
6. **Email d'assistance du projet**: Entrez votre email (ex: `mimb.nout@gmail.com`)
7. **Sauvegarder**

**Scopes demandés:**
- `profile` - Accès au nom et photo de profil
- `email` - Accès à l'adresse email

**Aucune clé API supplémentaire requise** - Google est intégré nativement à Firebase.

---

### 2. Facebook Login

**Étapes de configuration:**

#### Partie 1: Créer une App Facebook

1. Allez sur [Facebook Developers](https://developers.facebook.com/)
2. **Mes Apps** → **Créer une app**
3. Type: **Consommateur**
4. Nom de l'app: `Budget Pro` (ou votre nom)
5. Créez l'app
6. **Ajouter un produit** → **Facebook Login** → **Configurer**

#### Partie 2: Récupérer les Identifiants

1. Dans votre app Facebook → **Paramètres** → **Général**
2. Copiez:
   - **ID de l'app** (App ID)
   - **Clé secrète de l'app** (App Secret - cliquez sur "Afficher")

#### Partie 3: Configurer Firebase

1. Firebase Console → **Authentication** → **Sign-in method**
2. Cliquez sur **Facebook**
3. **Activer** le fournisseur
4. Collez:
   - **ID de l'app**: [Votre App ID]
   - **Clé secrète de l'app**: [Votre App Secret]
5. **Copiez l'URI de redirection OAuth** fourni par Firebase (ex: `https://studio-3821270625-cd276.firebaseapp.com/__/auth/handler`)
6. **Sauvegarder**

#### Partie 4: Configurer l'App Facebook

1. Retournez sur Facebook Developers
2. **Facebook Login** → **Paramètres**
3. **URI de redirection OAuth valides**: Collez l'URI de Firebase
4. **Sauvegarder les modifications**
5. **Paramètres** → **Général**:
   - **Domaines de l'app**: `localhost` (pour dev) et votre domaine de production
   - **URL de la politique de confidentialité**: Ajoutez l'URL de votre politique
   - **URL des conditions d'utilisation**: Ajoutez l'URL de vos conditions
6. **Rendre l'app publique**: Dans "Général", basculez le mode de développement vers production

**Scopes demandés:**
- `email` - Accès à l'adresse email
- `public_profile` - Accès au profil public (nom, photo)

---

### 3. Apple Sign-In

**Étapes de configuration:**

#### Partie 1: Configuration Apple Developer

1. Allez sur [Apple Developer](https://developer.apple.com/)
2. **Certificates, Identifiers & Profiles**
3. **Identifiers** → **+** (Créer un nouvel identifiant)
4. Type: **Services IDs**
5. Description: `Budget Pro Web`
6. Identifier: `com.budgetpro.web` (ou votre bundle ID)
7. **Activer Sign In with Apple**
8. **Configure** → Ajouter votre domaine web et Return URLs

#### Partie 2: Récupérer les Identifiants

1. Dans votre Service ID:
  - Copiez le **Services ID** (ex: `com.budgetpro.web`)
2. Créez une **Key** pour Sign In with Apple:
   - **Keys** → **+**
  - Nom: `Budget Pro Sign In Key`
   - **Activer Sign In with Apple**
   - **Configure** → Sélectionnez votre Primary App ID
   - **Téléchargez la clé** (.p8 file) - ⚠️ Une seule fois !
   - Notez le **Key ID**
3. Récupérez votre **Team ID**:
   - En haut à droite de Apple Developer

#### Partie 3: Configurer Firebase

1. Firebase Console → **Authentication** → **Sign-in method**
2. Cliquez sur **Apple**
3. **Activer** le fournisseur
4. Entrez:
  - **Services ID**: `com.budgetpro.web`
   - **Team ID**: [Votre Team ID]
   - **Key ID**: [Votre Key ID]
   - **Private Key**: Ouvrez le fichier .p8 et collez le contenu
5. **Copiez l'URI de redirection OAuth** fourni par Firebase
6. **Sauvegarder**

#### Partie 4: Finaliser Apple Developer

1. Retournez sur Apple Developer
2. **Votre Service ID** → **Configure Sign In with Apple**
3. **Domains and Subdomains**: `studio-3821270625-cd276.firebaseapp.com`
4. **Return URLs**: Collez l'URI de redirection Firebase
5. **Sauvegarder**

**Scopes demandés:**
- `email` - Accès à l'adresse email
- `name` - Accès au nom (prénom, nom)

⚠️ **Note**: Apple peut fournir un email anonymisé (privaterelay@appleid.com) si l'utilisateur le souhaite.

---

## Gestion des Profils Utilisateurs

### Création automatique du profil

Après une authentification sociale réussie, le composant `SocialAuthButtons` redirige vers `/`. Le système Firebase Auth crée automatiquement l'utilisateur, mais **vous devez créer le document Firestore** correspondant.

### Solution recommandée: Cloud Function

Créez une Cloud Function qui s'exécute automatiquement lors de la création d'un utilisateur:

```typescript
// functions/src/index.ts
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();

export const onUserCreate = functions.auth.user().onCreate(async (user) => {
  const { uid, email, displayName, photoURL, providerData } = user;
  
  // Extraire le provider (google.com, facebook.com, apple.com)
  const provider = providerData[0]?.providerId || 'password';
  
  // Créer le document utilisateur dans Firestore
  await admin.firestore().collection('users').doc(uid).set({
    id: uid,
    email: email || '',
    displayName: displayName || '',
    photoURL: photoURL || '',
    provider: provider,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    // Valeurs par défaut
    country: 'FR',
    language: 'fr',
    displayCurrency: 'EUR',
    locale: 'fr-FR',
    role: 'user',
    status: 'active'
  }, { merge: true });
});
```

### Alternative: Middleware côté client

Si vous ne voulez pas utiliser Cloud Functions, créez le profil côté client après la connexion:

```typescript
// src/components/auth/social-auth-buttons.tsx
const result = await signInWithPopup(auth, authProvider);

if (result.user) {
  // Vérifier si le profil existe déjà
  const userDoc = await getDoc(doc(firestore, 'users', result.user.uid));
  
  if (!userDoc.exists()) {
    // Créer le profil utilisateur
    await setDoc(doc(firestore, 'users', result.user.uid), {
      id: result.user.uid,
      email: result.user.email || '',
      displayName: result.user.displayName || '',
      photoURL: result.user.photoURL || '',
      provider: result.user.providerData[0]?.providerId || '',
      createdAt: new Date(),
      country: 'FR',
      language: 'fr',
      displayCurrency: 'EUR',
      locale: 'fr-FR'
    });
  }
  
  router.push('/');
}
```

---

## Gestion des Erreurs

### Codes d'erreur Firebase courants

| Code | Signification | Action |
|------|--------------|--------|
| `auth/popup-closed-by-user` | L'utilisateur a fermé la popup | Ignorer silencieusement |
| `auth/popup-blocked` | Le navigateur a bloqué la popup | Demander d'autoriser les popups |
| `auth/cancelled-popup-request` | Popup déjà ouverte | Ignorer |
| `auth/account-exists-with-different-credential` | Email déjà utilisé avec un autre provider | Proposer de lier les comptes |
| `auth/unauthorized-domain` | Domaine non autorisé dans Firebase | Ajouter le domaine dans Firebase Console |
| `auth/operation-not-allowed` | Provider non activé | Activer le provider dans Firebase Console |

### Gestion implémentée

Le composant `SocialAuthButtons` gère déjà ces erreurs avec des messages en français:

```typescript
if (error.code === 'auth/popup-closed-by-user') {
  errorMessage = 'La connexion a été annulée.';
} else if (error.code === 'auth/popup-blocked') {
  errorMessage = 'La popup a été bloquée. Veuillez autoriser les popups pour ce site.';
} else if (error.code === 'auth/account-exists-with-different-credential') {
  errorMessage = 'Un compte existe déjà avec cet email via un autre fournisseur.';
}
```

---

## Tests

### Test en local (http://localhost:9002)

1. Assurez-vous d'avoir ajouté `localhost` dans les domaines autorisés:
   - Firebase Console → **Authentication** → **Settings** → **Authorized domains**
   - Ajouter `localhost`

2. Pour Facebook: Ajoutez `localhost` dans les domaines de l'app Facebook

3. Pour Apple: Le test local peut nécessiter HTTPS (utilisez ngrok ou similaire)

### Test en production

1. Ajoutez votre domaine de production dans:
   - Firebase: **Authorized domains**
   - Facebook: **Domaines de l'app**
   - Apple: **Domains and Subdomains**

---

## Sécurité

### Bonnes pratiques implémentées

✅ **Popup au lieu de redirect** - Meilleure UX, garde l'état de l'application
✅ **Scopes minimaux** - Demande uniquement email et profil
✅ **Gestion d'erreurs** - Messages clairs pour l'utilisateur
✅ **Loading states** - Feedback visuel pendant l'authentification
✅ **Disable buttons** - Évite les clics multiples

### Recommandations supplémentaires

- [ ] Implémenter le lien de comptes (link credentials)
- [ ] Ajouter une vérification d'email pour les comptes sociaux
- [ ] Logger les authentifications pour audit
- [ ] Implémenter le re-authentication avant actions sensibles

---

## Dépannage

### Google ne fonctionne pas

- ✅ Vérifier que le provider est activé dans Firebase Console
- ✅ Vérifier l'email d'assistance du projet
- ✅ Vérifier que le domaine est autorisé
- ✅ Désactiver les bloqueurs de popup

### Facebook ne fonctionne pas

- ✅ Vérifier App ID et App Secret
- ✅ Vérifier que l'app est en mode production (pas dev)
- ✅ Vérifier les URI de redirection OAuth
- ✅ Vérifier que les domaines de l'app incluent votre domaine
- ✅ Vérifier que vous avez une politique de confidentialité valide

### Apple ne fonctionne pas

- ✅ Vérifier Services ID, Team ID, Key ID
- ✅ Vérifier que la clé privée (.p8) est correcte
- ✅ Vérifier les Return URLs dans Apple Developer
- ✅ Vérifier que le domaine correspond exactement
- ✅ Apple Sign-In nécessite HTTPS (sauf localhost)

### Popup bloquée

1. Demander à l'utilisateur d'autoriser les popups
2. Alternative: Utiliser `signInWithRedirect` au lieu de `signInWithPopup`

```typescript
// Alternative avec redirect
import { signInWithRedirect, getRedirectResult } from 'firebase/auth';

// Lors du clic
await signInWithRedirect(auth, provider);

// Sur la page de retour
useEffect(() => {
  getRedirectResult(auth).then(result => {
    if (result?.user) {
      router.push('/');
    }
  });
}, []);
```

---

## Résumé de la Configuration

| Provider | Configuré | Testé | Notes |
|----------|-----------|-------|-------|
| **Google** | ✅ Code | ⏳ Attente config Firebase | Le plus simple, aucune clé externe |
| **Facebook** | ✅ Code | ⏳ Attente config Facebook & Firebase | Nécessite App Facebook |
| **Apple** | ✅ Code | ⏳ Attente config Apple & Firebase | Nécessite Developer Account |

**Prochaines étapes:**
1. Configurer les 3 providers dans Firebase Console
2. Tester chaque provider individuellement
3. Implémenter la création automatique du profil (Cloud Function recommandée)
4. Tester en production avec domaine HTTPS

---

## Support

Pour toute question ou problème:
1. Consulter la [documentation Firebase Auth](https://firebase.google.com/docs/auth)
2. Vérifier les logs dans Firebase Console → Authentication
3. Tester avec les outils de développement du navigateur (Network tab)
4. Vérifier la console JavaScript pour les erreurs détaillées
