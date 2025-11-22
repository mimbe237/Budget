import 'package:flutter/material.dart';
import '../../models/account.dart';
import '../../models/transaction.dart' as app_transaction;
import '../../models/category.dart';
import '../../services/mock_data_service.dart';
import '../../services/firestore_service.dart';
import '../../constants/app_design.dart';
import '../auth/auth_screen.dart';
import '../accounts/account_management_screen.dart';

/// Formulaire pour ajouter une transaction (dépense ou revenu)
/// Type déterminé par le paramètre transactionType: 'expense' ou 'income'
class TransactionFormScreen extends StatefulWidget {
  final app_transaction.TransactionType transactionType;
  
  const TransactionFormScreen({
    super.key,
    required this.transactionType,
  });

  @override
  State<TransactionFormScreen> createState() => _TransactionFormScreenState();
}

class _TransactionFormScreenState extends State<TransactionFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _mockService = MockDataService();
  final _firestoreService = FirestoreService();
  final TextEditingController _amountController = TextEditingController();

  // Variables du formulaire
  double _amount = 0.0;
  String _description = '';
  String? _selectedAccountId;
  String? _selectedCategoryId;
  DateTime _selectedDate = DateTime.now();
  String _note = '';
  List<String> _tags = [];
  String? _selectedTemplate;
  
  // Streams pour les données
  Stream<List<Account>> _accountsStream = const Stream.empty();
  Stream<List<Category>> _categoriesStream = const Stream.empty();
  bool _isInitializing = true;

  @override
  void initState() {
    super.initState();
    _initStreams();
  }

  Future<void> _initStreams() async {
    final userId = _firestoreService.currentUserId;
    if (userId == null) {
      // Fallback sur mock si pas connecté (pour dev)
      setState(() {
        _accountsStream = Stream.value(_mockService.getMockAccounts());
        _categoriesStream = Stream.value(_mockService.getMockCategories()
            .where((cat) => cat.type == _getCategoryTypeFromTransaction())
            .toList());
        _isInitializing = false;
      });
    } else {
      // Initialiser les comptes et catégories par défaut si nécessaire
      _firestoreService.createDefaultAccounts(userId);
      _firestoreService.createDefaultCategories(userId);
      
      setState(() {
        _accountsStream = _firestoreService.getAccountsStream(userId);
        _categoriesStream = _firestoreService.getCategoriesStream(
          userId, 
          type: _getCategoryTypeFromTransaction()
        );
        _isInitializing = false;
      });
    }
  }

  CategoryType _getCategoryTypeFromTransaction() {
    return widget.transactionType == app_transaction.TransactionType.income
        ? CategoryType.income
        : CategoryType.expense;
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: ThemeData.light().copyWith(
            colorScheme: ColorScheme.light(primary: AppDesign.primaryIndigo),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedDate) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _saveTransaction() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_selectedAccountId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez sélectionner un compte.')),
      );
      return;
    }

    if (_selectedCategoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Veuillez sélectionner une catégorie.')),
      );
      return;
    }

    final userId = _firestoreService.currentUserId;
    if (userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vous devez être connecté pour ajouter une transaction.')),
      );
      return;
    }
    
    _formKey.currentState!.save();
    
    // Afficher un loader
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator()),
    );

    try {
      // --- DISCIPLINE BUDGÉTAIRE STRICTE ---
      if (widget.transactionType == app_transaction.TransactionType.expense) {
        // Récupérer le compte à jour depuis Firestore pour avoir le solde réel
        final currentAccount = await _firestoreService.getAccount(userId, _selectedAccountId!);
        
        if (currentAccount != null) {
          final currentBalance = currentAccount.balance;

          // Règle 1 : Solde proche de zéro ou négatif
          if (currentBalance <= 0.1) { // Marge de 10 centimes
            if (mounted) {
              Navigator.of(context).pop(); // Fermer le loader
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Discipline Budgétaire 🛡️'),
                  content: const Text(
                    'Vous devez enregistrer un revenu ou une entrée de fonds avant d\'ajouter une dépense.\n\n'
                    'Votre solde actuel est insuffisant pour effectuer cette opération.',
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(ctx).pop(),
                      child: const Text('Compris'),
                    ),
                  ],
                ),
              );
            }
            return;
          }

          // Règle 2 : Dépense supérieure au solde disponible
          if (_amount > currentBalance) {
            if (mounted) {
              Navigator.of(context).pop(); // Fermer le loader
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Solde Insuffisant ⚠️'),
                  content: Text(
                    'Cette dépense de ${_amount.toStringAsFixed(2)} € dépasse le solde disponible de ${currentBalance.toStringAsFixed(2)} € sur ce compte.\n\n'
                    'Veuillez choisir un autre compte ou enregistrer un revenu.',
                  ),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.of(ctx).pop(),
                      child: const Text('OK'),
                    ),
                  ],
                ),
              );
            }
            return;
          }
        }
      }
      // -------------------------------------

      await _firestoreService.addTransaction(
        userId: userId,
        accountId: _selectedAccountId!,
        categoryId: _selectedCategoryId,
        type: widget.transactionType,
        amount: _amount,
        description: _description.isEmpty ? _getDefaultDescription() : _description,
        note: _note.isEmpty ? null : _note,
        date: _selectedDate,
        tags: _tags.isEmpty ? null : _tags,
      );
      
      if (mounted) {
        Navigator.of(context).pop(); // Fermer le loader
        Navigator.of(context).pop(); // Retour à l'écran précédent
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              '${_isExpense ? 'Dépense' : 'Revenu'} enregistré${_isExpense ? 'e' : ''} avec succès !',
            ),
            backgroundColor: Colors.green,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.of(context).pop(); // Fermer le loader
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erreur : $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    }
  }

  bool get _isExpense => widget.transactionType == app_transaction.TransactionType.expense;
  
  String _getDefaultDescription() {
    return _isExpense ? 'Dépense' : 'Revenu';
  }

  void _applyTemplate(_TxTemplate template, List<Category> categories) {
    setState(() {
      _selectedTemplate = template.name;
      _amount = template.amount;
      _amountController.text = template.amount.toStringAsFixed(2);
      _description = template.name;
      _note = template.note ?? '';

      final match = categories.firstWhere(
        (c) => c.name.toLowerCase().contains(template.categoryLabel.toLowerCase()),
        orElse: () => categories.isNotEmpty ? categories.first : Category(
          categoryId: 'temp',
          userId: '',
          name: template.categoryLabel,
          type: _isExpense ? CategoryType.expense : CategoryType.income,
          icon: '💳',
          color: '#808080',
          createdAt: DateTime.now(),
          updatedAt: DateTime.now(),
        ),
      );
      _selectedCategoryId = match.categoryId;
    });
  }

  Color get _accentColor {
    return _isExpense ? AppDesign.expenseColor : AppDesign.incomeColor;
  }

  List<_TxTemplate> get _templates {
    if (_isExpense) {
      return [
        _TxTemplate(
          name: 'Loyer',
          amount: 1200,
          categoryLabel: 'Logement',
          note: 'Loyer mensuel',
        ),
        _TxTemplate(
          name: 'Internet',
          amount: 50,
          categoryLabel: 'Internet',
          note: 'Fibre',
        ),
        _TxTemplate(
          name: 'Courses',
          amount: 150,
          categoryLabel: 'Alimentation',
          note: 'Hebdo',
        ),
      ];
    } else {
      return [
        _TxTemplate(
          name: 'Salaire',
          amount: 3200,
          categoryLabel: 'Salaire',
          note: 'Mensuel',
        ),
        _TxTemplate(
          name: 'Prime',
          amount: 300,
          categoryLabel: 'Prime',
          note: 'Exceptionnel',
        ),
        _TxTemplate(
          name: 'Remboursement',
          amount: 100,
          categoryLabel: 'Autres revenus',
          note: 'Remboursement',
        ),
      ];
    }
  }

  @override
  Widget build(BuildContext context) {
    final bool isLoggedIn = _firestoreService.currentUserId != null;
    
    return Scaffold(
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        title: Text(
          _isExpense ? 'Nouvelle Dépense' : 'Nouveau Revenu',
          style: TextStyle(
            color: _accentColor,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Colors.white,
        iconTheme: IconThemeData(color: _accentColor),
        elevation: 0,
      ),
      body: _isInitializing
          ? const Center(child: CircularProgressIndicator())
          : StreamBuilder<List<Account>>(
        stream: _accountsStream,
        builder: (context, accountSnapshot) {
          if (accountSnapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          
          if (accountSnapshot.hasError) {
            return Center(child: Text('Erreur chargement comptes: ${accountSnapshot.error}'));
          }

          final accounts = accountSnapshot.data ?? [];
          
          // Initialisation par défaut du compte sélectionné
          if (accounts.isNotEmpty && (_selectedAccountId == null || !accounts.any((a) => a.accountId == _selectedAccountId))) {
            WidgetsBinding.instance.addPostFrameCallback((_) {
              if (mounted) {
                setState(() {
                  _selectedAccountId = accounts.first.accountId;
                });
              }
            });
          }

          return StreamBuilder<List<Category>>(
            stream: _categoriesStream,
            builder: (context, categorySnapshot) {
              if (categorySnapshot.connectionState == ConnectionState.waiting) {
                return const Center(child: CircularProgressIndicator());
              }

              final categories = categorySnapshot.data ?? [];
              
              // Initialisation par défaut de la catégorie sélectionnée
              if (categories.isNotEmpty && (_selectedCategoryId == null || !categories.any((c) => c.categoryId == _selectedCategoryId))) {
                WidgetsBinding.instance.addPostFrameCallback((_) {
                  if (mounted) {
                    setState(() {
                      _selectedCategoryId = categories.first.categoryId;
                    });
                  }
                });
              }

              return Form(
                key: _formKey,
                child: SafeArea(
                  child: AnimatedPadding(
                    duration: const Duration(milliseconds: 180),
                    curve: Curves.easeOut,
                    padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (!isLoggedIn) _buildAuthBanner(context),
                          if (!isLoggedIn) const SizedBox(height: 16),
                          
                          _buildTemplates(),
                          const SizedBox(height: 16),

                          _buildAmountField(),
                          const SizedBox(height: 24),

                          _buildAccountSelector(accounts),
                          const SizedBox(height: 20),

                          _buildCategorySelector(categories),
                          const SizedBox(height: 20),

                          _buildDescriptionField(),
                          const SizedBox(height: 20),

                          _buildNoteField(),
                          const SizedBox(height: 20),

                          _buildDateSelector(),
                          const SizedBox(height: 20),

                          _buildTagsField(),
                          const SizedBox(height: 32),

                          _buildSaveButton(),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildTemplates() {
    return SizedBox(
      height: 40,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: _templates.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final template = _templates[index];
          final isSelected = _selectedTemplate == template.name;
          return StreamBuilder<List<Category>>(
            stream: _categoriesStream,
            builder: (context, snapshot) {
              final categories = snapshot.data ?? [];
              return ActionChip(
                label: Text(template.name),
                backgroundColor: isSelected ? _accentColor.withValues(alpha: 0.2) : Colors.grey[100],
                labelStyle: TextStyle(
                  color: isSelected ? _accentColor : Colors.grey[800],
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
                onPressed: () => _applyTemplate(template, categories),
              );
            }
          );
        },
      ),
    );
  }

  Widget _buildAuthBanner(BuildContext context) {
    return Card(
      color: Colors.orange[50],
      shape: RoundedRectangleBorder(borderRadius: AppDesign.mediumRadius),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(Icons.lock_open, color: Colors.orange),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  Text(
                    'Connexion requise',
                    style: TextStyle(fontWeight: FontWeight.w700),
                  ),
                  SizedBox(height: 4),
                  Text(
                    'Connectez-vous pour enregistrer des revenus ou dépenses.',
                    style: TextStyle(color: Colors.grey),
                  ),
                ],
              ),
            ),
            TextButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const AuthScreen()),
                );
              },
              child: const Text('Se connecter'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAmountField() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: AppDesign.mediumRadius),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  _isExpense ? Icons.remove_circle : Icons.add_circle,
                  color: _accentColor,
                  size: 28,
                ),
                const SizedBox(width: 12),
                Text(
                  'Montant',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[700],
                  ),
                ),
                const Spacer(),
                if (_selectedTemplate != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: _accentColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      _selectedTemplate!,
                      style: TextStyle(
                        color: _accentColor,
                        fontWeight: FontWeight.w700,
                        fontSize: 12,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _amountController,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              textInputAction: TextInputAction.next,
              style: TextStyle(
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: _accentColor,
              ),
              decoration: InputDecoration(
                hintText: '0.00',
                suffixText: 'EUR',
                border: InputBorder.none,
                hintStyle: TextStyle(color: Colors.grey[300]),
              ),
              validator: (value) {
                if (value == null || double.tryParse(value) == null || double.tryParse(value)! <= 0) {
                  return 'Montant invalide';
                }
                return null;
              },
              onSaved: (value) => _amount = double.parse(value!),
              onChanged: (value) {
                final parsed = double.tryParse(value);
                if (parsed != null) {
                  _amount = parsed;
                }
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAccountSelector(List<Account> accounts) {
    if (accounts.isEmpty) {
      return Card(
        color: Colors.red[50],
        shape: RoundedRectangleBorder(borderRadius: AppDesign.mediumRadius),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              const Icon(Icons.error_outline, color: Colors.red),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Aucun compte disponible. Créez-en un d\'abord.',
                  style: TextStyle(color: Colors.red),
                ),
              ),
              TextButton.icon(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const AccountManagementScreen(),
                    ),
                  );
                },
                icon: const Icon(Icons.add_circle_outline, color: Colors.red),
                label: const Text('Créer', style: TextStyle(color: Colors.red)),
              ),
            ],
          ),
        ),
      );
    }

    return DropdownButtonFormField<String>(
      isExpanded: true,
      itemHeight: null, // autorise plusieurs lignes sans overflow
      isDense: false,
      decoration: InputDecoration(
        labelText: 'Compte',
        prefixIcon: const Icon(Icons.account_balance_wallet_outlined),
        border: OutlineInputBorder(borderRadius: AppDesign.mediumRadius),
        filled: true,
        fillColor: Colors.grey[50],
        contentPadding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
      ),
      value: _selectedAccountId,
      items: accounts.map((Account account) {
        return DropdownMenuItem<String>(
          value: account.accountId,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8.0),
            child: Row(
              children: [
                Text(account.icon ?? '💰', style: const TextStyle(fontSize: 24)),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        account.name,
                        style: const TextStyle(fontWeight: FontWeight.w600),
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        '${account.balance.toStringAsFixed(2)} ${account.currency}',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      }).toList(),
      onChanged: (String? newValue) {
        setState(() => _selectedAccountId = newValue);
      },
      validator: (value) => value == null ? 'Compte requis' : null,
    );
  }

  Widget _buildCategorySelector(List<Category> categories) {
    if (categories.isEmpty) {
      return Card(
        color: Colors.orange[50],
        child: const Padding(
          padding: EdgeInsets.all(16.0),
          child: Text(
            'Aucune catégorie disponible.',
            style: TextStyle(color: Colors.orange),
          ),
        ),
      );
    }

    return DropdownButtonFormField<String>(
      isExpanded: true,
      itemHeight: null, // autorise plusieurs lignes sans overflow
      isDense: false,
      decoration: InputDecoration(
        labelText: 'Catégorie',
        prefixIcon: const Icon(Icons.category_outlined),
        border: OutlineInputBorder(borderRadius: AppDesign.mediumRadius),
        filled: true,
        fillColor: Colors.grey[50],
      ),
      value: _selectedCategoryId,
      items: categories.map((Category category) {
        return DropdownMenuItem<String>(
          value: category.categoryId,
          child: Row(
            children: [
              Text(category.icon, style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  category.name,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        );
      }).toList(),
      onChanged: (String? newValue) {
        setState(() => _selectedCategoryId = newValue);
      },
      validator: (value) => value == null ? 'Catégorie requise' : null,
      hint: _selectedTemplate != null ? const Text('Catégorie liée au template') : null,
    );
  }

  Widget _buildDescriptionField() {
    return TextFormField(
      decoration: InputDecoration(
        labelText: 'Description',
        hintText: 'Ex: Courses du mois',
        prefixIcon: const Icon(Icons.description_outlined),
        border: OutlineInputBorder(borderRadius: AppDesign.mediumRadius),
        filled: true,
        fillColor: Colors.grey[50],
      ),
      maxLength: 100,
      onSaved: (value) => _description = value ?? '',
    );
  }

  Widget _buildNoteField() {
    return TextFormField(
      decoration: InputDecoration(
        labelText: 'Note (optionnel)',
        hintText: 'Ajoutez une note...',
        prefixIcon: const Icon(Icons.edit_note_outlined),
        border: OutlineInputBorder(borderRadius: AppDesign.mediumRadius),
        filled: true,
        fillColor: Colors.grey[50],
      ),
      maxLines: 3,
      maxLength: 200,
      onSaved: (value) => _note = value ?? '',
    );
  }

  Widget _buildDateSelector() {
    return InkWell(
      onTap: () => _selectDate(context),
      borderRadius: AppDesign.mediumRadius,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: AppDesign.mediumRadius,
          color: Colors.grey[50],
        ),
        child: Row(
          children: [
            const Icon(Icons.calendar_today_outlined, color: Colors.grey),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Date',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${_selectedDate.day}/${_selectedDate.month}/${_selectedDate.year}',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _buildTagsField() {
    return TextFormField(
      decoration: InputDecoration(
        labelText: 'Tags (séparés par des virgules)',
        hintText: 'Ex: urgent, mensuel, important',
        prefixIcon: const Icon(Icons.local_offer_outlined),
        border: OutlineInputBorder(borderRadius: AppDesign.mediumRadius),
        filled: true,
        fillColor: Colors.grey[50],
      ),
      onSaved: (value) {
        if (value != null && value.isNotEmpty) {
          _tags = value.split(',').map((tag) => tag.trim()).where((tag) => tag.isNotEmpty).toList();
        }
      },
    );
  }

  Widget _buildSaveButton() {
    return ElevatedButton(
      onPressed: _saveTransaction,
      style: ElevatedButton.styleFrom(
        backgroundColor: _accentColor,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 56),
        shape: RoundedRectangleBorder(borderRadius: AppDesign.mediumRadius),
        elevation: 2,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.check_circle_outline, size: 24),
          const SizedBox(width: 12),
          Text(
            _isExpense ? 'ENREGISTRER LA DÉPENSE' : 'ENREGISTRER LE REVENU',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }
}

class _TxTemplate {
  final String name;
  final double amount;
  final String categoryLabel;
  final String? note;

  _TxTemplate({
    required this.name,
    required this.amount,
    required this.categoryLabel,
    this.note,
  });
}
