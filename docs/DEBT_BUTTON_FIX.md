# 🔧 Fix Bouton Ajout Dette - Diagnostic

## 🎯 Problème

Le bouton "Ajouter une dette" sur la page `/debts` ne fonctionne pas.

## 🔍 Diagnostic

### 1. Vérifier que le bouton existe

Le bouton est présent dans le code :

```tsx
// src/app/debts/page.tsx ligne 274
<Button asChild>
  <Link href="/debts/new" className="flex items-center gap-2">
    <Plus className="h-4 w-4" />
    Ajouter une dette
  </Link>
</Button>
```

✅ Le bouton existe et pointe vers `/debts/new`

### 2. Vérifier que la page de création existe

La page `/debts/new/page.tsx` existe et contient le formulaire complet.

✅ La page de création existe

### 3. Causes possibles

#### A. Cloud Functions non déployées

Les fonctions `createDebt` et `buildSchedule` doivent être déployées :

```bash
firebase deploy --only functions
```

#### B. Permissions Firestore manquantes

Vérifier dans `firestore.rules` que les règles pour `debts` sont présentes.

#### C. Problème de navigation/routing

Le lien vers `/debts/new` ne fonctionne pas.

#### D. Problème visuel (bouton disabled)

Le bouton est peut-être disabled à cause d'un état de chargement.

## ✅ Solutions

### Solution 1: Vérifier la navigation

Testez directement l'URL :

```
http://localhost:3000/debts/new
```

Si ça fonctionne → Le problème est avec le bouton
Si ça ne fonctionne pas → Le problème est avec la page

### Solution 2: Vérifier les Cloud Functions

```bash
# Vérifier les fonctions déployées
firebase functions:list

# Devrait afficher:
# - createDebt
# - buildSchedule
# - recordPayment
# etc.
```

Si les fonctions manquent :

```bash
# Déployer toutes les fonctions
firebase deploy --only functions

# Ou déployer des fonctions spécifiques
firebase deploy --only functions:createDebt,functions:buildSchedule
```

### Solution 3: Vérifier les permissions Firestore

Ouvrir `firestore.rules` et vérifier :

```javascript
// Collection debts à la racine
match /debts/{debtId} {
  allow create: if isAuthenticated() && request.resource.data.userId == request.auth.uid;
  allow read: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow update: if isAuthenticated() && resource.data.userId == request.auth.uid;
  allow delete: if isAuthenticated() && resource.data.userId == request.auth.uid;
}

// Collection debts sous users
match /users/{userId}/debts/{debtId} {
  allow create: if isOwner(userId);
  allow read: if isOwner(userId);
  allow update: if isOwner(userId);
  allow delete: if isOwner(userId);
}
```

Si les règles manquent ou sont incorrectes :

```bash
firebase deploy --only firestore:rules
```

### Solution 4: Corriger le problème de navigation

Si le bouton ne redirige pas, le problème peut venir du composant `Link` ou `Button`.

**Test rapide** : Remplacer temporairement le bouton par un lien simple :

```tsx
// Version de test
<a href="/debts/new" className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md">
  <Plus className="h-4 w-4" />
  Ajouter une dette
</a>
```

Si ça fonctionne avec `<a>` mais pas avec `<Button asChild><Link>`, c'est un problème de composant.

### Solution 5: Vérifier l'état du bouton

Le bouton peut être disabled à cause d'un état de chargement.

Vérifiez dans `src/app/debts/page.tsx` si le bouton a une condition `disabled` :

```tsx
// Rechercher dans le code
disabled={isLoading || error}
```

### Solution 6: Logs navigateur

Ouvrir DevTools (F12) → Console

Cliquer sur le bouton et vérifier s'il y a des erreurs :
- Erreurs React Router
- Erreurs Firebase
- Erreurs de permissions

### Solution 7: Mode debug

Ajouter un `console.log` au clic :

```tsx
<Button
  asChild
  onClick={() => console.log('Bouton cliqué, navigation vers /debts/new')}
>
  <Link href="/debts/new" className="flex items-center gap-2">
    <Plus className="h-4 w-4" />
    Ajouter une dette
  </Link>
</Button>
```

## 🧪 Tests

### Test 1: Navigation directe

```bash
# Démarrer l'app
npm run dev

# Ouvrir dans le navigateur
http://localhost:3000/debts/new
```

**Résultat attendu** : Le formulaire de création s'affiche

### Test 2: Clic sur le bouton

```bash
# Ouvrir http://localhost:3000/debts
# Cliquer sur "Ajouter une dette"
```

**Résultat attendu** : Redirection vers `/debts/new`

### Test 3: Création d'une dette

```bash
# Remplir le formulaire
# Cliquer sur "Créer la dette"
```

**Résultat attendu** : 
- Dette créée dans Firestore
- Redirection vers `/debts/{id}`

## 🐛 Erreurs courantes

### "Cannot read property 'createDebt' of undefined"

**Cause** : Cloud Functions non déployées

**Solution** :
```bash
firebase deploy --only functions
```

### "Permission denied"

**Cause** : Règles Firestore incorrectes

**Solution** :
```bash
# Vérifier firestore.rules
firebase deploy --only firestore:rules
```

### "Network error"

**Cause** : Pas de connexion internet ou Firebase

**Solution** :
- Vérifier la connexion
- Vérifier les credentials Firebase dans `.env.local`

### Le bouton ne fait rien

**Cause** : Problème avec Next.js Link ou Button

**Solution** : Utiliser un lien HTML simple temporairement

## 📋 Checklist de vérification

- [ ] Page `/debts` s'affiche correctement
- [ ] Bouton "Ajouter une dette" est visible
- [ ] Bouton n'est pas disabled
- [ ] Navigation vers `/debts/new` fonctionne directement
- [ ] Formulaire de création s'affiche
- [ ] Cloud Functions déployées (`createDebt`, `buildSchedule`)
- [ ] Règles Firestore correctes
- [ ] Aucune erreur dans la console navigateur
- [ ] Utilisateur authentifié

## 🚀 Fix rapide

Si rien ne fonctionne, voici un fix rapide :

### Option 1: Bouton HTML simple

```tsx
// Dans src/app/debts/page.tsx, remplacer le bouton par:
<a
  href="/debts/new"
  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
>
  <Plus className="h-4 w-4" />
  Ajouter une dette
</a>
```

### Option 2: useRouter

```tsx
import { useRouter } from 'next/navigation';

// Dans le composant
const router = useRouter();

<Button onClick={() => router.push('/debts/new')}>
  <Plus className="h-4 w-4" />
  Ajouter une dette
</Button>
```

---

**Date** : 15 novembre 2025
**Status** : 🔍 Diagnostic en cours
