# Recommandations IA avec Google Genkit

## Vue d'ensemble

Les recommandations IA utilisent **Google Genkit** et le modèle **Gemini 2.0 Flash** pour analyser les habitudes de dépenses des utilisateurs et fournir des insights personnalisés.

## Fonctionnalités

### 1. Analyse Intelligente des Finances
- **Analyse des KPI** : Revenus, dépenses, solde net, taux d'épargne
- **Détection des tendances** : Variation des dépenses, catégories principales
- **Évaluation des budgets** : Respect des budgets par catégorie
- **Suivi des objectifs** : Progression vers les objectifs d'épargne

### 2. Recommandations Personnalisées
- **Réduction des dépenses** : Suggestions spécifiques par catégorie
- **Optimisation budgétaire** : Réallocation des budgets
- **Stratégies d'épargne** : Actions pour augmenter le taux d'épargne
- **Atteinte des objectifs** : Plans d'action pour atteindre les objectifs plus rapidement

### 3. Insights Contextuels
- **Comparaisons temporelles** : Évolution par rapport aux périodes précédentes
- **Benchmarking** : Comparaison avec les bonnes pratiques financières
- **Alertes préventives** : Détection des dépassements de budget
- **Opportunités d'économie** : Identification des postes à optimiser

## Configuration

