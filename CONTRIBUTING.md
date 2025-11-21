# 🤝 Guide de Contribution

Bienvenue et merci de contribuer à ce projet !

## 📚 Documentation Disponible

Avant de commencer, consultez ces documents :

1. **[README.md](./README.md)** - Documentation principale
2. **[PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)** - Structure du projet
3. **[PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md)** - Résumé et statistiques
4. **[TODO.md](./TODO.md)** - Liste des tâches
5. **[QUICKSTART.md](./QUICKSTART.md)** - Démarrage rapide
6. **[APP_PREVIEW.md](./APP_PREVIEW.md)** - Aperçu de l'UI

## 🎯 Standards de Code

### 1. Nomenclature

#### Fichiers
```dart
// Fichiers : snake_case
user_profile.dart
firestore_service.dart
add_transaction_screen.dart
```

#### Classes
```dart
// Classes : PascalCase
class UserProfile { }
class FirestoreService { }
class AddTransactionScreen { }
```

#### Variables & Fonctions
```dart
// Variables et fonctions : camelCase
String userId;
double totalAmount;
Future<void> addTransaction() { }
```

#### Constantes
```dart
// Constantes : camelCase avec const
const double radiusMedium = 16.0;
const Color primaryIndigo = Color(0xFF6366F1);
```

### 2. Structure des Classes

```dart
/// Documentation de la classe
class ModelName {
  // 1. Propriétés (final en priorité)
  final String id;
  final String name;
  final DateTime createdAt;
  
  // 2. Constructeur
  ModelName({
    required this.id,
    required this.name,
    required this.createdAt,
  });
  
  // 3. Méthodes de sérialisation
  Map<String, dynamic> toMap() { }
  factory ModelName.fromMap(Map<String, dynamic> map) { }
  
  // 4. Méthodes utilitaires
  ModelName copyWith({...}) { }
  
  // 5. Overrides (toString, ==, hashCode)
  @override
  String toString() => 'ModelName(id: $id, name: $name)';
}
```

### 3. Widgets

```dart
/// Documentation du widget
class MyCustomWidget extends StatelessWidget {
  // 1. Propriétés
  final String title;
  final VoidCallback? onTap;
  
  // 2. Constructeur avec Key
  const MyCustomWidget({
    Key? key,
    required this.title,
    this.onTap,
  }) : super(key: key);
  
  // 3. Build method
  @override
  Widget build(BuildContext context) {
    return Container(
      // ...
    );
  }
}
```

### 4. Providers

```dart
class MyProvider with ChangeNotifier {
  // 1. Propriétés privées
  List<Item> _items = [];
  bool _isLoading = false;
  
  // 2. Getters publics
  List<Item> get items => _items;
  bool get isLoading => _isLoading;
  
  // 3. Méthodes publiques
  Future<void> loadItems() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      _items = await _fetchItems();
    } catch (e) {
      // Gérer l'erreur
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
  
  // 4. Méthodes privées
  Future<List<Item>> _fetchItems() async { }
}
```

## 🎨 Standards UI/UX

### 1. Espacements

```dart
// Utiliser les constantes de AppDesign
padding: EdgeInsets.all(AppDesign.spacingMedium), // 16.0
margin: EdgeInsets.symmetric(
  horizontal: AppDesign.spacingLarge, // 24.0
  vertical: AppDesign.spacingSmall,   // 8.0
),
```

### 2. Bordures

```dart
// Utiliser les constantes de bordures
BorderRadius.circular(AppDesign.radiusMedium), // 16.0
decoration: BoxDecoration(
  borderRadius: AppDesign.mediumRadius,
),
```

### 3. Couleurs

```dart
// Utiliser les couleurs du design system
color: AppDesign.primaryIndigo,
backgroundColor: AppDesign.successGreen,

// Ou le thème
color: Theme.of(context).colorScheme.primary,
```

### 4. Typographie

```dart
// Utiliser le thème Material
Text(
  'Titre',
  style: Theme.of(context).textTheme.headlineMedium,
)

// Ou Google Fonts
Text(
  'Custom',
  style: GoogleFonts.inter(
    fontSize: 16,
    fontWeight: FontWeight.w600,
  ),
)
```

## 🧪 Tests

### Tests Unitaires

```dart
// test/models/user_profile_test.dart
void main() {
  group('UserProfile', () {
    test('toMap should convert model to map', () {
      final profile = UserProfile(
        userId: '123',
        displayName: 'Test',
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      
      final map = profile.toMap();
      
      expect(map['userId'], '123');
      expect(map['displayName'], 'Test');
    });
  });
}
```

### Tests de Widget

