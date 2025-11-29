# Schéma Firestore - Collections de Traductions

## Collection: `translations`

Chaque document représente une clé de traduction avec ses valeurs dans différentes langues.

### Document ID
- **Format**: `{key}` (la clé de traduction utilisée dans le code)
- **Exemple**: `welcome_message`, `add_expense`, `budget_planner`

### Champs

| Champ | Type | Description | Exemple |
|-------|------|-------------|---------|
| `key` | string | Clé unique de la traduction | `"welcome_message"` |
| `fr` | string | Texte en français | `"Bienvenue dans Budget Pro"` |
| `en` | string | Texte en anglais | `"Welcome to Budget Pro"` |
| `category` | string | Catégorie de la traduction | `"auth"`, `"dashboard"`, `"budget"` |
| `status` | string | Statut de la traduction | `"active"`, `"pending"`, `"deprecated"` |
| `lastModified` | timestamp | Date de dernière modification | `2024-11-29T10:30:00Z` |
| `modifiedBy` | string | ID ou email de l'admin modificateur | `"admin@beonweb.cm"` |

### Exemple de document

```json
{
  "key": "welcome_message",
  "fr": "Bienvenue dans Budget Pro",
  "en": "Welcome to Budget Pro",
  "category": "auth",
  "status": "active",
  "lastModified": "2024-11-29T10:30:00Z",
  "modifiedBy": "admin@beonweb.cm"
}
```

### Catégories disponibles

- `general` - Textes généraux
- `auth` - Authentification et inscription
- `dashboard` - Tableau de bord
- `transactions` - Transactions et opérations
- `budget` - Planification budgétaire
- `accounts` - Gestion des comptes
- `goals` - Objectifs d'épargne
- `settings` - Paramètres
- `admin` - Administration

### Règles de sécurité Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Traductions - lecture publique, écriture admin uniquement
    match /translations/{translationId} {
      // Tout le monde peut lire les traductions
      allow read: if true;
      
      // Seuls les admins peuvent créer/modifier/supprimer
      allow create, update, delete: if request.auth != null 
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Index recommandés

```json
{
  "collectionGroup": "translations",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "category", "order": "ASCENDING" },
    { "fieldPath": "status", "order": "ASCENDING" },
    { "fieldPath": "lastModified", "order": "DESCENDING" }
  ]
}
```

## Workflow d'utilisation

### 1. Chargement initial
```dart
// Au démarrage de l'app
final translationService = TranslationService();
await translationService.loadTranslations();
```

### 2. Ajout d'une traduction (Admin)
```dart
await translationService.saveTranslation(
  key: 'new_feature_title',
  frenchText: 'Nouvelle fonctionnalité',
  englishText: 'New feature',
  category: 'dashboard',
  status: 'active',
  modifiedBy: 'admin@example.com',
);
```

### 3. Modification d'une traduction
```dart
await translationService.saveTranslation(
  key: 'existing_key',
  frenchText: 'Texte mis à jour',
  englishText: 'Updated text',
  category: 'general',
);
```

### 4. Recherche de traductions
```dart
final results = await translationService.searchTranslations('welcome');
```

### 5. Export de toutes les traductions
```dart
final translations = await translationService.exportTranslations();
// Génère un Map<String, Map<String, String>> pour backup/migration
```

### 6. Import en batch
```dart
final translations = {
  'key1': {'fr': 'Texte 1', 'en': 'Text 1', 'category': 'general'},
  'key2': {'fr': 'Texte 2', 'en': 'Text 2', 'category': 'auth'},
};
await translationService.importTranslations(translations);
```

## Migration depuis les traductions hardcodées

Pour migrer les traductions existantes dans `app_localizations.dart` vers Firestore :

```dart
// Script de migration
Future<void> migrateTranslations() async {
  final service = TranslationService();
  
  // Extraire du dictionnaire _phraseOverrides
  final translations = AppLocalizations._phraseOverrides;
  
  final batch = <String, Map<String, String>>{};
  translations.forEach((fr, en) {
    final key = fr.toLowerCase()
      .replaceAll(' ', '_')
      .replaceAll('\'', '')
      .replaceAll('?', '')
      .replaceAll('!', '');
    
    batch[key] = {
      'fr': fr,
      'en': en,
      'category': 'general',
      'status': 'active',
    };
  });
  
  await service.importTranslations(batch, modifiedBy: 'migration_script');
}
```

## Priorité de chargement

L'AppLocalizations charge les traductions dans cet ordre :

1. **Firestore** (dynamique, modifiable par admin) ← Priorité haute
2. **Dictionnaire local** (_localizedValues) ← Fallback
3. **Traduction automatique** (_autoTranslate) ← Dernier recours

Cela permet aux admins de surcharger n'importe quelle traduction sans redéployer l'app.
