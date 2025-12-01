# 📚 Guide du Système de Traduction

## Vue d'ensemble

Le système de traduction de Budget Pro est entièrement fonctionnel et permet :
- ✅ Traductions dynamiques depuis Firestore
- ✅ Gestion admin via interface web
- ✅ Scanner automatique des clés manquantes
- ✅ Synchronisation temps réel
- ✅ Support FR/EN avec fallback intelligent
- ✅ Initialisation des traductions de base

## 🚀 Mise en route

### 1. Initialiser les traductions de base

**Via l'interface admin** (recommandé) :
1. Allez sur https://budget-pro-8e46f.web.app
2. Connectez-vous avec un compte admin
3. Menu → **Admin** → **Traductions**
4. Cliquez sur l'icône ⚙️ **Initialiser traductions de base** dans la barre d'outils
5. Confirmez l'ajout des 50+ traductions essentielles

Cela peuplera Firestore avec toutes les clés nécessaires pour l'interface utilisateur de base.

### 2. Scanner le code pour les clés manquantes

1. Dans l'écran **Gestion des Traductions**
2. Cliquez sur l'icône 🔍 **Scanner les clés**
3. Le système analysera tout le code source et trouvera les `TrText()` et `t()`
4. Un rapport s'affichera avec :
   - Nombre total de clés trouvées
   - Clés existantes dans Firestore
   - Clés manquantes
   - Taux de couverture (%)
5. Cliquez sur **Ajouter les clés manquantes** pour les insérer automatiquement

## 📖 Utilisation dans le code

### Widget TrText (recommandé)

```dart
// Simple
TrText('Bonjour')

// Avec style
TrText(
  'Bienvenue sur Budget Pro',
  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
)

// Avec toutes les propriétés Text
TrText(
  'Texte long qui peut déborder...',
  maxLines: 2,
  overflow: TextOverflow.ellipsis,
)
```

**Avantages** :
- Se met à jour automatiquement quand les traductions changent
- Écoute les changements de langue
- Synchronisation temps réel avec Firestore

### Fonction t() (globale)

```dart
// Pour les tooltips, labels, etc.
IconButton(
  icon: Icon(Icons.add),
  tooltip: t('Ajouter une transaction'),
)

// Pour les String en dehors des widgets
final message = t('Opération réussie');
```

### Extension context.tr()

```dart
// Dans un widget avec BuildContext
Text(context.tr('Mon texte'))

// Avec paramètres dynamiques
context.tr('Bonjour {name}', params: {'name': userName})
```

## 🔧 Gestion Admin

### Ajouter une traduction

1. Cliquez sur le bouton **+ Nouvelle traduction**
2. Remplissez :
   - **Clé unique** : identifiant (ex: `welcome_message`)
   - **Catégorie** : general, auth, dashboard, transactions, etc.
   - **Texte français** : "Bienvenue sur Budget Pro"
   - **Texte anglais** : "Welcome to Budget Pro"
3. Enregistrer

### Modifier une traduction

1. Cliquez sur la carte de traduction pour l'ouvrir
2. Cliquez sur l'icône ✏️ **Modifier**
3. Changez les textes FR/EN ou la catégorie
4. Enregistrer

**Note** : Les modifications sont instantanées pour tous les utilisateurs connectés !

### Supprimer une traduction

1. Ouvrez la traduction
2. Cliquez sur l'icône 🗑️ **Supprimer**
3. Confirmez

### Filtrer les traductions

- **Par statut** :
  - Toutes
  - Complètes (FR + EN renseignés)
  - Incomplètes (FR ou EN manquant)
  
- **Par catégorie** :
  - general, auth, dashboard, transactions, budget, accounts, goals, settings, admin

- **Par recherche** : tapez dans la barre de recherche (cherche dans clé, FR et EN)

### Statistiques

Le tableau de bord affiche :
- **Total** : nombre de clés
- **Complètes** : traductions FR+EN
- **En attente** : traductions incomplètes
- **Taux** : pourcentage de complétion

## 🏗️ Architecture technique

### Structure Firestore

```
translations/
  {key}/
    fr: "Texte français"
    en: "English text"
    category: "dashboard"
    status: "active"
    lastModified: Timestamp
    modifiedBy: "admin@example.com"
```

### Flux de traduction

1. **Au démarrage** :
   - `TranslationService().startRealtime()` charge toutes les traductions
   - Écoute en temps réel les changements Firestore

2. **Dans TrText** :
   - Lit depuis le cache `TranslationService`
   - Écoute les changements via `context.watch<TranslationService>()`
   - Se reconstruit automatiquement

