import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'dart:async';

/// Service pour gérer les traductions dynamiques depuis Firestore
/// Permet aux admins de modifier les traductions sans redéployer l'app
class TranslationService extends ChangeNotifier {
  static final TranslationService _instance = TranslationService._internal();
  factory TranslationService() => _instance;
  TranslationService._internal();

  FirebaseFirestore? get _firestore {
    try {
      return FirebaseFirestore.instance;
    } catch (e) {
      return null;
    }
  }
  
  // Cache local des traductions
  Map<String, Map<String, String>> _translations = {};
  bool _isLoaded = false;
  DateTime? _lastSync;
  StreamSubscription<QuerySnapshot<Map<String, dynamic>>>? _subscription;
  bool _listening = false;

  Map<String, Map<String, String>> get translations => _translations;
  bool get isLoaded => _isLoaded;
  DateTime? get lastSync => _lastSync;
  bool get isListening => _listening;

  /// Lance l'écoute temps réel et charge initialement
  Future<void> startRealtime() async {
    if (_listening || _firestore == null) return;
    _listening = true;
    await loadTranslations();
    _subscription = _firestore!.collection('translations').snapshots().listen((snapshot) {
      final Map<String, Map<String, String>> loaded = {};
      for (var doc in snapshot.docs) {
        final key = doc.id;
        final data = doc.data();
        loaded[key] = {
          'fr': data['fr'] as String? ?? key,
          'en': data['en'] as String? ?? key,
          'status': data['status'] as String? ?? 'active',
          'category': data['category'] as String? ?? 'general',
          'lastModified': (data['lastModified'] as Timestamp?)?.toDate().toIso8601String() ?? '',
          'modifiedBy': data['modifiedBy'] as String? ?? 'system',
        };
      }
      _translations = loaded;
      _isLoaded = true;
      _lastSync = DateTime.now();
      notifyListeners();
    }, onError: (e) {
      debugPrint('⚠️ TranslationService realtime error: $e');
    });
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  /// Charge les traductions depuis Firestore
  Future<void> loadTranslations() async {
    if (_firestore == null) return;
    try {
      final snapshot = await _firestore!.collection('translations').get();
      
      final Map<String, Map<String, String>> loadedTranslations = {};
      
      for (var doc in snapshot.docs) {
        final key = doc.id;
        final data = doc.data();
        loadedTranslations[key] = {
          'fr': data['fr'] as String? ?? key,
          'en': data['en'] as String? ?? key,
          'status': data['status'] as String? ?? 'active',
          'category': data['category'] as String? ?? 'general',
          'lastModified': (data['lastModified'] as Timestamp?)?.toDate().toIso8601String() ?? '',
          'modifiedBy': data['modifiedBy'] as String? ?? 'system',
        };
      }
      
      _translations = loadedTranslations;
      _isLoaded = true;
      _lastSync = DateTime.now();
      notifyListeners();
      
      debugPrint('✓ Loaded ${_translations.length} translations from Firestore');
    } catch (e) {
      debugPrint('⚠️ Error loading translations: $e');
      _isLoaded = true; // Continue with fallback
    }
  }

  /// Stream en temps réel des traductions
  Stream<Map<String, Map<String, String>>> watchTranslations() {
    if (_firestore == null) return Stream.value({});
    return _firestore!.collection('translations').snapshots().map((snapshot) {
      final Map<String, Map<String, String>> translations = {};
      
      for (var doc in snapshot.docs) {
        final key = doc.id;
        final data = doc.data();
        translations[key] = {
          'fr': data['fr'] as String? ?? key,
          'en': data['en'] as String? ?? key,
          'status': data['status'] as String? ?? 'active',
          'category': data['category'] as String? ?? 'general',
        };
      }
      
      return translations;
    });
  }

  /// Ajoute ou met à jour une traduction
  Future<void> saveTranslation({
    required String key,
    required String frenchText,
    required String englishText,
    String category = 'general',
    String status = 'active',
    String? modifiedBy,
  }) async {
    if (_firestore == null) return;
    try {
      await _firestore!.collection('translations').doc(key).set({
        'fr': frenchText,
        'en': englishText,
        'category': category,
        'status': status,
        'lastModified': FieldValue.serverTimestamp(),
        'modifiedBy': modifiedBy ?? 'admin',
        'key': key, // Pour faciliter les recherches
      }, SetOptions(merge: true));

      // Mise à jour du cache local
      _translations[key] = {
        'fr': frenchText,
        'en': englishText,
        'category': category,
        'status': status,
      };
      notifyListeners();
      
      debugPrint('✓ Translation saved: $key');
    } catch (e) {
      debugPrint('⚠️ Error saving translation: $e');
      rethrow;
    }
  }

  /// Supprime une traduction
  Future<void> deleteTranslation(String key) async {
    if (_firestore == null) return;
    try {
      await _firestore!.collection('translations').doc(key).delete();
      _translations.remove(key);
      notifyListeners();
    } catch (e) {
      debugPrint('⚠️ Error deleting translation: $e');
      rethrow;
    }
  }

  /// Importe plusieurs traductions en batch
  Future<void> importTranslations(Map<String, Map<String, String>> translations, {String? modifiedBy}) async {
    if (_firestore == null) return;
    try {
      final batch = _firestore!.batch();
      
      translations.forEach((key, values) {
        final docRef = _firestore!.collection('translations').doc(key);
        batch.set(docRef, {
          'fr': values['fr'] ?? key,
          'en': values['en'] ?? key,
          'category': values['category'] ?? 'general',
          'status': values['status'] ?? 'active',
          'lastModified': FieldValue.serverTimestamp(),
          'modifiedBy': modifiedBy ?? 'admin',
          'key': key,
        }, SetOptions(merge: true));
      });
      
      await batch.commit();
      await loadTranslations(); // Recharger le cache
      
      debugPrint('✓ Imported ${translations.length} translations');
    } catch (e) {
      debugPrint('⚠️ Error importing translations: $e');
      rethrow;
    }
  }

  /// Exporte toutes les traductions
  Future<Map<String, Map<String, String>>> exportTranslations() async {
    if (_firestore == null) return {};
    try {
      final snapshot = await _firestore!.collection('translations').get();
      final Map<String, Map<String, String>> exported = {};
      
      for (var doc in snapshot.docs) {
        final data = doc.data();
        exported[doc.id] = {
          'fr': data['fr'] as String? ?? '',
          'en': data['en'] as String? ?? '',
          'category': data['category'] as String? ?? 'general',
          'status': data['status'] as String? ?? 'active',
        };
      }
      
      return exported;
    } catch (e) {
      debugPrint('⚠️ Error exporting translations: $e');
      return {};
    }
  }

  /// Recherche des traductions par texte ou clé
  Future<List<Map<String, dynamic>>> searchTranslations(String query) async {
    if (_firestore == null) return [];
    try {
      final snapshot = await _firestore!.collection('translations').get();
      final results = <Map<String, dynamic>>[];
      
      final lowerQuery = query.toLowerCase();
      
      for (var doc in snapshot.docs) {
        final data = doc.data();
        final key = doc.id.toLowerCase();
        final fr = (data['fr'] as String? ?? '').toLowerCase();
        final en = (data['en'] as String? ?? '').toLowerCase();
        
        if (key.contains(lowerQuery) || fr.contains(lowerQuery) || en.contains(lowerQuery)) {
          results.add({
            'key': doc.id,
            'fr': data['fr'],
            'en': data['en'],
            'category': data['category'] ?? 'general',
            'status': data['status'] ?? 'active',
            'lastModified': data['lastModified'],
            'modifiedBy': data['modifiedBy'],
          });
        }
      }
      
      return results;
    } catch (e) {
      debugPrint('⚠️ Error searching translations: $e');
      return [];
    }
  }

  /// Récupère la traduction pour une clé et langue donnée
  String? getTranslation(String key, String languageCode) {
    if (!_isLoaded) return null;
    final entry = _translations[key];
    if (entry == null) return null;
    if ((entry['status'] ?? 'active') != 'active') return null;
    final value = entry[languageCode];
    if (value == null || value.isEmpty) return null;
    return value;
  }

  /// Vérifie si une traduction existe
  bool hasTranslation(String key) {
    return _translations.containsKey(key);
  }

  /// Obtient les statistiques des traductions
  Map<String, dynamic> getStats() {
    final total = _translations.length;
    final complete = _translations.values.where((t) => 
      (t['fr']?.isNotEmpty ?? false) && (t['en']?.isNotEmpty ?? false)
    ).length;
    final pending = total - complete;
    
    final categories = <String, int>{};
    for (var translation in _translations.values) {
      final category = translation['category'] ?? 'general';
      categories[category] = (categories[category] ?? 0) + 1;
    }
    
    return {
      'total': total,
      'complete': complete,
      'pending': pending,
      'completionRate': total > 0 ? (complete / total * 100).toStringAsFixed(1) : '0.0',
      'categories': categories,
      'lastSync': _lastSync?.toIso8601String(),
    };
  }
}
