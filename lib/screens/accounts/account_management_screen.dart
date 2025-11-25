import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../models/models.dart';
import '../../models/transaction.dart' as app_transaction;
import '../../services/firestore_service.dart';
import '../../services/currency_service.dart';
import '../../constants/app_design.dart';
import '../../widgets/revolutionary_logo.dart';
import '../../widgets/app_modal.dart';
import '../transactions/transactions_list_screen.dart';
import 'package:budget/l10n/app_localizations.dart';
import '../profile/profile_settings_screen.dart';
import '../settings/notification_settings_screen.dart';
import '../auth/auth_screen.dart';
import '../../services/theme_service.dart';
import 'package:firebase_auth/firebase_auth.dart';

/// Écran de gestion des comptes bancaires avec liste, ajout, édition et transfert
class AccountManagementScreen extends StatefulWidget {
  const AccountManagementScreen({super.key});

  @override
  State<AccountManagementScreen> createState() => _AccountManagementScreenState();
}

class _AccountManagementScreenState extends State<AccountManagementScreen> {
  final FirestoreService _firestoreService = FirestoreService();
  late Stream<List<Account>> _accountsStream;
  String? _userId;
  Account? _selectedAccountForHistory;
  app_transaction.TransactionType? _historyFilterType;
  DateTimeRange? _historyRange;

