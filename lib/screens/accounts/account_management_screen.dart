import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../models/models.dart';
import '../../models/transaction.dart' as app_transaction;
import '../../services/firestore_service.dart';
import '../../constants/app_design.dart';
import '../../widgets/revolutionary_logo.dart';
import '../transactions/transactions_list_screen.dart';

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
        body: Center(child: Text('Veuillez vous connecter pour gérer vos comptes')),
      );
    }

    return Scaffold(
      backgroundColor: AppDesign.backgroundGrey,
      appBar: AppBar(
        title: Row(
          children: [
            const RevolutionaryLogo(size: 32),
            const SizedBox(width: 12),
            const Text(
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
      ),
      body: StreamBuilder<List<Account>>(
        stream: _accountsStream,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          
          if (snapshot.hasError) {
            return Center(child: Text('Erreur: ${snapshot.error}'));
          }

          final accounts = snapshot.data ?? [];

          if (accounts.isEmpty) {
            return _buildEmptyState();
          }

          final totalBalance = accounts.fold<double>(0.0, (sum, acc) => sum + acc.balance);
          final currency = accounts.isNotEmpty ? accounts.first.currency : 'EUR';

          return ListView.builder(
            padding: const EdgeInsets.all(AppDesign.paddingMedium),
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
      floatingActionButton: Column(
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
            label: const Text(
              'Compte',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
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
          Text(
            'Aucun compte',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          Text(
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
                  color: accountColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(AppDesign.borderRadiusMedium),
                ),
                child: Center(
                  child: Text(
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
                    Text(
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
                        color: accountColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        accountTypeLabel,
                        style: TextStyle(
                          fontSize: 12,
                          color: accountColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${account.balance.toStringAsFixed(2)} ${account.currency}',
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
                    tooltip: 'Gérer le partage',
                    icon: const Icon(Icons.people, color: Colors.grey),
                    onPressed: () => _showShareAccountModal(account),
                  ),
                  IconButton(
                    icon: const Icon(Icons.edit_outlined),
                    color: AppDesign.primaryIndigo,
                    onPressed: () => _showEditAccountModal(account),
                  ),
                  IconButton(
                    tooltip: 'Historique',
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
              color: Colors.white.withOpacity(0.16),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.account_balance, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Avoirs financiers',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.9),
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${total.toStringAsFixed(2)} $currency',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    letterSpacing: -0.4,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Total de tous vos comptes',
                  style: TextStyle(
                    color: Colors.white.withOpacity(0.78),
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
                    const Text(
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
                          child: Text(
                            _historyRange == null
                                ? 'Période'
                                : '${_historyRange!.start.day}/${_historyRange!.start.month} → ${_historyRange!.end.day}/${_historyRange!.end.month}',
                          ),
                        ),
                        IconButton(
                          tooltip: 'Exporter CSV',
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
                              const SnackBar(content: Text('Historique copié (CSV)')),
                            );
                          },
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (txs.isEmpty)
                  const Text(
                    'Aucun mouvement pour ce compte.',
                    style: TextStyle(color: Colors.grey),
                  )
                else
                  ...txs.take(20).map((tx) {
                    final isIncome = tx.type == app_transaction.TransactionType.income;
                    final isExpense = tx.type == app_transaction.TransactionType.expense;
                    final color = isIncome
                        ? AppDesign.incomeColor
                        : isExpense
                            ? AppDesign.expenseColor
                            : Colors.blueGrey;
                    final prefix = isIncome ? '+' : isExpense ? '-' : '';
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: CircleAvatar(
                        backgroundColor: color.withOpacity(0.12),
                        child: Text(
                          (tx.category ?? '💳').characters.first,
                          style: const TextStyle(fontSize: 18),
                        ),
                      ),
                      title: Text(
                        tx.description ?? 'Transaction',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                      subtitle: Text(
                        '${tx.date.day}/${tx.date.month}/${tx.date.year} · ${tx.category ?? 'Sans catégorie'}',
                        style: const TextStyle(color: Colors.grey),
                      ),
                      trailing: Text(
                        '$prefix${tx.amount.toStringAsFixed(2)} ${account.currency}',
                        style: TextStyle(
                          color: color,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    );
                  }),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _historyChip(String label, app_transaction.TransactionType? type) {
    final selected = _historyFilterType == type;
    return Padding(
      padding: const EdgeInsets.only(right: 6),
      child: ChoiceChip(
        label: Text(label),
        selected: selected,
        onSelected: (_) {
          setState(() {
            _historyFilterType = type;
          });
        },
        selectedColor: AppDesign.primaryIndigo.withOpacity(0.15),
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
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => AddAccountModal(
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
                const SnackBar(content: Text('Compte ajouté avec succès !')),
              );
            }
          }
        },
      ),
    );
  }

  void _showEditAccountModal(Account account) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => EditAccountModal(
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
                const SnackBar(content: Text('Compte modifié avec succès !')),
              );
            }
          }
        },
        onAccountDeleted: (account) async {
          if (_userId != null) {
            await _firestoreService.deleteAccount(_userId!, account.accountId);
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Compte supprimé avec succès !')),
              );
            }
          }
        },
      ),
    );
  }

  void _showShareAccountModal(Account account) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => ShareAccountModal(
        account: account,
        onSharedUpdated: (email) async {
          if (_userId != null) {
            try {
              await _firestoreService.addSharedAccess(email, account.accountId);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Invitation envoyée à $email')),
                );
              }
            } catch (e) {
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Erreur: $e'), backgroundColor: Colors.red),
                );
              }
            }
          }
        },
      ),
    );
  }

  void _showTransferModal(List<Account> accounts) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => TransferModal(
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
                    content: Text('Transfert de ${amount.toStringAsFixed(2)} € effectué avec succès !'),
                    backgroundColor: AppDesign.incomeColor,
                  ),
                );
              }
            } catch (e) {
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Erreur: $e'), backgroundColor: Colors.red),
                );
              }
            }
          }
        },
      ),
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
                const Text(
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
                  decoration: const InputDecoration(
                    labelText: 'Nom du compte',
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
                  decoration: const InputDecoration(
                    labelText: 'Type de compte',
                    prefixIcon: Icon(Icons.category),
                  ),
                  items: AccountType.values.map((type) {
                    return DropdownMenuItem(
                      value: type,
                      child: Text(_getAccountTypeName(type)),
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
                  decoration: const InputDecoration(
                    labelText: 'Solde initial',
                    prefixIcon: Icon(Icons.euro),
                    suffixText: '€',
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
                const Text(
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
                              ? AppDesign.primaryIndigo.withOpacity(0.1)
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
                          child: Text(
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
                      : const Text(
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
                    const Text(
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
                  decoration: const InputDecoration(
                    labelText: 'Nom du compte',
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
                  decoration: const InputDecoration(
                    labelText: 'Type de compte',
                    prefixIcon: Icon(Icons.category),
                  ),
                  items: AccountType.values.map((type) {
                    return DropdownMenuItem(
                      value: type,
                      child: Text(_getAccountTypeName(type)),
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
                const Text(
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
                              ? AppDesign.primaryIndigo.withOpacity(0.1)
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
                          child: Text(
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
                        child: const Text('Annuler'),
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
                          : const Text(
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
        title: const Text('Supprimer le compte'),
        content: Text(
          'Êtes-vous sûr de vouloir supprimer "${widget.account.name}" ?\n\nCette action est irréversible.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context); // Close dialog
              await widget.onAccountDeleted(widget.account);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppDesign.expenseColor,
            ),
            child: const Text('Supprimer'),
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
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppDesign.transferColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        Icons.swap_horiz,
                        color: AppDesign.transferColor,
                        size: 28,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
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
                  decoration: const InputDecoration(
                    labelText: 'Depuis le compte',
                    prefixIcon: Icon(Icons.account_balance_wallet),
                  ),
                  hint: const Text('Sélectionner un compte'),
                  items: _availableSourceAccounts.map((account) {
                    return DropdownMenuItem(
                      value: account,
                      child: Row(
                        children: [
                          Text(account.icon ?? '❓', style: const TextStyle(fontSize: 20)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(account.name),
                                Text(
                                  '${account.balance.toStringAsFixed(2)} ${account.currency}',
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
                  decoration: const InputDecoration(
                    labelText: 'Vers le compte',
                    prefixIcon: Icon(Icons.account_balance),
                  ),
                  hint: const Text('Sélectionner un compte'),
                  items: _availableDestinationAccounts.map((account) {
                    return DropdownMenuItem(
                      value: account,
                      child: Row(
                        children: [
                          Text(account.icon ?? '❓', style: const TextStyle(fontSize: 20)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(account.name),
                                Text(
                                  '${account.balance.toStringAsFixed(2)} ${account.currency}',
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
                    labelText: 'Montant à transférer',
                    prefixIcon: const Icon(Icons.euro),
                    suffixText: 'EUR',
                    helperText: _sourceAccount != null
                        ? 'Solde disponible: ${_sourceAccount!.balance.toStringAsFixed(2)} EUR'
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
                        : const Text(
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
                  const Text(
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
                      color: AppDesign.primaryIndigo.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
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
                decoration: const InputDecoration(
                  labelText: 'Email de l’utilisateur',
                  prefixIcon: Icon(Icons.email_outlined),
                  hintText: 'prenom.nom@email.com',
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
                  label: Text(_isSending ? 'Envoi...' : 'Envoyer une invitation'),
                ),
              ),
              const SizedBox(height: 20),
              const Text(
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
                  child: const Text(
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
                      label: Text(uid),
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
