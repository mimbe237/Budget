# Guide de Test Offline - Budget App

## 📋 Checklist des Tests

### 1. Installation du Service Worker

**Objectif** : Vérifier que le Service Worker s'enregistre correctement

**Étapes** :
1. Ouvrir l'application en production : `npm start` (port 3000)
2. Ouvrir DevTools → Application → Service Workers
3. Vérifier :
   - ✅ Service Worker status: **Activated and running**
   - ✅ Source: `/service-worker.js`
   - ✅ Version cache: `budget-app-v2`

**Commandes de test** :
```bash
# Démarrer en production
npm run build
npm start

# Vérifier le SW dans Chrome
open http://localhost:3000
# DevTools > Application > Service Workers
```

---

### 2. Précache des Assets Statiques

**Objectif** : Vérifier que les assets critiques sont pré-cachés

**Étapes** :
1. DevTools → Application → Cache Storage
2. Vérifier la présence de `budget-app-v2` avec :
   - ✅ `/` (page d'accueil)
   - ✅ `/offline` (page fallback)
   - ✅ `/manifest.webmanifest`
   - ✅ `/icons/icon-192.png`
   - ✅ `/icons/icon-512.png`
   - ✅ `/icons/maskable-512.png`
   - ✅ `/icons/apple-touch-icon.png`
   - ✅ `/icons/favicon-32x32.png`
   - ✅ `/icons/favicon-16x16.png`

**Test automatique** :
```javascript
// Console DevTools
caches.open('budget-app-v2').then(cache => {
  cache.keys().then(keys => console.log(keys.map(r => r.url)));
});
```

---

### 3. Runtime Cache (Network First)

**Objectif** : Vérifier que les pages visitées sont mises en cache

**Étapes** :
1. Visiter plusieurs pages :
   - `/dashboard`
   - `/transactions`
   - `/goals`
   - `/reports`
2. DevTools → Application → Cache Storage → `budget-runtime-v2`
3. Vérifier que les pages apparaissent dans le cache

**Test** :
```javascript
// Vérifier le cache runtime
caches.open('budget-runtime-v2').then(cache => {
  cache.keys().then(keys => {
    console.log('📦 Pages en cache:', keys.length);
    keys.forEach(r => console.log('  ✓', r.url));
  });
});
```

---

### 4. Mode Offline - Page Fallback

**Objectif** : Vérifier que `/offline` s'affiche quand hors ligne

**Étapes** :
1. Visiter `/dashboard` (pour le mettre en cache)
2. DevTools → Network → Cocher "Offline"
3. Naviguer vers une page non visitée (ex: `/settings`)
4. Vérifier :
   - ✅ Page `/offline` s'affiche
   - ✅ Indicateur de connexion : "Pas de connexion" (rouge)
   - ✅ Bouton "Recharger" désactivé

**Test physique mobile** :
```bash
# Sur mobile (Android/iOS)
1. Visiter l'app en Wi-Fi
2. Activer Mode Avion
3. Naviguer dans l'app
4. Vérifier que les pages en cache fonctionnent
5. Tenter d'accéder à une page non visitée → /offline
```

---

### 5. Reconnexion Automatique

**Objectif** : Vérifier la détection de retour en ligne

**Étapes** :
1. Mode offline activé → Page `/offline` visible
2. DevTools → Network → Décocher "Offline"
3. Vérifier :
   - ✅ Indicateur passe au vert : "Connexion détectée"
   - ✅ Bouton "Recharger" activé
   - ✅ Message change : "Reconnexion en cours..."

---

### 6. Cache des Assets Statiques (CacheFirst)

**Objectif** : Vérifier que les images/CSS/JS sont servis du cache

**Étapes** :
1. Visiter `/dashboard` en ligne
2. DevTools → Network → Activer "Offline"
3. Recharger `/dashboard` (Cmd+R)
4. Vérifier dans Network tab :
   - ✅ Assets servis depuis "(ServiceWorker)" ou "(disk cache)"
   - ✅ Pas d'erreurs réseau pour les assets statiques

**Commande de vérification** :
```javascript
// Vérifier les stratégies de cache
navigator.serviceWorker.ready.then(reg => {
  console.log('SW actif:', reg.active.state);
  console.log('Scope:', reg.scope);
});
```

---

### 7. Navigation Preload

**Objectif** : Vérifier que Navigation Preload est actif

**Étapes** :
1. Console DevTools :
```javascript
navigator.serviceWorker.ready.then(reg => {
  reg.navigationPreload.getState().then(state => {
    console.log('Navigation Preload:', state.enabled ? '✅ Activé' : '❌ Désactivé');
  });
});
```
2. Vérifier : `✅ Activé`

---

### 8. Test de Mise à Jour du SW

**Objectif** : Vérifier le cycle de mise à jour

**Étapes** :
1. Modifier `public/service-worker.js` (changer version : `v3`)
2. Recompiler : `npm run build`
3. Redémarrer : `npm start`
4. Recharger l'app (ne pas hard refresh)
5. Vérifier :
   - ✅ Notification "Une nouvelle version est disponible"
   - ✅ Bouton "Mettre à jour"
6. Cliquer "Mettre à jour"
7. Vérifier : Page rechargée avec nouveau SW

---

### 9. Test PWA Installation

**Objectif** : Vérifier l'installabilité de l'app

**Test Desktop (Chrome)** :
1. Ouvrir en production
2. Barre d'adresse → Icône "Installer Budget Pro"
3. Cliquer "Installer"
4. Vérifier :
   - ✅ App s'ouvre en fenêtre standalone
   - ✅ Pas de barre d'URL
   - ✅ Icônes correctes

**Test Mobile (Android)** :
1. Ouvrir dans Chrome mobile
2. Menu → "Ajouter à l'écran d'accueil"
3. Vérifier :
   - ✅ Icône maskable avec safe zone
   - ✅ Nom "Budget Pro"
   - ✅ Thème color appliqué

---

### 10. Shortcuts PWA (Android)

**Objectif** : Vérifier les raccourcis de l'app

**Étapes** :
1. Installer l'app sur Android
2. Long press sur l'icône
3. Vérifier les 4 shortcuts :
   - ✅ 💰 Transactions
   - ✅ 📊 Rapports
   - ✅ 💳 Dettes
   - ✅ 🎯 Objectifs

**Test manuel** :
```bash
# Vérifier le manifest
curl http://localhost:3000/manifest.webmanifest | jq .shortcuts
```

---

## 🐛 Debugging

### Logs Service Worker
```javascript
// Activer les logs détaillés
localStorage.setItem('debug', 'lh:*');
location.reload();
```

### Clear Cache
```javascript
// Vider tous les caches
caches.keys().then(names => {
  names.forEach(name => caches.delete(name));
});
```

### Unregister SW
```javascript
// Désinscrire le SW
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister());
});
```

---

## ✅ Résultats Attendus

| Test | Statut | Notes |
|------|--------|-------|
| SW Enregistré | ✅ | Version v2 active |
| Précache 9 assets | ✅ | Manifest + 6 icônes + / + /offline |
| Runtime cache pages | ✅ | Dashboard, transactions, etc. |
| Fallback /offline | ✅ | Affiché quand page non en cache |
| Reconnexion auto | ✅ | Indicateur vert + bouton actif |
| CacheFirst assets | ✅ | CSS/JS/Images du cache |
| Navigation Preload | ✅ | Activé pour NetworkFirst |
| Update notification | ✅ | Toast + bouton update |
| PWA installable | ✅ | Desktop + mobile |
| Shortcuts (4) | ✅ | Android long press |

---

## 📱 Test Mobile Réel

**Android** :
1. Déployer sur Firebase Hosting ou serveur public
2. Ouvrir dans Chrome mobile
3. Installer via "Ajouter à l'écran d'accueil"
4. Mode Avion → Tester navigation offline
5. Vérifier Shortcuts
6. Vérifier Material You (Android 12+)

**iOS** :
1. Ouvrir dans Safari mobile
2. Partager → "Sur l'écran d'accueil"
3. Vérifier apple-touch-icon
4. Mode Avion → Tester offline
5. Note : Pas de shortcuts sur iOS

---

## 🚀 Prochaines Étapes

1. ✅ Tests offline réussis → Passer à TWA packaging
2. 📦 Créer assetlinks.json pour Play Store
3. 🔧 Configurer @bubblewrap/cli
4. 📱 Générer APK/AAB
5. 🎨 Préparer assets Play Store (screenshots, feature graphic)
6. 🚀 Publication Play Store

