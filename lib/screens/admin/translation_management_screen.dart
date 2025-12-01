import 'dart:io';
import 'package:flutter/material.dart';
import '../../services/translation_service.dart';
import '../../constants/app_design.dart';
import 'package:intl/intl.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:budget/l10n/app_localizations.dart';
import '../../utils/translation_keys_scanner.dart';

/// Écran de gestion des traductions pour les admins
/// Permet d'ajouter, modifier et supprimer des traductions dynamiquement
class TranslationManagementScreen extends StatefulWidget {
  const TranslationManagementScreen({super.key});

  @override
  State<TranslationManagementScreen> createState() => _TranslationManagementScreenState();
}

class _TranslationManagementScreenState extends State<TranslationManagementScreen> {
  final TranslationService _translationService = TranslationService();
  final TextEditingController _searchController = TextEditingController();
  
  String _filter = 'all'; // all, pending, complete
  String _categoryFilter = 'all';
  List<String> _categories = ['general', 'auth', 'dashboard', 'transactions', 'budget', 'settings'];
  
  @override
  void initState() {
    super.initState();
    _translationService.loadTranslations();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppDesign.backgroundGrey,
      appBar: AppBar(
        title: const TrText(
          'Gestion des Traductions',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppDesign.primaryIndigo,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.scanner),
            onPressed: _scanForMissingKeys,
            tooltip: 'Scanner les clés',
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => _translationService.loadTranslations(),
            tooltip: 'Recharger',
          ),
          IconButton(
            icon: const Icon(Icons.file_download),
            onPressed: _exportTranslations,
            tooltip: 'Exporter',
          ),
          IconButton(
            icon: const Icon(Icons.file_upload),
            onPressed: _showImportDialog,
            tooltip: 'Importer',
          ),
        ],
      ),
      body: Column(
        children: [
          // Statistiques
          _buildStatsBar(),
          
          // Barre de recherche et filtres
          _buildSearchAndFilters(),
          
          // Liste des traductions
          Expanded(
            child: StreamBuilder<Map<String, Map<String, String>>>(
              stream: _translationService.watchTranslations(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                
                if (snapshot.hasError) {
                  return Center(
                    child: TrText('Erreur: ${snapshot.error}'),
                  );
                }
                
                final translations = snapshot.data ?? {};
                final filtered = _filterTranslations(translations);
                
                if (filtered.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.translate, size: 64, color: Colors.grey[400]),
                        const SizedBox(height: 16),
                        TrText(
                          'Aucune traduction trouvée',
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                      ],
                    ),
                  );
                }
                
                return ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final entry = filtered[index];
                    return _buildTranslationCard(entry);
                  },
                );
              },
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddTranslationDialog,
        backgroundColor: AppDesign.primaryIndigo,
        icon: const Icon(Icons.add),
        label: const TrText('Nouvelle traduction'),
      ),
    );
  }

  Widget _buildStatsBar() {
    final stats = _translationService.getStats();
    
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: _buildStatItem(
              'Total',
              '${stats['total']}',
              Icons.translate,
              AppDesign.primaryIndigo,
            ),
          ),
          Expanded(
            child: _buildStatItem(
              'Complètes',
              '${stats['complete']}',
              Icons.check_circle,
              AppDesign.incomeColor,
            ),
          ),
          Expanded(
            child: _buildStatItem(
              'En attente',
              '${stats['pending']}',
              Icons.pending,
              Colors.orange,
            ),
          ),
          Expanded(
            child: _buildStatItem(
              'Taux',
              '${stats['completionRate']}%',
              Icons.pie_chart,
              AppDesign.primaryPurple,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 24),
        const SizedBox(height: 4),
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: Colors.grey),
        ),
      ],
    );
  }

  Widget _buildSearchAndFilters() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Barre de recherche
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Rechercher par clé ou texte...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        setState(() {});
                      },
                    )
                  : null,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            onChanged: (value) => setState(() {}),
          ),
          
          const SizedBox(height: 12),
          
          // Filtres
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _filter,
                  decoration: InputDecoration(
                    labelText: 'Statut',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'all', child: Text('Toutes')),
                    DropdownMenuItem(value: 'complete', child: Text('Complètes')),
                    DropdownMenuItem(value: 'pending', child: Text('Incomplètes')),
                  ],
                  onChanged: (value) => setState(() => _filter = value ?? 'all'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _categoryFilter,
                  decoration: InputDecoration(
                    labelText: 'Catégorie',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                  items: [
                    const DropdownMenuItem(value: 'all', child: Text('Toutes')),
                    ..._categories.map((cat) => DropdownMenuItem(value: cat, child: Text(cat))),
                  ],
                  onChanged: (value) => setState(() => _categoryFilter = value ?? 'all'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  List<MapEntry<String, Map<String, String>>> _filterTranslations(
    Map<String, Map<String, String>> translations,
  ) {
    var entries = translations.entries.toList();
    
    // Filtre par recherche
    if (_searchController.text.isNotEmpty) {
      final query = _searchController.text.toLowerCase();
      entries = entries.where((e) {
        final key = e.key.toLowerCase();
        final fr = (e.value['fr'] ?? '').toLowerCase();
        final en = (e.value['en'] ?? '').toLowerCase();
        return key.contains(query) || fr.contains(query) || en.contains(query);
      }).toList();
    }
    
    // Filtre par statut
    if (_filter == 'complete') {
      entries = entries.where((e) {
        final fr = e.value['fr'] ?? '';
        final en = e.value['en'] ?? '';
        return fr.isNotEmpty && en.isNotEmpty;
      }).toList();
    } else if (_filter == 'pending') {
      entries = entries.where((e) {
        final fr = e.value['fr'] ?? '';
        final en = e.value['en'] ?? '';
        return fr.isEmpty || en.isEmpty;
      }).toList();
    }
    
    // Filtre par catégorie
    if (_categoryFilter != 'all') {
      entries = entries.where((e) => e.value['category'] == _categoryFilter).toList();
    }
    
    // Tri alphabétique par clé
    entries.sort((a, b) => a.key.compareTo(b.key));
    
    return entries;
  }

  Widget _buildTranslationCard(MapEntry<String, Map<String, String>> entry) {
    final key = entry.key;
    final fr = entry.value['fr'] ?? '';
    final en = entry.value['en'] ?? '';
    final category = entry.value['category'] ?? 'general';
    final isComplete = fr.isNotEmpty && en.isNotEmpty;
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: ExpansionTile(
        leading: Icon(
          isComplete ? Icons.check_circle : Icons.pending,
          color: isComplete ? AppDesign.incomeColor : Colors.orange,
        ),
        title: Text(
          key,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
        ),
        subtitle: Text(
          category,
          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
        ),
        trailing: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: const Icon(Icons.edit, size: 20),
              onPressed: () => _showEditTranslationDialog(key, fr, en, category),
            ),
            IconButton(
              icon: const Icon(Icons.delete, size: 20, color: Colors.red),
              onPressed: () => _confirmDelete(key),
            ),
          ],
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildLanguageRow('🇫🇷 Français', fr),
                const SizedBox(height: 12),
                _buildLanguageRow('🇬🇧 Anglais', en),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLanguageRow(String label, String text) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
        ),
        const SizedBox(height: 4),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppDesign.backgroundGrey,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            text.isNotEmpty ? text : '(vide)',
            style: TextStyle(
              color: text.isNotEmpty ? Colors.black87 : Colors.grey,
              fontStyle: text.isEmpty ? FontStyle.italic : FontStyle.normal,
            ),
          ),
        ),
      ],
    );
  }

  void _showAddTranslationDialog() {
    final keyController = TextEditingController();
    final frController = TextEditingController();
    final enController = TextEditingController();
    String selectedCategory = 'general';
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const TrText('Nouvelle traduction'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: keyController,
                decoration: const InputDecoration(
                  labelText: 'Clé unique',
                  hintText: 'ex: welcome_message',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: selectedCategory,
                decoration: const InputDecoration(
                  labelText: 'Catégorie',
                  border: OutlineInputBorder(),
                ),
                items: _categories.map((cat) => DropdownMenuItem(value: cat, child: Text(cat))).toList(),
                onChanged: (value) => selectedCategory = value ?? 'general',
              ),
              const SizedBox(height: 12),
              TextField(
                controller: frController,
                decoration: const InputDecoration(
                  labelText: '🇫🇷 Texte français',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: enController,
                decoration: const InputDecoration(
                  labelText: '🇬🇧 Texte anglais',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const TrText('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (keyController.text.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: TrText('La clé est requise')),
                );
                return;
              }
              
              try {
                await _translationService.saveTranslation(
                  key: keyController.text.trim(),
                  frenchText: frController.text.trim(),
                  englishText: enController.text.trim(),
                  category: selectedCategory,
                );
                
                if (mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: TrText('Traduction ajoutée avec succès')),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: TrText('Erreur: $e')),
                  );
                }
              }
            },
            child: const TrText('Enregistrer'),
          ),
        ],
      ),
    );
  }

  void _showEditTranslationDialog(String key, String fr, String en, String category) {
    final frController = TextEditingController(text: fr);
    final enController = TextEditingController(text: en);
    String selectedCategory = category;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: TrText('Modifier: $key'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                value: selectedCategory,
                decoration: const InputDecoration(
                  labelText: 'Catégorie',
                  border: OutlineInputBorder(),
                ),
                items: _categories.map((cat) => DropdownMenuItem(value: cat, child: Text(cat))).toList(),
                onChanged: (value) => selectedCategory = value ?? 'general',
              ),
              const SizedBox(height: 12),
              TextField(
                controller: frController,
                decoration: const InputDecoration(
                  labelText: '🇫🇷 Texte français',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: enController,
                decoration: const InputDecoration(
                  labelText: '🇬🇧 Texte anglais',
                  border: OutlineInputBorder(),
                ),
                maxLines: 3,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const TrText('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              try {
                await _translationService.saveTranslation(
                  key: key,
                  frenchText: frController.text.trim(),
                  englishText: enController.text.trim(),
                  category: selectedCategory,
                );
                
                if (mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: TrText('Traduction mise à jour')),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: TrText('Erreur: $e')),
                  );
                }
              }
            },
            child: const TrText('Enregistrer'),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(String key) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const TrText('Supprimer la traduction'),
        content: TrText('Voulez-vous vraiment supprimer "$key" ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const TrText('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              try {
                await _translationService.deleteTranslation(key);
                if (mounted) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: TrText('Traduction supprimée')),
                  );
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: TrText('Erreur: $e')),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const TrText('Supprimer'),
          ),
        ],
      ),
    );
  }

  Future<void> _exportTranslations() async {
    try {
      final translations = await _translationService.exportTranslations();
      // TODO: Implémenter l'export CSV/JSON
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: TrText('${translations.length} traductions exportées')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: TrText('Erreur d\'export: $e')),
        );
      }
    }
  }

  void _showImportDialog() {
    // TODO: Implémenter l'import depuis CSV/JSON
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: TrText('Fonctionnalité d\'import à venir')),
    );
  }

  void _scanForMissingKeys() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const AlertDialog(
        title: TrText('Scan en cours...'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            TrText('Analyse du code source...'),
          ],
        ),
      ),
    );

    () async {
      try {
        // Charger les traductions existantes avant le scan
        await _translationService.loadTranslations();

        // Scanner le projet en entier pour extraire les clés
        final scanned = await TranslationKeysScanner.scanProject(Directory.current.path);

        final report = TranslationKeysScanner.generateMissingKeysReport(
          scanned,
          _translationService.translations,
        );

        if (!mounted) return;
        Navigator.pop(context); // Fermer le dialogue de chargement
        _showScanReportDialog(report);
      } catch (e) {
        if (!mounted) return;
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: TrText('Erreur pendant le scan: $e')),
        );
      }
    }();
  }

  void _showScanReportDialog(Map<String, dynamic> report) {
    final missingKeys = report['missingKeys'] as List<String>;
    final coverage = report['coverage'] as double;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(
              Icons.analytics,
              color: coverage >= 90 ? Colors.green : Colors.orange,
            ),
            const SizedBox(width: 8),
            const TrText('Rapport de scan'),
          ],
        ),
        content: SizedBox(
          width: double.maxFinite,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TrText(
                'Couverture: ${coverage.toStringAsFixed(1)}%',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: coverage >= 90 ? Colors.green : Colors.orange,
                ),
              ),
              const SizedBox(height: 16),
              TrText('Total de clés trouvées: ${report['total']}'),
              TrText('Clés existantes: ${report['existing']}', style: const TextStyle(color: Colors.green)),
              TrText('Clés manquantes: ${report['missing']}', style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 16),
              if (missingKeys.isNotEmpty) ...[
                const TrText(
                  'Exemples de clés manquantes:',
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  height: 150,
                  child: ListView.builder(
                    shrinkWrap: true,
                    itemCount: missingKeys.length,
                    itemBuilder: (context, index) {
                      return ListTile(
                        dense: true,
                        leading: const Icon(Icons.warning, size: 16, color: Colors.orange),
                        title: TrText(
                          missingKeys[index],
                          style: const TextStyle(fontSize: 13),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const TrText('Fermer'),
          ),
          ElevatedButton(
            onPressed: missingKeys.isEmpty ? null : () => _addMissingKeys(missingKeys),
            child: const TrText('Ajouter les clés manquantes'),
          ),
        ],
      ),
    );
  }

  Future<void> _addMissingKeys(List<String> missingKeys) async {
    if (missingKeys.isEmpty) return;

    Navigator.pop(context); // Fermer le rapport

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (_) => const AlertDialog(
        title: TrText('Ajout des clés...'),
        content: Padding(
          padding: EdgeInsets.all(12.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 12),
              TrText('Insertion dans Firestore'),
            ],
          ),
        ),
      ),
    );

    try {
      final batch = <String, Map<String, String>>{};
      for (final key in missingKeys) {
        batch[key] = {
          'fr': key,
          'en': key, // placeholder en attendant traduction
          'category': TranslationKeysScanner.guessCategory(key),
          'status': 'pending',
        };
      }

      await _translationService.importTranslations(batch, modifiedBy: 'admin-scan');
      await _translationService.loadTranslations();

      if (mounted) {
        Navigator.pop(context); // fermer loader
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: TrText('${missingKeys.length} clés ajoutées')),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: TrText('Erreur lors de l\'ajout: $e')),
        );
      }
    }
  }
}
