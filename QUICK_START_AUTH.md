# 🚀 Guide Rapide - Système d'Authentification

## ✅ Ce qui est déjà fait

Tout le code est implémenté et fonctionnel. Voici ce qui fonctionne :

### Pages Créées
- ✅ `/settings` - Paramètres complets (5 onglets)
- ✅ `/pending-approval` - Page d'attente de validation
- ✅ `/admin/users/pending` - Interface admin pour approuver/rejeter
- ✅ `/auth/reset-password` - Réinitialisation mot de passe

### Cloud Functions
- ✅ `onUserCreate` - Bloque automatiquement les nouveaux comptes
- ✅ `approveUser` - Active un compte en attente
- ✅ `rejectUser` - Rejette un compte avec raison
- ✅ `getPendingUsers` - Liste les comptes en attente

### Protections
- ✅ Middleware Next.js pour routes publiques
- ✅ AuthStatusGuard pour vérifier le statut utilisateur
- ✅ Règles Firestore mises à jour et déployées

## ⏳ À Faire (Configuration Firebase Console)

### 1. Déployer les Cloud Functions

```bash
cd /Users/macbook/Touch-Point-Insights/Finance/Budget
./scripts/deploy-auth.sh --functions
```

**OU manuellement** :
```bash
cd functions && npm run build && cd ..
firebase deploy --only functions:onUserCreate,functions:approveUser,functions:rejectUser,functions:getPendingUsers
```

### 2. Activer Google Sign-In (2 minutes)

