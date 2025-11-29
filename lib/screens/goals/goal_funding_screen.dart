import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/currency_service.dart';
import '../../constants/app_design.dart';
import 'package:intl/intl.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../services/firestore_service.dart';
import '../../widgets/modern_page_app_bar.dart';
import '../../widgets/screen_header.dart';
import '../../widgets/app_modal.dart';
import 'package:budget/l10n/app_localizations.dart';

/// Écran de suivi et financement des objectifs d'épargne
class GoalFundingScreen extends StatefulWidget {
  const GoalFundingScreen({super.key});

  @override
  State<GoalFundingScreen> createState() => _GoalFundingScreenState();
}

class _GoalFundingScreenState extends State<GoalFundingScreen> {
  final FirestoreService _firestoreService = FirestoreService();
  List<Goal> _goals = [];
  List<Account> _accounts = [];
  StreamSubscription<List<Goal>>? _goalsSub;
  StreamSubscription<List<Account>>? _accountsSub;
  String? _selectedGoalForHistory;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    final userId = _firestoreService.currentUserId;
    if (userId == null) {
      setState(() {
        _goals = [];
        _accounts = [];
      });
      return;
    }

    _goalsSub?.cancel();
    _accountsSub?.cancel();

    _goalsSub = _firestoreService.getGoalsStream(userId).listen((data) {
      if (mounted) setState(() => _goals = data);
    });

    // S'assurer que des comptes existent (création par défaut si besoin)
    _firestoreService.createDefaultAccounts(userId);

