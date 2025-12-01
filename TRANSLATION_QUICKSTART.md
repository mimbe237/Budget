# 🚀 Quick Start - Système de Traduction

## Installation rapide (Admin)

1. **Connexion admin** → https://budget-pro-8e46f.web.app
2. **Menu Admin** → **Traductions**
3. **Cliquer ⚙️** → Initialiser traductions de base
4. **Cliquer 🔍** → Scanner les clés manquantes
5. ✅ **C'est prêt !**

## Code - 3 façons d'utiliser

```dart
// 1. Widget TrText (RECOMMANDÉ - auto-update)
TrText('Mon texte')

// 2. Fonction globale t()
t('Mon texte')

// 3. Extension context
context.tr('Mon texte')
```

## Ajouter une nouvelle traduction

**Option A - Interface admin** :
1. Bouton **+ Nouvelle traduction**
2. Remplir FR + EN
3. Enregistrer

**Option B - Scanner automatique** :
1. Ajouter `TrText('Nouveau texte')` dans le code
2. Interface admin → Scanner 🔍
3. Ajouter les clés manquantes

## Vérification rapide

```dart
// Statut du système
final stats = TranslationService().getStats();
print('Couverture: ${stats['completionRate']}%');

// Nombre de traductions
print('Total: ${stats['total']}');
```

## Règles importantes

✅ **À faire** :
- Utiliser `TrText()` pour tous les textes UI
- Catégoriser correctement (dashboard, auth, etc.)
- Textes courts et descriptifs comme clés

❌ **À éviter** :
- Text() direct sans traduction
- Clés techniques (txt_1, msg_456)
- Oublier la traduction EN

## Dépannage 30 secondes

**Problème** : Traduction ne s'affiche pas  
**Solution** : Admin → Scanner → Ajouter les clés

**Problème** : Affiche la clé au lieu du texte  
**Solution** : Traduction manquante dans Firestore

**Problème** : Changements non visibles  
**Solution** : Recharger avec l'icône ↻

## Support

📖 Guide complet : `TRANSLATION_SYSTEM_GUIDE.md`  
🔧 Code : `lib/services/translation_service.dart`  
🎨 Admin UI : `lib/screens/admin/translation_management_screen.dart`

---
✅ **Système 100% fonctionnel**  
🌍 **FR/EN supportés**  
🔄 **Sync temps réel**  
📱 **Web + Mobile ready**
