# Optimisation des coûts de l'analyse IA

## 🎯 Problème actuel

La fonctionnalité d'analyse IA utilise l'API Gemini 2.5 Flash et est appelée **sans cache** à chaque chargement de page, ce qui peut entraîner des coûts élevés avec l'usage.

### Coût estimé actuel
- **Par utilisateur actif** : $0.05-0.23/mois
- **100 utilisateurs actifs** : $5-23/mois
- **1000 utilisateurs actifs** : $50-230/mois

## 🔧 Solutions d'optimisation

### 1. ⭐ **Implémenter un cache Firestore** (Recommandé)

Stocker les insights générés dans Firestore avec une durée de validité.

#### Structure de données proposée
```typescript
// Collection: users/{userId}/aiInsights
{
  userId: string;
  insights: string;
  recommendations: string;
  generatedAt: Timestamp;
  expiresAt: Timestamp; // generatedAt + 24h
  dataHash: string; // hash des transactions/budgets pour détecter les changements
  transactionCount: number;
  budgetCount: number;
}
```

#### Logique de mise en cache
```typescript
async function getCachedOrGenerateInsights(userId: string) {
  const db = getAdminFirestore();
  const cacheDoc = await db.doc(`users/${userId}/aiInsights/latest`).get();
  
  if (cacheDoc.exists) {
    const cache = cacheDoc.data();
    const now = Date.now();
    
    // Vérifier si le cache est encore valide (24h)
    if (cache.expiresAt.toMillis() > now) {
      return {
        insights: cache.insights,
        recommendations: cache.recommendations,
        fromCache: true,
      };
    }
  }
  
  // Générer de nouveaux insights
  const result = await getSpendingInsights(...);
  
  // Sauvegarder dans le cache
  await db.doc(`users/${userId}/aiInsights/latest`).set({
    userId,
    insights: result.insights,
    recommendations: result.recommendations,
    generatedAt: Timestamp.now(),
    expiresAt: Timestamp.fromMillis(Date.now() + 24 * 60 * 60 * 1000), // +24h
    dataHash: hashTransactionsAndBudgets(...),
  });
  
  return { ...result, fromCache: false };
}
```

**Économies** : ~80-90% de réduction des appels API
- Au lieu de 3+ appels/jour → 1 appel/24h

---

### 2. 🎯 **Limiter les données envoyées à l'API**

Actuellement, **toutes** les transactions sont envoyées. Limiter à une période récente.

#### Modification dans `ai-insights-wrapper.tsx`
```typescript
// AVANT : Toutes les transactions
const transactionsSnap = await db.collection(`users/${user.uid}/expenses`).get();

// APRÈS : Uniquement les 60 derniers jours
const sixtyDaysAgo = new Date();
sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

const transactionsSnap = await db
  .collection(`users/${user.uid}/expenses`)
  .where('date', '>=', sixtyDaysAgo.toISOString())
  .orderBy('date', 'desc')
  .limit(100) // Maximum 100 transactions
  .get();
```

**Économies** : ~30-50% de réduction de la taille des requêtes
- Tokens envoyés réduits → coût par requête diminué

---

### 3. 🔄 **Génération asynchrone en arrière-plan**

Au lieu de générer les insights à chaque chargement, utiliser une Cloud Function schedulée.

#### Cloud Function (à créer)
```typescript
// functions/src/scheduled/generateAIInsights.ts
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getFirestore } from 'firebase-admin/firestore';

export const generateDailyAIInsights = onSchedule(
  {
    schedule: 'every day 02:00', // 2h du matin
    timeZone: 'Europe/Paris',
  },
  async (event) => {
    const db = getFirestore();
    
    // Récupérer tous les utilisateurs actifs (avec transactions récentes)
    const usersSnapshot = await db.collection('users').get();
    
    for (const userDoc of usersSnapshot.docs) {
      try {
        // Vérifier si l'utilisateur a des transactions récentes
        const recentTransactions = await db
          .collection(`users/${userDoc.id}/expenses`)
          .where('date', '>=', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
          .limit(1)
          .get();
        
        if (recentTransactions.empty) {
          continue; // Pas d'activité récente, skip
        }
        
        // Générer les insights et sauvegarder
        await generateAndCacheInsights(userDoc.id);
        
        console.log(`Generated insights for user ${userDoc.id}`);
      } catch (error) {
        console.error(`Failed to generate insights for user ${userDoc.id}:`, error);
      }
    }
  }
);
```

**Avantages** :
- Pas de latence pour l'utilisateur
- 1 seul appel API par utilisateur par jour
- Insights toujours disponibles instantanément

**Inconvénients** :
- Insights peuvent être décalés de 24h max
- Nécessite une Cloud Function (coût minimal)

---

### 4. 💳 **Système de quotas par utilisateur**

Limiter le nombre de générations IA par utilisateur.

#### Exemple d'implémentation
```typescript
// Collection: users/{userId}/aiUsage
{
  monthlyGenerations: number,
  lastReset: Timestamp,
  plan: 'free' | 'premium', // Si vous avez des plans payants
}

// Quotas
const QUOTAS = {
  free: 10, // 10 générations/mois
  premium: 100, // 100 générations/mois
};

async function checkAndIncrementQuota(userId: string, plan: string): Promise<boolean> {
  const db = getAdminFirestore();
  const usageRef = db.doc(`users/${userId}/aiUsage/current`);
  
  return await db.runTransaction(async (transaction) => {
    const usageDoc = await transaction.get(usageRef);
    
    if (!usageDoc.exists) {
      transaction.set(usageRef, {
        monthlyGenerations: 1,
        lastReset: Timestamp.now(),
        plan,
      });
      return true;
    }
    
    const usage = usageDoc.data();
    const now = Date.now();
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;
    
    // Reset si plus d'un mois
    if (usage.lastReset.toMillis() < monthAgo) {
      transaction.update(usageRef, {
        monthlyGenerations: 1,
        lastReset: Timestamp.now(),
      });
      return true;
    }
    
    // Vérifier le quota
    if (usage.monthlyGenerations >= QUOTAS[plan]) {
      return false; // Quota dépassé
    }
    
    // Incrémenter
    transaction.update(usageRef, {
      monthlyGenerations: usage.monthlyGenerations + 1,
    });
    return true;
  });
}
```

