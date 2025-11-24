import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:characters/characters.dart';
import 'package:provider/provider.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../../services/firestore_service.dart';
import '../../services/currency_service.dart';
import '../../models/transaction.dart' as app_transaction;
import '../../models/account.dart';
import '../../models/category.dart';
import '../../services/mock_data_service.dart';
import '../../constants/app_design.dart';
import 'package:flutter/services.dart';
import '../../widgets/modern_page_app_bar.dart';
import 'package:budget/l10n/app_localizations.dart';

/// Liste des transactions avec pagination infinie et filtres
class TransactionsListScreen extends StatefulWidget {
  const TransactionsListScreen({super.key});

  @override
  State<TransactionsListScreen> createState() => _TransactionsListScreenState();
}

class _TransactionsListScreenState extends State<TransactionsListScreen> {
  final _firestoreService = FirestoreService();
  final _mockService = MockDataService();
  
  // State pour la pagination
  final List<app_transaction.Transaction> _transactions = [];
  final List<DocumentSnapshot> _snapshots = [];
  bool _isLoading = false;
  bool _hasMore = true;
  final int _pageSize = 20;
  
  // Streams pour les filtres (Comptes/Catégories)
  late Stream<List<Account>> _accountsStream;
  late Stream<List<Category>> _categoriesStream;
  
  // Filtres actifs
  app_transaction.TransactionType? _filterType;
  String? _filterAccountId;
  String? _filterCategoryId;
  DateTimeRange? _filterRange;
  double? _minAmount;
  double? _maxAmount;
  String _search = '';
  
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final _currency = NumberFormat.currency(locale: 'fr_FR', symbol: '€');

  @override
  void initState() {
    super.initState();
    _initStreams();
    _loadInitialData();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  void _initStreams() {
    final userId = _firestoreService.currentUserId;
    if (userId == null) {
      _accountsStream = Stream.value(_mockService.getMockAccounts());
      _categoriesStream = Stream.value(_mockService.getMockCategories());
    } else {
      _accountsStream = _firestoreService.getAccountsStream(userId);
      _categoriesStream = _firestoreService.getCategoriesStream(userId);
    }
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      _loadMoreData();
    }
  }

  Future<void> _loadInitialData() async {
    setState(() {
      _transactions.clear();
      _snapshots.clear();
      _isLoading = true;
      _hasMore = true;
    });
    await _fetchPage();
  }

  Future<void> _loadMoreData() async {
    if (_isLoading || !_hasMore) return;
    setState(() => _isLoading = true);
    await _fetchPage();
  }

  Future<void> _fetchPage() async {
    try {
      final userId = _firestoreService.currentUserId;
      if (userId == null) {
        // Mock data fallback
        await Future.delayed(const Duration(milliseconds: 500));
        if (mounted) {
          setState(() {
            _transactions.addAll(_mockService.getMockTransactions());
            _isLoading = false;
            _hasMore = false;
          });
        }
        return;
      }

      final snapshot = await _firestoreService.getTransactionsPagedSnapshot(
        userId,
        limit: _pageSize,
        startAfterDocument: _snapshots.isNotEmpty ? _snapshots.last : null,
        type: _filterType,
        accountId: _filterAccountId,
        categoryId: _filterCategoryId,
        startDate: _filterRange?.start,
        endDate: _filterRange?.end,
      );

      final newTransactions = snapshot.docs.map((doc) => 
        app_transaction.Transaction.fromMap(doc.data() as Map<String, dynamic>, doc.id)
      ).toList();

      if (mounted) {
        setState(() {
          _transactions.addAll(newTransactions);
          _snapshots.addAll(snapshot.docs);
          _isLoading = false;
          if (snapshot.docs.length < _pageSize) {
            _hasMore = false;
          }
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: TrText('Erreur: $e')));
      }
    }
  }

  void _updateFilter(app_transaction.TransactionType? type) {
    setState(() {
      _filterType = type;
    });
    _loadInitialData();
  }