  @override
  void initState() {
    super.initState();
    _userId = _firestoreService.currentUserId;
    if (_userId != null) {
      _accountsStream = _firestoreService.getAccountsStream(_userId!);
    } else {
      _accountsStream = Stream.value([]);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_userId == null) {
      return const Scaffold(
        body: Center(child: TrText('Veuillez vous connecter pour gérer vos comptes')),
      );
    }

    return Scaffold(
      backgroundColor: AppDesign.backgroundGrey,
      appBar: AppBar(
        title: Row(
          children: [
            const RevolutionaryLogo(size: 32),
            const SizedBox(width: 12),
            const TrText(
              'Mes Comptes',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: AppDesign.primaryIndigo,
              ),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            tooltip: t('Historique des transactions'),
            icon: const Icon(Icons.history, color: AppDesign.primaryIndigo),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const TransactionsListScreen(),
                ),
              );
            },
          ),
          if (MediaQuery.of(context).size.width < 600)
            Padding(
              padding: const EdgeInsets.only(right: 8),
              child: PopupMenuButton<int>(
                tooltip: t('Profil'),
                offset: const Offset(0, 42),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                itemBuilder: (context) => const [
                  PopupMenuItem<int>(value: 0, child: TrText('Profil')),
                  PopupMenuItem<int>(value: 1, child: TrText('Paramètres')),
                  PopupMenuItem<int>(value: 2, child: TrText('Déconnexion')),
                  PopupMenuItem<int>(value: 3, child: TrText('Basculer le thème')),
                ],
                onSelected: (value) async {
                  if (value == 0) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ProfileSettingsScreen()),
                    );
                  } else if (value == 1) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const NotificationSettingsScreen()),
                    );
                  } else if (value == 2) {
                    await FirestoreService().cleanupDemoDataOnLogout();
                    await FirebaseAuth.instance.signOut();
                    if (!context.mounted) return;
                    Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
                      MaterialPageRoute(builder: (_) => const AuthScreen()),
                      (route) => false,
                    );
                  } else if (value == 3) {
                    if (!context.mounted) return;
                    await context.read<ThemeProvider>().toggleTheme();
                  }
                },
                child: CircleAvatar(
                  backgroundColor: AppDesign.primaryIndigo.withValues(alpha: 0.12),
                  child: const Icon(Icons.person_outline, color: AppDesign.primaryIndigo),
                ),
              ),
            ),
        ],
      ),
      body: StreamBuilder<List<Account>>(
        stream: _accountsStream,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          
          if (snapshot.hasError) {
            return Center(child: TrText('Erreur: ${snapshot.error}'));
          }

          final accounts = snapshot.data ?? [];

          if (accounts.isEmpty) {
            return _buildEmptyState();
          }

          final totalBalance = accounts.fold<double>(0.0, (sum, acc) => sum + acc.balance);
          final currency = accounts.isNotEmpty ? accounts.first.currency : context.read<CurrencyService>().currentCurrency;
          final extraBottomPadding = kBottomNavigationBarHeight +
              MediaQuery.of(context).padding.bottom +
              140; // espace pour la bottom bar + FABs

          return ListView.builder(
            padding: EdgeInsets.fromLTRB(
              AppDesign.paddingMedium,
              AppDesign.paddingMedium,
              AppDesign.paddingMedium,
              AppDesign.paddingMedium + extraBottomPadding,
            ),
            itemCount: accounts.length + 1,
            itemBuilder: (context, index) {
              if (index == 0) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: AppDesign.spacingMedium),
                  child: _buildTotalAssetsCard(totalBalance, currency),
                );
              }
              return Column(
                children: [
                  _buildAccountCard(accounts[index - 1]),
                  if (_selectedAccountForHistory?.accountId == accounts[index - 1].accountId)
                    Padding(
                      padding: const EdgeInsets.only(bottom: AppDesign.spacingMedium),
                      child: _buildAccountHistory(accounts[index - 1]),
                    ),
                ],
              );
            },
          );
        },
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      floatingActionButton: Padding(
        padding: EdgeInsets.only(
          bottom: kBottomNavigationBarHeight + MediaQuery.of(context).padding.bottom + 12,
          right: 4,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            StreamBuilder<List<Account>>(
              stream: _accountsStream,
              builder: (context, snapshot) {
                final accounts = snapshot.data ?? [];
                if (accounts.length < 2) return const SizedBox.shrink();
                
                return FloatingActionButton(
                  heroTag: 'transfer',
                  onPressed: () => _showTransferModal(accounts),
                  backgroundColor: AppDesign.transferColor,
                  foregroundColor: Colors.white,
                  child: const Icon(Icons.swap_horiz),
                );
              },
            ),
            const SizedBox(height: 12),
            FloatingActionButton.extended(
              heroTag: 'add',
              onPressed: () => _showAddAccountModal(),
              backgroundColor: AppDesign.primaryIndigo,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add),
              label: const TrText(
                'Compte',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.account_balance_wallet_outlined,
            size: 80,
            color: Colors.grey[400],
          ),
          const SizedBox(height: 16),
          TrText(
            'Aucun compte',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          TrText(
            'Ajoutez votre premier compte',
            style: TextStyle(color: Colors.grey[500]),
          ),
        ],
      ),
    );
  }

  Widget _buildAccountCard(Account account) {
    String accountTypeLabel = _getAccountTypeLabel(account.type);
    Color accountColor = _getAccountTypeColor(account.type);

    return Card(
      elevation: 2,
      margin: const EdgeInsets.only(bottom: AppDesign.spacingMedium),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
        onTap: () {
          setState(() {
            _selectedAccountForHistory = account;
          });
        },
        child: Padding(
          padding: const EdgeInsets.all(AppDesign.paddingMedium),
          child: Row(
            children: [
              // Icône du compte
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: accountColor.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(AppDesign.borderRadiusMedium),
                ),
                child: Center(
                  child: TrText(
                    account.icon ?? '❓',
                    style: const TextStyle(fontSize: 28),
                  ),
                ),
              ),
              const SizedBox(width: AppDesign.spacingMedium),
              
              // Informations du compte
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    TrText(
                      account.name,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: accountColor.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: TrText(
                        accountTypeLabel,
                        style: TextStyle(
                          fontSize: 12,
                          color: accountColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TrText(
                      context.watch<CurrencyService>().formatAmount(
                            account.balance,
                            account.currency,
                            false,
                          ),
                      style: TextStyle(
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        color: account.balance >= 0
                            ? AppDesign.incomeColor
                            : AppDesign.expenseColor,
                      ),
                    ),
                  ],
                ),
              ),
              
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    tooltip: t('Gérer le partage'),
                    icon: const Icon(Icons.people, color: Colors.grey),
                    onPressed: () => _showShareAccountModal(account),
                  ),
                  IconButton(
                    icon: const Icon(Icons.edit_outlined),
                    color: AppDesign.primaryIndigo,
                    onPressed: () => _showEditAccountModal(account),
                  ),
                  IconButton(
                    tooltip: t('Historique'),
                    icon: const Icon(Icons.receipt_long_outlined, color: Colors.grey),
                    onPressed: () {
                      setState(() {
                        _selectedAccountForHistory = account;
                      });
                    },
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTotalAssetsCard(double total, String currency) {
    final currencyService = context.read<CurrencyService>();
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF5E35B1), Color(0xFF3D4DB7)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(AppDesign.radiusXLarge),
        boxShadow: AppDesign.mediumShadow,
      ),
      padding: const EdgeInsets.all(22),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.16),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.account_balance, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TrText(
                  'Avoirs financiers',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.9),
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.2,
                  ),
                ),
                const SizedBox(height: 4),
                TrText(
                  currencyService.formatAmount(total, currency),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.4,
                  ),
                ),
                const SizedBox(height: 6),
                TrText(
                  'Total de tous vos comptes',
                  style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.78),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          const Icon(Icons.arrow_forward_ios_rounded, color: Colors.white70, size: 18),
        ],
      ),
    );
  }

  Widget _buildAccountHistory(Account account) {
    return StreamBuilder<List<app_transaction.Transaction>>(
      stream: _firestoreService.getTransactionsStream(
        _userId!,
        accountId: account.accountId,
        type: _historyFilterType,
        startDate: _historyRange?.start,
        endDate: _historyRange?.end,
        limit: 100,
      ),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Padding(
            padding: EdgeInsets.all(12),
            child: Center(child: CircularProgressIndicator()),
          );
        }
        final txs = snapshot.data ?? [];

        return Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const TrText(
                      'Historique du compte',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    Row(
                      children: [
                        _historyChip('Tous', null),
                        _historyChip('Revenus', app_transaction.TransactionType.income),
                        _historyChip('Dépenses', app_transaction.TransactionType.expense),
                        _historyChip('Transferts', app_transaction.TransactionType.transfer),
                        TextButton(
                          onPressed: () async {
                            final now = DateTime.now();
                            final range = await showDateRangePicker(
                              context: context,
                              firstDate: DateTime(now.year - 2),
                              lastDate: DateTime(now.year + 1),
                              initialDateRange: _historyRange ??
                                  DateTimeRange(
                                    start: DateTime(now.year, now.month, 1),
                                    end: now,
                                  ),
                            );
                            if (range != null) {
                              setState(() {
                                _historyRange = range;
                              });
                            }
                          },
                          child: TrText(
                            _historyRange == null
                                ? 'Période'
                                : '${_historyRange!.start.day}/${_historyRange!.start.month} → ${_historyRange!.end.day}/${_historyRange!.end.month}',
                          ),
                        ),
                        IconButton(
                          tooltip: t('Exporter CSV'),
                          icon: const Icon(Icons.download),
                          onPressed: () async {
                            final buffer = StringBuffer();
                            buffer.writeln('date,type,description,amount,category');
                            for (final tx in txs) {
                              buffer.writeln(
                                '${tx.date.toIso8601String()},${tx.type.name},${tx.description ?? ''},${tx.amount.toStringAsFixed(2)},${tx.category ?? ''}',
                              );
                            }
                            await Clipboard.setData(ClipboardData(text: buffer.toString()));
                            if (!mounted) return;
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: TrText('Historique copié (CSV)')),
                            );
                          },
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (txs.isEmpty)
                  const TrText(
                    'Aucun mouvement pour ce compte.',
                    style: TextStyle(color: Colors.grey),
                  )
                else
                  ...txs.take(40).map((tx) => _buildTransactionTile(tx, account)),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTransactionTile(app_transaction.Transaction tx, Account account) {
    final isIncome = tx.type == app_transaction.TransactionType.income;
    final isExpense = tx.type == app_transaction.TransactionType.expense;
    final isTransfer = tx.type == app_transaction.TransactionType.transfer;
    final color = isIncome
        ? AppDesign.incomeColor
        : isExpense
            ? AppDesign.expenseColor
            : AppDesign.transferColor;
    final iconData = isIncome
        ? Icons.trending_up_rounded
        : isExpense
            ? Icons.trending_down_rounded
            : Icons.swap_horiz_rounded;
    final prefix = isIncome ? '+' : isExpense ? '-' : '';
    final dateFmt = DateFormat('dd/MM/yyyy HH:mm');
    return Container(
      margin: const EdgeInsets.only(bottom: 6),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: ListTile(
        leading: Container(
          width: 48,
          height: 48,
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
            child: Icon(iconData, color: color),
        ),
        title: TrText(
          tx.description ?? 'Transaction',
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        subtitle: TrText(
          '${dateFmt.format(tx.date)} · ${tx.category ?? (isTransfer ? 'Transfert' : 'Sans catégorie')}',
          style: const TextStyle(color: Colors.grey),
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            TrText(
              '$prefix${context.watch<CurrencyService>().formatAmount(tx.amount, account.currency, false)}',
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height:4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  tooltip: t('Modifier'),
                  icon: const Icon(Icons.edit, size: 20, color: AppDesign.primaryIndigo),
                  onPressed: () => _showEditTransactionModal(tx),
                ),
                IconButton(
                  tooltip: t('Supprimer'),
                  icon: const Icon(Icons.delete_outline, size: 20, color: AppDesign.expenseColor),
                  onPressed: () => _confirmDeleteTransaction(tx),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showEditTransactionModal(app_transaction.Transaction tx) {
    final amountController = TextEditingController(text: tx.amount.toStringAsFixed(2));
    final descriptionController = TextEditingController(text: tx.description ?? '');
    DateTime selectedDate = tx.date;
    showAppModal(
      context,
      SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      tx.type == app_transaction.TransactionType.income
                          ? Icons.trending_up_rounded
                          : tx.type == app_transaction.TransactionType.expense
                              ? Icons.trending_down_rounded
                              : Icons.swap_horiz_rounded,
                      color: AppDesign.primaryIndigo,
                    ),
                    const SizedBox(width: 12),
                    TrText(
                      t('Modifier la transaction'),
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: descriptionController,
                  decoration: InputDecoration(
                    labelText: t('Description'),
                    prefixIcon: const Icon(Icons.description_outlined),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: amountController,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  decoration: InputDecoration(
                    labelText: t('Montant'),
                    prefixIcon: const Icon(Icons.payments_outlined),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () async {
                          final picked = await showDatePicker(
                            context: context,
                            initialDate: selectedDate,
                            firstDate: DateTime(2022),
                            lastDate: DateTime.now().add(const Duration(days: 365)),
                          );
                          if (picked != null) {
                            setState(() {
                              selectedDate = picked;
                            });
                          }
                        },
                        icon: const Icon(Icons.calendar_month),
                        label: TrText(DateFormat('dd/MM/yyyy').format(selectedDate)),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          final newAmount = double.tryParse(amountController.text.replaceAll(',', '.'));
                          if (newAmount == null) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: TrText('Montant invalide')),);
                            return;
                          }
                          try {
                            await _firestoreService.updateTransactionBasic(
                              userId: _userId!,
                              transactionId: tx.transactionId,
                              amount: newAmount,
                              description: descriptionController.text.trim().isEmpty ? null : descriptionController.text.trim(),
                              date: selectedDate,
                            );
                            if (mounted) {
                              Navigator.pop(context);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(content: TrText('Transaction modifiée')),);
                            }
                          } catch (e) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: TrText('Erreur: $e'), backgroundColor: Colors.red),);
                          }
                        },
                        icon: const Icon(Icons.save),
                        label: const TrText('Enregistrer'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppDesign.primaryIndigo,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextButton.icon(
                  onPressed: () async {
                    Navigator.pop(context);
                    _confirmDeleteTransaction(tx);
                  },
                  icon: const Icon(Icons.delete_outline, color: AppDesign.expenseColor),
                  label: const TrText('Supprimer', style: TextStyle(color: AppDesign.expenseColor)),
                ),
              ],
          ),
        ),
      ),
      heightFactor: 0.78,
    );
  }

  void _confirmDeleteTransaction(app_transaction.Transaction tx) {
    showDialog(
      context: context,
      builder: (dCtx) => AlertDialog(
        title: const TrText('Supprimer la transaction'),
        content: const TrText('Cette action annulera son impact sur les soldes. Continuer ?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dCtx), child: const TrText('Annuler')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppDesign.expenseColor),
            onPressed: () async {
              Navigator.pop(dCtx);
              try {
                await _firestoreService.softDeleteTransaction(_userId!, tx.transactionId);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: TrText('Transaction supprimée')));
                }
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: TrText('Erreur: $e'), backgroundColor: Colors.red));
                }
              }
            },
            child: const TrText('Supprimer'),
          ),
        ],
      ),
    );
  }

  Widget _historyChip(String label, app_transaction.TransactionType? type) {
    final selected = _historyFilterType == type;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: ChoiceChip(
        label: TrText(label),
        selected: selected,
        onSelected: (_) {
          setState(() {
            _historyFilterType = type;
          });
        },
        selectedColor: AppDesign.primaryIndigo.withValues(alpha: 0.15),
        labelStyle: TextStyle(
          color: selected ? AppDesign.primaryIndigo : Colors.grey[800],
          fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
        ),
      ),
    );
  }

  String _getAccountTypeLabel(AccountType type) {
    switch (type) {
      case AccountType.checking:
        return 'Compte Courant';
      case AccountType.savings:
        return 'Épargne';
      case AccountType.cash:
        return 'Espèces';
      case AccountType.creditCard:
        return 'Carte de Crédit';
      case AccountType.investment:
        return 'Investissement';
      case AccountType.mobileWallet:
        return 'Portefeuille Mobile';
      case AccountType.other:
        return 'Autre';
    }
  }

  Color _getAccountTypeColor(AccountType type) {
    switch (type) {
      case AccountType.checking:
        return AppDesign.primaryIndigo;
      case AccountType.savings:
        return AppDesign.incomeColor;
      case AccountType.cash:
        return Colors.orange;
      case AccountType.creditCard:
        return AppDesign.expenseColor;
      case AccountType.investment:
        return AppDesign.primaryPurple;
      case AccountType.mobileWallet:
        return Colors.teal;
      case AccountType.other:
        return Colors.grey;
    }
  }

  void _showAddAccountModal() {
    showAppModal(
      context,
      AddAccountModal(
        onAccountAdded: (name, type, balance, icon) async {
          if (_userId != null) {
            await _firestoreService.addAccount(
              userId: _userId!,
              name: name,
              type: type,
              balance: balance,
              icon: icon,
              color: '#6366F1', // Default color
            );
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: TrText('Compte ajouté avec succès !')),
              );
            }
          }
        },
      ),
      heightFactor: 0.9,
    );
  }

  void _showEditAccountModal(Account account) {
    showAppModal(
      context,
      EditAccountModal(
        account: account,
        onAccountUpdated: (updatedAccount) async {
          if (_userId != null) {
            await _firestoreService.updateAccount(
              _userId!,
              updatedAccount.accountId,
              {
                'name': updatedAccount.name,
                'type': updatedAccount.type.name,
                'icon': updatedAccount.icon,
              },
            );
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: TrText('Compte modifié avec succès !')),
              );
            }
          }
        },
        onAccountDeleted: (account) async {
          if (_userId != null) {
            await _firestoreService.deleteAccount(_userId!, account.accountId);
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: TrText('Compte supprimé avec succès !')),
              );
            }
          }
        },
      ),
      heightFactor: 0.9,
    );
  }

  void _showShareAccountModal(Account account) {
    showAppModal(
      context,
      ShareAccountModal(
        account: account,
        onSharedUpdated: (email) async {
          if (_userId != null) {
            try {
              await _firestoreService.addSharedAccess(email, account.accountId);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: TrText('Invitation envoyée à $email')),
                );
              }
            } catch (e) {
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: TrText('Erreur: $e'), backgroundColor: Colors.red),
                );
              }
            }
          }
        },
      ),
      heightFactor: 0.85,
    );
  }

  void _showTransferModal(List<Account> accounts) {
    showAppModal(
      context,
      TransferModal(
        accounts: accounts,
        onTransferCompleted: (sourceId, destId, amount) async {
          if (_userId != null) {
            try {
              await _firestoreService.addTransaction(
                userId: _userId!,
                accountId: sourceId,
                toAccountId: destId,
                type: app_transaction.TransactionType.transfer,
                amount: amount,
                description: 'Transfert',
                date: DateTime.now(),
              );
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: TrText('Transfert de ${context.read<CurrencyService>().formatAmount(amount)} effectué avec succès !'),
                    backgroundColor: AppDesign.incomeColor,
                  ),
                );
              }
            } catch (e) {
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: TrText('Erreur: $e'), backgroundColor: Colors.red),
                );
              }
            }
          }
        },
      ),
      heightFactor: 0.88,
    );
  }

  @override
  void dispose() {
    super.dispose();
  }
}

