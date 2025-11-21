# 🚀 Déploiement de l'optimisation du cache IA

## Pré-requis

- [x] Code implémenté et testé localement
- [ ] Variables d'environnement configurées
- [ ] Accès Firebase avec droits de déploiement
- [ ] Application Next.js fonctionnelle

## 📋 Étapes de déploiement

### 1. Vérification locale

```bash
# Tester le script de cache
node scripts/test-ai-cache.js

# Vérifier qu'il n'y a pas d'erreurs TypeScript
npm run build

# Tester localement
npm run dev
```

**Vérifications** :
- ✅ Le script de test passe tous les tests
- ✅ Le build réussit sans erreur
- ✅ L'application démarre correctement

### 2. Déployer les règles Firestore

```bash
# Déployer uniquement les règles
firebase deploy --only firestore:rules

# Vérifier le déploiement
firebase firestore:rules --list
```

**Vérifications** :
- ✅ Les règles sont déployées sans erreur
- ✅ La nouvelle collection `aiInsights` est protégée

### 3. Test manuel en développement

Avant de déployer en production, tester le cache :

```bash
# 1. Lancer l'app en dev
npm run dev

# 2. Se connecter avec un compte test
# 3. Aller sur /dashboard
#    → Vérifier dans les logs : "[AIInsights] Generating new insights"
#    → Vérifier dans Firestore : users/{userId}/aiInsights/latest créé

# 4. Recharger /dashboard
#    → Vérifier dans les logs : "[AIInsights] Using cached insights"

# 5. Ajouter une transaction
# 6. Recharger /dashboard
#    → Vérifier : "Data changed" → nouvelle génération

# 7. Aller sur /ai-insights
#    → Vérifier : bouton "Actualiser l'analyse" présent
#    → Cliquer dessus
#    → Vérifier : rechargement + nouveaux insights
```

### 4. Déploiement en production

```bash
# Build production
npm run build

# Déployer l'application
firebase deploy --only hosting

# OU si vous utilisez Cloud Functions
firebase deploy
```

### 5. Vérification post-déploiement

#### a) Vérifier Firestore

1. Ouvrir Firebase Console > Firestore Database
2. Chercher : `users > [n'importe quel userId] > aiInsights > latest`
3. Vérifier les champs :
   - ✅ `insights` (string)
   - ✅ `recommendations` (string)
   - ✅ `generatedAt` (timestamp ISO)
   - ✅ `expiresAt` (timestamp ISO, +24h)
   - ✅ `dataHash` (string 64 caractères)
   - ✅ `transactionCount` (number)
   - ✅ `budgetCount` (number)
   - ✅ `modelVersion` (string)

#### b) Vérifier les logs

```bash
# Ouvrir Firebase Console > Functions > Logs
# Ou si vous utilisez Cloud Run : Cloud Run > Logs

# Chercher :
[AI Cache] Cache HIT
[AI Cache] Saved cache
[AIInsights] Using cached insights
```

#### c) Vérifier l'API Gemini

