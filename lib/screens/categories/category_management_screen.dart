import 'package:flutter/material.dart';
import '../../services/firestore_service.dart';
import '../../models/category.dart';
import '../../constants/app_design.dart';
import '../../widgets/revolutionary_logo.dart';
import 'package:budget/l10n/app_localizations.dart';

class CategoryManagementScreen extends StatefulWidget {
  const CategoryManagementScreen({super.key});

  @override
  State<CategoryManagementScreen> createState() => _CategoryManagementScreenState();
}

class _CategoryManagementScreenState extends State<CategoryManagementScreen> {
  final _firestoreService = FirestoreService();

  @override
  Widget build(BuildContext context) {
    final userId = _firestoreService.currentUserId;

    return Scaffold(
      backgroundColor: AppDesign.backgroundGrey,
      appBar: AppBar(
        title: Row(
          children: [
            const RevolutionaryLogo(size: 32),
            const SizedBox(width: 12),
            const TrText(
              'Gérer les Catégories',
              style: TextStyle(fontWeight: FontWeight.bold, color: AppDesign.primaryIndigo),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppDesign.primaryIndigo),
      ),
      body: userId == null
          ? const Center(child: TrText('Veuillez vous connecter.'))
          : StreamBuilder<List<Category>>(
              stream: _firestoreService.getCategoriesStream(userId),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (snapshot.hasError) {
                  return Center(child: TrText('Erreur: ${snapshot.error}'));
                }

                final categories = snapshot.data ?? [];
                
                if (categories.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const TrText('Aucune catégorie trouvée.'),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: () => _openCategoryForm(userId: userId),
                          child: const TrText('Créer ma première catégorie'),
                        ),
                      ],
                    ),
                  );
                }

                // Group by type
                final incomeCategories = categories.where((c) => c.type == CategoryType.income).toList();
                final expenseCategories = categories.where((c) => c.type == CategoryType.expense).toList();

                return ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    if (incomeCategories.isNotEmpty) ...[
                      _buildSectionTitle('Revenus', AppDesign.incomeColor),
                      ...incomeCategories.map((c) => _buildCategoryTile(c, userId)),
                      const SizedBox(height: 24),
                    ],
                    if (expenseCategories.isNotEmpty) ...[
                      _buildSectionTitle('Dépenses', AppDesign.expenseColor),
                      ...expenseCategories.map((c) => _buildCategoryTile(c, userId)),
                    ],
                  ],
                );
              },
            ),
      floatingActionButton: userId == null
          ? null
          : FloatingActionButton.extended(
              onPressed: () => _openCategoryForm(userId: userId),
              backgroundColor: AppDesign.primaryIndigo,
              icon: const Icon(Icons.add, color: Colors.white),
              label: const TrText(
                'Nouvelle Catégorie',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
              ),
            ),
    );
  }

  Widget _buildSectionTitle(String title, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, left: 4),
      child: TrText(
        title,
        style: TextStyle(
          fontSize: 18,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }

  Widget _buildCategoryTile(Category category, String userId) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      elevation: 0,
      child: ListTile(
        leading: Container(
          width: 48,
          height: 48,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: AppDesign.primaryIndigo.withValues(alpha: 0.1),
            shape: BoxShape.circle,
          ),
          child: TrText(
            category.icon,
            style: const TextStyle(fontSize: 24),
          ),
        ),
        title: TrText(
          category.name,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: TrText(
          category.type == CategoryType.income ? 'Revenu' : 'Dépense',
          style: TextStyle(color: Colors.grey[600]),
        ),
        trailing: IconButton(
          icon: const Icon(Icons.edit_outlined, color: Colors.grey),
          onPressed: () => _openCategoryForm(userId: userId, category: category),
        ),
      ),
    );
  }

  Future<void> _openCategoryForm({required String userId, Category? category}) async {
    final nameController = TextEditingController(text: category?.name ?? '');
    final iconController = TextEditingController(text: category?.icon ?? '📁');
    final colorController = TextEditingController(text: category?.color ?? '#4F46E5');
    CategoryType selectedType = category?.type ?? CategoryType.expense;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 16,
                right: 16,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
                top: 16,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TrText(
                    category == null ? 'Ajouter une catégorie' : 'Modifier la catégorie',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      ChoiceChip(
                        label: const TrText('Dépense'),
                        selected: selectedType == CategoryType.expense,
                        onSelected: (_) => setSheetState(() => selectedType = CategoryType.expense),
                        selectedColor: AppDesign.expenseColor.withValues(alpha: 0.2),
                        labelStyle: TextStyle(
                          color: selectedType == CategoryType.expense ? AppDesign.expenseColor : Colors.black,
                        ),
                      ),
                      const SizedBox(width: 8),
                      ChoiceChip(
                        label: const TrText('Revenu'),
                        selected: selectedType == CategoryType.income,
                        onSelected: (_) => setSheetState(() => selectedType = CategoryType.income),
                        selectedColor: AppDesign.incomeColor.withValues(alpha: 0.2),
                        labelStyle: TextStyle(
                          color: selectedType == CategoryType.income ? AppDesign.incomeColor : Colors.black,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: nameController,
                    decoration: InputDecoration(
                      labelText: t('Nom de la catégorie'),
                      prefixIcon: Icon(Icons.label_outline),
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: iconController,
                    decoration: InputDecoration(
                      labelText: t('Icône (emoji ou texte)'),
                      prefixIcon: Icon(Icons.emoji_emotions_outlined),
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: colorController,
                    decoration: InputDecoration(
                      labelText: t('Couleur (hex)'),
                      prefixIcon: Icon(Icons.palette_outlined),
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        if (nameController.text.trim().isEmpty) return;
                        
                        try {
                          if (category == null) {
                            await _firestoreService.addCategory(
                              userId: userId,
                              name: nameController.text.trim(),
                              type: selectedType,
                              icon: iconController.text.isEmpty ? '📁' : iconController.text.trim(),
                              color: colorController.text.isEmpty ? '#4F46E5' : colorController.text.trim(),
                            );
                          } else {
                            await _firestoreService.updateCategory(
                              userId: userId,
                              categoryId: category.categoryId,
                              name: nameController.text.trim(),
                              type: selectedType,
                              icon: iconController.text.isEmpty ? category.icon : iconController.text.trim(),
                              color: colorController.text.isEmpty ? category.color : colorController.text.trim(),
                            );
                          }
                          if (mounted) Navigator.pop(ctx);
                        } catch (e) {
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            SnackBar(content: TrText('Erreur: $e')),
                          );
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppDesign.primaryIndigo,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: TrText(
                        category == null ? 'Créer' : 'Mettre à jour',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}