/// Modal pour ajouter un nouveau compte
class AddAccountModal extends StatefulWidget {
  final Function(String name, AccountType type, double balance, String icon) onAccountAdded;

  const AddAccountModal({super.key, required this.onAccountAdded});

  @override
  State<AddAccountModal> createState() => _AddAccountModalState();
}

class _AddAccountModalState extends State<AddAccountModal> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _balanceController = TextEditingController(text: '0');
  AccountType _selectedType = AccountType.checking;
  String _selectedIcon = '💳';
  bool _isLoading = false;

  final List<String> _accountIcons = [
    '💳', '💰', '🏦', '💵', '💶', '💷',
    '💴', '🪙', '💸', '📱', '🏧', '💎'
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _balanceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currencySymbol = context.watch<CurrencyService>().currencySymbol;
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const TrText(
                  'Ajouter un Compte',
                  style: TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 24),
                
                // Nom du compte
                TextFormField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    labelText: t('Nom du compte'),
                    prefixIcon: Icon(Icons.account_balance_wallet),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Veuillez entrer un nom';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                
                // Type de compte
                DropdownButtonFormField<AccountType>(
                  value: _selectedType,
                  decoration: InputDecoration(
                    labelText: t('Type de compte'),
                    prefixIcon: Icon(Icons.category),
                  ),
                  items: AccountType.values.map((type) {
                    return DropdownMenuItem(
                      value: type,
                      child: TrText(_getAccountTypeName(type)),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedType = value!;
                    });
                  },
                ),
                const SizedBox(height: 16),
                
                // Solde initial
                TextFormField(
                  controller: _balanceController,
                  decoration: InputDecoration(
                    labelText: t('Solde initial'),
                    prefixIcon: const Icon(Icons.payments_outlined),
                    suffixText: currencySymbol,
                  ),
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  inputFormatters: [
                    FilteringTextInputFormatter.allow(RegExp(r'^\d+\.?\d{0,2}')),
                  ],
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Veuillez entrer un montant';
                    }
                    if (double.tryParse(value) == null) {
                      return 'Montant invalide';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                
                // Sélection d'icône
                const TrText(
                  'Icône du compte',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _accountIcons.map((icon) {
                    final isSelected = icon == _selectedIcon;
                    return InkWell(
                      onTap: () {
                        setState(() {
                          _selectedIcon = icon;
                        });
                      },
                      child: Container(
                        width: 50,
                        height: 50,
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
                  }).toList(),
                ),
                const SizedBox(height: 24),
                
                // Bouton d'ajout
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _saveAccount,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppDesign.primaryIndigo,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: _isLoading 
                      ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const TrText(
                      'Ajouter le Compte',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _getAccountTypeName(AccountType type) {
    switch (type) {
      case AccountType.checking:
        return 'Compte Courant';
      case AccountType.savings:
        return 'Épargne';
      case AccountType.cash:
        return 'Espèces';
      case AccountType.creditCard:
        return 'Carte de Crédit';
      case AccountType.investment:
        return 'Investissement';
      case AccountType.mobileWallet:
        return 'Portefeuille Mobile';
      case AccountType.other:
        return 'Autre';
    }
  }

  Future<void> _saveAccount() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);
      try {
        await widget.onAccountAdded(
          _nameController.text,
          _selectedType,
          double.parse(_balanceController.text),
          _selectedIcon,
        );
        if (mounted) Navigator.pop(context);
      } finally {
        if (mounted) setState(() => _isLoading = false);
      }
    }
  }
}

/// Modal pour éditer un compte existant
class EditAccountModal extends StatefulWidget {
  final Account account;
  final Function(Account) onAccountUpdated;
  final Function(Account) onAccountDeleted;

  const EditAccountModal({
    super.key,
    required this.account,
    required this.onAccountUpdated,
    required this.onAccountDeleted,
  });

  @override
  State<EditAccountModal> createState() => _EditAccountModalState();
}

class _EditAccountModalState extends State<EditAccountModal> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late AccountType _selectedType;
  late String _selectedIcon;
  bool _isLoading = false;

  final List<String> _accountIcons = [
    '💳', '💰', '🏦', '💵', '💶', '💷',
    '💴', '🪙', '💸', '📱', '🏧', '💎'
  ];

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.account.name);
    _selectedType = widget.account.type;
    _selectedIcon = widget.account.icon ?? '💳';
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const TrText(
                      'Modifier le Compte',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete, color: AppDesign.expenseColor),
                      onPressed: () => _showDeleteConfirmation(),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                
                // Nom du compte
                TextFormField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    labelText: t('Nom du compte'),
                    prefixIcon: Icon(Icons.account_balance_wallet),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Veuillez entrer un nom';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                
                // Type de compte
                DropdownButtonFormField<AccountType>(
                  value: _selectedType,
                  decoration: InputDecoration(
                    labelText: t('Type de compte'),
                    prefixIcon: Icon(Icons.category),
                  ),
                  items: AccountType.values.map((type) {
                    return DropdownMenuItem(
                      value: type,
                      child: TrText(_getAccountTypeName(type)),
                    );
                  }).toList(),
                  onChanged: (value) {
                    setState(() {
                      _selectedType = value!;
                    });
                  },
                ),
                const SizedBox(height: 16),
                
                // Sélection d'icône
                const TrText(
                  'Icône du compte',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _accountIcons.map((icon) {
                    final isSelected = icon == _selectedIcon;
                    return InkWell(
                      onTap: () {
                        setState(() {
                          _selectedIcon = icon;
                        });
                      },
                      child: Container(
                        width: 50,
                        height: 50,
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
                  }).toList(),
                ),
                const SizedBox(height: 24),
                
                // Boutons
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const TrText('Annuler'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _updateAccount,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppDesign.primaryIndigo,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: _isLoading
                          ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                          : const TrText(
                          'Enregistrer',
                          style: TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _getAccountTypeName(AccountType type) {
    switch (type) {
      case AccountType.checking:
        return 'Compte Courant';
      case AccountType.savings:
        return 'Épargne';
      case AccountType.cash:
        return 'Espèces';
      case AccountType.creditCard:
        return 'Carte de Crédit';
      case AccountType.investment:
        return 'Investissement';
      case AccountType.mobileWallet:
        return 'Portefeuille Mobile';
      case AccountType.other:
        return 'Autre';
    }
  }

  Future<void> _updateAccount() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);
      try {
        final updatedAccount = widget.account.copyWith(
          name: _nameController.text,
          type: _selectedType,
          icon: _selectedIcon,
          updatedAt: DateTime.now(),
        );

        await widget.onAccountUpdated(updatedAccount);
        if (mounted) Navigator.pop(context);
      } finally {
        if (mounted) setState(() => _isLoading = false);
      }
    }
  }

  void _showDeleteConfirmation() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const TrText('Supprimer le compte'),
        content: TrText(
          'Êtes-vous sûr de vouloir supprimer "${widget.account.name}" ?\n\nCette action est irréversible.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const TrText('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context); // Close dialog
              await widget.onAccountDeleted(widget.account);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppDesign.expenseColor,
            ),
            child: const TrText('Supprimer'),
          ),
        ],
      ),
    );
  }
}

