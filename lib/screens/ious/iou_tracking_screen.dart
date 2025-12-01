import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../../models/models.dart';
import '../../services/firestore_service.dart';
import '../../services/currency_service.dart';
import '../../constants/app_design.dart';
import 'package:intl/intl.dart';
import '../../widgets/modern_page_app_bar.dart';
import '../../widgets/screen_header.dart';
import 'package:budget/l10n/app_localizations.dart';
import 'package:firebase_auth/firebase_auth.dart';

/// Écran de suivi des dettes (je dois) et créances (on me doit)
class IOUTrackingScreen extends StatefulWidget {
  const IOUTrackingScreen({super.key});

  @override
  State<IOUTrackingScreen> createState() => _IOUTrackingScreenState();
}

class _IOUTrackingScreenState extends State<IOUTrackingScreen> {
  final FirestoreService _firestoreService = FirestoreService();
  List<IOU> _ious = [];
  String? _selectedIOUForHistory;
  StreamSubscription<List<IOU>>? _iousSub;

  @override
  void initState() {
    super.initState();
    _loadIOUs();
  }

  void _loadIOUs() {
    final userId = _firestoreService.currentUserId;
    if (userId == null) {
      setState(() => _ious = []);
      return;
    }
    _iousSub?.cancel();
    _iousSub = _firestoreService.getIOUsStream(userId).listen((data) {
      if (mounted) setState(() => _ious = data);
    });
  }

  @override
  void dispose() {
    _iousSub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currency = context.watch<CurrencyService>();
    bool _isActive(IOU iou) =>
        iou.status != IOUStatus.completed && iou.status != IOUStatus.paid && iou.status != IOUStatus.cancelled;

    final debts = _ious.where((iou) => iou.type == IOUType.payable).toList();
    final receivables = _ious.where((iou) => iou.type == IOUType.receivable).toList();
    
    final totalDebt = debts.fold(0.0, (sum, iou) => 
      _isActive(iou) ? sum + iou.currentBalance : sum);
    final totalReceivable = receivables.fold(0.0, (sum, iou) => 
      _isActive(iou) ? sum + iou.currentBalance : sum);

    final isMobile = MediaQuery.of(context).size.width < 600;

    return Scaffold(
      resizeToAvoidBottomInset: false,
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
                receivables.where(_isActive).length,
              ),
              const SizedBox(height: AppDesign.spacingSmall),
              ...receivables.map((iou) => _buildIOUCard(iou)).toList(),
              
              const SizedBox(height: AppDesign.spacingLarge),
              
              // Section Dettes (Je dois)
              _buildSectionHeader(
                'Je dois',
                Icons.arrow_upward,
                AppDesign.expenseColor,
                debts.where(_isActive).length,
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
                    context.watch<CurrencyService>().formatAmountCompact(totalDebt),
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
                    context.watch<CurrencyService>().formatAmountCompact(totalReceivable),
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
                  PopupMenuButton<String>(
                    onSelected: (value) async {
                      if (value == 'delete') {
                        await _confirmDeleteIOU(iou);
                      }
                    },
                    itemBuilder: (context) => const [
                      PopupMenuItem(
                        value: 'delete',
                        child: TrText('Supprimer'),
                      ),
                    ],
                    child: const Icon(Icons.more_horiz, color: Colors.grey),
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
                    context.watch<CurrencyService>().formatAmountCompact(iou.originalAmount),
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
                    context.watch<CurrencyService>().formatAmountCompact(iou.currentBalance),
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
    final userId = _firestoreService.currentUserId;
    if (userId == null) {
      return const TrText('Connectez-vous pour voir l\'historique.');
    }

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
          StreamBuilder<List<Map<String, dynamic>>>(
            stream: _firestoreService.getIOUPaymentsStream(userId, iou.iouId),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return const Padding(
                  padding: EdgeInsets.all(8.0),
                  child: LinearProgressIndicator(minHeight: 2),
                );
              }
              final payments = snapshot.data ?? [];
              final entries = [
                ...payments.map((p) => _IouTx(
                      label: t('Paiement'),
                      amount: p['amount'] as double,
                      date: p['createdAt'] as DateTime,
                    )),
                _IouTx(label: t('Création'), amount: iou.originalAmount, date: iou.createdAt),
              ]..sort((a, b) => b.date.compareTo(a.date));

              if (entries.isEmpty) {
                return const TrText(
                  'Aucun mouvement pour l’instant.',
                  style: TextStyle(color: Colors.grey),
                );
              }

              return Column(
                children: entries.map((e) {
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
                          '$prefix${context.watch<CurrencyService>().formatAmountCompact(e.amount)}',
                          style: TextStyle(
                            color: color,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              );
            },
          ),
        ],
      ),
    );
  }

