import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/transaction.dart';
import '../../services/firestore_service.dart';
import '../../services/currency_service.dart';
import 'package:budget/l10n/app_localizations.dart';

class TrashScreen extends StatelessWidget {
  const TrashScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final firestoreService = FirestoreService();
    final userId = firestoreService.currentUserId;

    if (userId == null) {
      return const Scaffold(
        body: Center(child: TrText('Veuillez vous connecter')),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const TrText('Corbeille'),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete_forever),
            tooltip: t('Vider la corbeille'),
            onPressed: () => _confirmEmptyTrash(context, firestoreService, userId),
          ),
        ],
      ),
      body: StreamBuilder<List<Transaction>>(
        stream: firestoreService.getDeletedTransactionsStream(userId),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: TrText('Erreur: ${snapshot.error}'));
          }

          final transactions = snapshot.data ?? [];

          if (transactions.isEmpty) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.delete_outline, size: 64, color: Colors.grey),
                  SizedBox(height: 16),
                  TrText(
                    'La corbeille est vide',
                    style: TextStyle(fontSize: 18, color: Colors.grey),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            itemCount: transactions.length,
            itemBuilder: (context, index) {
              final transaction = transactions[index];
              return _buildTrashItem(context, transaction, firestoreService, userId);
            },
          );
        },
      ),
    );
  }

  Widget _buildTrashItem(
    BuildContext context,
    Transaction transaction,
    FirestoreService service,
    String userId,
  ) {
    final currencyFormat = NumberFormat.currency(
      locale: 'fr_FR',
      symbol: context.watch<CurrencyService>().getCurrencySymbol(
            context.watch<CurrencyService>().currentCurrency,
          ),
    );
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');
    
    // Calcul du temps restant avant suppression auto (3 jours après deletedAt)
    final deletedAt = transaction.deletedAt ?? DateTime.now();
    final autoDeleteDate = deletedAt.add(const Duration(days: 3));
    final daysRemaining = autoDeleteDate.difference(DateTime.now()).inDays;
    final hoursRemaining = autoDeleteDate.difference(DateTime.now()).inHours % 24;

    String remainingText;
    if (daysRemaining > 0) {
      remainingText = '$daysRemaining jours restants';
    } else if (hoursRemaining > 0) {
      remainingText = '$hoursRemaining heures restantes';
    } else {
      remainingText = 'Suppression imminente';
    }

    return Dismissible(
      key: Key(transaction.transactionId),
      background: Container(
        color: Colors.green,
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.only(left: 20),
        child: const Icon(Icons.restore, color: Colors.white),
      ),
      secondaryBackground: Container(
        color: Colors.red,
        alignment: Alignment.centerRight,
        padding: const EdgeInsets.only(right: 20),
        child: const Icon(Icons.delete_forever, color: Colors.white),
      ),
      confirmDismiss: (direction) async {
        if (direction == DismissDirection.startToEnd) {
          // Restore
          await service.restoreTransaction(userId, transaction.transactionId);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: TrText('Transaction restaurée')),
          );
          return false; // Don't remove from list immediately (stream will update)
        } else {
          // Delete forever
          return await showDialog(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const TrText('Supprimer définitivement ?'),
              content: const TrText('Cette action est irréversible.'),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(false),
                  child: const TrText('Annuler'),
                ),
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(true),
                  child: const TrText('Supprimer', style: TextStyle(color: Colors.red)),
                ),
              ],
            ),
          );
        }
      },
      onDismissed: (direction) async {
        if (direction == DismissDirection.endToStart) {
          await service.deleteTransaction(userId, transaction.transactionId);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: TrText('Transaction supprimée définitivement')),
          );
        }
      },
      child: Card(
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor: transaction.type == TransactionType.expense
                ? Colors.red.withValues(alpha: 0.1)
                : Colors.green.withValues(alpha: 0.1),
            child: Icon(
              transaction.type == TransactionType.expense
                  ? Icons.arrow_downward
                  : Icons.arrow_upward,
              color: transaction.type == TransactionType.expense
                  ? Colors.red
                  : Colors.green,
            ),
          ),
          title: TrText(transaction.description ?? 'Sans description'),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TrText(currencyFormat.format(transaction.amount)),
              TrText(
                'Supprimé le ${dateFormat.format(deletedAt)}',
                style: const TextStyle(fontSize: 12),
              ),
              TrText(
                remainingText,
                style: TextStyle(
                  fontSize: 12,
                  color: daysRemaining < 1 ? Colors.red : Colors.orange,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              IconButton(
                icon: const Icon(Icons.restore, color: Colors.green),
                onPressed: () async {
                  await service.restoreTransaction(userId, transaction.transactionId);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: TrText('Transaction restaurée')),
                    );
                  }
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _confirmEmptyTrash(
    BuildContext context,
    FirestoreService service,
    String userId,
  ) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const TrText('Vider la corbeille ?'),
        content: const TrText('Toutes les transactions seront supprimées définitivement. Cette action est irréversible.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const TrText('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            child: const TrText('Vider', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true) {
      // Récupérer tous les items et les supprimer un par un
      // Idéalement, on ferait ça dans le service avec un batch, mais pour l'instant on itère
      final snapshot = await service.getDeletedTransactionsStream(userId).first;
      int count = 0;
      for (final tx in snapshot) {
        await service.deleteTransaction(userId, tx.transactionId);
        count++;
      }
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: TrText('$count éléments supprimés')),
        );
      }
    }
  }
}