/// Modal pour effectuer un transfert entre comptes
class TransferModal extends StatefulWidget {
  final List<Account> accounts;
  final Function(String sourceId, String destId, double amount) onTransferCompleted;

  const TransferModal({
    super.key,
    required this.accounts,
    required this.onTransferCompleted,
  });

  @override
  State<TransferModal> createState() => _TransferModalState();
}

class _TransferModalState extends State<TransferModal> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  Account? _sourceAccount;
  Account? _destinationAccount;
  bool _isLoading = false;

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  List<Account> get _availableSourceAccounts {
    if (_destinationAccount == null) {
      return widget.accounts;
    }
    return widget.accounts
        .where((acc) => acc.accountId != _destinationAccount!.accountId)
        .toList();
  }

  List<Account> get _availableDestinationAccounts {
    if (_sourceAccount == null) {
      return widget.accounts;
    }
    return widget.accounts
        .where((acc) => acc.accountId != _sourceAccount!.accountId)
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: SingleChildScrollView(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 640),
              child: Padding(
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
                              color: AppDesign.transferColor.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(
                              Icons.swap_horiz,
                              color: AppDesign.transferColor,
                              size: 28,
                            ),
                          ),
                          const SizedBox(width: 12),
                          const TrText(
                            'Transférer de l\'argent',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      
                      // Compte source
                      DropdownButtonFormField<Account>(
                        value: _sourceAccount,
                        isExpanded: true,
                        decoration: InputDecoration(
                          labelText: t('Depuis le compte'),
                          prefixIcon: Icon(Icons.account_balance_wallet),
                        ),
                        hint: const TrText('Sélectionner un compte'),
                        items: _availableSourceAccounts.map((account) {
                          return DropdownMenuItem(
                            value: account,
                            child: Row(
                              children: [
                                TrText(account.icon ?? '❓', style: const TextStyle(fontSize: 20)),
                                const SizedBox(width: 8),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      TrText(account.name),
                                      TrText(
                                        context.watch<CurrencyService>().formatAmount(account.balance, account.currency, false),
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
                            _sourceAccount = value;
                          });
                        },
                        validator: (value) {
                          if (value == null) {
                            return 'Veuillez sélectionner un compte source';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 16),
                      
                      // Icône de transfert
                      Center(
                        child: Icon(
                          Icons.arrow_downward,
                          color: Colors.grey[400],
                          size: 32,
                        ),
                      ),
                const SizedBox(height: 16),
                
                // Compte destination
                DropdownButtonFormField<Account>(
                  value: _destinationAccount,
                  isExpanded: true,
                  decoration: InputDecoration(
                    labelText: t('Vers le compte'),
                    prefixIcon: Icon(Icons.account_balance),
                  ),
                  hint: const TrText('Sélectionner un compte'),
                  items: _availableDestinationAccounts.map((account) {
                    return DropdownMenuItem(
                      value: account,
                      child: Row(
                        children: [
                          TrText(account.icon ?? '❓', style: const TextStyle(fontSize: 20)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                TrText(account.name),
                                TrText(
                                  context.watch<CurrencyService>().formatAmount(account.balance, account.currency, false),
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
                      _destinationAccount = value;
                    });
                  },
                  validator: (value) {
                    if (value == null) {
                      return 'Veuillez sélectionner un compte destination';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                
                // Montant
                TextFormField(
                  controller: _amountController,
                  decoration: InputDecoration(
                    labelText: t('Montant à transférer'),
                    prefixIcon: const Icon(Icons.payments_outlined),
                    suffixText: context.watch<CurrencyService>().getCurrencySymbol(context.watch<CurrencyService>().currentCurrency),
                      helperText: _sourceAccount != null
                        ? 'Solde disponible: ${context.watch<CurrencyService>().formatAmount(_sourceAccount!.balance)}'
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
                    if (_sourceAccount != null && amount > _sourceAccount!.balance) {
                      return 'Solde insuffisant';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                
                // Bouton de transfert
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _performTransfer,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppDesign.transferColor,
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
                            'Effectuer le Transfert',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                  ),
                ),
              ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _performTransfer() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true;
      });

      try {
        final amount = double.parse(_amountController.text);
        await widget.onTransferCompleted(
          _sourceAccount!.accountId,
          _destinationAccount!.accountId,
          amount,
        );

        if (mounted) {
          Navigator.pop(context);
        }
      } finally {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
        }
      }
    }
  }
}

/// Modal de partage de compte
class ShareAccountModal extends StatefulWidget {
  final Account account;
  final ValueChanged<String> onSharedUpdated;

  const ShareAccountModal({
    super.key,
    required this.account,
    required this.onSharedUpdated,
  });

  @override
  State<ShareAccountModal> createState() => _ShareAccountModalState();
}

class _ShareAccountModalState extends State<ShareAccountModal> {
  final _emailController = TextEditingController();
  late List<String> _sharedWith;
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    _sharedWith = List<String>.from(widget.account.sharedWithUIDs);
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _sendInvitation() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) return;

    setState(() {
      _isSending = true;
    });

    try {
      widget.onSharedUpdated(email);
      // Note: onSharedUpdated is async and handles the actual sharing logic
      // We just clear the field here if successful
      setState(() {
        _emailController.clear();
      });
    } finally {
      if (mounted) {
        setState(() {
          _isSending = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const TrText(
                    'Gérer le partage',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppDesign.primaryIndigo.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: TrText(
                      widget.account.name,
                      style: const TextStyle(
                        color: AppDesign.primaryIndigo,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _emailController,
                decoration: InputDecoration(
                  labelText: t('Email de l’utilisateur'),
                  prefixIcon: Icon(Icons.email_outlined),
                  hintText: t('prenom.nom@email.com'),
                ),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: _isSending ? null : _sendInvitation,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppDesign.primaryIndigo,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  icon: _isSending
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Icon(Icons.send),
                  label: TrText(_isSending ? 'Envoi...' : 'Envoyer une invitation'),
                ),
              ),
              const SizedBox(height: 20),
              const TrText(
                'Utilisateurs ayant accès',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 10),
              if (_sharedWith.isEmpty)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const TrText(
                    'Aucun utilisateur ajouté pour le moment.',
                    style: TextStyle(color: Colors.grey),
                  ),
                )
              else
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: _sharedWith.map((uid) {
                    return Chip(
                      avatar: const Icon(Icons.person, size: 18),
                      label: TrText(uid),
                    );
                  }).toList(),
                ),
              const SizedBox(height: 12),
            ],
          ),
        ),
      ),
    );
  }
}
