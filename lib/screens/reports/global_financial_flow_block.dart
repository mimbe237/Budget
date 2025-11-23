import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/transaction.dart' as app_transaction;
import '../../models/iou.dart';
import '../../models/account.dart';
import '../../services/firestore_service.dart';
import '../../constants/app_design.dart';
import 'package:budget/l10n/app_localizations.dart';

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

    final start = widget.dateRange.start;
    final end = widget.dateRange.end;

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
      final amount = tx.amount;

      // Income / Expense
      if (tx.type == app_transaction.TransactionType.income) {
        income += amount;
      } else if (tx.type == app_transaction.TransactionType.expense) {
        expense += amount;
        
        // Goal Funding (via tags ou catégorie)
        if (tx.tags?.contains('goal') == true || 
            (tx.category?.toLowerCase().contains('objectif') ?? false) ||
            (tx.description?.toLowerCase().contains('objectif') ?? false)) {
          goalFunding += amount;
        }

        // Remboursements de dettes (détection par mots clés)
        if (_looksLikeRepayment(tx)) {
          repaid += amount;
        }
      } else if (tx.type == app_transaction.TransactionType.transfer) {
        // Savings (Virements vers comptes épargne)
        if (tx.toAccountId != null && savingsAccountIds.contains(tx.toAccountId)) {
          savings += amount;
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
        final createdInPeriod = !iou.createdAt.isBefore(start) && !iou.createdAt.isAfter(end);

        if (!createdInPeriod) continue;

        if (iou.type == IOUType.payable || iou.type == IOUType.iOwe) {
          borrowed += iou.amount;
        } else if (iou.type == IOUType.owedToMe || iou.type == IOUType.receivable) {
          lent += iou.amount;
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

  bool _looksLikeRepayment(app_transaction.Transaction tx) {
    final haystack = [
      tx.category,
      tx.description,
      tx.note,
      ...(tx.tags ?? []),
    ]
        .whereType<String>()
        .map((e) => e.toLowerCase())
        .join(' ');

    return haystack.contains('rembourse') ||
        haystack.contains('rembourser') ||
        haystack.contains('remboursement') ||
        haystack.contains('dette') ||
        haystack.contains('iou') ||
        haystack.contains('debt');
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator()));
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        final maxWidth = constraints.maxWidth;
        final sectionWidth = _computeSectionWidth(maxWidth);

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const TrText(
              'Vue 360° des flux financiers',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            TrText(
              'Tous les mouvements d\'argent sur la période sélectionnée',
              style: TextStyle(color: Colors.grey[600], fontSize: 13, fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 16,
              runSpacing: 16,
              children: [
                SizedBox(
                  width: sectionWidth,
                  child: _buildOperationsSection(sectionWidth),
                ),
                SizedBox(
                  width: sectionWidth,
                  child: _buildCapitalSection(sectionWidth),
                ),
                SizedBox(
                  width: sectionWidth,
                  child: _buildDebtSection(sectionWidth),
                ),
              ],
            ),
          ],
        );
      },
    );
  }

  double _computeSectionWidth(double maxWidth) {
    if (maxWidth >= 1180) {
      return (maxWidth - 32) / 3;
    } else if (maxWidth >= 820) {
      return (maxWidth - 16) / 2;
    }
    return maxWidth;
  }

  Widget _buildOperationsSection(double availableWidth) {
    final cardWidth = _computeCardWidth(availableWidth, desiredPerRow: 2);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Opérations', 'Le flux quotidien'),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            SizedBox(
              width: cardWidth,
              child: _flowCard(
                label: t('Revenus'),
                amount: _totalIncome,
                color: AppDesign.successGreen,
                icon: Icons.arrow_upward_rounded,
                amountFontSize: 24,
              ),
            ),
            SizedBox(
              width: cardWidth,
              child: _flowCard(
                label: t('Dépenses'),
                amount: _totalExpense,
                color: AppDesign.dangerRed,
                icon: Icons.arrow_downward_rounded,
                amountFontSize: 24,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCapitalSection(double availableWidth) {
    final cardWidth = _computeCardWidth(availableWidth, desiredPerRow: 2);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Capitalisation', 'La construction d\'avenir'),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            SizedBox(
              width: cardWidth,
              child: _flowCard(
                label: t('Épargne Directe'),
                amount: _totalSavings,
                color: AppDesign.primaryIndigo,
                emoji: '🏦',
                amountFontSize: 20,
                labelColor: AppDesign.primaryIndigo.withValues(alpha: 0.75),
                amountColor: AppDesign.primaryIndigo,
              ),
            ),
            SizedBox(
              width: cardWidth,
              child: _flowCard(
                label: t('Objectifs Financés'),
                amount: _totalGoalFunding,
                color: AppDesign.primaryIndigo,
                emoji: '🎯',
                amountFontSize: 20,
                labelColor: AppDesign.primaryIndigo.withValues(alpha: 0.75),
                amountColor: AppDesign.primaryIndigo,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildDebtSection(double availableWidth) {
    final int desiredPerRow;
    if (availableWidth >= 900) {
      desiredPerRow = 3;
    } else if (availableWidth >= 560) {
      desiredPerRow = 2;
    } else {
      desiredPerRow = 1;
    }
    final cardWidth = _computeCardWidth(availableWidth, desiredPerRow: desiredPerRow);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle('Dettes', 'Mouvements tiers'),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: [
            SizedBox(
              width: cardWidth,
              child: _flowCard(
                label: t('Emprunté'),
                amount: _totalBorrowed,
                color: AppDesign.warningOrange,
                icon: Icons.trending_up_rounded,
                amountFontSize: 18,
              ),
            ),
            SizedBox(
              width: cardWidth,
              child: _flowCard(
                label: t('Prêté'),
                amount: _totalLent,
                color: Colors.blueGrey,
                icon: Icons.outbond_rounded,
                amountFontSize: 18,
              ),
            ),
            SizedBox(
              width: cardWidth,
              child: _flowCard(
                label: t('Remboursé'),
                amount: _totalRepaid,
                color: Colors.grey[800]!,
                icon: Icons.check_circle_outline_rounded,
                amountFontSize: 18,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title, String subtitle) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TrText(
          title.toUpperCase(),
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w800,
            color: Colors.grey[700],
            letterSpacing: 0.8,
          ),
        ),
        const SizedBox(height: 2),
        TrText(
          subtitle,
          style: TextStyle(
            color: Colors.grey[600],
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _flowCard({
    required String label,
    required double amount,
    required Color color,
    IconData? icon,
    String? emoji,
    double amountFontSize = 20,
    double backgroundOpacity = 0.05,
    Color? labelColor,
    Color? amountColor,
  }) {
    final textColor = labelColor ?? Colors.grey[600];
    final valueColor = amountColor ?? color;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withValues(alpha: backgroundOpacity),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.12)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.6),
              shape: BoxShape.circle,
            ),
            child: icon != null
                ? Icon(icon, color: color, size: 20)
                : TrText(emoji ?? '', style: TextStyle(fontSize: 18, color: color)),
          ),
          const SizedBox(height: 10),
          TrText(
            label,
            style: TextStyle(
              color: textColor,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          TrText(
            _formatAmount(amount),
            style: TextStyle(
              color: valueColor,
              fontSize: amountFontSize,
              fontWeight: FontWeight.w800,
              letterSpacing: 0.2,
            ),
          ),
        ],
      ),
    );
  }

  double _computeCardWidth(double availableWidth, {required int desiredPerRow, double spacing = 12}) {
    if (desiredPerRow <= 1 || availableWidth < 420) {
      return availableWidth;
    }

    final totalSpacing = spacing * (desiredPerRow - 1);
    return (availableWidth - totalSpacing) / desiredPerRow;
  }

  String _formatAmount(double amount) {
    final formatter = NumberFormat.currency(
      locale: 'fr_FR',
      symbol: '€',
      decimalDigits: amount.abs() >= 1000 ? 0 : 2,
    );
    return formatter.format(amount);
  }
}
