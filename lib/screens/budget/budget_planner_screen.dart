import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../models/budget_plan.dart';
import '../../services/mock_data_service.dart';
import '../../constants/app_design.dart';

/// Écran de planification budgétaire avec répartition intelligente
class BudgetPlannerScreen extends StatefulWidget {
  const BudgetPlannerScreen({super.key});

  @override
  State<BudgetPlannerScreen> createState() => _BudgetPlannerScreenState();
}

class _BudgetPlannerScreenState extends State<BudgetPlannerScreen> {
  final TextEditingController _incomeController = TextEditingController(text: '3000');
  final MockDataService _mockService = MockDataService();
  
  double _totalIncome = 3000.0;
  Map<String, double> _allocations = Map.from(DEFAULT_ALLOCATION);
  Map<String, double> _actualSpending = {}; // Dépenses réelles par catégorie
  
  // Contrôleurs pour chaque champ de montant
  final Map<String, TextEditingController> _amountControllers = {};
  final Map<String, TextEditingController> _percentageControllers = {};

  @override
  void initState() {
    super.initState();
    _loadActualSpending();
    _initializeControllers();
  }

  void _initializeControllers() {
    for (var category in DEFAULT_BUDGET_CATEGORIES.keys) {
      final percentage = _allocations[category] ?? 0.0;
      final amount = _totalIncome * percentage;
      
      _percentageControllers[category] = TextEditingController(
        text: (percentage * 100).toStringAsFixed(1),
      );
      _amountControllers[category] = TextEditingController(
        text: amount.toStringAsFixed(2),
      );
    }
  }

  void _loadActualSpending() {
    // Simuler les dépenses réelles du mois en cours
    final transactions = _mockService.getMockTransactions();
    final now = DateTime.now();
    
    final Map<String, double> spending = {};
    
    for (var tx in transactions) {
      if (tx.date.month == now.month && tx.date.year == now.year) {
        final categories = _mockService.getMockCategories();
        final category = categories.firstWhere(
          (cat) => cat.categoryId == tx.categoryId,
          orElse: () => categories.first,
        );
        
        final categoryKey = _findCategoryKey(category.name);
        if (categoryKey != null) {
          spending[categoryKey] = (spending[categoryKey] ?? 0.0) + tx.amount;
        }
      }
    }
    
    setState(() {
      _actualSpending = spending;
    });
  }

  String? _findCategoryKey(String categoryName) {
    for (var entry in DEFAULT_BUDGET_CATEGORIES.entries) {
      if (entry.value['name']!.toLowerCase().contains(categoryName.toLowerCase()) ||
          categoryName.toLowerCase().contains(entry.value['name']!.toLowerCase())) {
        return entry.key;
      }
    }
    return null;
  }

  @override
  void dispose() {
    _incomeController.dispose();
    for (var controller in _amountControllers.values) {
      controller.dispose();
    }
    for (var controller in _percentageControllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppDesign.backgroundGrey,
      appBar: AppBar(
        title: const Text(
          'Planification Budgétaire',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: AppDesign.primaryIndigo,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.restore, color: AppDesign.primaryIndigo),
            onPressed: _resetToDefaultAllocation,
            tooltip: 'Réinitialiser',
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(AppDesign.paddingMedium),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildIncomeSection(),
              const SizedBox(height: AppDesign.spacingLarge),
              _buildHealthIndicator(),
              const SizedBox(height: AppDesign.spacingLarge),
              _buildDonutChart(),
              const SizedBox(height: AppDesign.spacingLarge),
              _buildAllocationList(),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _saveBudgetPlan,
        backgroundColor: AppDesign.primaryIndigo,
        icon: const Icon(Icons.save),
        label: const Text('Enregistrer'),
      ),
    );
  }