  Future<void> _pickDateRange() async {
    final now = DateTime.now();
    final result = await showDateRangePicker(
      context: context,
      firstDate: DateTime(now.year - 2),
      lastDate: DateTime(now.year + 1),
      initialDateRange: _filterRange ??
          DateTimeRange(
            start: DateTime(now.year, now.month, 1),
            end: now,
          ),
    );
    if (result != null) {
      setState(() {
        _filterRange = result;
      });
      _loadInitialData();
    }
  }

  void _resetFilters() {
    setState(() {
      _filterType = null;
      _filterAccountId = null;
      _filterCategoryId = null;
      _filterRange = null;
      _minAmount = null;
      _maxAmount = null;
      _search = '';
      _searchController.clear();
    });
    _loadInitialData();
  }

  Future<void> _exportCsv() async {
    if (_transactions.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: TrText('Aucune transaction chargée à exporter')),
      );
      return;
    }
    final buffer = StringBuffer();
    buffer.writeln('date,type,description,amount,category');
    for (final tx in _transactions) {
      buffer.writeln(
        '${DateFormat('yyyy-MM-dd').format(tx.date)},${tx.type.name},${tx.description ?? ''},${tx.amount.toStringAsFixed(2)},${tx.category ?? ''}',
      );
    }
    await Clipboard.setData(ClipboardData(text: buffer.toString()));
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: TrText('CSV (données chargées) copié dans le presse-papiers')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    // Filtrage local pour la recherche textuelle et montant (sur les données chargées)
    final filteredTransactions = _transactions.where((tx) {
      final matchesSearch = _search.isEmpty ||
          (tx.description?.toLowerCase().contains(_search.toLowerCase()) ?? false) ||
          (tx.category?.toLowerCase().contains(_search.toLowerCase()) ?? false);
      final matchesMin = _minAmount == null || tx.amount >= _minAmount!;
      final matchesMax = _maxAmount == null || tx.amount <= _maxAmount!;
      return matchesSearch && matchesMin && matchesMax;
    }).toList();

    return Scaffold(
      backgroundColor: AppDesign.backgroundGrey,
      appBar: ModernPageAppBar(
        title: t('Transactions'),
        subtitle: t('Historique et filtres détaillés'),
        icon: Icons.swap_horiz_rounded,
        showProfile: true,
        actions: [
          IconButton(
            tooltip: t('Exporter CSV'),
            icon: const Icon(Icons.file_download_outlined, color: AppDesign.primaryIndigo),
            onPressed: () async {
              await _exportCsv();
            },
          ),
          IconButton(
            tooltip: t('Exporter PDF (aperçu)'),
            icon: const Icon(Icons.picture_as_pdf_outlined, color: AppDesign.primaryIndigo),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: TrText('Export PDF à implémenter (aperçu)')),
              );
            },
          ),
        ],
      ),
      body: StreamBuilder<List<Account>>(
        stream: _accountsStream,
        builder: (context, accountSnapshot) {
          final accounts = accountSnapshot.data ?? [];
          return StreamBuilder<List<Category>>(
            stream: _categoriesStream,
            builder: (context, categorySnapshot) {
              final categories = categorySnapshot.data ?? [];
              return CustomScrollView(
                slivers: [
                  SliverToBoxAdapter(
                    child: _buildFilters(accounts, categories),
                  ),
                  SliverFillRemaining(
                    hasScrollBody: true,
                    child: RefreshIndicator(
                      onRefresh: _loadInitialData,
                      child: filteredTransactions.isEmpty && !_isLoading
                          ? ListView(
                              children: const [
                                SizedBox(height: 100),
                                Center(
                                  child: TrText(
                                    'Aucune transaction trouvée.',
                                    style: TextStyle(color: Colors.grey),
                                  ),
                                ),
                              ],
                            )
                          : ListView.separated(
                              controller: _scrollController,
                              padding: const EdgeInsets.all(16),
                              itemCount: filteredTransactions.length + (_hasMore ? 1 : 0),
                              separatorBuilder: (_, __) => const SizedBox(height: 8),
                              itemBuilder: (context, index) {
                                if (index == filteredTransactions.length) {
                                  return const Center(
                                    child: Padding(
                                      padding: EdgeInsets.all(16.0),
                                      child: CircularProgressIndicator(),
                                    ),
                                  );
                                }

                                final tx = filteredTransactions[index];
                                final isIncome = tx.type == app_transaction.TransactionType.income;
                                final isExpense = tx.type == app_transaction.TransactionType.expense;
                                final color = isIncome
                                    ? AppDesign.incomeColor
                                    : isExpense
                                        ? AppDesign.expenseColor
                                        : Colors.blueGrey;
                                final prefix = isIncome ? '+' : isExpense ? '-' : '';
                                final dateLabel = DateFormat('dd/MM/yyyy').format(tx.date);

                                final iconText = (tx.category ?? '💳');
                                final leadingChar = iconText.isNotEmpty ? iconText.characters.first : '💳';

                                return Card(
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
                                  ),
                                  elevation: 2,
                                  child: ListTile(
                                    onTap: () => _openTransactionEditor(tx, categories),
                                    leading: CircleAvatar(
                                      backgroundColor: color.withValues(alpha: 0.12),
                                      child: TrText(
                                        leadingChar,
                                        style: const TextStyle(fontSize: 20),
                                      ),
                                    ),
                                    title: TrText(
                                      tx.description?.isNotEmpty == true ? tx.description! : 'Transaction',
                                      style: const TextStyle(fontWeight: FontWeight.w700),
                                    ),
                                    subtitle: TrText(
                                      '$dateLabel · ${tx.category ?? 'Sans catégorie'}',
                                      style: const TextStyle(color: Colors.grey),
                                    ),
                                    trailing: TrText(
                                      '$prefix${_currency.format(tx.amount)}',
                                      style: TextStyle(
                                        color: color,
                                        fontWeight: FontWeight.bold,
                                        fontSize: 16,
                                      ),
                                    ),
                                  ),
                                );
                              },
                            ),
                    ),
                  ),
                ],
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildFilters(List<Account> accounts, List<Category> categories) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Wrap(
            spacing: 10,
            runSpacing: 8,
            children: [
              _filterChip(label: t('Toutes'), value: null),
              _filterChip(label: t('Revenus'), value: app_transaction.TransactionType.income),
              _filterChip(label: t('Dépenses'), value: app_transaction.TransactionType.expense),
              _filterChip(label: t('Transferts'), value: app_transaction.TransactionType.transfer),
              _secondaryChip(
                label: t('Gérer catégories'),
                icon: Icons.category_outlined,
                onTap: () => _openCategoryManager(categories),
              ),
              _secondaryChip(
                label: _filterRange == null
                    ? 'Période'
                    : '${DateFormat('dd/MM').format(_filterRange!.start)} → ${DateFormat('dd/MM').format(_filterRange!.end)}',
                icon: Icons.date_range,
                onTap: _pickDateRange,
              ),
              _secondaryChip(
                label: t('Reset'),
                icon: Icons.refresh,
                onTap: _resetFilters,
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: t('Rechercher (description/catégorie)'),
                    prefixIcon: const Icon(Icons.search),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    isDense: true,
                  ),
                  onChanged: (value) {
                    setState(() {
                      _search = value;
                    });
                  },
                ),
              ),
              const SizedBox(width: 10),
              SizedBox(
                width: 120,
                child: TextField(
                  keyboardType: TextInputType.number,
                  textInputAction: TextInputAction.next,
                  decoration: InputDecoration(
                    labelText: t('Min'),
                    prefixText: '${context.watch<CurrencyService>().getCurrencySymbol(context.watch<CurrencyService>().currentCurrency)} ',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  onChanged: (v) {
                    final d = double.tryParse(v.replaceAll(',', '.'));
                    setState(() => _minAmount = d);
                  },
                ),
              ),
              const SizedBox(width: 8),
              SizedBox(
                width: 120,
                child: TextField(
                  keyboardType: TextInputType.number,
                  textInputAction: TextInputAction.done,
                  decoration: InputDecoration(
                    labelText: t('Max'),
                    prefixText: '${context.watch<CurrencyService>().getCurrencySymbol(context.watch<CurrencyService>().currentCurrency)} ',
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  onChanged: (v) {
                    final d = double.tryParse(v.replaceAll(',', '.'));
                    setState(() => _maxAmount = d);
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _filterAccountId,
                  isExpanded: true,
                  decoration: InputDecoration(
                    labelText: t('Compte'),
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  items: [
                    const DropdownMenuItem(value: null, child: TrText('Tous les comptes')),
                    ...accounts.map((a) => DropdownMenuItem(value: a.accountId, child: TrText(a.name))),
                  ],
                  onChanged: (val) {
                    setState(() {
                      _filterAccountId = val;
                    });
                    _loadInitialData();
                  },
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _filterCategoryId,
                  isExpanded: true,
                  decoration: InputDecoration(
                    labelText: t('Catégorie'),
                    border: OutlineInputBorder(),
                    isDense: true,
                  ),
                  items: [
                    const DropdownMenuItem(value: null, child: TrText('Toutes les catégories')),
                    ...categories.map((c) => DropdownMenuItem(value: c.categoryId, child: TrText(c.name))),
                  ],
                  onChanged: (val) {
                    setState(() {
                      _filterCategoryId = val;
                    });
                    _loadInitialData();
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _filterChip({
    required String label,
    required app_transaction.TransactionType? value,
  }) {
    final bool selected = _filterType == value;
    return ChoiceChip(
      label: TrText(label),
      selected: selected,
      selectedColor: AppDesign.primaryIndigo.withValues(alpha: 0.15),
      labelStyle: TextStyle(
        color: selected ? AppDesign.primaryIndigo : Colors.grey[800],
        fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
      ),
      onSelected: (_) => _updateFilter(value),
    );
  }

  Widget _secondaryChip({
    required String label,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return ActionChip(
      avatar: Icon(icon, size: 16, color: Colors.grey[700]),
      label: TrText(label),
      backgroundColor: Colors.white,
      side: BorderSide(color: Colors.grey[300]!),
      onPressed: onTap,
    );
  }

  Future<void> _openTransactionEditor(app_transaction.Transaction tx, List<Category> categories) async {
    final userId = _firestoreService.currentUserId;
    if (userId == null) return;

    final descController = TextEditingController(text: tx.description ?? '');
    final amountController = TextEditingController(text: tx.amount.toStringAsFixed(2));
    DateTime selectedDate = tx.date;
    String? selectedCategoryId = tx.categoryId;
    
    // Vérification du verrouillage
    final isLocked = tx.isLocked;

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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const TrText(
                        'Modifier la transaction',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                      ),
                      if (!isLocked)
                        IconButton(
                          icon: const Icon(Icons.delete_outline, color: Colors.red),
                          tooltip: t('Mettre à la corbeille'),
                          onPressed: () async {
                            final confirm = await showDialog<bool>(
                              context: context,
                              builder: (dCtx) => AlertDialog(
                                title: const TrText('Supprimer ?'),
                                content: const TrText('La transaction sera déplacée dans la corbeille.'),
                                actions: [
                                  TextButton(
                                    onPressed: () => Navigator.pop(dCtx, false),
                                    child: const TrText('Annuler'),
                                  ),
                                  TextButton(
                                    onPressed: () => Navigator.pop(dCtx, true),
                                    child: const TrText('Supprimer', style: TextStyle(color: Colors.red)),
                                  ),
                                ],
                              ),
                            );
                            
                            if (confirm == true) {
                              await _firestoreService.softDeleteTransaction(userId, tx.transactionId);
                              // Refresh list
                              _loadInitialData();
                              if (mounted) Navigator.pop(ctx);
                            }
                          },
                        ),
                    ],
                  ),
                  if (isLocked)
                    Container(
                      margin: const EdgeInsets.only(top: 8, bottom: 8),
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.orange.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.orange.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: const [
                          Icon(Icons.lock_outline, size: 16, color: Colors.orange),
                          SizedBox(width: 8),
                          Expanded(
                            child: TrText(
                              'Modification verrouillée (48h dépassées)',
                              style: TextStyle(color: Colors.orange, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: descController,
                    enabled: !isLocked,
                    decoration: InputDecoration(
                      labelText: t('Description'),
                      prefixIcon: Icon(Icons.notes_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: amountController,
                    enabled: !isLocked,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    decoration: InputDecoration(
                      labelText: t('Montant'),
                      prefixIcon: Icon(Icons.euro),
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: selectedCategoryId,
                    isExpanded: true,
                    decoration: InputDecoration(
                      labelText: t('Catégorie'),
                      prefixIcon: Icon(Icons.category),
                    ),
                    items: [
                      const DropdownMenuItem(
                        value: null,
                        child: TrText('Aucune'),
                      ),
                      ...categories.map(
                        (c) => DropdownMenuItem(
                          value: c.categoryId,
                          child: TrText('${c.icon}  ${c.name}'),
                        ),
                      ),
                    ],
                    onChanged: isLocked ? null : (val) => setSheetState(() => selectedCategoryId = val),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TrText(
                          'Date : ${DateFormat('dd/MM/yyyy').format(selectedDate)}',
                          style: const TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                      TextButton.icon(
                        onPressed: isLocked ? null : () async {
                          final picked = await showDatePicker(
                            context: ctx,
                            initialDate: selectedDate,
                            firstDate: DateTime(2000),
                            lastDate: DateTime(2100),
                          );
                          if (picked != null) {
                            setSheetState(() => selectedDate = picked);
                          }
                        },
                        icon: const Icon(Icons.date_range),
                        label: const TrText('Changer'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (!isLocked)
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () async {
                          final newAmount = double.tryParse(amountController.text.replaceAll(',', '.'));
                          try {
                            await _firestoreService.updateTransactionBasic(
                              userId: userId,
                              transactionId: tx.transactionId,
                              amount: newAmount,
                              description: descController.text.trim().isEmpty ? null : descController.text.trim(),
                              categoryId: selectedCategoryId,
                              date: selectedDate,
                            );
                            // Refresh list
                            _loadInitialData();
                            if (mounted) Navigator.pop(ctx);
                          } catch (e) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: TrText('Erreur: $e')),
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppDesign.primaryIndigo,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: const TrText('Enregistrer'),
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

  Future<void> _openCategoryManager(List<Category> categories) async {
    final userId = _firestoreService.currentUserId;
    if (userId == null) return;

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            left: 16,
            right: 16,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
            top: 16,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const TrText(
                    'Catégories',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                  ),
                  IconButton(
                    icon: const Icon(Icons.add),
                    onPressed: () {
                      Navigator.pop(ctx);
                      _openCategoryForm(userId: userId);
                    },
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ...categories.map(
                (c) => ListTile(
                  leading: TrText(c.icon, style: const TextStyle(fontSize: 20)),
                  title: TrText(c.name),
                  subtitle: TrText(c.type == CategoryType.income ? 'Revenu' : 'Dépense'),
                  trailing: IconButton(
                    icon: const Icon(Icons.edit),
                    onPressed: () {
                      Navigator.pop(ctx);
                      _openCategoryForm(userId: userId, category: c);
                    },
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Future<void> _openCategoryForm({required String userId, Category? category}) async {
    final nameController = TextEditingController(text: category?.name ?? '');
    final iconController = TextEditingController(text: category?.icon ?? '💳');
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
                      ),
                      const SizedBox(width: 8),
                      ChoiceChip(
                        label: const TrText('Revenu'),
                        selected: selectedType == CategoryType.income,
                        onSelected: (_) => setSheetState(() => selectedType = CategoryType.income),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: nameController,
                    decoration: InputDecoration(
                      labelText: t('Nom de la catégorie'),
                      prefixIcon: Icon(Icons.label_outline),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: iconController,
                    decoration: InputDecoration(
                      labelText: t('Icône (emoji ou texte)'),
                      prefixIcon: Icon(Icons.emoji_emotions_outlined),
                    ),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: colorController,
                    decoration: InputDecoration(
                      labelText: t('Couleur (hex)'),
                      prefixIcon: Icon(Icons.palette_outlined),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () async {
                        if (nameController.text.trim().isEmpty) return;
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
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppDesign.primaryIndigo,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: TrText(category == null ? 'Créer' : 'Mettre à jour'),
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