1. Aller sur [Firebase Console](https://console.firebase.google.com/project/studio-3821270625-cd276/authentication/providers)
2. Cliquer sur **"Google"** dans la liste des providers
3. Activer le toggle
4. Email d'assistance : **businessclubleader7@gmail.com**
5. Cliquer sur **"Enregistrer"**

✅ C'est tout ! Google Sign-In sera fonctionnel immédiatement.

### 3. Activer Facebook Login (10-15 minutes)

#### Étape A : Créer l'App Facebook
1. Aller sur [Facebook Developers](https://developers.facebook.com/apps/create/)
2. Créer une application :
   - Nom : **Budget Pro**
   - Email : **businessclubleader7@gmail.com**
   - Catégorie : **Finance**
3. Ajouter le produit **"Facebook Login"**
4. Configuration :
   - Site Web : `https://studio-3821270625-cd276.web.app`
   - Domaines : `studio-3821270625-cd276.firebaseapp.com`

#### Étape B : Récupérer les Credentials
1. Dans l'app Facebook : **Paramètres > Général**
2. Copier :
   - **App ID** (Identifiant de l'application)
   - **App Secret** (Clé secrète)

#### Étape C : Configurer dans Firebase
1. Aller sur [Firebase Console](https://console.firebase.google.com/project/studio-3821270625-cd276/authentication/providers)
2. Cliquer sur **"Facebook"**
3. Activer le toggle
4. Coller **App ID** et **App Secret**
5. Copier l'**OAuth Redirect URI** fourni par Firebase

#### Étape D : Finaliser dans Facebook
1. Retourner dans l'app Facebook
2. **Facebook Login > Paramètres**
3. Dans **"Valid OAuth Redirect URIs"**, coller l'URI de Firebase
4. Enregistrer

✅ Facebook Login opérationnel !

## 🧪 Test Complet

### Test 1 : Inscription avec Validation Admin

```bash
# 1. Ouvrir l'app en navigation privée
open http://localhost:9002/signup

# 2. Créer un compte :
Email: test@example.com
Password: Test1234!
[Remplir le formulaire]

# 3. Après soumission, vérifier :
- Redirection vers /pending-approval ✅
- Message "Compte en attente de validation" ✅

# 4. Vérifier dans Firestore :
Collection: users/[uid]
- status: "pending" ✅
- createdAt: [timestamp] ✅

# 5. Vérifier dans Firebase Auth :
- Compte désactivé (disabled: true) ✅
```

### Test 2 : Validation Admin

```bash
# 1. Se connecter avec un compte admin
# Email: businessclubleader7@gmail.com

# 2. Aller sur :
open http://localhost:9002/admin/users/pending

# 3. Vérifier :
- Le nouveau compte apparaît dans la liste ✅
- Badge "En attente" affiché ✅

# 4. Cliquer sur "Approuver"

# 5. Vérifier :
- Toast de confirmation ✅
- Compte retiré de la liste ✅

# 6. Vérifier dans Firestore :
- status: "active" ✅

# 7. Vérifier dans Firebase Auth :
- disabled: false ✅
- customClaims: { approved: true } ✅
```

### Test 3 : Connexion Utilisateur Approuvé

```bash
# 1. Se déconnecter de l'admin
# 2. Se connecter avec test@example.com
# 3. Vérifier :
- Connexion réussie ✅
- Accès au dashboard ✅
- Pas de redirection vers pending-approval ✅
```

### Test 4 : Changement de Mot de Passe

```bash
# 1. Aller sur :
open http://localhost:9002/settings

# 2. Onglet "Sécurité"

# 3. Remplir :
- Mot de passe actuel : Test1234!
- Nouveau mot de passe : NewPass123!
- Confirmer : NewPass123!

# 4. Cliquer sur "Changer"

# 5. Vérifier :
- Toast "Mot de passe modifié" ✅
- Champs réinitialisés ✅

# 6. Se déconnecter et se reconnecter avec NewPass123! ✅
```

### Test 5 : Réinitialisation Mot de Passe

```bash
# 1. Se déconnecter
# 2. Sur /login, cliquer "Forgot password?"
# 3. Entrer : test@example.com
# 4. Cliquer "Send Reset Link"
# 5. Vérifier :
- Message de confirmation ✅
- Email reçu ✅
# 6. Cliquer sur le lien dans l'email
# 7. Définir nouveau mot de passe ✅
# 8. Se connecter avec le nouveau mot de passe ✅
```

## 📊 Vérifications Firestore

### Collection `users`
Chaque document doit avoir :
```json
{
  "id": "QE79kfsdIDMVn94c129WVygjMh32",
  "email": "test@example.com",
  "status": "pending" | "active" | "rejected",
  "firstName": "John",
  "lastName": "Doe",
  "role": "user",
  "admin": false,
  "createdAt": "2025-01-15T10:30:00.000Z",
  "updatedAt": "2025-01-15T10:30:00.000Z"
}
```

## ❌ Suppression de compte

- Sur `/settings` l’utilisateur peut planifier la suppression avec mot-clé (`DELETE/SUPPRIMER`) et mot de passe : cela déclenche `DELETE /api/user/me`, qui marque l’utilisateur en `pending_deletion` pendant 30 jours.
- Tant que `deletionExpiresAt` n’est pas dépassé, toute connexion redirige vers `/account-restore`, une page d’attente avec un seul bouton “Restaurer mon compte”. La restauration appelle `POST /api/user/me/restore` et rétablit le statut `active`.
- Après 30 jours, un script `scripts/purge-pending-deletions.js` (scheduler/cron) ou un login automatique supprime définitivement les sous-collections, le document `users/{uid}` et l’utilisateur Firebase, en enregistrant l’email dans `deletedEmails` pour empêcher toute réinscription avec la même adresse. La page `/account-deleted` affiche un message fixe quand on est redirigé avec `?accountDeleted=1`.

## 🔍 Dépannage

### Problème : Cloud Functions ne se déploient pas

**Solution** :
```bash
# Vérifier les logs
firebase functions:log

# Redéployer avec verbose
firebase deploy --only functions --debug

# Vérifier la compilation
cd functions && npm run build && ls lib/
```

### Problème : Utilisateur reste bloqué sur /pending-approval

**Vérifications** :
1. Firestore : `status` = "active" ?
2. Firebase Auth : `disabled` = false ?
3. Custom claims : `approved` = true ?
4. Rafraîchir la page (F5)

**Correction** :
```javascript
// Dans Firebase Console > Firestore
users/[uid] → status: "active"

// Ou avec Cloud Function :
await admin.auth().updateUser(uid, { disabled: false });
await admin.auth().setCustomUserClaims(uid, { approved: true });
```

### Problème : Erreur "Insufficient permissions"

**Solution** :
```bash
# Redéployer les règles Firestore
firebase deploy --only firestore:rules

# Vérifier dans Firebase Console > Firestore > Rules
```

## 📞 Support

Questions ou problèmes ?
- **Email** : contact@beonweb.cm
- **Email** : businessclubleader7@gmail.com
- **Console Firebase** : [Ouvrir](https://console.firebase.google.com/project/studio-3821270625-cd276)

## 🎉 C'est Prêt !

Une fois les Cloud Functions déployées et les OAuth providers activés, le système est **100% opérationnel**.

### Récap Final

- ✅ Code complet et testé
- ✅ Règles Firestore déployées
- ⏳ Déployer Cloud Functions (1 commande)
- ⏳ Activer Google (2 clics)
- ⏳ Activer Facebook (10 min setup)

**Temps total de configuration** : ~15-20 minutes

---

**Dernière mise à jour** : 2025-01-15