  Widget _buildIncomeSection() {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppDesign.paddingLarge),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Revenu Mensuel Total',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _incomeController,
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.euro, color: AppDesign.incomeColor),
                suffixText: '€',
                hintText: 'Ex: 3000',
              ),
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
              ],
              onChanged: (value) {
                final newIncome = double.tryParse(value);
                if (newIncome != null && newIncome > 0) {
                  setState(() {
                    _totalIncome = newIncome;
                    _updateAmountsFromPercentages();
                  });
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHealthIndicator() {
    final totalPercentage = _getTotalAllocation();
    final isBalanced = (totalPercentage - 1.0).abs() < 0.001;
    final isOver = totalPercentage > 1.0;

    Color indicatorColor;
    String message;
    IconData icon;

    if (isBalanced) {
      indicatorColor = AppDesign.incomeColor;
      message = 'Budget équilibré à 100% !';
      icon = Icons.check_circle;
    } else if (isOver) {
      indicatorColor = AppDesign.expenseColor;
      message = 'Dépassement : ${(totalPercentage * 100).toStringAsFixed(1)}%';
      icon = Icons.warning;
    } else {
      indicatorColor = Colors.orange;
      message = 'Reste à allouer : ${((1.0 - totalPercentage) * 100).toStringAsFixed(1)}%';
      icon = Icons.info;
    }

    return Card(
      elevation: 4,
      color: indicatorColor.withOpacity(0.1),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
        side: BorderSide(color: indicatorColor, width: 2),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppDesign.paddingMedium),
        child: Row(
          children: [
            Icon(icon, color: indicatorColor, size: 32),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Santé Financière',
                    style: TextStyle(
                      fontSize: 14,
                      color: indicatorColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    message,
                    style: TextStyle(
                      fontSize: 18,
                      color: indicatorColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDonutChart() {
    final totalPercentage = _getTotalAllocation();
    final isOver = totalPercentage > 1.0;

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppDesign.paddingLarge),
        child: Column(
          children: [
            const Text(
              'Répartition Visuelle',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              height: 250,
              child: PieChart(
                PieChartData(
                  sectionsSpace: 2,
                  centerSpaceRadius: 60,
                  sections: _buildPieChartSections(isOver),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              'Total: ${(totalPercentage * 100).toStringAsFixed(1)}%',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: isOver ? AppDesign.expenseColor : AppDesign.primaryIndigo,
              ),
            ),
          ],
        ),
      ),
    );
  }

  List<PieChartSectionData> _buildPieChartSections(bool isOver) {
    final colors = [
      Colors.blue,
      Colors.green,
      Colors.orange,
      Colors.purple,
      Colors.pink,
      Colors.teal,
      Colors.amber,
      Colors.indigo,
      Colors.cyan,
    ];

    int index = 0;
    return _allocations.entries.map((entry) {
      final percentage = entry.value;
      final color = isOver ? AppDesign.expenseColor : colors[index % colors.length];
      index++;

      return PieChartSectionData(
        value: percentage * 100,
        title: '${(percentage * 100).toStringAsFixed(0)}%',
        radius: 80,
        titleStyle: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
        color: color,
      );
    }).toList();
  }

  Widget _buildAllocationList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Poches Budgétaires',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            TextButton.icon(
              onPressed: _resetToDefaultAllocation,
              icon: const Icon(Icons.refresh),
              label: const Text('Par Défaut'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        ...DEFAULT_BUDGET_CATEGORIES.entries.map((entry) {
          return _buildAllocationItem(
            entry.key,
            entry.value['icon']!,
            entry.value['name']!,
          );
        }).toList(),
      ],
    );
  }

  Widget _buildAllocationItem(String categoryKey, String icon, String name) {
    final percentage = _allocations[categoryKey] ?? 0.0;
    final amount = _totalIncome * percentage;
    final actualSpent = _actualSpending[categoryKey] ?? 0.0;
    final isOverBudget = actualSpent > amount;
    final spentPercentage = amount > 0 ? (actualSpent / amount).clamp(0.0, 1.0) : 0.0;

    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: AppDesign.spacingMedium),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppDesign.paddingMedium),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // En-tête avec icône et nom
            Row(
              children: [
                Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: AppDesign.primaryIndigo.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Center(
                    child: Text(icon, style: const TextStyle(fontSize: 24)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      if (actualSpent > 0)
                        Text(
                          'Dépensé: ${actualSpent.toStringAsFixed(2)} €',
                          style: TextStyle(
                            fontSize: 12,
                            color: isOverBudget ? AppDesign.expenseColor : Colors.grey[600],
                          ),
                        ),
                    ],
                  ),
                ),
                if (isOverBudget)
                  const Icon(
                    Icons.warning_amber_rounded,
                    color: AppDesign.expenseColor,
                    size: 28,
                  ),
              ],
            ),
            const SizedBox(height: 12),
            
            // Slider
            Slider(
              value: percentage,
              min: 0.0,
              max: 1.0,
              divisions: 100,
              label: '${(percentage * 100).toStringAsFixed(0)}%',
              activeColor: isOverBudget ? AppDesign.expenseColor : AppDesign.primaryIndigo,
              onChanged: (value) {
                setState(() {
                  _adjustAllocations(categoryKey, value);
                });
              },
            ),
            
            // Champs de saisie
            Row(
              children: [
                // Pourcentage
                Expanded(
                  flex: 2,
                  child: TextFormField(
                    controller: _percentageControllers[categoryKey],
                    decoration: const InputDecoration(
                      suffixText: '%',
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,1}')),
                    ],
                    onChanged: (value) {
                      final newPercentage = double.tryParse(value);
                      if (newPercentage != null) {
                        setState(() {
                          _adjustAllocations(categoryKey, newPercentage / 100.0);
                        });
                      }
                    },
                  ),
                ),
                const SizedBox(width: 8),
                // Montant
                Expanded(
                  flex: 3,
                  child: TextFormField(
                    controller: _amountControllers[categoryKey],
                    decoration: const InputDecoration(
                      suffixText: '€',
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    ),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    inputFormatters: [
                      FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                    ],
                    onChanged: (value) {
                      final newAmount = double.tryParse(value);
                      if (newAmount != null && _totalIncome > 0) {
                        setState(() {
                          _adjustAllocations(categoryKey, newAmount / _totalIncome);
                        });
                      }
                    },
                  ),
                ),
              ],
            ),
            
            // Barre de progression des dépenses
            if (actualSpent > 0) ...[
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: spentPercentage,
                  minHeight: 8,
                  backgroundColor: Colors.grey[300],
                  valueColor: AlwaysStoppedAnimation<Color>(
                    isOverBudget ? AppDesign.expenseColor : AppDesign.incomeColor,
                  ),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${actualSpent.toStringAsFixed(2)} € / ${amount.toStringAsFixed(2)} € (${(spentPercentage * 100).toStringAsFixed(0)}%)',
                style: TextStyle(
                  fontSize: 12,
                  color: isOverBudget ? AppDesign.expenseColor : Colors.grey[600],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _adjustAllocations(String changedKey, double newValue) {
    // 1. Calculer la différence
    final oldValue = _allocations[changedKey] ?? 0.0;
    final diff = newValue - oldValue;
    
    // Si pas de changement, on sort
    if (diff.abs() < 0.0001) return;

    // 2. Mettre à jour la valeur modifiée
    _allocations[changedKey] = newValue;
    _updateController(changedKey, newValue);

    // 3. Calculer le reste à distribuer (pour que total = 1.0)
    // On veut réduire les autres catégories de 'diff'
    // Ex: Si on augmente de +0.10, on doit retirer 0.10 aux autres
    
    final otherKeys = _allocations.keys.where((k) => k != changedKey).toList();
    if (otherKeys.isEmpty) return;

    // Calculer le total des autres catégories
    double othersTotal = 0.0;
    for (var key in otherKeys) {
      othersTotal += _allocations[key]!;
    }

    // Si les autres sont à 0, on ne peut rien retirer -> on force le dépassement (ou on tape dans une catégorie tampon si on en avait une)
    // Ici, on va essayer de répartir proportionnellement
    
    if (othersTotal > 0) {
      for (var key in otherKeys) {
        final currentVal = _allocations[key]!;
        // Part de cette catégorie dans le total des "autres"
        final share = currentVal / othersTotal;
        
        // On retire proportionnellement la différence
        // Si diff est positif (augmentation), on retire. Si négatif (baisse), on ajoute.
        double newVal = currentVal - (diff * share);
        
        // Protection contre les valeurs négatives
        if (newVal < 0) newVal = 0;
        
        _allocations[key] = newVal;
        _updateController(key, newVal);
      }
    }
    
    // Petit fix final pour les erreurs d'arrondi si besoin (optionnel)
  }

  void _updateController(String key, double value) {
    _percentageControllers[key]!.text = (value * 100).toStringAsFixed(1);
    _amountControllers[key]!.text = (_totalIncome * value).toStringAsFixed(2);
  }

  void _updateAmountsFromPercentages() {
    for (var entry in _allocations.entries) {
      final amount = _totalIncome * entry.value;
      _amountControllers[entry.key]!.text = amount.toStringAsFixed(2);
    }
  }

  double _getTotalAllocation() {
    return _allocations.values.fold(0.0, (sum, value) => sum + value);
  }

  void _resetToDefaultAllocation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Réinitialiser le Budget'),
        content: const Text(
          'Voulez-vous appliquer la répartition par défaut (30/15/10/5/5/10/10/10/5) ?\n\nCela remplacera votre configuration actuelle.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () {
              setState(() {
                _allocations = Map.from(DEFAULT_ALLOCATION);
                for (var entry in _allocations.entries) {
                  _percentageControllers[entry.key]!.text = (entry.value * 100).toStringAsFixed(1);
                  _amountControllers[entry.key]!.text = (_totalIncome * entry.value).toStringAsFixed(2);
                }
              });
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Budget réinitialisé avec succès !')),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppDesign.primaryIndigo,
            ),
            child: const Text('Appliquer'),
          ),
        ],
      ),
    );
  }

  void _saveBudgetPlan() {
    final totalPercentage = _getTotalAllocation();
    
    if ((totalPercentage - 1.0).abs() > 0.01) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Budget Déséquilibré'),
          content: Text(
            'Le total de votre budget est de ${(totalPercentage * 100).toStringAsFixed(1)}%.\n\n'
            'Voulez-vous enregistrer quand même ou ajuster pour atteindre 100% ?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Annuler'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                _performSave();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppDesign.primaryIndigo,
              ),
              child: const Text('Enregistrer'),
            ),
          ],
        ),
      );
    } else {
      _performSave();
    }
  }

  void _performSave() {
    // TODO: Sauvegarder dans Firestore
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Budget enregistré avec succès !'),
        backgroundColor: AppDesign.incomeColor,
      ),
    );
  }
}