    _accountsSub = _firestoreService.getAccountsStream(userId).listen((data) {
      if (mounted) setState(() => _accounts = data);
    });
  }

  Widget _buildGoalHistory(Goal goal) {
    final currencyService = context.watch<CurrencyService>();
    final entries = <_GoalTx>[];

    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: const [
              TrText(
                'Historique des mouvements',
                style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ...entries.map((e) {
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppDesign.primaryIndigo.withValues(alpha: 0.08),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.savings, size: 16, color: AppDesign.primaryIndigo),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TrText(
                          e.label,
                          style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                        ),
                        TrText(
                          '${e.date.day}/${e.date.month}/${e.date.year}',
                          style: TextStyle(color: Colors.grey[600], fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  TrText(
                    '+${currencyService.formatAmountCompact(e.amount)}',
                    style: const TextStyle(
                      color: AppDesign.incomeColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final activeGoals = _goals.where((g) => g.status == GoalStatus.active).toList();
    final completedGoals = _goals.where((g) => g.status == GoalStatus.completed).toList();
    
    final totalTarget = activeGoals.fold(0.0, (sum, g) => sum + g.targetAmount);
    final totalSaved = activeGoals.fold(0.0, (sum, g) => sum + g.currentAmount);
    final overallProgress = totalTarget > 0 ? totalSaved / totalTarget : 0.0;

    if (_goals.isEmpty) {
      return Scaffold(
        backgroundColor: AppDesign.backgroundGrey,
        appBar: ModernPageAppBar(
          title: t("Objectifs d'Épargne"),
          subtitle: t('Suivez et financez vos projets'),
          icon: Icons.flag_rounded,
          showProfile: true,
          hideLogoOnMobile: true,
          showHome: false,
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppDesign.paddingLarge),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.savings_outlined, size: 48, color: AppDesign.primaryIndigo),
                const SizedBox(height: 12),
                const TrText(
                  'Aucun objectif pour le moment',
                  style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                ),
                const SizedBox(height: 8),
                const TrText(
                  'Ajoutez vos premiers objectifs pour suivre vos économies.',
                  style: TextStyle(color: Colors.grey),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: _showCreateGoalModal,
                  icon: const Icon(Icons.add),
                  label: const TrText('Créer un objectif'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppDesign.primaryIndigo,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppDesign.backgroundGrey,
      appBar: ModernPageAppBar(
        title: t("Objectifs d'Épargne"),
        subtitle: t('Suivez et financez vos projets'),
        icon: Icons.flag_rounded,
        showProfile: true,
        hideLogoOnMobile: true,
        showHome: false,
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(AppDesign.paddingMedium),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildOverallProgressCard(totalSaved, totalTarget, overallProgress),
              const SizedBox(height: AppDesign.spacingLarge),
              
              _buildSectionHeader(
                'Objectifs Actifs',
                Icons.flag,
                activeGoals.length,
              ),
              const SizedBox(height: AppDesign.spacingSmall),
              ...activeGoals.map((goal) => _buildGoalCard(goal)).toList(),
              
              if (completedGoals.isNotEmpty) ...[
                const SizedBox(height: AppDesign.spacingLarge),
                _buildSectionHeader(
                  'Objectifs Atteints',
                  Icons.check_circle,
                  completedGoals.length,
                ),
                const SizedBox(height: AppDesign.spacingSmall),
                ...completedGoals.map((goal) => _buildGoalCard(goal)).toList(),
              ],
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showCreateGoalModal(),
        backgroundColor: AppDesign.primaryIndigo,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const TrText(
          'Nouvel Objectif',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }

  Widget _buildOverallProgressCard(double saved, double target, double progress) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
      ),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [
              AppDesign.primaryIndigo,
              AppDesign.primaryPurple,
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
        ),
        padding: const EdgeInsets.all(AppDesign.paddingLarge),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.auto_graph, color: Colors.white, size: 32),
                SizedBox(width: 12),
                TrText(
                  'Progression Globale',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                const TrText(
                  'Économisé',
                  style: TextStyle(color: Colors.white70, fontSize: 14),
                ),
                TrText(
                  context.watch<CurrencyService>().formatAmountCompact(saved),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                const TrText(
                  'Objectif',
                  style: TextStyle(color: Colors.white70, fontSize: 14),
                ),
                TrText(
                  context.watch<CurrencyService>().formatAmountCompact(target),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 16),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 12,
                backgroundColor: Colors.white30,
                valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
              ),
            ),
            const SizedBox(height: 8),
            TrText(
              '${(progress * 100).toStringAsFixed(1)}% de tous les objectifs',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon, int count) {
    return Row(
      children: [
        Icon(icon, color: AppDesign.primaryIndigo, size: 24),
        const SizedBox(width: 8),
        TrText(
          title,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: AppDesign.primaryIndigo.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: TrText(
            '$count',
            style: const TextStyle(
              fontSize: 12,
              color: AppDesign.primaryIndigo,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildGoalCard(Goal goal) {
    final currency = context.watch<CurrencyService>();
    final progress = goal.targetAmount > 0 
        ? (goal.currentAmount / goal.targetAmount).clamp(0.0, 1.0) 
        : 0.0;
    final remaining = goal.targetAmount - goal.currentAmount;
    final isCompleted = goal.status == GoalStatus.completed;
    
    final daysRemaining = goal.targetDate?.difference(DateTime.now()).inDays ?? 0;
    final isOverdue = daysRemaining < 0 && !isCompleted;

    Color progressColor;
    if (isCompleted) {
      progressColor = Colors.green;
    } else if (progress >= 0.75) {
      progressColor = Colors.blue;
    } else if (progress >= 0.50) {
      progressColor = Colors.orange;
    } else {
      progressColor = AppDesign.primaryIndigo;
    }

    return Card(
      elevation: 3,
      margin: const EdgeInsets.only(bottom: AppDesign.spacingMedium),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
        onTap: isCompleted ? null : () => _showFundGoalModal(goal),
        child: Padding(
          padding: const EdgeInsets.all(AppDesign.paddingMedium),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // En-tête avec icône et nom
              Row(
                children: [
                  Container(
                    width: 60,
                    height: 60,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          Color(
                            int.parse((goal.color ?? '#6366F1').replaceFirst('#', '0xFF')),
                          ),
                          Color(
                            int.parse((goal.color ?? '#6366F1').replaceFirst('#', '0xFF')),
                          ).withValues(alpha: 0.7),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(15),
                    ),
                    child: Center(
                      child: TrText(
                        goal.icon ?? '🎯',
                        style: const TextStyle(fontSize: 32),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: TrText(
                                goal.name,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            if (isCompleted)
                              const Icon(
                                Icons.check_circle,
                                color: Colors.green,
                                size: 28,
                              )
                            else if (isOverdue)
                              const Icon(
                                Icons.warning_amber,
                                color: Colors.orange,
                                size: 28,
                              ),
                            IconButton(
                              icon: const Icon(Icons.receipt_long_outlined, color: Colors.grey),
                              tooltip: t('Historique'),
                              onPressed: () {
                                setState(() {
                                  if (_selectedGoalForHistory == goal.goalId) {
                                    _selectedGoalForHistory = null;
                                  } else {
                                    _selectedGoalForHistory = goal.goalId;
                                  }
                                });
                              },
                            ),
                          ],
                        ),
                        if (goal.description != null)
                          TrText(
                            goal.description!,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              // Montants
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TrText(
                        'Financé',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                      TrText(
                        currency.formatAmount(goal.currentAmount),
                        style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: progressColor,
                        ),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      TrText(
                        'Progression',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                      TrText(
                        '${(progress * 100).toStringAsFixed(1)}%',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: progressColor,
                        ),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      TrText(
                        'Objectif',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                      TrText(
                        currency.formatAmount(goal.targetAmount),
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              // Barre de progression très visible
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: LinearProgressIndicator(
                      value: progress,
                      minHeight: 16,
                      backgroundColor: Colors.grey[300],
                      valueColor: AlwaysStoppedAnimation<Color>(progressColor),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      if (!isCompleted)
                        TrText(
                          'Reste: ${currency.formatAmount(remaining)}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w600,
                          ),
                        )
                      else
                        const TrText(
                          '🎉 Objectif Atteint !',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.green,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      if (goal.targetDate != null)
                        TrText(
                          isOverdue
                              ? 'En retard de ${-daysRemaining} jours'
                              : 'J-$daysRemaining jours',
                          style: TextStyle(
                            fontSize: 12,
                            color: isOverdue ? Colors.orange : Colors.grey[600],
                            fontWeight: isOverdue ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                    ],
                  ),
              ],
            ),
            
            const SizedBox(height: 12),
            if (_selectedGoalForHistory == goal.goalId)
              _buildGoalHistory(goal),
            
            // Bouton Financer
            if (!isCompleted) ...[
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => _showFundGoalModal(goal),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: progressColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                    icon: const Icon(Icons.account_balance_wallet),
                    label: const TrText(
                      'Allouer des Fonds',
                      style: TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _showCreateGoalModal() {
    showAppModal(
      context,
      _firestoreService.currentUserId == null
          ? const Padding(
              padding: EdgeInsets.all(24),
              child: TrText('Connectez-vous pour créer un objectif.'),
            )
          : CreateGoalModal(
              onGoalCreated: (newGoal) async {
                final userId = _firestoreService.currentUserId;
                if (userId == null) return;
                await _firestoreService.addGoal(
                  userId: userId,
                  name: newGoal.name,
                  description: newGoal.description,
                  targetAmount: newGoal.targetAmount,
                  targetDate: newGoal.targetDate ?? DateTime.now().add(const Duration(days: 30)),
                  icon: newGoal.icon,
                  color: newGoal.color,
                );
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: TrText('Objectif créé avec succès !')),
                  );
                }
              },
            ),
    );
  }

  void _showFundGoalModal(Goal goal) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      isDismissible: true,
      enableDrag: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        final userId = _firestoreService.currentUserId;
        if (userId == null) {
          return const Padding(
            padding: EdgeInsets.all(24),
            child: TrText('Connectez-vous pour allouer des fonds.'),
          );
        }
        return FundGoalModal(
          userId: userId,
          goal: goal,
          accounts: _accounts,
          onFundingCompleted: () {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: TrText('Fonds alloués à ${goal.name} !'),
                backgroundColor: AppDesign.incomeColor,
              ),
            );
          },
        );
      },
    );
  }
}

/// Modal pour créer un nouvel objectif
class CreateGoalModal extends StatefulWidget {
  final Function(Goal) onGoalCreated;

  const CreateGoalModal({super.key, required this.onGoalCreated});

  @override
  State<CreateGoalModal> createState() => _CreateGoalModalState();
}

class _CreateGoalModalState extends State<CreateGoalModal> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _amountController = TextEditingController();
  final _descriptionController = TextEditingController();
  
  String _selectedIcon = '🎯';
  DateTime? _targetDate;

  final List<String> _goalIcons = [
    '🎯', '🏝️', '🚗', '🏠', '💍', '💻',
    '📚', '🎓', '🛡️', '✈️', '🎸', '📱',
    '🏋️', '🎨', '🎮', '⚽', '🏖️', '🌎',
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currencyService = context.watch<CurrencyService>();
    return ModalContent(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 12,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle bar
            Center(
              child: Container(
                width: 48,
                height: 5,
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
            const Row(
              children: [
                Icon(Icons.flag, color: AppDesign.primaryIndigo, size: 32),
                SizedBox(width: 12),
                TrText(
                  'Nouvel Objectif',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
                
                // Nom de l'objectif
                TextFormField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    labelText: "Nom de l'objectif",
                    prefixIcon: const Icon(Icons.edit),
                    hintText: 'Ex: Vacances, Voiture...',
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Veuillez entrer un nom';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                
                // Montant cible
                TextFormField(
                  controller: _amountController,
                  decoration: InputDecoration(
                    labelText: 'Montant cible',
                    prefixIcon: const Icon(Icons.savings, color: AppDesign.incomeColor),
                    suffixText: currencyService.currencySymbol,
                  ),
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                  ],
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Veuillez entrer un montant';
                    }
                    if (double.tryParse(value) == null || double.parse(value) <= 0) {
                      return 'Montant invalide';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                
                // Description
                TextFormField(
                  controller: _descriptionController,
                  decoration: InputDecoration(
                    labelText: 'Description (optionnel)',
                    prefixIcon: const Icon(Icons.note),
                  ),
                  maxLines: 2,
                ),
                const SizedBox(height: 16),
                
                // Date cible
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.calendar_today),
                  title: TrText(
                    _targetDate == null
                        ? 'Date cible (optionnel)'
                        : "Cible: ${DateFormat('dd/MM/yyyy').format(_targetDate!)}",
                  ),
                  trailing: _targetDate != null
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            setState(() {
                              _targetDate = null;
                            });
                          },
                        )
                      : null,
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now().add(const Duration(days: 180)),
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 3650)),
                    );
                    if (date != null) {
                      setState(() {
                        _targetDate = date;
                      });
                    }
                  },
                ),
                const SizedBox(height: 16),
                
                // Sélection d'icône
                const TrText(
                  'Icône de l\'objectif',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  height: 120,
                  child: GridView.builder(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 6,
                      mainAxisSpacing: 8,
                      crossAxisSpacing: 8,
                    ),
                    itemCount: _goalIcons.length,
                    itemBuilder: (context, index) {
                      final icon = _goalIcons[index];
                      final isSelected = icon == _selectedIcon;
                      return InkWell(
                        onTap: () {
                          setState(() {
                            _selectedIcon = icon;
                          });
                        },
                        child: Container(
                          decoration: BoxDecoration(
                            color: isSelected
                                ? AppDesign.primaryIndigo.withValues(alpha: 0.1)
                                : Colors.grey[200],
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isSelected
                                  ? AppDesign.primaryIndigo
                                  : Colors.transparent,
                              width: 2,
                            ),
                          ),
                          child: Center(
                            child: TrText(
                              icon,
                              style: const TextStyle(fontSize: 24),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 24),
                
                // Bouton de création
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _createGoal,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppDesign.primaryIndigo,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const TrText(
                      'Créer l\'Objectif',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  void _createGoal() {
    if (_formKey.currentState!.validate()) {
      final amount = double.parse(_amountController.text);
      final now = DateTime.now();
      
      final newGoal = Goal(
        goalId: 'goal_${now.millisecondsSinceEpoch}',
        userId: 'user_1',
        name: _nameController.text,
        targetAmount: amount,
        currentAmount: 0.0,
        status: GoalStatus.active,
        targetDate: _targetDate ?? now.add(const Duration(days: 30)),
        icon: _selectedIcon,
        color: '#6366F1',
        description: _descriptionController.text.isNotEmpty 
            ? _descriptionController.text 
            : null,
        createdAt: now,
        updatedAt: now,
      );

      widget.onGoalCreated(newGoal);
      Navigator.pop(context);
    }
  }
}

/// Modal pour allouer des fonds à un objectif
class FundGoalModal extends StatefulWidget {
  final Goal goal;
  final List<Account> accounts;
  final String userId;
  final VoidCallback onFundingCompleted;

  const FundGoalModal({
    super.key,
    required this.userId,
    required this.goal,
    required this.accounts,
    required this.onFundingCompleted,
  });

  @override
  State<FundGoalModal> createState() => _FundGoalModalState();
}

class _FundGoalModalState extends State<FundGoalModal> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  Account? _selectedAccount;
  bool _isLoading = false;
  final FirestoreService _firestoreService = FirestoreService();

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final remaining = widget.goal.targetAmount - widget.goal.currentAmount;
    final progress = widget.goal.targetAmount > 0 
        ? widget.goal.currentAmount / widget.goal.targetAmount 
        : 0.0;
    final currencyService = context.watch<CurrencyService>();

    return SafeArea(
      top: false,
      child: SingleChildScrollView(
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [AppDesign.primaryIndigo, AppDesign.primaryPurple],
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: TrText(
                      widget.goal.icon ?? '🎯',
                      style: const TextStyle(fontSize: 32),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const TrText(
                          'Allouer des Fonds',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        TrText(
                          widget.goal.name,
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              
              // Info sur la progression
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppDesign.primaryIndigo.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppDesign.primaryIndigo.withValues(alpha: 0.3)),
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const TrText('Financé', style: TextStyle(fontSize: 12)),
                            TrText(
                              currencyService.formatAmount(widget.goal.currentAmount),
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppDesign.primaryIndigo,
                              ),
                            ),
                          ],
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const TrText('Reste', style: TextStyle(fontSize: 12)),
                            TrText(
                              currencyService.formatAmount(remaining),
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: Colors.orange,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: LinearProgressIndicator(
                        value: progress,
                        minHeight: 8,
                        backgroundColor: Colors.grey[300],
                        valueColor: const AlwaysStoppedAnimation<Color>(
                          AppDesign.primaryIndigo,
                        ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    TrText(
                      '${(progress * 100).toStringAsFixed(1)}% atteint',
                      style: const TextStyle(fontSize: 12),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              
              // Compte source
              DropdownButtonFormField<Account>(
                value: _selectedAccount,
                decoration: InputDecoration(
                  labelText: 'Compte source',
                  prefixIcon: Icon(Icons.account_balance_wallet),
                ),
                hint: const TrText('Sélectionner un compte'),
                items: widget.accounts.map((account) {
                  return DropdownMenuItem(
                    value: account,
                    child: Row(
                      children: [
                        TrText(account.icon ?? '💳', style: const TextStyle(fontSize: 20)),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              TrText(account.name),
                              TrText(
                                currencyService.formatAmount(account.balance),
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _selectedAccount = value;
                  });
                },
                validator: (value) {
                  if (value == null) {
                    return 'Veuillez sélectionner un compte';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              
              // Montant à allouer
              TextFormField(
                controller: _amountController,
                decoration: InputDecoration(
                  labelText: t('Montant à allouer'),
                  prefixIcon: const Icon(Icons.payments_outlined, color: AppDesign.incomeColor),
                  suffixText: currencyService.getCurrencySymbol(currencyService.currentCurrency),
                  helperText: _selectedAccount != null
                      ? 'Disponible: ${currencyService.formatAmount(_selectedAccount!.balance)}'
                      : null,
                ),
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                inputFormatters: [
                  FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                ],
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer un montant';
                  }
                  final amount = double.tryParse(value);
                  if (amount == null) {
                    return 'Montant invalide';
                  }
                  if (amount <= 0) {
                    return 'Le montant doit être positif';
                  }
                  if (_selectedAccount != null && amount > _selectedAccount!.balance) {
                    return 'Solde insuffisant';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              
              // Boutons rapides
              const TrText(
                'Montants rapides',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: [
                  ActionChip(
                    label: TrText('10 ${currencyService.getCurrencySymbol(currencyService.currentCurrency)}'),
                    onPressed: () => _amountController.text = 10.0.toStringAsFixed(2),
                  ),
                  ActionChip(
                    label: TrText('50 ${currencyService.getCurrencySymbol(currencyService.currentCurrency)}'),
                    onPressed: () => _amountController.text = 50.0.toStringAsFixed(2),
                  ),
                  ActionChip(
                    label: TrText('100 ${currencyService.getCurrencySymbol(currencyService.currentCurrency)}'),
                    onPressed: () => _amountController.text = 100.0.toStringAsFixed(2),
                  ),
                  ActionChip(
                    label: const TrText('Reste'),
                    onPressed: () => _amountController.text = remaining.toStringAsFixed(2),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              
              // Bouton d'allocation
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _fundGoal,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppDesign.incomeColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const TrText(
                          'Allouer les Fonds',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
              SizedBox(height: MediaQuery.of(context).viewInsets.bottom),
            ],
          ),
        ),
      ),
    );
  }

  void _fundGoal() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    final amount = double.parse(_amountController.text);
    try {
      await _firestoreService.fundGoal(
        userId: widget.userId,
        goalId: widget.goal.goalId,
        amount: amount,
        sourceAccountId: _selectedAccount!.accountId,
        description: 'Allocation vers ${widget.goal.name}',
      );
      widget.onFundingCompleted();
      if (mounted) Navigator.pop(context);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: TrText('Erreur: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
}

// Petit modèle interne pour l'historique factice
class _GoalTx {
  final String label;
  final double amount;
  final DateTime date;
  _GoalTx({required this.label, required this.amount, required this.date});
}
