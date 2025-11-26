import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/mock_data_service.dart';
import '../../services/currency_service.dart';
import '../../constants/app_design.dart';
import 'package:intl/intl.dart';
import '../../widgets/modern_page_app_bar.dart';
import '../../widgets/screen_header.dart';
import 'package:budget/l10n/app_localizations.dart';

/// Écran de suivi des dettes (je dois) et créances (on me doit)
class IOUTrackingScreen extends StatefulWidget {
  const IOUTrackingScreen({super.key});

  @override
  State<IOUTrackingScreen> createState() => _IOUTrackingScreenState();
}

class _IOUTrackingScreenState extends State<IOUTrackingScreen> {
  final MockDataService _mockService = MockDataService();
  List<IOU> _ious = [];
  String? _selectedIOUForHistory;

  @override
  void initState() {
    super.initState();
    _loadIOUs();
  }

  void _loadIOUs() {
    // Pas de données de test pour les dettes/créances
    // L'utilisateur peut ajouter ses propres dettes et créances
    setState(() {
      _ious = [];
    });
  }

  @override
  Widget build(BuildContext context) {
    final debts = _ious.where((iou) => iou.type == IOUType.payable).toList();
    final receivables = _ious.where((iou) => iou.type == IOUType.receivable).toList();
    
    final totalDebt = debts.fold(0.0, (sum, iou) => 
      iou.status == IOUStatus.active ? sum + iou.currentBalance : sum);
    final totalReceivable = receivables.fold(0.0, (sum, iou) => 
      iou.status == IOUStatus.active ? sum + iou.currentBalance : sum);

    final isMobile = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      backgroundColor: AppDesign.backgroundGrey,
      appBar: ModernPageAppBar(
        title: isMobile ? t('Dettes & Créances') : t('Suivi Dettes & Créances'),
        subtitle: t('Ce que je dois et ce qu’on me doit'),
        icon: Icons.handshake_rounded,
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
              _buildSummaryCards(totalDebt, totalReceivable),
              const SizedBox(height: AppDesign.spacingLarge),
              
              // Section Créances (On me doit)
              _buildSectionHeader(
                'On me doit',
                Icons.arrow_downward,
                AppDesign.incomeColor,
                receivables.where((iou) => iou.status == IOUStatus.active).length,
              ),
              const SizedBox(height: AppDesign.spacingSmall),
              ...receivables.map((iou) => _buildIOUCard(iou)).toList(),
              
              const SizedBox(height: AppDesign.spacingLarge),
              
              // Section Dettes (Je dois)
              _buildSectionHeader(
                'Je dois',
                Icons.arrow_upward,
                AppDesign.expenseColor,
                debts.where((iou) => iou.status == IOUStatus.active).length,
              ),
              const SizedBox(height: AppDesign.spacingSmall),
              ...debts.map((iou) => _buildIOUCard(iou)).toList(),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddIOUModal(),
        backgroundColor: AppDesign.primaryIndigo,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const TrText(
          'Nouvelle dette / créance',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryCards(double totalDebt, double totalReceivable) {
    final netBalance = totalReceivable - totalDebt;
    
    return Row(
      children: [
        Expanded(
          child: Card(
            elevation: 2,
            color: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
              side: BorderSide(color: AppDesign.expenseColor.withValues(alpha: 0.15), width: 1.2),
            ),
            child: Padding(
              padding: const EdgeInsets.all(AppDesign.paddingMedium),
              child: Column(
                children: [
                  const Icon(
                    Icons.trending_up_rounded,
                    color: AppDesign.expenseColor,
                    size: 32,
                  ),
                  const SizedBox(height: 8),
                  const TrText(
                    'Je dois',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppDesign.expenseColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  TrText(
                    '${totalDebt.toStringAsFixed(2)} €',
                    style: const TextStyle(
                      fontSize: 22,
                      color: AppDesign.expenseColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(width: AppDesign.spacingMedium),
        Expanded(
          child: Card(
            elevation: 2,
            color: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
              side: BorderSide(color: AppDesign.incomeColor.withValues(alpha: 0.15), width: 1.2),
            ),
            child: Padding(
              padding: const EdgeInsets.all(AppDesign.paddingMedium),
              child: Column(
                children: [
                  const Icon(
                    Icons.trending_down_rounded,
                    color: AppDesign.incomeColor,
                    size: 32,
                  ),
                  const SizedBox(height: 8),
                  const TrText(
                    'On me doit',
                    style: TextStyle(
                      fontSize: 14,
                      color: AppDesign.incomeColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  TrText(
                    '${totalReceivable.toStringAsFixed(2)} €',
                    style: const TextStyle(
                      fontSize: 22,
                      color: AppDesign.incomeColor,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSectionHeader(String title, IconData icon, Color color, int count) {
    return Row(
      children: [
        Icon(icon, color: color.withValues(alpha: 0.8), size: 22),
        const SizedBox(width: 8),
        TrText(
          title,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: Colors.black87,
          ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.12),
            borderRadius: BorderRadius.circular(12),
          ),
          child: TrText(
            '$count actif${count > 1 ? 's' : ''}',
            style: TextStyle(
              fontSize: 12,
              color: color.withValues(alpha: 0.9),
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildIOUCard(IOU iou) {
    final isReceivable = iou.type == IOUType.receivable;
    final color = isReceivable ? AppDesign.incomeColor : AppDesign.expenseColor;
    final displayIcon = (iou.icon.isNotEmpty ? iou.icon : '🤝');
    final progress = iou.originalAmount > 0 
        ? 1 - (iou.currentBalance / iou.originalAmount) 
        : 0.0;
    final isCompleted = iou.status == IOUStatus.completed;
    final isOverdue = iou.dueDate != null && 
                     iou.dueDate!.isBefore(DateTime.now()) && 
                     !isCompleted;

    return Card(
      elevation: 1,
      margin: const EdgeInsets.only(bottom: AppDesign.spacingMedium),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
        side: BorderSide(
          color: color.withValues(alpha: isCompleted ? 0.15 : 0.25),
          width: 1.3,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppDesign.borderRadiusLarge),
        onTap: isCompleted ? null : () => _showRecordPaymentModal(iou),
        child: Padding(
          padding: const EdgeInsets.all(AppDesign.paddingMedium),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // En-tête
              Row(
                children: [
                  Container(
                    width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(25),
                  ),
                  child: Center(
                    child: TrText(
                      displayIcon,
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: color,
                      ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TrText(
                          iou.partyName,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        if (iou.description != null)
                          TrText(
                            iou.description!,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                      ],
                    ),
                  ),
                  if (isCompleted)
                    Icon(Icons.check_circle, color: Colors.green.withValues(alpha: 0.8), size: 24)
                  else if (isOverdue)
                    Icon(Icons.warning_amber_rounded, color: Colors.orange.withValues(alpha: 0.9), size: 24),
                  IconButton(
                    icon: const Icon(Icons.receipt_long_outlined, color: Colors.grey),
                    tooltip: t('Historique'),
                    onPressed: () {
                      setState(() {
                        if (_selectedIOUForHistory == iou.iouId) {
                          _selectedIOUForHistory = null;
                        } else {
                          _selectedIOUForHistory = iou.iouId;
                        }
                      });
                    },
                  ),
                ],
              ),
              const SizedBox(height: 12),
              
              // Montants
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TrText(
                        'Montant initial',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                      TrText(
                        '${iou.originalAmount.toStringAsFixed(2)} €',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      TrText(
                        isCompleted ? 'Soldé' : 'Reste',
                        style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                      ),
                      TrText(
                        '${iou.currentBalance.toStringAsFixed(2)} €',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: isCompleted ? Colors.green : color,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              
              // Barre de progression
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 8,
                  backgroundColor: Colors.grey[200],
                  valueColor: AlwaysStoppedAnimation<Color>(
                    isCompleted ? Colors.green : color.withValues(alpha: 0.9),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              
              // Info complémentaire
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TrText(
                    'Remboursé: ${(progress * 100).toStringAsFixed(0)}%',
                    style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                  ),
                  if (iou.dueDate != null)
                    TrText(
                      "Échéance: ${DateFormat('dd/MM/yyyy').format(iou.dueDate!)}",
                      style: TextStyle(
                        fontSize: 12,
                        color: isOverdue ? Colors.orange : Colors.grey[600],
                        fontWeight: isOverdue ? FontWeight.bold : FontWeight.normal,
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 12),
              if (_selectedIOUForHistory == iou.iouId)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _buildIOUHistory(iou),
                ),
              
              // Bouton d'action
              if (!isCompleted) ...[
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () => _showRecordPaymentModal(iou),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: color,
                      foregroundColor: Colors.white,
                    ),
                    icon: Icon(isReceivable ? Icons.account_balance_wallet : Icons.payment),
                    label: TrText(isReceivable ? 'Recevoir paiement' : 'Enregistrer paiement'),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildIOUHistory(IOU iou) {
    final entries = [
      _IouTx(label: t('Paiement partiel'), amount: 100, date: DateTime.now().subtract(const Duration(days: 7))),
      _IouTx(label: t('Paiement partiel'), amount: 150, date: DateTime.now().subtract(const Duration(days: 20))),
      _IouTx(label: t('Initial'), amount: iou.originalAmount, date: iou.createdAt),
    ];

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const TrText(
            'Historique des mouvements',
            style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
          ),
          const SizedBox(height: 8),
          ...entries.map((e) {
            final isPayment = e.label.toLowerCase().contains('paiement');
            final color = isPayment ? AppDesign.incomeColor : AppDesign.expenseColor;
            final prefix = isPayment ? '- ' : '+ ';
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      isPayment ? Icons.payments_outlined : Icons.request_page,
                      color: color,
                      size: 16,
                    ),
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
                    '$prefix${e.amount.toStringAsFixed(2)} €',
                    style: TextStyle(
                      color: color,
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

  void _showAddIOUModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => AddIOUModal(
        onIOUAdded: (newIOU) {
          setState(() {
            _ious.add(newIOU);
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: TrText('Ajout enregistré avec succès !')),
          );
        },
      ),
    );
  }

  void _showRecordPaymentModal(IOU iou) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => RecordPaymentModal(
        iou: iou,
        onPaymentRecorded: (updatedIOU) {
          setState(() {
            final index = _ious.indexWhere((i) => i.iouId == updatedIOU.iouId);
            if (index != -1) {
              _ious[index] = updatedIOU;
            }
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: TrText(
                updatedIOU.type == IOUType.receivable
                    ? 'Paiement reçu enregistré !'
                    : 'Paiement enregistré !',
              ),
              backgroundColor: AppDesign.incomeColor,
            ),
          );
        },
      ),
    );
  }
}

/// Modal pour ajouter une dette ou créance
class AddIOUModal extends StatefulWidget {
  final Function(IOU) onIOUAdded;

  const AddIOUModal({super.key, required this.onIOUAdded});

  @override
  State<AddIOUModal> createState() => _AddIOUModalState();
}

class _AddIOUModalState extends State<AddIOUModal> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _amountController = TextEditingController();
  final _descriptionController = TextEditingController();
  final List<String> _iouIcons = const ['🤝', '💸', '📄', '📆', '💳', '🏠', '🚗', '🎁', '💡', '🍽️', '🎓', '🛍️'];
  
  IOUType _selectedType = IOUType.receivable;
  DateTime? _dueDate;
  late String _selectedIcon;

  @override
  void initState() {
    super.initState();
    _selectedIcon = _iouIcons.first;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _amountController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isReceivable = _selectedType == IOUType.receivable;
    final color = isReceivable ? AppDesign.incomeColor : AppDesign.expenseColor;

    return SafeArea(
      top: false,
      child: SingleChildScrollView(
        padding: EdgeInsets.only(
          left: 24,
          right: 24,
          top: 24,
          bottom: MediaQuery.of(context).viewInsets.bottom + 24,
        ),
        child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const TrText(
                    'Nouvelle dette ou créance',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 24),
                
                // Toggle Switch Type
                Container(
                  decoration: BoxDecoration(
                    color: Colors.grey[200],
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: _buildTypeButton(
                          'On me doit',
                          Icons.arrow_downward,
                          AppDesign.incomeColor,
                          IOUType.receivable,
                        ),
                      ),
                      Expanded(
                        child: _buildTypeButton(
                          'Je dois',
                          Icons.arrow_upward,
                          AppDesign.expenseColor,
                          IOUType.payable,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                
                // Nom de la personne
                TextFormField(
                  controller: _nameController,
                  decoration: InputDecoration(
                    labelText: isReceivable ? 'Nom du débiteur' : 'Nom du créancier',
                    prefixIcon: const Icon(Icons.person),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Veuillez entrer un nom';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),
                
                // Montant
                TextFormField(
                  controller: _amountController,
                  decoration: InputDecoration(
                    labelText: t('Montant'),
                    prefixIcon: Icon(Icons.euro, color: color),
                    suffixText: context.watch<CurrencyService>().getCurrencySymbol(context.watch<CurrencyService>().currentCurrency),
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
                
                const TrText(
                  'Icône',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  height: 110,
                  child: GridView.builder(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 6,
                      mainAxisSpacing: 8,
                      crossAxisSpacing: 8,
                    ),
                    itemCount: _iouIcons.length,
                    itemBuilder: (context, index) {
                      final icon = _iouIcons[index];
                      final isSelected = icon == _selectedIcon;
                      return InkWell(
                        onTap: () {
                          setState(() {
                            _selectedIcon = icon;
                          });
                        },
                        child: Container(
                          decoration: BoxDecoration(
                            color: isSelected ? color.withValues(alpha: 0.12) : Colors.grey[200],
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: isSelected ? color : Colors.transparent, width: 2),
                          ),
                          child: Center(
                            child: TrText(
                              icon,
                              style: const TextStyle(fontSize: 22),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                const SizedBox(height: 16),
                
                // Description
                TextFormField(
                  controller: _descriptionController,
                  decoration: InputDecoration(
                    labelText: t('Description (optionnel)'),
                    prefixIcon: Icon(Icons.note),
                  ),
                  maxLines: 2,
                ),
                const SizedBox(height: 16),
                
                // Date d'échéance
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.calendar_today),
                  title: TrText(
                    _dueDate == null
                        ? 'Date d\'échéance (optionnel)'
                        : "Échéance: ${DateFormat('dd/MM/yyyy').format(_dueDate!)}",
                  ),
                  trailing: _dueDate != null
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            setState(() {
                              _dueDate = null;
                            });
                          },
                        )
                      : null,
                  onTap: () async {
                    final date = await showDatePicker(
                      context: context,
                      initialDate: DateTime.now().add(const Duration(days: 30)),
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 365)),
                    );
                    if (date != null) {
                      setState(() {
                        _dueDate = date;
                      });
                    }
                  },
                ),
                const SizedBox(height: 24),
                
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _saveIOU,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: color,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: TrText(
                      "Ajouter ${isReceivable ? 'la créance' : 'la dette'}",
                      style: const TextStyle(
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
        ),
      );
  }

  Widget _buildTypeButton(String label, IconData icon, Color color, IOUType type) {
    final isSelected = _selectedType == type;
    
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedType = type;
        });
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? color : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.white : Colors.grey,
              size: 20,
            ),
            const SizedBox(width: 8),
            TrText(
              label,
              style: TextStyle(
                color: isSelected ? Colors.white : Colors.grey,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _saveIOU() {
    if (_formKey.currentState!.validate()) {
      final amount = double.parse(_amountController.text);
      final now = DateTime.now();
      
      final newIOU = IOU(
        iouId: 'iou_${now.millisecondsSinceEpoch}',
        userId: 'user_1',
        personName: _nameController.text,
        type: _selectedType,
        status: IOUStatus.active,
        icon: _selectedIcon,
        amount: amount,
        paidAmount: 0.0,
        dueDate: _dueDate ?? now.add(const Duration(days: 30)),
        description: _descriptionController.text.isNotEmpty 
            ? _descriptionController.text 
            : null,
        createdAt: now,
        updatedAt: now,
      );

      widget.onIOUAdded(newIOU);
      Navigator.pop(context);
    }
  }
}

/// Modal pour enregistrer un paiement/remboursement
class RecordPaymentModal extends StatefulWidget {
  final IOU iou;
  final Function(IOU) onPaymentRecorded;

  const RecordPaymentModal({
    super.key,
    required this.iou,
    required this.onPaymentRecorded,
  });

  @override
  State<RecordPaymentModal> createState() => _RecordPaymentModalState();
}

class _RecordPaymentModalState extends State<RecordPaymentModal> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isReceivable = widget.iou.type == IOUType.receivable;
    final color = isReceivable ? AppDesign.incomeColor : AppDesign.expenseColor;

    return SafeArea(
      top: false,
      child: Padding(
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
                          color: color.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          isReceivable ? Icons.account_balance_wallet : Icons.payment,
                          color: color,
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            TrText(
                              isReceivable ? 'Recevoir un paiement' : 'Enregistrer un paiement',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            TrText(
                              widget.iou.partyName,
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
                
                // Info sur le solde restant
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: color.withValues(alpha: 0.3)),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const TrText(
                            'Solde restant',
                            style: TextStyle(fontSize: 14),
                          ),
                          TrText(
                            '${widget.iou.currentBalance.toStringAsFixed(2)} €',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: color,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      LinearProgressIndicator(
                        value: widget.iou.originalAmount > 0
                            ? 1 - (widget.iou.currentBalance / widget.iou.originalAmount)
                            : 0.0,
                        minHeight: 6,
                        backgroundColor: Colors.grey[300],
                        valueColor: AlwaysStoppedAnimation<Color>(color),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                
                // Montant du paiement
                TextFormField(
                  controller: _amountController,
                  decoration: InputDecoration(
                    labelText: t('Montant du paiement'),
                    prefixIcon: Icon(Icons.euro, color: color),
                    suffixText: context.watch<CurrencyService>().getCurrencySymbol(context.watch<CurrencyService>().currentCurrency),
                    helperText: 'Maximum: ${context.read<CurrencyService>().formatAmount(widget.iou.currentBalance)}',
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
                    if (amount > widget.iou.currentBalance) {
                      return 'Le montant dépasse le solde restant';
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
                    _buildQuickAmountButton('25%', widget.iou.currentBalance * 0.25),
                    _buildQuickAmountButton('50%', widget.iou.currentBalance * 0.50),
                    _buildQuickAmountButton('75%', widget.iou.currentBalance * 0.75),
                    _buildQuickAmountButton('Tout', widget.iou.currentBalance),
                  ],
                ),
                const SizedBox(height: 24),
                
                // Bouton d'enregistrement
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _recordPayment,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: color,
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
                        : TrText(
                            isReceivable ? 'Recevoir le paiement' : 'Enregistrer le paiement',
                            style: const TextStyle(
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
    ));
  }

  Widget _buildQuickAmountButton(String label, double amount) {
    return ActionChip(
      label: TrText(label),
      onPressed: () {
        setState(() {
          _amountController.text = amount.toStringAsFixed(2);
        });
      },
    );
  }

  void _recordPayment() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true;
      });

      // Simulation d'un délai réseau
      await Future.delayed(const Duration(milliseconds: 800));

      final paymentAmount = double.parse(_amountController.text);
      final newPaidAmount = widget.iou.paidAmount + paymentAmount;
      
      final updatedIOU = widget.iou.copyWith(
        paidAmount: newPaidAmount,
        status: newPaidAmount >= widget.iou.amount - 0.01 ? IOUStatus.completed : IOUStatus.active,
        updatedAt: DateTime.now(),
      );

      widget.onPaymentRecorded(updatedIOU);

      if (mounted) {
        Navigator.pop(context);
      }
    }
  }
}

class _IouTx {
  final String label;
  final double amount;
  final DateTime date;
  _IouTx({required this.label, required this.amount, required this.date});
}