```dart
// test/widgets/account_card_test.dart
void main() {
  testWidgets('AccountCard displays account info', (tester) async {
    await tester.pumpWidget(
      MaterialApp(
        home: AccountCard(
          name: 'Test Account',
          balance: 1000.0,
          currency: 'EUR',
        ),
      ),
    );
    
    expect(find.text('Test Account'), findsOneWidget);
    expect(find.text('1000.0 EUR'), findsOneWidget);
  });
}
```

## 📝 Commits

### Format des Messages

```
type(scope): description courte

Description détaillée (optionnel)

Footer (optionnel)
```

### Types

- `feat` : Nouvelle fonctionnalité
- `fix` : Correction de bug
- `docs` : Documentation
- `style` : Formatage, sans changement de code
- `refactor` : Refactoring du code
- `test` : Ajout ou modification de tests
- `chore` : Tâches de maintenance

### Exemples

```bash
feat(transactions): add transaction list screen

Implemented the transaction list screen with:
- Filtering by date and category
- Search functionality
- Pull to refresh

Closes #12

---

fix(firestore): handle null values in fromMap

Fixed crash when optional fields are null in Firestore documents

---

docs(readme): update installation instructions

---

style(main): format code with dartfmt
```

## 🔄 Workflow Git

### 1. Créer une Branche

```bash
# Feature branch
git checkout -b feat/add-dashboard

# Bug fix branch
git checkout -b fix/transaction-crash

# Documentation
git checkout -b docs/update-readme
```

### 2. Faire des Commits

```bash
# Ajouter les fichiers
git add .

# Commit avec message formaté
git commit -m "feat(dashboard): add account cards"

# Push vers GitHub
git push origin feat/add-dashboard
```

### 3. Pull Request

1. Créer une Pull Request sur GitHub
2. Décrire les changements
3. Lier les issues concernées
4. Demander une review
5. Attendre l'approbation
6. Merger dans main

## ✅ Checklist avant PR

### Code
- [ ] Code fonctionne sans erreur
- [ ] Pas de warnings importants
- [ ] Formaté avec `dart format`
- [ ] Analysé avec `flutter analyze`
- [ ] Commentaires ajoutés si nécessaire

### Tests
- [ ] Tests unitaires ajoutés/mis à jour
- [ ] Tests de widget ajoutés si applicable
- [ ] Tous les tests passent (`flutter test`)

### Documentation
- [ ] README mis à jour si nécessaire
- [ ] Commentaires de code ajoutés
- [ ] Docstrings pour les méthodes publiques

### UI (si applicable)
- [ ] Testé sur mobile (Android/iOS)
- [ ] Responsive design vérifié
- [ ] Animations fluides
- [ ] Accessibilité considérée

## 🛠️ Commandes Utiles

```bash
# Formater le code
dart format lib/

# Analyser le code
flutter analyze

# Lancer les tests
flutter test

# Vérifier la couverture
flutter test --coverage

# Build
flutter build apk
flutter build ios
flutter build web

# Clean
flutter clean
flutter pub get
```

## 📦 Ajouter une Dépendance

1. Ajouter dans `pubspec.yaml` :
```yaml
dependencies:
  new_package: ^1.0.0
```

2. Installer :
```bash
flutter pub get
```

3. Documenter dans README si nécessaire

## 🎯 Priorités de Développement

Consultez [TODO.md](./TODO.md) pour les tâches prioritaires.

### Phase Actuelle : Onboarding & Dashboard

Focus sur :
1. Écrans d'onboarding
2. Dashboard principal
3. Navigation de base

## 💡 Conseils

### Performance

- Utiliser `const` pour les widgets immutables
- Éviter les `setState()` inutiles
- Utiliser `ListView.builder` pour les listes longues
- Limiter les requêtes Firestore (pagination)

### Sécurité

- Ne jamais commiter de clés API
- Valider les entrées utilisateur
- Utiliser les règles Firestore
- Tester avec des données invalides

### UX

- Feedback visuel pour chaque action
- Loading indicators
- Messages d'erreur clairs
- Animations cohérentes

## 🐛 Rapporter un Bug

Utilisez le template suivant :

```markdown
### Description
[Description claire du bug]

### Étapes pour reproduire
1. Aller à '...'
2. Cliquer sur '...'
3. Observer le problème

### Comportement attendu
[Ce qui devrait se passer]

### Comportement observé
[Ce qui se passe réellement]

### Environnement
- OS: [iOS 16.0 / Android 13]
- Version de l'app: [1.0.0]
- Appareil: [iPhone 14 / Samsung S21]

### Screenshots
[Si applicable]
```

## 💬 Questions ?

- Consultez la [documentation](./README.md)
- Lisez les [issues existantes](https://github.com/username/budget/issues)
- Créez une nouvelle issue

---

**Merci de contribuer à ce projet ! 🎉**
