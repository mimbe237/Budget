import 'dart:io';
import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';

/// Script utilitaire pour scanner le code et détecter toutes les clés de traduction
/// Génère automatiquement la liste des textes à traduire
class TranslationKeysScanner {
  static final Set<String> _discoveredKeys = {};
  
  /// Scanne tous les fichiers Dart du projet pour extraire les TrText
  static Future<Map<String, String>> scanProject(String projectPath) async {
    _discoveredKeys.clear();
    final libDir = Directory('$projectPath/lib');
    
    if (!await libDir.exists()) {
      print('❌ Directory lib/ not found');
      return {};
    }
    
    await _scanDirectory(libDir);
    
    print('✓ Found ${_discoveredKeys.length} unique translation keys');
    
    // Retourner sous forme de map avec clé = texte FR
    final Map<String, String> result = {};
    for (var key in _discoveredKeys) {
      result[key] = key; // Par défaut, FR = clé
    }
    
    return result;
  }
  
  /// Scanne récursivement un répertoire
  static Future<void> _scanDirectory(Directory dir) async {
    await for (var entity in dir.list(recursive: false)) {
      if (entity is File && entity.path.endsWith('.dart')) {
        await _scanFile(entity);
      } else if (entity is Directory) {
        // Ignorer certains dossiers
        final dirName = entity.path.split('/').last;
        if (!['build', '.dart_tool', 'android', 'ios', 'web', 'windows', 'linux', 'macos'].contains(dirName)) {
          await _scanDirectory(entity);
        }
      }
    }
  }
  
  /// Scanne un fichier Dart pour extraire les TrText
  static Future<void> _scanFile(File file) async {
    try {
      final content = await file.readAsString();
      
      // Pattern 1: TrText('texte')
      final pattern1 = RegExp("TrText\\s*\\(\\s*['\"]([^'\"]+)['\"]");
      final matches1 = pattern1.allMatches(content);
      for (var match in matches1) {
        final text = match.group(1);
        if (text != null && text.isNotEmpty) {
          _discoveredKeys.add(text);
        }
      }
      
      // Pattern 2: const TrText('texte')
      final pattern2 = RegExp("const\\s+TrText\\s*\\(\\s*['\"]([^'\"]+)['\"]");
      final matches2 = pattern2.allMatches(content);
      for (var match in matches2) {
        final text = match.group(1);
        if (text != null && text.isNotEmpty) {
          _discoveredKeys.add(text);
        }
      }
      
      // Pattern 3: t('texte')
      final pattern3 = RegExp("t\\s*\\(\\s*['\"]([^'\"]+)['\"]");
      final matches3 = pattern3.allMatches(content);
      for (var match in matches3) {
        final text = match.group(1);
        if (text != null && text.isNotEmpty) {
          _discoveredKeys.add(text);
        }
      }
      
      // Pattern 4: context.tr('texte')
      final pattern4 = RegExp("context\\.tr\\s*\\(\\s*['\"]([^'\"]+)['\"]");
      final matches4 = pattern4.allMatches(content);
      for (var match in matches4) {
        final text = match.group(1);
        if (text != null && text.isNotEmpty) {
          _discoveredKeys.add(text);
        }
      }
      
    } catch (e) {
      print('⚠️ Error scanning ${file.path}: $e');
    }
  }
  
  /// Génère un rapport des clés manquantes (présentes dans le code mais pas dans Firestore)
  static Map<String, dynamic> generateMissingKeysReport(
    Map<String, String> scannedKeys,
    Map<String, Map<String, String>> firestoreTranslations,
  ) {
    final missingKeys = <String>[];
    final existingKeys = <String>[];
    
    for (var key in scannedKeys.keys) {
      if (!firestoreTranslations.containsKey(key)) {
        missingKeys.add(key);
      } else {
        existingKeys.add(key);
      }
    }
    
    return {
      'total': scannedKeys.length,
      'existing': existingKeys.length,
      'missing': missingKeys.length,
      'missingKeys': missingKeys,
      'coverage': existingKeys.length / scannedKeys.length * 100,
    };
  }
  
  /// Exporte les clés manquantes au format CSV
  static String exportMissingKeysToCSV(List<String> missingKeys) {
    final buffer = StringBuffer();
    buffer.writeln('key,fr,en,category,status');
    
    for (var key in missingKeys) {
      final category = guessCategory(key);
      buffer.writeln('"$key","$key","","$category","pending"');
    }
    
    return buffer.toString();
  }
  
  /// Devine la catégorie d'une clé basée sur son contenu
  static String guessCategory(String key) {
    final lower = key.toLowerCase();
    
    if (lower.contains('connexion') || lower.contains('inscription') || 
        lower.contains('mot de passe') || lower.contains('email')) {
      return 'auth';
    }
    
    if (lower.contains('dashboard') || lower.contains('accueil') || 
        lower.contains('bienvenue')) {
      return 'dashboard';
    }
    
    if (lower.contains('transaction') || lower.contains('dépense') || 
        lower.contains('revenu') || lower.contains('paiement')) {
      return 'transactions';
    }
    
    if (lower.contains('budget') || lower.contains('allocation') || 
        lower.contains('catégorie')) {
      return 'budget';
    }
    
    if (lower.contains('compte') || lower.contains('solde') || 
        lower.contains('transfert')) {
      return 'accounts';
    }
    
    if (lower.contains('objectif') || lower.contains('épargne') || 
        lower.contains('économie')) {
      return 'goals';
    }
    
    if (lower.contains('paramètre') || lower.contains('notification') || 
        lower.contains('langue') || lower.contains('devise')) {
      return 'settings';
    }
    
    if (lower.contains('admin') || lower.contains('utilisateur')) {
      return 'admin';
    }
    
    return 'general';
  }
  
  /// Widget de monitoring pour afficher les clés manquantes dans l'interface admin
  static Widget buildMissingKeysWidget(
    BuildContext context,
    Map<String, dynamic> report,
  ) {
    final missingKeys = report['missingKeys'] as List<String>;
    final coverage = report['coverage'] as double;
    
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.analytics,
                  color: coverage >= 90 ? Colors.green : Colors.orange,
                ),
                const SizedBox(width: 8),
                Text(
                  'Couverture des traductions: ${coverage.toStringAsFixed(1)}%',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text('Total de clés: ${report['total']}'),
            Text(
              'Clés manquantes: ${report['missing']}',
              style: const TextStyle(color: Colors.red),
            ),
            const SizedBox(height: 16),
            if (missingKeys.isNotEmpty) ...[
              const Text(
                'Clés à traduire:',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 200,
                child: ListView.builder(
                  itemCount: missingKeys.length,
                  itemBuilder: (context, index) {
                    return ListTile(
                      dense: true,
                      leading: const Icon(Icons.warning, size: 16, color: Colors.orange),
                      title: Text(
                        missingKeys[index],
                        style: const TextStyle(fontSize: 13),
                      ),
                      subtitle: Text(
                        guessCategory(missingKeys[index]),
                        style: const TextStyle(fontSize: 11),
                      ),
                    );
                  },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