---

### 5. 🎨 **Mode "Lite" sans IA pour le Dashboard**

Sur le dashboard, afficher une version simplifiée sans IA, et rediriger vers `/ai-insights` pour l'analyse complète.

#### Modification de `dashboard/page.tsx`
```tsx
// AVANT : Analyse IA automatique
<AIInsightsWrapper />

// APRÈS : Card simple avec CTA
<Card>
  <CardHeader>
    <CardTitle>Analyse IA</CardTitle>
    <CardDescription>
      Obtenez des insights personnalisés sur vos finances
    </CardDescription>
  </CardHeader>
  <CardContent>
    <Button asChild>
      <Link href="/ai-insights">
        <Sparkles className="mr-2 h-4 w-4" />
        Voir mon analyse IA
      </Link>
    </Button>
  </CardContent>
</Card>
```

**Économies** : ~40-60% de réduction des appels
- Dashboard ne génère plus d'insights automatiquement
- Utilisateur décide quand générer

---

## 📊 Comparaison des solutions

| Solution | Économie de coût | Complexité | Impact UX | Recommandation |
|----------|------------------|------------|-----------|----------------|
| **1. Cache Firestore** | 80-90% | Moyenne | Positif | ⭐⭐⭐⭐⭐ |
| **2. Limiter données** | 30-50% | Faible | Neutre | ⭐⭐⭐⭐ |
| **3. Génération async** | 70-85% | Élevée | Neutre/Négatif | ⭐⭐⭐ |
| **4. Quotas utilisateur** | Variable | Moyenne | Négatif | ⭐⭐ |
| **5. Mode Lite dashboard** | 40-60% | Faible | Négatif | ⭐⭐⭐ |

## 🚀 Plan d'action recommandé

### Phase 1 - Quick wins (1-2h)
1. ✅ Implémenter le cache Firestore (24h)
2. ✅ Limiter les transactions à 60 jours + max 100 items

**Impact estimé** : ~85% de réduction des coûts

### Phase 2 - Optimisations avancées (3-5h)
3. ✅ Ajouter un bouton "Rafraîchir l'analyse" pour forcer la régénération
4. ✅ Afficher un badge "Mise à jour il y a X heures"
5. ✅ Invalider le cache automatiquement si transaction ajoutée

### Phase 3 - Scaling (optionnel)
6. ⚠️ Implémenter des quotas si > 1000 utilisateurs actifs
7. ⚠️ Migrer vers génération async si > 5000 utilisateurs actifs

## 📈 Coûts estimés après optimisation

### Avec cache + limite de données
- **Par utilisateur actif** : $0.005-0.02/mois (-90%)
- **100 utilisateurs actifs** : $0.50-2/mois
- **1000 utilisateurs actifs** : $5-20/mois

### Monitoring des coûts
```bash
# Firebase Console > AI Studio > Usage
# Surveiller :
- Nombre de requêtes/jour
- Tokens consommés
- Coût mensuel estimé
```

## 🔍 Détection des abus

Ajouter un monitoring pour détecter les utilisateurs qui abusent :

```typescript
// Cloud Function pour monitorer
export const monitorAIUsage = onSchedule('every 24 hours', async () => {
  const db = getFirestore();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const snapshot = await db
    .collection('users')
    .where('aiInsights.lastGenerated', '>=', yesterday)
    .get();
  
  const usersWithHighUsage = [];
  
  for (const doc of snapshot.docs) {
    const user = doc.data();
    // Compter les générations sur les dernières 24h
    const count = await countRecentGenerations(doc.id);
    
    if (count > 10) { // Plus de 10 générations/jour = suspect
      usersWithHighUsage.push({ userId: doc.id, count });
    }
  }
  
  if (usersWithHighUsage.length > 0) {
    console.warn('Users with high AI usage:', usersWithHighUsage);
    // Envoyer une alerte admin
  }
});
```

---

## ✅ Checklist d'implémentation

- [ ] Créer la collection `aiInsights` dans Firestore
- [ ] Implémenter la fonction `getCachedOrGenerateInsights`
- [ ] Modifier `ai-insights-wrapper.tsx` pour utiliser le cache
- [ ] Modifier `ai-recommendations.tsx` pour utiliser le cache
- [ ] Limiter les transactions à 60 jours max
- [ ] Ajouter un bouton "Rafraîchir" sur `/ai-insights`
- [ ] Afficher un timestamp "Dernière mise à jour"
- [ ] Tester en local avec plusieurs utilisateurs
- [ ] Déployer progressivement (10% → 50% → 100%)
- [ ] Monitorer les coûts dans Firebase Console

---

## 📚 Ressources

- [Tarification Gemini API](https://ai.google.dev/pricing)
- [Firebase Firestore Pricing](https://firebase.google.com/pricing)
- [Genkit Documentation](https://firebase.google.com/docs/genkit)

