# ✅ TODO List - Prochaines Étapes

## 🎯 Priorités Immédiates

### 🔥 URGENT - Configuration Firebase
- [ ] Créer un projet Firebase sur console.firebase.google.com
- [ ] Exécuter `flutterfire configure`
- [ ] Vérifier que `google-services.json` et `GoogleService-Info.plist` sont créés
- [ ] Tester la connexion Firebase avec `flutter run`
- [ ] Déployer les règles de sécurité depuis `firestore.rules`

---

## 📱 Phase 2 : Écrans UI (Module par Module)

### Module 1 : Onboarding 🚀 (Priorité HAUTE)

#### Écran 1 : Welcome Screen
- [ ] `lib/screens/onboarding/welcome_screen.dart`
  - [ ] Logo animé
  - [ ] Titre et description
  - [ ] Bouton "Commencer"
  - [ ] Animation d'entrée avec flutter_animate

#### Écran 2 : User Setup Screen
- [ ] `lib/screens/onboarding/user_setup_screen.dart`
  - [ ] Input pour le nom
  - [ ] Sélecteur de devise (EUR, USD, GBP, CHF, etc.)
  - [ ] Bouton "Continuer"
  - [ ] Validation du formulaire

#### Écran 3 : First Account Screen
- [ ] `lib/screens/onboarding/first_account_screen.dart`
  - [ ] Sélecteur de type de compte
  - [ ] Input pour le nom du compte
  - [ ] Input pour le solde initial
  - [ ] Sélecteur d'icône et couleur
  - [ ] Bouton "Créer mon compte"

#### Écran 4 : Onboarding Complete Screen
- [ ] `lib/screens/onboarding/complete_screen.dart`
  - [ ] Animation de succès
  - [ ] Résumé de la configuration
  - [ ] Bouton "Accéder au dashboard"

#### Provider
- [ ] `lib/providers/onboarding_provider.dart`
  - [ ] Gérer l'état du processus d'onboarding
  - [ ] Appeler FirestoreService
  - [ ] Navigation entre les écrans

---

### Module 2 : Dashboard 📊 (Priorité HAUTE)

#### Écran Principal : Home Screen
- [ ] `lib/screens/home/home_screen.dart`
  - [ ] AppBar avec photo de profil
  - [ ] Section "Solde Total" (carte animée)
  - [ ] Liste horizontale des comptes (scrollable)
  - [ ] Section "Transactions Récentes" (5 dernières)
  - [ ] Bottom Navigation Bar

#### Widgets pour Dashboard
- [ ] `lib/widgets/home/balance_card.dart`
  - [ ] Affichage du solde total
  - [ ] Graphique mini sparkline
  - [ ] Animation du montant

- [ ] `lib/widgets/home/account_card.dart`
  - [ ] Carte de compte individuelle
  - [ ] Icône colorée
  - [ ] Nom et solde
  - [ ] Tap pour voir les détails

- [ ] `lib/widgets/home/transaction_list_item.dart`
  - [ ] Ligne de transaction
  - [ ] Catégorie avec icône
  - [ ] Montant coloré (vert/rouge)
  - [ ] Date formatée

#### Provider
- [ ] `lib/providers/dashboard_provider.dart`
  - [ ] Stream des comptes
  - [ ] Stream des transactions récentes
  - [ ] Calcul du solde total

---

### Module 3 : Comptes 💳 (Priorité MOYENNE)

#### Écrans
- [ ] `lib/screens/accounts/accounts_list_screen.dart`
  - [ ] Liste de tous les comptes
  - [ ] Bouton FAB pour ajouter un compte
  - [ ] Tap pour voir les détails

- [ ] `lib/screens/accounts/account_detail_screen.dart`
  - [ ] Détails du compte
  - [ ] Graphique des transactions
  - [ ] Liste des transactions du compte
  - [ ] Boutons Éditer/Supprimer

- [ ] `lib/screens/accounts/add_edit_account_screen.dart`
  - [ ] Formulaire de création/édition
  - [ ] Sélecteur de type
  - [ ] Sélecteur d'icône et couleur
  - [ ] Validation

#### Widgets
- [ ] `lib/widgets/accounts/account_type_selector.dart`
- [ ] `lib/widgets/accounts/icon_color_picker.dart`

#### Provider
- [ ] `lib/providers/accounts_provider.dart`

---

### Module 4 : Transactions 💸 (Priorité HAUTE)

#### Écrans
- [ ] `lib/screens/transactions/transactions_list_screen.dart`
  - [ ] Liste de toutes les transactions
  - [ ] Filtres (date, catégorie, compte, type)
  - [ ] Recherche
  - [ ] Groupement par date

