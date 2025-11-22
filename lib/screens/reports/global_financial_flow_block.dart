import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/transaction.dart' as app_transaction;
import '../../models/iou.dart';
import '../../models/account.dart';
import '../../services/firestore_service.dart';
import '../../constants/app_design.dart';

class GlobalFinancialFlowBlock extends StatefulWidget {
  final String userId;
  final List<app_transaction.Transaction> transactions;
  final DateTimeRange dateRange;

  const GlobalFinancialFlowBlock({
    super.key,
    required this.userId,
    required this.transactions,
    required this.dateRange,
  });

  @override
  State<GlobalFinancialFlowBlock> createState() => _GlobalFinancialFlowBlockState();
}

class _GlobalFinancialFlowBlockState extends State<GlobalFinancialFlowBlock> {
  final FirestoreService _firestoreService = FirestoreService();
  
  // Data state
  double _totalIncome = 0;
  double _totalExpense = 0;
  double _totalSavings = 0;
  double _totalGoalFunding = 0;
  double _totalBorrowed = 0;
  double _totalLent = 0;
  double _totalRepaid = 0;
  
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _calculateFlows();
  }

  @override
  void didUpdateWidget(covariant GlobalFinancialFlowBlock oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.transactions != widget.transactions || 
        oldWidget.dateRange != widget.dateRange) {
      _calculateFlows();
    }
  }

  Future<void> _calculateFlows() async {
    setState(() => _isLoading = true);

    // 1. Calculs basés sur les transactions (Income, Expense, Goals)
    double income = 0;
    double expense = 0;
    double goalFunding = 0;
    double savings = 0;
    double repaid = 0;

    // Récupération des comptes pour identifier les comptes épargne
    List<Account> accounts = [];
    try {
      accounts = await _firestoreService.getAccounts(widget.userId);
    } catch (e) {
      debugPrint('Erreur chargement comptes: $e');
    }
    
    final savingsAccountIds = accounts
        .where((a) => a.type == AccountType.savings)
        .map((a) => a.accountId)
        .toSet();

    for (var tx in widget.transactions) {
      // Income / Expense
      if (tx.type == app_transaction.TransactionType.income) {
        income += tx.amount;
      } else if (tx.type == app_transaction.TransactionType.expense) {
        expense += tx.amount;
        
        // Goal Funding (via tags ou catégorie)
        if (tx.tags?.contains('goal') == true || 
            (tx.category?.toLowerCase().contains('objectif') ?? false)) {
          goalFunding += tx.amount;
        }

        // Repaid (Dettes remboursées - détection par mots clés ou catégorie)
        // Idéalement, on aurait un type de transaction spécifique ou un lien vers l'IOU
        if ((tx.category?.toLowerCase().contains('dette') ?? false) || 
            (tx.category?.toLowerCase().contains('remboursement') ?? false) ||
            (tx.description?.toLowerCase().contains('remboursement') ?? false)) {
          repaid += tx.amount;
        }
      } else if (tx.type == app_transaction.TransactionType.transfer) {
        // Savings (Virements vers comptes épargne)
        if (tx.toAccountId != null && savingsAccountIds.contains(tx.toAccountId)) {
          savings += tx.amount;
        }
      }
    }

    // 2. Calculs basés sur les IOUs (Borrowed, Lent)
    // On doit récupérer les IOUs créés dans la période
    double borrowed = 0;
    double lent = 0;

    try {
      // Note: FirestoreService.getIOUsStream ne filtre pas par date, on le fait manuellement ici
      // Pour une vraie app, on ajouterait un filtre date dans le service
      final ious = await _firestoreService.getIOUsStream(widget.userId).first;
      
      for (var iou in ious) {
        if (iou.createdAt.isAfter(widget.dateRange.start) && 
            iou.createdAt.isBefore(widget.dateRange.end)) {
          if (iou.type == IOUType.payable) {
            borrowed += iou.amount;
          } else {
            lent += iou.amount;
          }
        }
      }
    } catch (e) {
      debugPrint('Erreur chargement IOUs: $e');
    }

    if (mounted) {
      setState(() {
        _totalIncome = income;
        _totalExpense = expense;
        _totalSavings = savings;
        _totalGoalFunding = goalFunding;
        _totalBorrowed = borrowed;
        _totalLent = lent;
        _totalRepaid = repaid;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()));
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final isMobile = constraints.maxWidth < 600;
        
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Section A: Flux Quotidien
            _buildSectionHeader('Opérations Courantes'),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _buildLargeCard(
                    label: 'Revenus',
                    amount: _totalIncome,
                    color: AppDesign.incomeColor,
                    icon: Icons.arrow_upward_rounded,
                    bgColor: AppDesign.incomeColor.withOpacity(0.05),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildLargeCard(
                    label: 'Dépenses',
                    amount: _totalExpense,
                    color: AppDesign.expenseColor,
                    icon: Icons.arrow_downward_rounded,
                    bgColor: AppDesign.expenseColor.withOpacity(0.05),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 24),
            
            // Section B: Capitalisation
            _buildSectionHeader('Capitalisation & Avenir'),
            const SizedBox(height: 8),
            Row(
              children: [
                Expanded(
                  child: _buildMediumCard(
                    label: 'Épargne Directe',
                    amount: _totalSavings,
                    icon: Icons.savings_rounded,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildMediumCard(
                    label: 'Objectifs Financés',
                    amount: _totalGoalFunding,
                    icon: Icons.track_changes_rounded,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 24),

            // Section C: Mouvements Tiers
            _buildSectionHeader('Dettes & Créances'),
            const SizedBox(height: 8),
            isMobile 
              ? Column(
                  children: [
                    Row(
                      children: [
                        Expanded(child: _buildSmallCard('Emprunté', _totalBorrowed, Colors.orange)),
                        const SizedBox(width: 12),
                        Expanded(child: _buildSmallCard('Prêté', _totalLent, Colors.blueGrey)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    _buildSmallCard('Remboursé', _totalRepaid, Colors.grey[700]!),
                  ],
                )
              : Row(
                  children: [
                    Expanded(child: _buildSmallCard('Emprunté', _totalBorrowed, Colors.orange)),
                    const SizedBox(width: 12),
                    Expanded(child: _buildSmallCard('Prêté', _totalLent, Colors.blueGrey)),
                    const SizedBox(width: 12),
                    Expanded(child: _buildSmallCard('Remboursé', _totalRepaid, Colors.grey[700]!)),
                  ],
                ),
          ],
        );
      },
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title.toUpperCase(),
      style: TextStyle(
        fontSize: 11,
        fontWeight: FontWeight.bold,
        color: Colors.grey[500],
        letterSpacing: 1.0,
      ),
    );
  }

  Widget _buildLargeCard({
    required String label,
    required double amount,
    required Color color,
    required IconData icon,
    required Color bgColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: color, size: 24),
              Text(
                label,
                style: TextStyle(color: color.withOpacity(0.8), fontSize: 13, fontWeight: FontWeight.w600),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            NumberFormat.currency(locale: 'fr_FR', symbol: '€').format(amount),
            style: TextStyle(
              color: color,
              fontSize: 20,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMediumCard({
    required String label,
    required double amount,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppDesign.primaryIndigo.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppDesign.primaryIndigo.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: AppDesign.primaryIndigo, size: 24),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(color: Colors.grey[600], fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            NumberFormat.currency(locale: 'fr_FR', symbol: '€', decimalDigits: 0).format(amount),
            style: const TextStyle(
              color: AppDesign.primaryIndigo,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSmallCard(String label, double amount, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.1)),
      ),
      child: Row(
        children: [
          Container(
            width: 4,
            height: 24,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(color: Colors.grey[600], fontSize: 11),
                ),
                Text(
                  NumberFormat.currency(locale: 'fr_FR', symbol: '€', decimalDigits: 0).format(amount),
                  style: TextStyle(
                    color: color,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
