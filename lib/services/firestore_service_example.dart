import 'package:flutter/material.dart';
import 'firestore_service.dart';
import '../models/account.dart';
import '../models/transaction.dart' as app_transaction;
import '../models/category.dart';

/// Exemple d'utilisation du FirestoreService
/// 
/// Ce fichier montre comment utiliser les différentes méthodes du service
class FirestoreServiceExample {
  final FirestoreService _firestoreService = FirestoreService();

  /// Exemple 1: Onboarding - Créer un utilisateur anonyme
  Future<void> exampleOnboarding() async {
    try {
      // 1. Connexion anonyme
      final userId = await _firestoreService.signInAnonymously();
      print('✓ Utilisateur créé: $userId');

      // 2. Créer le profil utilisateur
      await _firestoreService.createUserProfile(
        userId: userId,
        displayName: 'Utilisateur',
        currency: 'EUR',
      );
      print('✓ Profil utilisateur créé');

      // 3. Créer un compte par défaut
      final accountId = await _firestoreService.addAccount(
        userId: userId,
        name: 'Compte Principal',
        type: AccountType.checking,
        balance: 1000.0,
        currency: 'EUR',
        icon: '💳',
        color: '#4CAF50',
      );
      print('✓ Compte créé: $accountId');
    } catch (e) {
      print('✗ Erreur onboarding: $e');
    }
  }

  /// Exemple 2: Ajouter une transaction avec mise à jour atomique du solde
  Future<void> exampleAddTransaction(String userId, String accountId) async {
    try {
      final transactionId = await _firestoreService.addTransaction(
        userId: userId,
        accountId: accountId,
        categoryId: 'category_id', // Optionnel
        type: app_transaction.TransactionType.expense,
        amount: 50.0,
        description: 'Courses',
        note: 'Supermarché Carrefour',
        date: DateTime.now(),
        tags: ['alimentation', 'quotidien'],
      );
      
      print('✓ Transaction ajoutée: $transactionId');
      print('✓ Le solde du compte a été mis à jour automatiquement');
    } catch (e) {
      print('✗ Erreur transaction: $e');
    }
  }

  /// Exemple 3: Écouter les comptes en temps réel
  void exampleListenToAccounts(String userId) {
    _firestoreService.getAccountsStream(userId).listen((accounts) {
      print('📊 Comptes mis à jour (${accounts.length}):');
      for (var account in accounts) {
        print('  - ${account.name}: ${account.balance}${account.currency}');
      }
    });
  }

  /// Exemple 4: Transfert entre comptes
  Future<void> exampleTransfer(
    String userId,
    String fromAccountId,
    String toAccountId,
  ) async {
    try {
      await _firestoreService.addTransaction(
        userId: userId,
        accountId: fromAccountId,
        type: app_transaction.TransactionType.transfer,
        amount: 200.0,
        description: 'Transfert vers épargne',
        toAccountId: toAccountId,
      );
      
      print('✓ Transfert effectué');
      print('✓ Les deux comptes ont été mis à jour atomiquement');
    } catch (e) {
      print('✗ Erreur transfert: $e');
    }
  }

  /// Exemple 5: Filtrer les transactions
  void exampleFilterTransactions(String userId, String accountId) {
    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);
    
    _firestoreService
        .getTransactionsStream(
          userId,
          accountId: accountId,
          type: app_transaction.TransactionType.expense,
          startDate: startOfMonth,
          endDate: now,
        )
        .listen((transactions) {
      print('📈 Dépenses du mois: ${transactions.length}');
      double total = 0;
      for (var transaction in transactions) {
        total += transaction.amount;
        print('  - ${transaction.description}: ${transaction.amount}€');
      }
      print('  Total: ${total}€');
    });
  }
}

/// Widget exemple utilisant StreamBuilder
class AccountsListWidget extends StatelessWidget {
  final String userId;
  
  const AccountsListWidget({Key? key, required this.userId}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final firestoreService = FirestoreService();
    
    return StreamBuilder<List<Account>>(
      stream: firestoreService.getAccountsStream(userId),
      builder: (context, snapshot) {
        if (snapshot.hasError) {
          return Center(child: Text('Erreur: ${snapshot.error}'));
        }

        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        final accounts = snapshot.data ?? [];
        
        if (accounts.isEmpty) {
          return const Center(child: Text('Aucun compte'));
        }

        return ListView.builder(
          itemCount: accounts.length,
          itemBuilder: (context, index) {
            final account = accounts[index];
            return ListTile(
              leading: Text(account.icon ?? '💰', style: const TextStyle(fontSize: 32)),
              title: Text(account.name),
              subtitle: Text(account.type.name),
              trailing: Text(
                '${account.balance.toStringAsFixed(2)} ${account.currency}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            );
          },
        );
      },
    );
  }
}