- [ ] `lib/screens/transactions/add_transaction_screen.dart`
  - [ ] Formulaire de transaction
  - [ ] Sélecteur de type (revenu/dépense/transfert)
  - [ ] Montant avec calculatrice
  - [ ] Sélecteur de compte
  - [ ] Sélecteur de catégorie
  - [ ] Date picker
  - [ ] Notes et tags
  - [ ] Bouton "Enregistrer"

- [ ] `lib/screens/transactions/transaction_detail_screen.dart`
  - [ ] Détails complets
  - [ ] Boutons Éditer/Supprimer
  - [ ] Confirmation de suppression

#### Widgets
- [ ] `lib/widgets/transactions/transaction_type_selector.dart`
- [ ] `lib/widgets/transactions/amount_input.dart` (avec calculatrice)
- [ ] `lib/widgets/transactions/category_selector.dart` (grid d'icônes)
- [ ] `lib/widgets/transactions/date_picker_button.dart`
- [ ] `lib/widgets/transactions/transaction_filters.dart`

#### Provider
- [ ] `lib/providers/transactions_provider.dart`
  - [ ] Stream des transactions
  - [ ] Filtres actifs
  - [ ] Ajout/Suppression

---

### Module 5 : Budget & Objectifs 🎯 (Priorité MOYENNE)

#### Écrans
- [ ] `lib/screens/budget/budget_overview_screen.dart`
  - [ ] Liste des budgets par catégorie
  - [ ] Barres de progression
  - [ ] Alertes de dépassement

- [ ] `lib/screens/budget/add_budget_screen.dart`
  - [ ] Sélection de catégorie
  - [ ] Montant du budget
  - [ ] Période (mensuel/annuel)

- [ ] `lib/screens/goals/goals_list_screen.dart`
  - [ ] Liste des objectifs
  - [ ] Progression visuelle
  - [ ] Bouton pour ajouter

- [ ] `lib/screens/goals/add_edit_goal_screen.dart`
  - [ ] Nom de l'objectif
  - [ ] Montant cible
  - [ ] Date limite
  - [ ] Icône et couleur

#### Widgets
- [ ] `lib/widgets/budget/budget_progress_bar.dart`
- [ ] `lib/widgets/goals/goal_card.dart`
- [ ] `lib/widgets/goals/goal_progress_indicator.dart`

#### Provider
- [ ] `lib/providers/goals_provider.dart`

---

### Module 6 : Catégories 📁 (Priorité BASSE)

#### Écrans
- [ ] `lib/screens/categories/categories_screen.dart`
  - [ ] Tabs : Dépenses / Revenus
  - [ ] Liste des catégories
  - [ ] Édition inline

- [ ] `lib/screens/categories/add_edit_category_screen.dart`
  - [ ] Nom de la catégorie
  - [ ] Type (revenu/dépense)
  - [ ] Sélecteur d'icône emoji
  - [ ] Sélecteur de couleur

#### Widgets
- [ ] `lib/widgets/categories/emoji_picker.dart`
- [ ] `lib/widgets/categories/color_picker.dart`

#### Provider
- [ ] `lib/providers/categories_provider.dart`

---

### Module 7 : Dettes/Créances 💰 (Priorité BASSE)

#### Écrans
- [ ] `lib/screens/ious/ious_list_screen.dart`
  - [ ] Tabs : Je dois / On me doit
  - [ ] Liste des IOUs
  - [ ] Statut de paiement

- [ ] `lib/screens/ious/add_edit_iou_screen.dart`
  - [ ] Type (je dois / on me doit)
  - [ ] Informations de la personne
  - [ ] Montant et échéance

- [ ] `lib/screens/ious/iou_detail_screen.dart`
  - [ ] Détails complets
  - [ ] Historique des paiements
  - [ ] Bouton "Enregistrer un paiement"

#### Provider
- [ ] `lib/providers/ious_provider.dart`

---

### Module 8 : Statistiques 📈 (Priorité BASSE)

#### Écrans
- [ ] `lib/screens/stats/stats_screen.dart`
  - [ ] Graphiques mensuels
  - [ ] Dépenses par catégorie (camembert)
  - [ ] Évolution du solde (courbe)
  - [ ] Top catégories
  - [ ] Rapports personnalisés

#### Widgets
- [ ] `lib/widgets/stats/pie_chart.dart` (avec fl_chart)
- [ ] `lib/widgets/stats/line_chart.dart`
- [ ] `lib/widgets/stats/bar_chart.dart`

#### Provider
- [ ] `lib/providers/stats_provider.dart`

---

### Module 9 : Paramètres ⚙️ (Priorité BASSE)

#### Écrans
- [ ] `lib/screens/settings/settings_screen.dart`
  - [ ] Profil utilisateur
  - [ ] Devise
  - [ ] Thème (clair/sombre)
  - [ ] Notifications
  - [ ] Export des données
  - [ ] À propos

- [ ] `lib/screens/settings/profile_edit_screen.dart`
  - [ ] Changer le nom
  - [ ] Photo de profil

#### Provider
- [ ] `lib/providers/settings_provider.dart`

---

## 🧩 Composants Communs (Priorité HAUTE)

### Widgets Réutilisables
- [ ] `lib/widgets/common/custom_app_bar.dart`
- [ ] `lib/widgets/common/custom_button.dart`
- [ ] `lib/widgets/common/custom_text_field.dart`
- [ ] `lib/widgets/common/loading_indicator.dart`
- [ ] `lib/widgets/common/empty_state.dart`
- [ ] `lib/widgets/common/error_state.dart`
- [ ] `lib/widgets/common/custom_bottom_nav_bar.dart`
- [ ] `lib/widgets/common/amount_display.dart` (formateur)
- [ ] `lib/widgets/common/date_display.dart` (formateur)

### Utilities
- [ ] `lib/utils/formatters.dart`
  - [ ] Formatage des montants
  - [ ] Formatage des dates
  - [ ] Formatage des devises

- [ ] `lib/utils/validators.dart`
  - [ ] Validation email
  - [ ] Validation montants
  - [ ] Validation formulaires

- [ ] `lib/utils/helpers.dart`
  - [ ] Calculs de dates
  - [ ] Helpers de navigation
  - [ ] Helpers de couleurs

---

## 🎨 Design & UX (Priorité MOYENNE)

### Animations
- [ ] Transitions de page personnalisées
- [ ] Animations de chargement
- [ ] Animations de succès/erreur
- [ ] Micro-interactions (tap, swipe)

### Responsive Design
- [ ] Adaptation tablette
- [ ] Adaptation web
- [ ] Breakpoints

### Thème
- [ ] Thème clair complet
- [ ] Thème sombre complet
- [ ] Transitions fluides entre thèmes

---

## 🧪 Tests (Priorité BASSE - mais important !)

### Tests Unitaires
- [ ] Tests des modèles
- [ ] Tests du service Firestore
- [ ] Tests des providers
- [ ] Tests des utils

### Tests d'Intégration
- [ ] Flow d'onboarding complet
- [ ] Ajout de transaction
- [ ] Navigation principale

### Tests de Widget
- [ ] Tests des widgets réutilisables
- [ ] Tests des écrans principaux

---

## 📦 Build & Déploiement (Priorité BASSE)

### Configuration
- [ ] Icône de l'application
- [ ] Splash screen
- [ ] Nom de l'application
- [ ] Version et build number

### Android
- [ ] Configuration signing key
- [ ] Build APK
- [ ] Build App Bundle
- [ ] Upload sur Play Store

### iOS
- [ ] Configuration certificates
- [ ] Build IPA
- [ ] Upload sur App Store

### Web
- [ ] Configuration Firebase Hosting
- [ ] Build web
- [ ] Déploiement

---

## 🚀 Features Avancées (Future)

### Notifications
- [ ] Notifications locales (rappels)
- [ ] Notifications push (alertes budget)

### Backup & Sync
- [ ] Export CSV/JSON
- [ ] Import de données
- [ ] Synchronisation multi-devices

### Intelligence
- [ ] Suggestions de catégories (ML)
- [ ] Prédictions de dépenses
- [ ] Insights automatiques

### Social
- [ ] Partage de budgets
- [ ] Comptes partagés
- [ ] Split de factures

---

## 📊 Ordre de Priorité Recommandé

1. **Semaine 1** : Configuration Firebase + Onboarding complet
2. **Semaine 2** : Dashboard + Navigation principale
3. **Semaine 3** : Transactions (ajout/liste/détails)
4. **Semaine 4** : Comptes + Polish UI
5. **Semaine 5** : Budget & Objectifs
6. **Semaine 6** : Stats + Catégories + IOUs
7. **Semaine 7** : Tests + Fixes
8. **Semaine 8** : Build & Déploiement

---

**Total estimé : ~8 semaines pour une v1.0 complète**

Bon courage ! 💪🚀