3. **Fallback** :
   - Si clé non trouvée dans Firestore → utilise la clé comme texte FR
   - Si langue non supportée → français par défaut

### Services

- **TranslationService** : Gère le cache et la synchro Firestore
- **TranslationKeysScanner** : Scanne le code source pour extraire les clés
- **TranslationInitializer** : Initialise les traductions de base

## 🎯 Bonnes pratiques

### Nommage des clés

✅ **BON**
```dart
TrText('Bienvenue') // Court et descriptif
TrText('Nouvelle Dépense')
TrText('Total du mois')
```

❌ **MAUVAIS**
```dart
TrText('welcome_message_123') // Trop technique
TrText('txt_1') // Pas descriptif
```

### Catégorisation

- `general` : éléments communs (Annuler, Enregistrer, etc.)
- `auth` : connexion, inscription, mot de passe
- `dashboard` : écran d'accueil, statistiques
- `transactions` : revenus, dépenses, transferts
- `budget` : allocation, planification
- `accounts` : comptes bancaires, soldes
- `goals` : objectifs, épargne
- `settings` : paramètres, préférences
- `admin` : gestion administrative

### Performance

- ✅ Le cache local évite les requêtes répétées
- ✅ Synchronisation temps réel uniquement pour l'écran admin
- ✅ Chargement au démarrage : 1 seule requête Firestore
- ✅ TrText optimisé : reconstruction uniquement si traduction change

## 🔒 Sécurité

### Règles Firestore

```javascript
match /translations/{translationId} {
  allow read: if true; // Lecture publique
  allow write: if isAdmin(); // Écriture admin uniquement
}
```

- Tous les utilisateurs peuvent lire les traductions
- Seuls les admins (custom claims) peuvent modifier

### Custom Claims Admin

Pour donner les droits admin à un utilisateur :

```javascript
// Firebase Admin SDK
admin.auth().setCustomUserClaims(uid, { admin: true, role: 'admin' });
```

## 📊 Monitoring

### Vérifier la santé du système

```dart
final health = await TranslationInitializer.checkTranslationHealth();
print(health); 
// {
//   status: 'ok',
//   total: 150,
//   complete: 140,
//   pending: 10,
//   completionRate: '93.3%',
//   isListening: true
// }
```

### Logs

Le système affiche des logs dans la console :
- `✓ Loaded N translations from Firestore`
- `✓ Translation saved: key`
- `⚠️ Error loading translations: ...`

## 🐛 Dépannage

### Les traductions ne s'affichent pas

1. Vérifiez que TranslationService est chargé :
   ```dart
   if (!TranslationService().isLoaded) {
     await TranslationService().loadTranslations();
   }
   ```

2. Vérifiez Firestore :
   - Collection `translations` existe ?
   - Documents avec champs `fr` et `en` ?

3. Vérifiez les règles Firestore (lecture publique activée)

### TrText n'affiche que la clé

C'est normal si :
- La clé n'existe pas dans Firestore (fallback = clé)
- Le champ `fr` ou `en` est vide

**Solution** : Ajoutez la traduction via l'interface admin

### Les modifications ne sont pas visibles

1. Rechargez les traductions :
   ```dart
   await TranslationService().loadTranslations();
   ```

2. Vérifiez que le listener temps réel est actif :
   ```dart
   print(TranslationService().isListening); // devrait être true
   ```

### Scanner ne trouve pas les clés

Le scanner cherche ces patterns :
- `TrText('texte')`
- `const TrText('texte')`
- `t('texte')`
- `context.tr('texte')`

Assurez-vous d'utiliser ces formats.

## 🚀 Prochaines étapes

### Fonctionnalités à venir

- [ ] Export CSV des traductions
- [ ] Import CSV depuis fichier
- [ ] Historique des modifications
- [ ] Support de langues supplémentaires (ES, DE, etc.)
- [ ] Traduction automatique via Google Translate API
- [ ] Validation de format (placeholders {name})
- [ ] Suggestions de traductions similaires

### Améliorations possibles

- [ ] Cache persistant (SharedPreferences)
- [ ] Mode offline avec synchronisation
- [ ] Compression des traductions pour réduire la bande passante
- [ ] Lazy loading par catégorie
- [ ] A/B testing de traductions

## 📞 Support

Pour toute question sur le système de traduction :
1. Consultez ce guide
2. Vérifiez les logs console
3. Testez avec le scanner de clés
4. Utilisez l'initialisation de base pour recommencer

---

**Système de traduction Budget Pro v1.0**  
Dernière mise à jour : 1 décembre 2025