### Prérequis
1. **Clé API Google Gemini**
   - Obtenir une clé sur [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Ou utiliser Google Cloud avec une clé API Vertex AI

2. **Variables d'environnement**
   ```bash
   # .env.local
   GEMINI_API_KEY=your_gemini_api_key_here
   # OU
   GOOGLE_API_KEY=your_google_api_key_here
   ```

### Installation des dépendances
```bash
npm install genkit @genkit-ai/google-genai
```

## Architecture

### Composants

#### 1. `AIRecommendations` (Server Component)
- **Fichier** : `src/app/reports/_components/ai-recommendations.tsx`
- **Rôle** : Composant serveur qui appelle Genkit et affiche les résultats
- **Props** :
  - `reportData`: Données financières complètes de l'utilisateur
  - `userProfile`: Profil utilisateur (devise, langue)
  - `isFrench`: Indicateur de langue

#### 2. `getSpendingInsights` (Flow Genkit)
- **Fichier** : `src/ai/flows/spending-insights.ts`
- **Rôle** : Flow Genkit qui analyse les données et génère les insights
- **Input** :
  - `spendingHistory`: Historique des transactions
  - `budgetGoals`: Objectifs budgétaires
- **Output** :
  - `insights`: Analyse des habitudes financières
  - `recommendations`: Recommandations spécifiques

#### 3. Configuration Genkit
- **Fichier** : `src/ai/genkit.ts`
- **Modèle** : `gemini-2.5-flash` (rapide et performant)
- **Fallback** : Messages par défaut si l'API n'est pas configurée

## Utilisation

### Dans la page Reports
Le composant `AIRecommendations` est automatiquement intégré dans le rapport financier :

```tsx
import { AIRecommendations } from './ai-recommendations';

<AIRecommendations
  reportData={reportData}
  userProfile={userProfile}
  isFrench={isFrench}
/>
```

### Données d'entrée
Le composant prépare automatiquement les données pour Genkit :

```typescript
// Contexte financier global
- Revenus totaux
- Dépenses totales
- Solde net
- Variation des dépenses
- Objectifs d'épargne avec progression

// Historique des transactions
Date: Description - Montant [Catégorie] (Type)

// Budgets et réalisation
Catégorie: Budget X, Dépensé Y (Z%)
```

### Exemple de sortie

**Insights** :
- Votre taux d'épargne de 15% est bon mais pourrait être amélioré
- Les dépenses en "Alimentation" ont augmenté de 23% ce mois
- Vous êtes à 85% de votre objectif "Vacances d'été"
- Budget "Transport" dépassé de 12%

**Recommandations** :
1. Réduire les dépenses alimentaires de 200 € en privilégiant les repas maison
2. Ajuster le budget "Transport" de 500 € à 600 € pour plus de réalisme
3. Augmenter l'épargne mensuelle de 100 € pour atteindre l'objectif vacances
4. Revoir les abonnements inutilisés dans "Loisirs"

## Mode développement

### Sans clé API
Si aucune clé API n'est configurée, le système affiche un message par défaut :

```
L'analyse IA est désactivée en environnement local. 
Ajoutez GEMINI_API_KEY pour activer cette fonctionnalité.
```

### Avec clé API
Les recommandations sont générées en temps réel à chaque chargement du rapport.

### Test local avec Genkit DevTools

```bash
# Lancer le serveur de développement Genkit
npx genkit start -- npm run dev

# Ouvrir http://localhost:4000
# Interface pour tester les flows manuellement
```

## Personnalisation

### Modifier le prompt
Éditez `src/ai/flows/spending-insights.ts` pour ajuster le comportement de l'IA :

```typescript
const prompt = ai.definePrompt({
  // ... configuration
  prompt: `Vous êtes un conseiller financier expert...
  
  [Ajoutez vos instructions personnalisées ici]
  `,
});
```

### Ajuster le modèle
Changez le modèle dans `src/ai/genkit.ts` :

```typescript
export const ai = genkit({
  plugins: [googleAI({ apiKey })],
  model: 'googleai/gemini-2.0-flash-exp', // Modèle expérimental
  // model: 'googleai/gemini-1.5-pro', // Plus puissant mais plus lent
});
```

### Ajouter des contextes supplémentaires
Modifiez `ai-recommendations.tsx` pour inclure plus de données :

```typescript
const contextInfo = `
${/* ... données existantes */}

Historique sur 6 mois:
${historicalData}

Comparaison avec objectifs annuels:
${annualGoals}
`;
```

## Performance

- **Temps de réponse** : ~2-5 secondes avec Gemini Flash
- **Coût** : ~0.001-0.005 USD par requête (selon la taille des données)
- **Cache** : Considérer la mise en cache pour les rapports fréquemment consultés
- **Rate limiting** : Respecter les limites de l'API Google (15 req/min gratuit)

## Sécurité

### Données utilisateur
- ✅ Les données financières restent privées
- ✅ Pas de stockage permanent par Google
- ✅ Traitement en temps réel uniquement
- ✅ Conformité RGPD (données transférées temporairement)

### Bonnes pratiques
1. Ne jamais exposer la clé API côté client
2. Utiliser des composants serveur (`'use server'`)
3. Valider les données avant envoi à l'API
4. Gérer les erreurs gracieusement avec fallback
5. Logger les erreurs pour le monitoring

## Dépannage

### Erreur "API key not valid"
- Vérifier que `GEMINI_API_KEY` est définie dans `.env.local`
- Régénérer une nouvelle clé sur Google AI Studio
- Redémarrer le serveur Next.js après modification de `.env.local`

### Erreur "Rate limit exceeded"
- Attendre 1 minute avant de réessayer
- Implémenter un système de retry avec backoff exponentiel
- Considérer un upgrade vers un plan payant

### Réponses en anglais au lieu de français
- Vérifier que `isFrench` est correctement passé
- S'assurer que les données d'entrée sont en français
- Ajuster le prompt pour forcer la langue

### Timeout
- Réduire la quantité de données envoyées
- Limiter le nombre de transactions (ex: 50 dernières)
- Utiliser Gemini Flash au lieu de Pro

## Évolutions futures

### Court terme
- [x] Intégration dans la page Reports
- [ ] Cache des recommandations (24h)
- [ ] Historique des insights précédents
- [ ] Comparaison mois par mois

### Moyen terme
- [ ] Notifications push avec insights hebdomadaires
- [ ] Prédictions de dépenses futures
- [ ] Alertes proactives de dépassement
- [ ] Recommandations d'investissement

### Long terme
- [ ] Assistant conversationnel (chat)
- [ ] Planification financière automatisée
- [ ] Analyse multi-comptes
- [ ] Benchmark avec anonymisation

## Ressources

- [Documentation Genkit](https://firebase.google.com/docs/genkit)
- [Google AI Studio](https://makersuite.google.com/)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Tarification Gemini](https://ai.google.dev/pricing)

## Support

Pour toute question ou problème :
1. Consulter les logs serveur
2. Vérifier la console Genkit DevTools
3. Tester manuellement le flow dans l'interface Genkit
4. Ouvrir une issue sur le repository

---

**Note** : Cette fonctionnalité utilise l'IA générative. Les recommandations sont à titre éducatif uniquement et ne constituent pas des conseils financiers professionnels.
