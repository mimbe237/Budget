# 🎯 URL CORRECTE POUR PWABUILDER

## ✅ Utiliser cette URL :

```
https://studio--studio-3821270625-cd276.us-central1.hosted.app
```

## ❌ NE PAS utiliser :

```
https://studio-3821270625-cd276.web.app (404 - Firebase Hosting classique vide)
```

---

## 📝 Explication

Votre application Next.js est déployée sur **Firebase App Hosting**, pas sur Firebase Hosting classique.

### Firebase Hosting classique
- URL : `https://studio-3821270625-cd276.web.app`
- Config : `firebase.json` → `"public": "public"`
- Statut : **Vide (404)** - contient seulement les fichiers statiques

### Firebase App Hosting (Correct ✅)
- URL : `https://studio--studio-3821270625-cd276.us-central1.hosted.app`
- Config : `apphosting.yaml`
- Backend : `studio`
- Repository : `mimbe237-Budget`
- Statut : **Actif (200)** - Application Next.js complète avec SSR

---

## 🚀 Actions Immédiates

### 1. Sur PWABuilder.com

Entrez l'URL correcte :
```
https://studio--studio-3821270625-cd276.us-central1.hosted.app
```

### 2. Mettre à jour Capacitor

```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.touchpointinsights.budget',
  appName: 'Budget Pro',
  webDir: 'out',
  server: {
    url: 'https://studio--studio-3821270625-cd276.us-central1.hosted.app',
    cleartext: false,
  },
  // ...
};
```

### 3. Mettre à jour manifest.json

Le manifest.json doit être accessible depuis l'URL App Hosting.
Vérifier : https://studio--studio-3821270625-cd276.us-central1.hosted.app/manifest.json

---

## 📊 Différences Techniques

| Aspect | Firebase Hosting | Firebase App Hosting |
|--------|------------------|----------------------|
| **Type** | Statique (CDN) | SSR Next.js |
| **API Routes** | ❌ Non supporté | ✅ Supporté |
| **SSR** | ❌ Non | ✅ Oui |
| **ISR** | ❌ Non | ✅ Oui |
| **Middleware** | ❌ Non | ✅ Oui |
| **Deploy** | `firebase deploy --only hosting` | Auto via GitHub |
| **Coût** | Gratuit (10GB/mois) | Payant (après quota gratuit) |

---

## ✅ Checklist PWABuilder

Avec l'URL App Hosting correcte, vous devriez avoir :

- ✅ **Manifest** : Détecté
- ✅ **Service Worker** : Actif
- ✅ **HTTPS** : Oui
- ✅ **Icônes** : 7 détectées
- ✅ **Description** : "Gérez votre budget..."
- ✅ **Name** : "Budget Pro - Gestion Finances Personnelles"

---

## 🔄 Pour Référence Future

### Déployer sur App Hosting
```bash
# App Hosting se déploie automatiquement via GitHub
# Chaque push sur la branche main déclenche un déploiement

# Pour forcer un redéploiement :
git commit --allow-empty -m "Trigger App Hosting deployment"
git push origin main
```

### Déployer sur Hosting Classique
```bash
# Si vous voulez utiliser Hosting pour des assets statiques
firebase deploy --only hosting
```

---

**Créé le** : 15 novembre 2025  
**Par** : BEONWEB
