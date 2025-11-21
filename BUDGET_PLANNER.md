# 📊 Module de Planification Budgétaire

## Vue d'ensemble
Le module de planification budgétaire permet de définir et gérer la répartition de vos revenus mensuels en différentes catégories avec un objectif d'équilibre à 100%.

## Fichiers Créés

### 1. **`lib/models/budget_plan.dart`**
Modèle de données pour la planification budgétaire.

#### Classe `BudgetPlan`
- `budgetPlanId`: Identifiant unique
- `userId`: Référence utilisateur
- `totalIncome`: Revenu mensuel total
- `categoryAllocations`: Map<String, double> (catégorie → pourcentage)
- Méthodes: `toMap()`, `fromMap()`, `copyWith()`, `getTotalAllocation()`, `isBalanced()`, `getAmountForCategory()`

#### Constantes
- **`DEFAULT_ALLOCATION`**: Répartition par défaut (30/15/10/5/5/10/10/10/5)
- **`DEFAULT_BUDGET_CATEGORIES`**: Catégories avec icônes et noms

### 2. **`lib/screens/budget/budget_planner_screen.dart`**
Interface complète de planification budgétaire.

## Fonctionnalités

### 🎯 Saisie du Revenu
- Champ `TextFormField` pour définir le revenu mensuel
- Recalcul automatique de tous les montants lors du changement
- Validation en temps réel

### 📊 Indicateur de Santé Financière
- **Équilibré (100%)**: Carte verte avec ✓
- **Dépassement (>100%)**: Carte rouge avec ⚠️
- **Sous-allocation (<100%)**: Carte orange avec ℹ️
- Affichage du pourcentage exact

### 🍩 Graphique en Donut (PieChart)
- Visualisation de la répartition actuelle via `fl_chart`
- Changement de couleur si dépassement (rouge)
- Affichage du total au centre
- Sections colorées pour chaque catégorie

### 💰 Liste Interactive des Poches Budgétaires

Chaque catégorie dispose de:
1. **Icône et Nom**: Affichage clair (🏠 Logement, 🍽️ Nourriture, etc.)
2. **Slider**: Curseur de 0% à 100% pour ajuster visuellement
3. **Champ Pourcentage (%)**: Éditable directement
4. **Champ Montant (€)**: Éditable directement
5. **Synchronisation 3-voies**: Modifier l'un met à jour les autres

### 📈 Suivi des Dépenses Réelles
- **Barre de progression**: Affiche dépenses vs budget alloué
- **Indicateur de dépassement**: 
  - Barre verte si dans le budget
  - Barre rouge + icône ⚠️ si dépassement
- **Pourcentage utilisé**: Ex: "450€ / 500€ (90%)"

### 🔄 Répartition par Défaut
Les 9 catégories avec leur allocation:
- 🏠 **Logement**: 30%
- 🍽️ **Nourriture**: 15%
- 🚗 **Transport**: 10%
- 📄 **Factures/Abo**: 5%
- 🏥 **Santé**: 5%
- 💰 **Épargne Sécurité**: 10%
- 📈 **Investissements**: 10%
- 🎮 **Loisirs**: 10%
- 👨‍👩‍👧 **Famille/Dons**: 5%

**Total**: 100%

### ⚙️ Actions Disponibles
1. **Bouton "Réinitialiser"** (AppBar): Retour à la répartition par défaut avec confirmation
2. **Bouton "Par Défaut"** (Liste): Même fonction, accessible facilement
3. **Bouton "Enregistrer"** (FAB): Sauvegarde avec validation du total

## Logique Technique

### Calculs en Temps Réel
```dart
// Modification du slider
onChanged: (value) {
  _allocations[category] = value;
  _updatePercentageField(value);
  _updateAmountField(value);
}

// Modification du pourcentage
onChanged: (value) {
  percentage = parseDouble(value) / 100;
  _updateSlider(percentage);
  _updateAmountField(percentage);
}

// Modification du montant
onChanged: (value) {
  amount = parseDouble(value);
  percentage = amount / totalIncome;
  _updateSlider(percentage);
  _updatePercentageField(percentage);
}
```

### Validation
- **Avant sauvegarde**: Vérifie si total ≠ 100%
- **Dialog de confirmation**: Permet d'enregistrer quand même ou annuler
- **Tolérance**: 0.001 (0.1%) pour gérer les erreurs d'arrondi

### Dépenses Réelles
- Chargées depuis `MockDataService`
- Filtrées par mois/année en cours
- Associées aux catégories budgétaires
- Calcul du pourcentage utilisé

## Intégration

### Dashboard
Bouton "Budget" ajouté dans la section "Performance Mensuelle" du dashboard pour accéder rapidement au planificateur.

### Dépendances
```yaml
fl_chart: ^0.66.0  # Pour les graphiques (PieChart)
```

## Usage

```dart
// Navigation vers le planificateur
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => const BudgetPlannerScreen(),
  ),
);
```

## Points Clés

✅ **Synchronisation 3-voies**: Slider ↔ Pourcentage ↔ Montant  
✅ **Validation visuelle**: Indicateur de santé + graphique  
✅ **Suivi en temps réel**: Dépenses vs Budget  
✅ **UX fluide**: Modifications instantanées avec `setState()`  
✅ **Répartition intelligente**: Modèle par défaut optimisé  
✅ **Alertes visuelles**: Rouge pour dépassements  

## À Faire (TODO)
- [ ] Implémenter la sauvegarde Firestore
- [ ] Ajouter l'ajustement automatique "Smart 100%" (réduire autres catégories)
- [ ] Historique des plans budgétaires
- [ ] Comparaison mois par mois
- [ ] Notifications de dépassement
