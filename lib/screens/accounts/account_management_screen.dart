import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../models/models.dart';
import '../../services/mock_data_service.dart';
import '../../constants/app_design.dart';

/// Écran de gestion des comptes bancaires avec liste, ajout, édition et transfert
class AccountManagementScreen extends StatefulWidget {
  const AccountManagementScreen({super.key});

  @override
  State<AccountManagementScreen> createState() => _AccountManagementScreenState();
}

class _AccountManagementScreenState extends State<AccountManagementScreen> {
  final MockDataService _mockService = MockDataService();
  List<Account> _accounts = [];

  @override
  void initState() {
    super.initState();
    _loadAccounts();
  }

  void _loadAccounts() {
    setState(() {
      _accounts = _mockService.getMockAccounts();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppDesign.backgroundGrey,
      appBar: AppBar(
        title: const Text(
          'Mes Comptes',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: AppDesign.primaryIndigo,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: _accounts.isEmpty
          ? _buildEmptyState()
          : ListView.builder(
              padding: const EdgeInsets.all(AppDesign.paddingMedium),
              itemCount: _accounts.length,
              itemBuilder: (context, index) {
                return _buildAccountCard(_accounts[index]);
              },
            ),
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton(
            heroTag: 'transfer',
            onPressed: () => _showTransferModal(),
            backgroundColor: AppDesign.transferColor,
            child: const Icon(Icons.swap_horiz),
          ),
          const SizedBox(height: 12),
          FloatingActionButton.extended(
            heroTag: 'add',
            onPressed: () => _showAddAccountModal(),
            backgroundColor: AppDesign.primaryIndigo,
            icon: const Icon(Icons.add),
            label: const Text('Compte'),
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
          // TODO: Naviguer vers les détails du compte
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
                ],
              ),
            ],
          ),
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
        onAccountAdded: (newAccount) {
          setState(() {
            _accounts.add(newAccount);
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Compte ajouté avec succès !')),
          );
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
        onAccountUpdated: (updatedAccount) {
          setState(() {
            final index = _accounts.indexWhere((a) => a.accountId == updatedAccount.accountId);
            if (index != -1) {
              _accounts[index] = updatedAccount;
            }
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Compte modifié avec succès !')),
          );
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
        onSharedUpdated: (updatedAccount) {
          setState(() {
            final idx = _accounts.indexWhere((a) => a.accountId == updatedAccount.accountId);
            if (idx != -1) {
              _accounts[idx] = updatedAccount;
            }
          });
        },
      ),
    );
  }

  void _showTransferModal() {
    if (_accounts.length < 2) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vous devez avoir au moins 2 comptes pour effectuer un transfert'),
        ),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => TransferModal(
        accounts: _accounts,
        onTransferCompleted: (sourceId, destId, amount) {
          _performTransfer(sourceId, destId, amount);
        },
      ),
    );
  }

  void _performTransfer(String sourceId, String destinationId, double amount) {
    setState(() {
      final sourceIndex = _accounts.indexWhere((a) => a.accountId == sourceId);
      final destIndex = _accounts.indexWhere((a) => a.accountId == destinationId);

      if (sourceIndex != -1 && destIndex != -1) {
        _accounts[sourceIndex] = _accounts[sourceIndex].copyWith(
          balance: _accounts[sourceIndex].balance - amount,
          updatedAt: DateTime.now(),
        );
        _accounts[destIndex] = _accounts[destIndex].copyWith(
          balance: _accounts[destIndex].balance + amount,
          updatedAt: DateTime.now(),
        );
      }
    });

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Transfert de ${amount.toStringAsFixed(2)} € effectué avec succès !'),
        backgroundColor: AppDesign.incomeColor,
      ),
    );
  }
}

/// Modal pour ajouter un nouveau compte
class AddAccountModal extends StatefulWidget {
  final Function(Account) onAccountAdded;

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
                    onPressed: _saveAccount,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppDesign.primaryIndigo,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: const Text(
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
      case AccountType.other:
        return 'Autre';
    }
  }

  void _saveAccount() {
    if (_formKey.currentState!.validate()) {
      final newAccount = Account(
        accountId: 'acc_${DateTime.now().millisecondsSinceEpoch}',
        userId: 'user_1',
        name: _nameController.text,
        type: _selectedType,
        balance: double.parse(_balanceController.text),
        currency: 'EUR',
        icon: _selectedIcon,
        color: '#6366F1',
        isActive: true,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      widget.onAccountAdded(newAccount);
      Navigator.pop(context);
    }
  }
}

/// Modal pour éditer un compte existant
class EditAccountModal extends StatefulWidget {
  final Account account;
  final Function(Account) onAccountUpdated;

  const EditAccountModal({
    super.key,
    required this.account,
    required this.onAccountUpdated,
  });

  @override
  State<EditAccountModal> createState() => _EditAccountModalState();
}

class _EditAccountModalState extends State<EditAccountModal> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late AccountType _selectedType;
  late String _selectedIcon;

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
                        onPressed: _updateAccount,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppDesign.primaryIndigo,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text(
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
      case AccountType.other:
        return 'Autre';
    }
  }

  void _updateAccount() {
    if (_formKey.currentState!.validate()) {
      final updatedAccount = widget.account.copyWith(
        name: _nameController.text,
        type: _selectedType,
        icon: _selectedIcon,
        updatedAt: DateTime.now(),
      );

      widget.onAccountUpdated(updatedAccount);
      Navigator.pop(context);
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
            onPressed: () {
              // TODO: Implémenter la suppression
              Navigator.pop(context);
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Suppression de compte (à implémenter)'),
                ),
              );
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

  void _performTransfer() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true;
      });

      // Simulation d'un délai réseau
      await Future.delayed(const Duration(milliseconds: 800));

      final amount = double.parse(_amountController.text);
      widget.onTransferCompleted(
        _sourceAccount!.accountId,
        _destinationAccount!.accountId,
        amount,
      );

      if (mounted) {
        Navigator.pop(context);
      }
    }
  }
}

/// Modal de partage de compte
class ShareAccountModal extends StatefulWidget {
  final Account account;
  final ValueChanged<Account> onSharedUpdated;

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

    // Simulation d'appel backend
    await Future.delayed(const Duration(milliseconds: 600));

    final simulatedUid = 'uid_${email.hashCode.abs()}';
    if (!_sharedWith.contains(simulatedUid)) {
      setState(() {
        _sharedWith.add(simulatedUid);
      });
      final updatedAccount = widget.account.copyWith(sharedWithUIDs: _sharedWith);
      widget.onSharedUpdated(updatedAccount);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Invitation envoyée à $email')),
        );
      }
    }

    setState(() {
      _isSending = false;
      _emailController.clear();
    });
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