  void _showAddIOUModal() {
    final userId = _firestoreService.currentUserId;
    if (userId == null) {
      showDialog(
        context: context,
        builder: (_) => AlertDialog(
          title: const TrText('Connexion requise'),
          content: const TrText('Connectez-vous pour enregistrer une dette ou créance.'),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const TrText('OK')),
          ],
        ),
      );
      return;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      isDismissible: true,
      enableDrag: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => AddIOUModal(
        onIOUAdded: (newIOU) async {
          await _firestoreService.addIOU(
            userId: userId,
            type: newIOU.type,
            personName: newIOU.personName,
            personEmail: newIOU.personEmail,
            personPhone: newIOU.personPhone,
            amount: newIOU.amount,
            description: newIOU.description,
            dueDate: newIOU.dueDate ?? DateTime.now(),
            icon: newIOU.icon ?? '🤝',
            status: IOUStatus.active,
          );
          if (context.mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: TrText('Ajout enregistré avec succès !')),
            );
          }
        },
      ),
    );
  }

  void _showRecordPaymentModal(IOU iou) {
    final userId = _firestoreService.currentUserId;
    if (userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: TrText('Connectez-vous pour enregistrer un paiement.')),
      );
      return;
    }
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      isDismissible: true,
      enableDrag: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => RecordPaymentModal(
        iou: iou,
        userId: userId,
        onPaymentRecorded: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: TrText(
                iou.type == IOUType.receivable
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

  Future<void> _confirmDeleteIOU(IOU iou) async {
    final user = FirebaseAuth.instance.currentUser;
    if (user == null) return;

    final pwdController = TextEditingController();
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const TrText('Supprimer cette dette / créance ?'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TrText('Cette action est irréversible pour "${iou.personName}".'),
            const SizedBox(height: 12),
            if (user.email != null)
              TextField(
                controller: pwdController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'Mot de passe (requis)',
                  border: OutlineInputBorder(),
                ),
              )
            else
              const TrText(
                'Compte non email/password : re-auth non disponible, validation simple.',
                style: TextStyle(color: Colors.grey, fontSize: 12),
              ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const TrText('Annuler')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppDesign.expenseColor),
            child: const TrText('Supprimer'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      if (user.email != null) {
        final cred = EmailAuthProvider.credential(email: user.email!, password: pwdController.text);
        await user.reauthenticateWithCredential(cred);
      }
      await _firestoreService.deleteIOU(user.uid, iou.iouId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: TrText('Dette / créance supprimée.')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: TrText('Suppression impossible: $e')),
        );
      }
    }
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
        keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
        padding: const EdgeInsets.all(24),
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
                    prefixIcon: Icon(Icons.attach_money, color: color),
                    suffixText: context.watch<CurrencyService>().currencySymbol,
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
                SizedBox(height: MediaQuery.of(context).viewInsets.bottom),
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
  final String userId;
  final VoidCallback onPaymentRecorded;

  const RecordPaymentModal({
    super.key,
    required this.iou,
    required this.userId,
    required this.onPaymentRecorded,
  });

  @override
  State<RecordPaymentModal> createState() => _RecordPaymentModalState();
}

class _RecordPaymentModalState extends State<RecordPaymentModal> {
  final _formKey = GlobalKey<FormState>();
  final _amountController = TextEditingController();
  bool _isLoading = false;
  final FirestoreService _firestoreService = FirestoreService();

  @override
  void dispose() {
    _amountController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isReceivable = widget.iou.type == IOUType.receivable;
    final color = isReceivable ? AppDesign.incomeColor : AppDesign.expenseColor;
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
                          currencyService.formatAmount(widget.iou.currentBalance),
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
                  prefixIcon: Icon(Icons.payments_outlined, color: color),
                  suffixText: currencyService.getCurrencySymbol(currencyService.currentCurrency),
                  helperText: 'Maximum: ${currencyService.formatAmount(widget.iou.currentBalance)}',
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
              SizedBox(height: MediaQuery.of(context).viewInsets.bottom),
            ],
          ),
        ),
      ),
    );
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
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    final paymentAmount = double.parse(_amountController.text);
    try {
      await _firestoreService.recordIOUPayment(
        widget.userId,
        widget.iou.iouId,
        paymentAmount,
      );
      widget.onPaymentRecorded();
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

class _IouTx {
  final String label;
  final double amount;
  final DateTime date;
  _IouTx({required this.label, required this.amount, required this.date});
}
