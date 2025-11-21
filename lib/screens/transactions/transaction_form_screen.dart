import 'package:flutter/material.dart';
import '../../models/account.dart';
import '../../models/transaction.dart' as app_transaction;
import '../../models/category.dart';
import '../../services/mock_data_service.dart';
// import '../../services/firestore_service.dart'; // Décommenter pour Firebase
import '../../constants/app_design.dart';

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
  // final _firestoreService = FirestoreService(); // Décommenter pour Firebase

  // Variables du formulaire
  double _amount = 0.0;
  String _description = '';
  String? _selectedAccountId;
  String? _selectedCategoryId;
  DateTime _selectedDate = DateTime.now();
  String _note = '';
  List<String> _tags = [];
  
  // Listes de données
  List<Account> _accounts = [];
  List<Category> _categories = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  void _loadData() {
    // Charger les données mockées (remplacer par des streams Firebase)
    _accounts = _mockService.getMockAccounts();
    _categories = _mockService.getMockCategories()
        .where((cat) => cat.type == _getCategoryTypeFromTransaction())
        .toList();
    
    if (_accounts.isNotEmpty) {
      _selectedAccountId = _accounts.first.accountId;
    }
    if (_categories.isNotEmpty) {
      _selectedCategoryId = _categories.first.categoryId;
    }
    
    setState(() {});
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
        const SnackBar(content: Text('Veuillez sélectionner un compte')),
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
      // MODE MOCK (pour développement sans Firebase)
      await Future.delayed(const Duration(milliseconds: 800)); // Simuler le délai réseau
      
      /* MODE FIREBASE (décommenter quand prêt)
      await _firestoreService.addTransaction(
        userId: _mockService.mockUserId,
        accountId: _selectedAccountId!,
        categoryId: _selectedCategoryId,
        type: widget.transactionType,
        amount: _amount,
        description: _description.isEmpty ? _getDefaultDescription() : _description,
        note: _note.isEmpty ? null : _note,
        date: _selectedDate,
        tags: _tags.isEmpty ? null : _tags,
      );
      */
      
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

  Color get _accentColor {
    return _isExpense ? AppDesign.expenseColor : AppDesign.incomeColor;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(24.0),
          children: [
            // Montant (Champ principal)
            _buildAmountField(),
            const SizedBox(height: 24),

            // Sélecteur de Compte
            _buildAccountSelector(),
            const SizedBox(height: 20),

            // Sélecteur de Catégorie
            _buildCategorySelector(),
            const SizedBox(height: 20),

            // Description
            _buildDescriptionField(),
            const SizedBox(height: 20),

            // Note (optionnel)
            _buildNoteField(),
            const SizedBox(height: 20),

            // Sélecteur de Date
            _buildDateSelector(),
            const SizedBox(height: 20),

            // Tags (optionnel)
            _buildTagsField(),
            const SizedBox(height: 40),

            // Bouton de Sauvegarde
            _buildSaveButton(),
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
              ],
            ),
            const SizedBox(height: 12),
            TextFormField(
              keyboardType: TextInputType.number,
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
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAccountSelector() {
    if (_accounts.isEmpty) {
      return Card(
        color: Colors.red[50],
        child: const Padding(
          padding: EdgeInsets.all(16.0),
          child: Text(
            'Aucun compte disponible. Créez-en un d\'abord.',
            style: TextStyle(color: Colors.red),
          ),
        ),
      );
    }

    return DropdownButtonFormField<String>(
      decoration: InputDecoration(
        labelText: 'Compte',
        prefixIcon: const Icon(Icons.account_balance_wallet_outlined),
        border: OutlineInputBorder(borderRadius: AppDesign.mediumRadius),
        filled: true,
        fillColor: Colors.grey[50],
      ),
      value: _selectedAccountId,
      items: _accounts.map((Account account) {
        return DropdownMenuItem<String>(
          value: account.accountId,
          child: Row(
            children: [
              Text(account.icon ?? '💰', style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      account.name,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    Text(
                      '${account.balance.toStringAsFixed(2)} ${account.currency}',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      }).toList(),
      onChanged: (String? newValue) {
        setState(() => _selectedAccountId = newValue);
      },
    );
  }

  Widget _buildCategorySelector() {
    if (_categories.isEmpty) {
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
      decoration: InputDecoration(
        labelText: 'Catégorie',
        prefixIcon: const Icon(Icons.category_outlined),
        border: OutlineInputBorder(borderRadius: AppDesign.mediumRadius),
        filled: true,
        fillColor: Colors.grey[50],
      ),
      value: _selectedCategoryId,
      items: _categories.map((Category category) {
        return DropdownMenuItem<String>(
          value: category.categoryId,
          child: Row(
            children: [
              Text(category.icon, style: const TextStyle(fontSize: 20)),
              const SizedBox(width: 12),
              Text(category.name),
            ],
          ),
        );
      }).toList(),
      onChanged: (String? newValue) {
        setState(() => _selectedCategoryId = newValue);
      },
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
