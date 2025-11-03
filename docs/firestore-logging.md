# Gestion des Logs Firestore

## 📋 Vue d'ensemble

Ce système filtre intelligemment les logs Firestore pour éviter le spam de messages informatifs tout en conservant les véritables erreurs critiques.

## 🎯 Problème résolu

Firestore génère beaucoup de logs informatifs qui ne sont pas des erreurs :
- "Could not reach Cloud Firestore backend" → Mode offline normal
- "Backend didn't respond within 10 seconds" → Timeout réseau attendu
- "Multiple tabs open" → Comportement normal avec persistance

Ces messages polluaient la console sans apporter de valeur en développement.

## ✨ Solution implémentée

### 1. **Niveau de log Firestore**
```typescript
// src/firebase/index.ts
setLogLevel('error'); // Uniquement les erreurs critiques
```

### 2. **Logger personnalisé**
```typescript
// src/firebase/firestore-logger.ts
setupFirestoreLogger(); // Filtre les messages non-critiques
```

### 3. **Messages filtrés**
- ✅ Timeouts réseau (mode offline automatique)
- ✅ Warnings de persistance multi-tabs
- ✅ Messages de connexion/déconnexion
- ❌ Vraies erreurs de permissions
- ❌ Erreurs de validation des données
- ❌ Erreurs de requêtes malformées

## 🔧 Configuration

### Mode Production (par défaut)
Tous les logs informatifs sont filtrés. Seules les erreurs critiques s'affichent.

### Mode Debug (développement)
Pour voir tous les logs Firestore, ajoutez dans `.env.local` :

```bash
NEXT_PUBLIC_DEBUG_FIRESTORE=true
```

Les messages filtrés apparaîtront alors en `console.debug()`.

## 📊 Types de logs

### Logs conservés (critiques)
```javascript
// Erreur de permissions
console.error('[Firestore] Critical error:', error);

// Erreur de validation
console.error('[Firestore/collection] Invalid document structure');
```

### Logs filtrés (informatifs)
```javascript
// Mode offline (normal)
console.debug('[Firestore Info] Could not reach backend - offline mode');

// Multiple tabs (normal)
console.debug('[Firestore] Multiple tabs detected - persistence in first tab');
```

## 🚀 Utilisation dans le code

### Log une erreur contextuelle
```typescript
import { logFirestoreError } from '@/firebase/firestore-logger';

try {
  await setDoc(docRef, data);
} catch (error) {
  logFirestoreError('UserProfile', error);
}
```

### Log une info de debug
```typescript
import { logFirestoreInfo } from '@/firebase/firestore-logger';

logFirestoreInfo('Cache', 'Document loaded from cache', { docId });
```

## 🎛️ Personnalisation

### Ajouter un filtre
```typescript
// src/firebase/firestore-logger.ts
const FILTERED_MESSAGES = [
  'Could not reach Cloud Firestore backend',
  'Votre nouveau message à filtrer',
];
```

### Ajouter un code d'erreur non-critique
```typescript
const NON_CRITICAL_CODES = [
  'failed-precondition',
  'votre-code-erreur',
];
```

## ⚙️ Architecture

```
src/firebase/
├── index.ts                  # Initialisation + setupFirestoreLogger()
├── firestore-logger.ts       # Logique de filtrage des logs
├── client.ts                 # Client Firestore
└── provider.tsx              # React Context
```

## 📝 Flux d'exécution

1. **Initialisation** : `setupFirestoreLogger()` intercepte `console.error/warn`
2. **Détection** : Vérifie si le message contient `@firebase/firestore`
3. **Filtrage** : Compare avec `FILTERED_MESSAGES` et `NON_CRITICAL_CODES`
4. **Action** :
   - Message filtré → `console.debug()` si `DEBUG_FIRESTORE=true`
   - Message critique → `console.error()` normal

## 🧪 Tests

### Test en mode offline
1. Ouvrir DevTools → Network → Offline
2. Recharger l'application
3. ✅ Aucun log "Could not reach backend" dans la console
4. ✅ L'app fonctionne en mode offline

### Test avec vraie erreur
1. Modifier les règles Firestore pour bloquer l'accès
2. Tenter une requête
3. ✅ Erreur "Missing or insufficient permissions" affichée
4. ✅ Stack trace complète disponible

## 💡 Bonnes pratiques

- ✅ Utiliser `logFirestoreError()` pour les erreurs avec contexte
- ✅ Utiliser `logFirestoreInfo()` pour les infos de debug
- ✅ Activer `DEBUG_FIRESTORE` uniquement en dev local
- ❌ Ne jamais désactiver complètement les logs d'erreur
- ❌ Ne pas ajouter trop de filtres (risque de masquer de vraies erreurs)

## 🔍 Debugging

Si vous ne voyez plus **aucun** log Firestore :

1. Vérifier que `setLogLevel('error')` n'est pas en `'silent'`
2. Vérifier que `setupFirestoreLogger()` est appelé
3. Tester avec `NEXT_PUBLIC_DEBUG_FIRESTORE=true`
4. Vérifier la console du navigateur (pas uniquement le terminal)

## 📚 Ressources

- [Firestore Offline Persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
- [Firestore Error Handling](https://firebase.google.com/docs/firestore/client/handle-errors)
- [Firebase SDK Logging](https://firebase.google.com/docs/reference/js/firestore_.md#setloglevel)

---

**Impact** : Console propre, meilleure DX, pas de régression sur la détection d'erreurs critiques. 🎉