1. Ouvrir [Google AI Studio](https://aistudio.google.com)
2. Aller dans Usage/Quotas
3. Vérifier que le nombre de requêtes diminue

#### d) Test utilisateur

1. Se connecter avec un compte réel
2. Charger `/dashboard` → devrait être instantané (cache)
3. Charger `/reports` → devrait utiliser le même cache
4. Charger `/ai-insights` → devrait afficher les mêmes insights
5. Cliquer "Actualiser l'analyse" → devrait régénérer

### 6. Monitoring continu

#### Métriques à surveiller (première semaine)

```bash
# Firestore Usage (Firebase Console > Firestore > Usage)
# Avant optimisation : ~3-6 lectures/utilisateur/jour
# Après optimisation : ~1-2 lectures/utilisateur/jour

# Gemini API Usage (Google AI Studio > Usage)
# Avant optimisation : ~3-6 requêtes/utilisateur/jour
# Après optimisation : ~0.5-1 requêtes/utilisateur/jour
```

#### Dashboard de monitoring

Créer un tableau de bord pour suivre :

| Métrique | Avant | Après | Objectif | Status |
|----------|-------|-------|----------|--------|
| Requêtes API/jour | ~300 | ~50 | <100 | ✅ |
| Coût mensuel | $27 | $4.5 | <$10 | ✅ |
| Cache hit rate | 0% | 85% | >80% | ✅ |
| Latence moyenne | 2-4s | <500ms | <1s | ✅ |

### 7. Rollback (si nécessaire)

Si des problèmes surviennent :

```bash
# 1. Revenir à la version précédente
git revert HEAD
npm run build
firebase deploy --only hosting

# 2. Ou simplement désactiver le cache en commentant l'import
# Dans ai-insights-wrapper.tsx et ai-recommendations.tsx :
# Commenter les lignes :
# import { getCachedInsights, ... } from '@/lib/ai-cache';
```

## 🔍 Troubleshooting

### Problème : Cache ne se créé pas

**Symptômes** :
- Pas de document `aiInsights/latest` dans Firestore
- Logs : erreurs lors de la sauvegarde

**Solutions** :
1. Vérifier les règles Firestore sont bien déployées
2. Vérifier que l'userId est correct
3. Vérifier les permissions Firebase Admin SDK

### Problème : Cache ne s'invalide pas

**Symptômes** :
- Insights obsolètes après ajout de transactions
- Hash ne change pas

**Solutions** :
1. Vérifier que `generateDataHash` inclut bien tous les IDs
2. Vérifier que les transactions ont des IDs uniques
3. Forcer l'invalidation manuellement :
   ```bash
   # Dans Firebase Console > Firestore
   # Supprimer manuellement users/{userId}/aiInsights/latest
   ```

### Problème : Erreur "Permission denied"

**Symptômes** :
- Erreur lors de la lecture/écriture du cache
- Status 403 dans les logs

**Solutions** :
1. Redéployer les règles Firestore :
   ```bash
   firebase deploy --only firestore:rules
   ```
2. Vérifier que l'utilisateur est bien authentifié
3. Vérifier que l'userId correspond au token auth

### Problème : Performance dégradée

**Symptômes** :
- Latence élevée malgré le cache
- Timeout sur certaines requêtes

**Solutions** :
1. Vérifier la taille du cache (devrait être <10KB)
2. Limiter encore plus les transactions (de 100 à 50)
3. Réduire la durée du cache (de 24h à 12h)

## 📊 Métriques de succès

### Court terme (1 semaine)

- [x] ✅ Déploiement sans erreur
- [ ] 📊 Réduction de 80%+ des appels API Gemini
- [ ] 📊 Cache hit rate >80%
- [ ] 📊 Latence <1s sur /dashboard
- [ ] 📊 Aucune plainte utilisateur

### Moyen terme (1 mois)

- [ ] 💰 Coût mensuel API <$10 pour 100 utilisateurs
- [ ] 📈 Nombre d'utilisateurs actifs stable/croissant
- [ ] 🐛 Aucun bug critique lié au cache
- [ ] ⚡ Performance globale améliorée

### Long terme (3 mois)

- [ ] 💰 Coût mensuel API <$50 pour 1000 utilisateurs
- [ ] 📊 ROI positif (économies > coût de développement)
- [ ] 🚀 Scalabilité validée à 1000+ utilisateurs
- [ ] 🎯 Satisfaction utilisateur maintenue/améliorée

## 🎉 Checklist finale

Avant de marquer comme terminé :

- [ ] ✅ Code déployé en production
- [ ] ✅ Règles Firestore déployées
- [ ] ✅ Tests manuels passés
- [ ] ✅ Cache fonctionne correctement
- [ ] ✅ Bouton refresh fonctionne
- [ ] ✅ Monitoring configuré
- [ ] ✅ Documentation à jour
- [ ] ✅ Équipe informée du changement
- [ ] ✅ Plan de rollback préparé
- [ ] ✅ Métriques de succès définies

## 📚 Ressources

- [Documentation Firebase Firestore](https://firebase.google.com/docs/firestore)
- [Documentation Google Gemini API](https://ai.google.dev/docs)
- [Documentation Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Guide d'optimisation des coûts](./AI_COST_OPTIMIZATION.md)
- [Détails d'implémentation](./AI_CACHE_IMPLEMENTATION.md)

---

**Date de déploiement** : _______________
**Déployé par** : _______________
**Status** : 🟢 Succès / 🟡 En cours / 🔴 Échec
**Notes** : _______________________________________________
