import 'dart:math' as math;

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/user_profile.dart';
import '../models/account.dart';
import '../models/transaction.dart' as app_transaction;
import '../models/category.dart';
import '../models/goal.dart';
import '../models/iou.dart';
import '../models/projection_result.dart';

/// Service Singleton pour gérer toutes les interactions avec Firebase Firestore
/// Structure de données : users/{userId}/accounts, transactions, categories, goals, ious
class FirestoreService {
  // Singleton pattern
  static final FirestoreService _instance = FirestoreService._internal();
  factory FirestoreService() => _instance;
  FirestoreService._internal();

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // Getters pour les collections principales
  CollectionReference get _usersCollection => _firestore.collection('users');

  /// Obtenir l'ID de l'utilisateur connecté
  String? get currentUserId => _auth.currentUser?.uid;

  // ============================================================================
  // AUTHENTIFICATION & PROFIL UTILISATEUR
  // ============================================================================

  /// Connexion anonyme pour l'onboarding
  /// Retourne l'ID de l'utilisateur créé
  Future<String> signInAnonymously() async {
    try {
      final UserCredential userCredential = await _auth.signInAnonymously();
      return userCredential.user!.uid;
    } catch (e) {
      throw Exception('Erreur lors de la connexion anonyme: $e');
    }
  }

  /// Créer un profil utilisateur dans Firestore
  Future<void> createUserProfile({
    required String userId,
    required String displayName,
    String? email,
    String? photoUrl,
    String currency = 'EUR',
  }) async {
    try {
      final now = DateTime.now();
      final userProfile = UserProfile(
        userId: userId,
        displayName: displayName,
        email: email,
        photoUrl: photoUrl,
        currency: currency,
        createdAt: now,
        updatedAt: now,
      );

      await _usersCollection.doc(userId).set(userProfile.toMap());
    } catch (e) {
      throw Exception('Erreur lors de la création du profil utilisateur: $e');
    }
  }

  /// Obtenir le profil utilisateur
  Future<UserProfile?> getUserProfile(String userId) async {
    try {
      final doc = await _usersCollection.doc(userId).get();
      if (doc.exists) {
        return UserProfile.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      }
      return null;
    } catch (e) {
      throw Exception('Erreur lors de la récupération du profil: $e');
    }
  }

  /// Stream du profil utilisateur
  Stream<UserProfile?> getUserProfileStream(String userId) {
    return _usersCollection.doc(userId).snapshots().map((doc) {
      if (doc.exists) {
        return UserProfile.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      }
      return null;
    });
  }

  /// Mettre à jour le profil utilisateur
  Future<void> updateUserProfile(String userId, Map<String, dynamic> updates) async {
    try {
      updates['updatedAt'] = Timestamp.fromDate(DateTime.now());
      await _usersCollection.doc(userId).update(updates);
    } catch (e) {
      throw Exception('Erreur lors de la mise à jour du profil: $e');
    }
  }

  // ============================================================================
  // COMPTES (ACCOUNTS)
  // ============================================================================

  /// Référence à la sous-collection accounts
  CollectionReference _accountsCollection(String userId) =>
      _usersCollection.doc(userId).collection('accounts');

  /// Ajouter un nouveau compte
  Future<String> addAccount({
    required String userId,
    required String name,
    required AccountType type,
    double balance = 0.0,
    String currency = 'EUR',
    String? icon,
    String? color,
    List<String> sharedWithUIDs = const [],
  }) async {
    try {
      final now = DateTime.now();
      final docRef = _accountsCollection(userId).doc();
      
      final account = Account(
        accountId: docRef.id,
        userId: userId,
        name: name,
        type: type,
        balance: balance,
        currency: currency,
        icon: icon,
        color: color,
        sharedWithUIDs: sharedWithUIDs,
        createdAt: now,
        updatedAt: now,
      );

      await docRef.set(account.toMap());
      return docRef.id;
    } catch (e) {
      throw Exception('Erreur lors de l\'ajout du compte: $e');
    }
  }

  /// Ajoute un accès partagé à un compte (simulation de résolution email -> UID).
  Future<void> addSharedAccess(String targetEmail, String accountId) async {
    final ownerId = currentUserId;
    if (ownerId == null) {
      throw Exception('Utilisateur non connecté');
    }

    try {
      final normalizedEmail = targetEmail.trim().toLowerCase();
      if (normalizedEmail.isEmpty) {
        throw Exception('Email cible invalide');
      }
      // Simulation simple de la résolution email → UID
      final simulatedTargetUid = 'uid_${normalizedEmail.hashCode.abs()}';

      final accountRef = _accountsCollection(ownerId).doc(accountId);

      await _firestore.runTransaction((transaction) async {
        final snapshot = await transaction.get(accountRef);
        if (!snapshot.exists) {
          throw Exception('Compte introuvable');
        }

        transaction.update(accountRef, {
          'sharedWithUIDs': FieldValue.arrayUnion([simulatedTargetUid]),
          'updatedAt': Timestamp.fromDate(DateTime.now()),
        });
      });
    } catch (e) {
      throw Exception('Erreur lors de l\'ajout du partage: $e');
    }
  }

  /// Obtenir tous les comptes de l'utilisateur (Stream)
  Stream<List<Account>> getAccountsStream(String userId) {
    return _accountsCollection(userId)
        .where('isActive', isEqualTo: true)
        .orderBy('createdAt', descending: false)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        return Account.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      }).toList();
    });
  }

  /// Obtenir tous les comptes actifs (fetch ponctuel)
  Future<List<Account>> getAccounts(String userId) async {
    try {
      final snapshot = await _accountsCollection(userId)
          .where('isActive', isEqualTo: true)
          .get();

      return snapshot.docs
          .map((doc) => Account.fromMap(doc.data() as Map<String, dynamic>, doc.id))
          .toList();
    } catch (e) {
      throw Exception('Erreur lors de la récupération des comptes: $e');
    }
  }

  /// Obtenir un compte spécifique
  Future<Account?> getAccount(String userId, String accountId) async {
    try {
      final doc = await _accountsCollection(userId).doc(accountId).get();
      if (doc.exists) {
        return Account.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      }
      return null;
    } catch (e) {
      throw Exception('Erreur lors de la récupération du compte: $e');
    }
  }

  /// Mettre à jour un compte
  Future<void> updateAccount(
    String userId,
    String accountId,
    Map<String, dynamic> updates,
  ) async {
    try {
      updates['updatedAt'] = Timestamp.fromDate(DateTime.now());
      await _accountsCollection(userId).doc(accountId).update(updates);
    } catch (e) {
      throw Exception('Erreur lors de la mise à jour du compte: $e');
    }
  }

  /// Supprimer (désactiver) un compte
  Future<void> deleteAccount(String userId, String accountId) async {
    try {
      await _accountsCollection(userId).doc(accountId).update({
        'isActive': false,
        'updatedAt': Timestamp.fromDate(DateTime.now()),
      });
    } catch (e) {
      throw Exception('Erreur lors de la suppression du compte: $e');
    }
  }

  // ============================================================================
  // TRANSACTIONS
  // ============================================================================

  /// Référence à la sous-collection transactions
  CollectionReference _transactionsCollection(String userId) =>
      _usersCollection.doc(userId).collection('transactions');

  /// Ajouter une transaction avec mise à jour atomique du solde du compte
  /// Utilise une transaction Firestore pour garantir la cohérence des données
  Future<String> addTransaction({
    required String userId,
    required String accountId,
    String? categoryId,
    required app_transaction.TransactionType type,
    required double amount,
    String? description,
    String? note,
    DateTime? date,
    String? toAccountId, // Pour les transferts
    List<String>? tags,
    String? receiptUrl,
  }) async {
    try {
      final transactionDate = date ?? DateTime.now();
      final now = DateTime.now();

      // Utilisation d'une transaction Firestore pour garantir l'atomicité
      return await _firestore.runTransaction<String>((transaction) async {
        // 1. Créer la référence de la nouvelle transaction
        final transactionDocRef = _transactionsCollection(userId).doc();
        
        // 2. Lire le compte source
        final accountDocRef = _accountsCollection(userId).doc(accountId);
        final accountSnapshot = await transaction.get(accountDocRef);
        
        if (!accountSnapshot.exists) {
          throw Exception('Le compte source n\'existe pas');
        }

        final accountData = accountSnapshot.data() as Map<String, dynamic>;
        final currentBalance = (accountData['balance'] ?? 0).toDouble();

        // 3. Calculer le nouveau solde selon le type de transaction
        double newBalance = currentBalance;
        
        switch (type) {
          case app_transaction.TransactionType.income:
            newBalance += amount;
            break;
          case app_transaction.TransactionType.expense:
            newBalance -= amount;
            break;
          case app_transaction.TransactionType.transfer:
            if (toAccountId == null) {
              throw Exception('Le compte de destination est requis pour un transfert');
            }
            newBalance -= amount;
            
            // Pour les transferts, mettre à jour aussi le compte de destination
            final toAccountDocRef = _accountsCollection(userId).doc(toAccountId);
            final toAccountSnapshot = await transaction.get(toAccountDocRef);
            
            if (!toAccountSnapshot.exists) {
              throw Exception('Le compte de destination n\'existe pas');
            }
            
            final toAccountData = toAccountSnapshot.data() as Map<String, dynamic>;
            final toCurrentBalance = (toAccountData['balance'] ?? 0).toDouble();
            
            transaction.update(toAccountDocRef, {
              'balance': toCurrentBalance + amount,
              'updatedAt': Timestamp.fromDate(now),
            });
            break;
        }

        // 4. Créer l'objet transaction
        final newTransaction = app_transaction.Transaction(
          transactionId: transactionDocRef.id,
          userId: userId,
          accountId: accountId,
          categoryId: categoryId,
          type: type,
          amount: amount,
          description: description,
          note: note,
          date: transactionDate,
          toAccountId: toAccountId,
          tags: tags,
          receiptUrl: receiptUrl,
          createdAt: now,
          updatedAt: now,
        );

        // 5. Écrire la transaction
        transaction.set(transactionDocRef, newTransaction.toMap());

        // 6. Mettre à jour le solde du compte source
        transaction.update(accountDocRef, {
          'balance': newBalance,
          'updatedAt': Timestamp.fromDate(now),
        });

        return transactionDocRef.id;
      });
    } catch (e) {
      throw Exception('Erreur lors de l\'ajout de la transaction: $e');
    }
  }

  /// Obtenir toutes les transactions de l'utilisateur (Stream)
  Stream<List<app_transaction.Transaction>> getTransactionsStream(
    String userId, {
    String? accountId,
    String? categoryId,
    app_transaction.TransactionType? type,
    DateTime? startDate,
    DateTime? endDate,
    int limit = 100,
  }) {
    Query query = _transactionsCollection(userId);

    // Filtres optionnels
    if (accountId != null) {
      query = query.where('accountId', isEqualTo: accountId);
    }
    if (categoryId != null) {
      query = query.where('categoryId', isEqualTo: categoryId);
    }
    if (type != null) {
      query = query.where('type', isEqualTo: type.name);
    }
    if (startDate != null) {
      query = query.where('date', isGreaterThanOrEqualTo: Timestamp.fromDate(startDate));
    }
    if (endDate != null) {
      query = query.where('date', isLessThanOrEqualTo: Timestamp.fromDate(endDate));
    }

    query = query.orderBy('date', descending: true).limit(limit);

    return query.snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        return app_transaction.Transaction.fromMap(
          doc.data() as Map<String, dynamic>,
          doc.id,
        );
      }).toList();
    });
  }

  /// Obtenir les transactions (fetch ponctuel, filtrable)
  Future<List<app_transaction.Transaction>> getTransactions(
    String userId, {
    String? accountId,
    String? categoryId,
    app_transaction.TransactionType? type,
    DateTime? startDate,
    DateTime? endDate,
    int limit = 500,
  }) async {
    try {
      Query query = _transactionsCollection(userId);

      if (accountId != null) {
        query = query.where('accountId', isEqualTo: accountId);
      }
      if (categoryId != null) {
        query = query.where('categoryId', isEqualTo: categoryId);
      }
      if (type != null) {
        query = query.where('type', isEqualTo: type.name);
      }
      if (startDate != null) {
        query = query.where('date', isGreaterThanOrEqualTo: Timestamp.fromDate(startDate));
      }
      if (endDate != null) {
        query = query.where('date', isLessThanOrEqualTo: Timestamp.fromDate(endDate));
      }

      query = query.orderBy('date', descending: true).limit(limit);

      final snapshot = await query.get();

      return snapshot.docs
          .map((doc) => app_transaction.Transaction.fromMap(
                doc.data() as Map<String, dynamic>,
                doc.id,
              ))
          .toList();
    } catch (e) {
      throw Exception('Erreur lors de la récupération des transactions: $e');
    }
  }

  /// Obtenir une transaction spécifique
  Future<app_transaction.Transaction?> getTransaction(
    String userId,
    String transactionId,
  ) async {
    try {
      final doc = await _transactionsCollection(userId).doc(transactionId).get();
      if (doc.exists) {
        return app_transaction.Transaction.fromMap(
          doc.data() as Map<String, dynamic>,
          doc.id,
        );
      }
      return null;
    } catch (e) {
      throw Exception('Erreur lors de la récupération de la transaction: $e');
    }
  }

  /// Supprimer une transaction avec mise à jour atomique du solde
  Future<void> deleteTransaction(String userId, String transactionId) async {
    try {
      await _firestore.runTransaction((transaction) async {
        // 1. Récupérer la transaction à supprimer
        final transactionDocRef = _transactionsCollection(userId).doc(transactionId);
        final transactionSnapshot = await transaction.get(transactionDocRef);
        
        if (!transactionSnapshot.exists) {
          throw Exception('La transaction n\'existe pas');
        }

        final transactionData = transactionSnapshot.data() as Map<String, dynamic>;
        final accountId = transactionData['accountId'] as String;
        final amount = (transactionData['amount'] ?? 0).toDouble();
        final type = app_transaction.TransactionType.values.firstWhere(
          (e) => e.name == transactionData['type'],
        );
        final toAccountId = transactionData['toAccountId'] as String?;

        // 2. Récupérer le compte source
        final accountDocRef = _accountsCollection(userId).doc(accountId);
        final accountSnapshot = await transaction.get(accountDocRef);
        
        if (!accountSnapshot.exists) {
          throw Exception('Le compte n\'existe pas');
        }

        final accountData = accountSnapshot.data() as Map<String, dynamic>;
        final currentBalance = (accountData['balance'] ?? 0).toDouble();

        // 3. Restaurer le solde (inverser l'opération)
        double newBalance = currentBalance;
        final now = DateTime.now();
        
        switch (type) {
          case app_transaction.TransactionType.income:
            newBalance -= amount; // Inverser l'ajout
            break;
          case app_transaction.TransactionType.expense:
            newBalance += amount; // Inverser la déduction
            break;
          case app_transaction.TransactionType.transfer:
            newBalance += amount; // Inverser le débit
            
            // Restaurer aussi le compte de destination
            if (toAccountId != null) {
              final toAccountDocRef = _accountsCollection(userId).doc(toAccountId);
              final toAccountSnapshot = await transaction.get(toAccountDocRef);
              
              if (toAccountSnapshot.exists) {
                final toAccountData = toAccountSnapshot.data() as Map<String, dynamic>;
                final toCurrentBalance = (toAccountData['balance'] ?? 0).toDouble();
                
                transaction.update(toAccountDocRef, {
                  'balance': toCurrentBalance - amount,
                  'updatedAt': Timestamp.fromDate(now),
                });
              }
            }
            break;
        }

        // 4. Mettre à jour le solde du compte
        transaction.update(accountDocRef, {
          'balance': newBalance,
          'updatedAt': Timestamp.fromDate(now),
        });

        // 5. Supprimer la transaction
        transaction.delete(transactionDocRef);
      });
    } catch (e) {
      throw Exception('Erreur lors de la suppression de la transaction: $e');
    }
  }

  // ============================================================================
  // CATÉGORIES
  // ============================================================================

  /// Référence à la sous-collection categories
  CollectionReference _categoriesCollection(String userId) =>
      _usersCollection.doc(userId).collection('categories');

  /// Ajouter une catégorie
  Future<String> addCategory({
    required String userId,
    required String name,
    required CategoryType type,
    required String icon,
    required String color,
    bool isDefault = false,
  }) async {
    try {
      final now = DateTime.now();
      final docRef = _categoriesCollection(userId).doc();
      
      final category = Category(
        categoryId: docRef.id,
        userId: userId,
        name: name,
        type: type,
        icon: icon,
        color: color,
        isDefault: isDefault,
        createdAt: now,
        updatedAt: now,
      );

      await docRef.set(category.toMap());
      return docRef.id;
    } catch (e) {
      throw Exception('Erreur lors de l\'ajout de la catégorie: $e');
    }
  }

  /// Obtenir toutes les catégories (Stream)
  Stream<List<Category>> getCategoriesStream(
    String userId, {
    CategoryType? type,
  }) {
    Query query = _categoriesCollection(userId).where('isActive', isEqualTo: true);

    if (type != null) {
      query = query.where('type', isEqualTo: type.name);
    }

    return query.orderBy('name').snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        return Category.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      }).toList();
    });
  }

  /// Obtenir toutes les catégories actives (fetch ponctuel)
  Future<List<Category>> getCategories(
    String userId, {
    CategoryType? type,
  }) async {
    try {
      Query query = _categoriesCollection(userId).where('isActive', isEqualTo: true);

      if (type != null) {
        query = query.where('type', isEqualTo: type.name);
      }

      final snapshot = await query.orderBy('name').get();
      return snapshot.docs
          .map((doc) => Category.fromMap(doc.data() as Map<String, dynamic>, doc.id))
          .toList();
    } catch (e) {
      throw Exception('Erreur lors de la récupération des catégories: $e');
    }
  }

  // ============================================================================
  // OBJECTIFS (GOALS)
  // ============================================================================

  /// Référence à la sous-collection goals
  CollectionReference _goalsCollection(String userId) =>
      _usersCollection.doc(userId).collection('goals');

  /// Ajouter un objectif
  Future<String> addGoal({
    required String userId,
    required String name,
    String? description,
    required double targetAmount,
    required DateTime targetDate,
    String? icon,
    String? color,
  }) async {
    try {
      final now = DateTime.now();
      final docRef = _goalsCollection(userId).doc();
      
      final goal = Goal(
        goalId: docRef.id,
        userId: userId,
        name: name,
        description: description,
        targetAmount: targetAmount,
        targetDate: targetDate,
        icon: icon,
        color: color,
        createdAt: now,
        updatedAt: now,
      );

      await docRef.set(goal.toMap());
      return docRef.id;
    } catch (e) {
      throw Exception('Erreur lors de l\'ajout de l\'objectif: $e');
    }
  }

  /// Obtenir tous les objectifs (Stream)
  Stream<List<Goal>> getGoalsStream(String userId) {
    return _goalsCollection(userId)
        .orderBy('targetDate')
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        return Goal.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      }).toList();
    });
  }

  /// Obtenir les objectifs (fetch ponctuel)
  Future<List<Goal>> getGoals(String userId, {GoalStatus? status}) async {
    try {
      Query query = _goalsCollection(userId);
      if (status != null) {
        query = query.where('status', isEqualTo: status.name);
      }

      final snapshot = await query.orderBy('targetDate').get();
      return snapshot.docs
          .map((doc) => Goal.fromMap(doc.data() as Map<String, dynamic>, doc.id))
          .toList();
    } catch (e) {
      throw Exception('Erreur lors de la récupération des objectifs: $e');
    }
  }

  /// Mettre à jour la progression d'un objectif
  Future<void> updateGoalProgress(
    String userId,
    String goalId,
    double amount,
  ) async {
    try {
      await _goalsCollection(userId).doc(goalId).update({
        'currentAmount': amount,
        'updatedAt': Timestamp.fromDate(DateTime.now()),
      });
    } catch (e) {
      throw Exception('Erreur lors de la mise à jour de l\'objectif: $e');
    }
  }

  // ============================================================================
  // DETTES/CRÉANCES (IOUs)
  // ============================================================================

  /// Référence à la sous-collection ious
  CollectionReference _iousCollection(String userId) =>
      _usersCollection.doc(userId).collection('ious');

  /// Ajouter une dette/créance
  Future<String> addIOU({
    required String userId,
    required IOUType type,
    required String personName,
    String? personEmail,
    String? personPhone,
    required double amount,
    String? description,
    required DateTime dueDate,
  }) async {
    try {
      final now = DateTime.now();
      final docRef = _iousCollection(userId).doc();
      
      final iou = IOU(
        iouId: docRef.id,
        userId: userId,
        type: type,
        personName: personName,
        personEmail: personEmail,
        personPhone: personPhone,
        amount: amount,
        description: description,
        dueDate: dueDate,
        createdAt: now,
        updatedAt: now,
      );

      await docRef.set(iou.toMap());
      return docRef.id;
    } catch (e) {
      throw Exception('Erreur lors de l\'ajout de la dette/créance: $e');
    }
  }

  /// Obtenir toutes les dettes/créances (Stream)
  Stream<List<IOU>> getIOUsStream(String userId, {IOUType? type}) {
    Query query = _iousCollection(userId);

    if (type != null) {
      query = query.where('type', isEqualTo: type.name);
    }

    return query.orderBy('dueDate').snapshots().map((snapshot) {
      return snapshot.docs.map((doc) {
        return IOU.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      }).toList();
    });
  }

  /// Enregistrer un paiement partiel ou total
  Future<void> recordIOUPayment(
    String userId,
    String iouId,
    double paymentAmount,
  ) async {
    try {
      final doc = await _iousCollection(userId).doc(iouId).get();
      if (!doc.exists) {
        throw Exception('Dette/Créance introuvable');
      }

      final iou = IOU.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      final newPaidAmount = iou.paidAmount + paymentAmount;
      
      IOUStatus newStatus = IOUStatus.pending;
      if (newPaidAmount >= iou.amount) {
        newStatus = IOUStatus.paid;
      } else if (newPaidAmount > 0) {
        newStatus = IOUStatus.partiallyPaid;
      }

      await _iousCollection(userId).doc(iouId).update({
        'paidAmount': newPaidAmount,
        'status': newStatus.name,
        'updatedAt': Timestamp.fromDate(DateTime.now()),
      });
    } catch (e) {
      throw Exception('Erreur lors de l\'enregistrement du paiement: $e');
    }
  }

  // ============================================================================
  // BUDGET PLANNER (Module 5)
  // ============================================================================

  /// Collection des budgets
  CollectionReference _budgetsCollection(String userId) {
    return _usersCollection.doc(userId).collection('budgets');
  }

  /// Sauvegarde un plan de budget
  Future<String> saveBudgetPlan({
    required String userId,
    required double totalBudget,
    required Map<String, double> categoryAllocations,
  }) async {
    try {
      if (userId.isEmpty) {
        throw Exception('User ID requis');
      }

      final now = DateTime.now();
      final docRef = _budgetsCollection(userId).doc();

      final budgetPlan = {
        'id': docRef.id,
        'totalBudget': totalBudget,
        'categoryAllocations': categoryAllocations,
        'createdAt': Timestamp.fromDate(now),
        'updatedAt': Timestamp.fromDate(now),
      };

      await docRef.set(budgetPlan);
      return docRef.id;
    } catch (e) {
      throw Exception('Erreur lors de la sauvegarde du budget: $e');
    }
  }

  /// Stream du plan de budget actuel
  Stream<Map<String, dynamic>?> getBudgetPlanStream(String userId) {
    return _budgetsCollection(userId)
        .orderBy('createdAt', descending: true)
        .limit(1)
        .snapshots()
        .map((snapshot) {
      if (snapshot.docs.isEmpty) return null;
      return snapshot.docs.first.data() as Map<String, dynamic>;
    });
  }

  /// Récupère le plan de budget actuel
  Future<Map<String, dynamic>?> getCurrentBudgetPlan(String userId) async {
    try {
      final snapshot = await _budgetsCollection(userId)
          .orderBy('createdAt', descending: true)
          .limit(1)
          .get();

      if (snapshot.docs.isEmpty) return null;
      return snapshot.docs.first.data() as Map<String, dynamic>;
    } catch (e) {
      throw Exception('Erreur lors de la récupération du budget: $e');
    }
  }

  /// Met à jour un plan de budget
  Future<void> updateBudgetPlan({
    required String userId,
    required String budgetId,
    required Map<String, double> categoryAllocations,
    double? totalBudget,
  }) async {
    try {
      final updates = <String, dynamic>{
        'categoryAllocations': categoryAllocations,
        'updatedAt': Timestamp.fromDate(DateTime.now()),
      };

      if (totalBudget != null) {
        updates['totalBudget'] = totalBudget;
      }

      await _budgetsCollection(userId).doc(budgetId).update(updates);
    } catch (e) {
      throw Exception('Erreur lors de la mise à jour du budget: $e');
    }
  }

  /// Supprime un plan de budget
  Future<void> deleteBudgetPlan(String userId, String budgetId) async {
    try {
      await _budgetsCollection(userId).doc(budgetId).delete();
    } catch (e) {
      throw Exception('Erreur lors de la suppression du budget: $e');
    }
  }

  // ============================================================================
  // OBJECTIFS - FONCTIONNALITÉ DE FINANCEMENT (Module 6)
  // ============================================================================

  /// Finance un objectif ET débite le compte source (opération atomique)
  Future<void> fundGoal({
    required String userId,
    required String goalId,
    required double amount,
    required String sourceAccountId,
    String? description,
  }) async {
    try {
      final batch = _firestore.batch();

      // 1. Mettre à jour l'objectif
      final goalRef = _goalsCollection(userId).doc(goalId);
      batch.update(goalRef, {
        'currentAmount': FieldValue.increment(amount),
        'updatedAt': Timestamp.fromDate(DateTime.now()),
      });

      // 2. Débiter le compte source
      final accountRef = _accountsCollection(userId).doc(sourceAccountId);
      batch.update(accountRef, {
        'balance': FieldValue.increment(-amount),
        'updatedAt': Timestamp.fromDate(DateTime.now()),
      });

      // 3. Créer une transaction de type "savings"
      final now = DateTime.now();
      final transactionRef = _transactionsCollection(userId).doc();
      
      final transaction = app_transaction.Transaction(
          transactionId: transactionRef.id,
          userId: userId,
          accountId: sourceAccountId,
          categoryId: 'savings', // Catégorie épargne
          type: app_transaction.TransactionType.expense,
          amount: amount,
          description: description ?? 'Financement objectif',
          note: 'Allocation vers objectif $goalId',
          date: now,
          toAccountId: null,
          tags: const ['goal'],
          receiptUrl: null,
          createdAt: now,
          updatedAt: now);

      batch.set(transactionRef, transaction.toMap());

      await batch.commit();
    } catch (e) {
      throw Exception('Erreur lors du financement de l\'objectif: $e');
    }
  }

  // ============================================================================
  // ADMINISTRATION (Module 7)
  // ============================================================================

  /// Stream de tous les utilisateurs (ADMIN SEULEMENT)
  Stream<List<UserProfile>> getAllUsersStream() {
    return _usersCollection
        .orderBy('createdAt', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        return UserProfile.fromMap(
          doc.data() as Map<String, dynamic>,
          doc.id,
        );
      }).toList();
    });
  }

  /// Récupère tous les utilisateurs (ADMIN SEULEMENT)
  Future<List<UserProfile>> getAllUsers() async {
    try {
      final snapshot = await _usersCollection
          .orderBy('createdAt', descending: true)
          .get();

      return snapshot.docs.map((doc) {
        return UserProfile.fromMap(
          doc.data() as Map<String, dynamic>,
          doc.id,
        );
      }).toList();
    } catch (e) {
      throw Exception('Erreur lors de la récupération des utilisateurs: $e');
    }
  }

  /// Met à jour le statut d'un utilisateur (ADMIN SEULEMENT)
  Future<void> updateUserStatus(String userId, String newStatus) async {
    try {
      await _usersCollection.doc(userId).update({
        'status': newStatus,
        'updatedAt': Timestamp.fromDate(DateTime.now()),
      });
    } catch (e) {
      throw Exception('Erreur lors de la mise à jour du statut: $e');
    }
  }

  /// Met à jour le rôle d'un utilisateur (ADMIN SEULEMENT)
  Future<void> updateUserRole(String userId, String newRole) async {
    try {
      await _usersCollection.doc(userId).update({
        'role': newRole,
        'updatedAt': Timestamp.fromDate(DateTime.now()),
      });
    } catch (e) {
      throw Exception('Erreur lors de la mise à jour du rôle: $e');
    }
  }

  /// Bloque un utilisateur (ADMIN SEULEMENT)
  Future<void> blockUser(String userId) async {
    try {
      await updateUserStatus(userId, 'blocked');
    } catch (e) {
      throw Exception('Erreur lors du blocage de l\'utilisateur: $e');
    }
  }

  /// Débloque un utilisateur (ADMIN SEULEMENT)
  Future<void> unblockUser(String userId) async {
    try {
      await updateUserStatus(userId, 'active');
    } catch (e) {
      throw Exception('Erreur lors du déblocage de l\'utilisateur: $e');
    }
  }

  /// Supprime un utilisateur et toutes ses données (ADMIN SEULEMENT)
  Future<void> deleteUserCompletely(String userId) async {
    try {
      final batch = _firestore.batch();

      // Supprimer toutes les sous-collections
      final collections = [
        'accounts',
        'transactions',
        'categories',
        'goals',
        'ious',
        'budgets',
      ];

      for (final collection in collections) {
        final snapshot = await _usersCollection
            .doc(userId)
            .collection(collection)
            .get();

        for (final doc in snapshot.docs) {
          batch.delete(doc.reference);
        }
      }

      // Supprimer le document utilisateur
      batch.delete(_usersCollection.doc(userId));

      await batch.commit();
    } catch (e) {
      throw Exception('Erreur lors de la suppression de l\'utilisateur: $e');
    }
  }

  // ============================================================================
  // PRÉDICTIONS & ANALYSE (Module 11)
  // ============================================================================

  /// Prédit le solde estimé de fin de mois et détecte quelques transactions
  /// exceptionnelles basées sur les données récentes.
  Future<ProjectionResult> predictEndOfMonthBalance({String? userId}) async {
    final uid = userId ?? currentUserId;
    if (uid == null) {
      return const ProjectionResult(
        estimatedEndOfMonthBalance: 0,
        upcomingFixedExpensesTotal: 0,
        exceptionalTransactions: [],
      );
    }

    try {
      final now = DateTime.now();
      final currentMonthStart = DateTime(now.year, now.month, 1);
      final analysisWindowStart = DateTime(now.year, now.month - 2, 1);
      final daysInMonth = DateTime(now.year, now.month + 1, 0).day;
      final daysElapsed = now.day;
      final daysRemaining = (daysInMonth - daysElapsed).clamp(0, daysInMonth);

      final accounts = await getAccounts(uid);
      final currentBalance = accounts.fold(0.0, (sum, acc) => sum + acc.balance);

      final transactions = await getTransactions(
        uid,
        startDate: analysisWindowStart,
        endDate: now,
        limit: 800,
      );

      final currentMonthTransactions = transactions
          .where((t) => t.date.isAfter(currentMonthStart.subtract(const Duration(milliseconds: 1))) &&
              t.date.isBefore(now.add(const Duration(days: 1))))
          .toList();

      final currentMonthExpenses = currentMonthTransactions
          .where((t) => t.type == app_transaction.TransactionType.expense)
          .toList();

      final monthlyIncomeByMonth = <String, double>{};
      final monthlyExpenseByMonth = <String, double>{};

      for (final tx in transactions) {
        final key = '${tx.date.year}-${tx.date.month.toString().padLeft(2, '0')}';
        if (tx.type == app_transaction.TransactionType.income) {
          monthlyIncomeByMonth[key] = (monthlyIncomeByMonth[key] ?? 0) + tx.amount;
        } else if (tx.type == app_transaction.TransactionType.expense) {
          monthlyExpenseByMonth[key] = (monthlyExpenseByMonth[key] ?? 0) + tx.amount;
        }
      }

      double averageMonthlyIncome = 0;
      if (monthlyIncomeByMonth.isNotEmpty) {
        averageMonthlyIncome = monthlyIncomeByMonth.values.reduce((a, b) => a + b) /
            monthlyIncomeByMonth.length;
      }

      double averageMonthlyExpense = 0;
      if (monthlyExpenseByMonth.isNotEmpty) {
        averageMonthlyExpense = monthlyExpenseByMonth.values.reduce((a, b) => a + b) /
            monthlyExpenseByMonth.length;
      }

      final simulatedFixedIncome = averageMonthlyIncome * 0.85;
      final simulatedFixedExpenses = averageMonthlyExpense * 0.65;

      final variableEnvelope =
          (averageMonthlyExpense - simulatedFixedExpenses).clamp(0.0, double.infinity);
      final projectedVariableExpenses =
          variableEnvelope * (daysInMonth == 0 ? 0 : daysRemaining / daysInMonth);

      final projectedBalance = currentBalance +
          simulatedFixedIncome -
          simulatedFixedExpenses -
          projectedVariableExpenses;

      // Détection de transactions exceptionnelles (dépenses ponctuelles fortes)
      List<app_transaction.Transaction> exceptionalTransactions = [];
      final expenseAmounts = currentMonthExpenses.map((e) => e.amount).toList();
      if (expenseAmounts.isNotEmpty) {
        final mean =
            expenseAmounts.reduce((a, b) => a + b) / expenseAmounts.length;
        final variance = expenseAmounts
                .map((a) => math.pow(a - mean, 2))
                .reduce((a, b) => a + b) /
            expenseAmounts.length;
        final stdDev = math.sqrt(variance);
        final rawThreshold = mean + (stdDev * 1.5);
        final highest = expenseAmounts.reduce(math.max);
        final threshold = math.max(rawThreshold, highest * 0.6);

        exceptionalTransactions = currentMonthExpenses
            .where((tx) => tx.amount >= threshold)
            .toList()
          ..sort((a, b) => b.amount.compareTo(a.amount));

        if (exceptionalTransactions.length < 2 && currentMonthExpenses.isNotEmpty) {
          currentMonthExpenses.sort((a, b) => b.amount.compareTo(a.amount));
          exceptionalTransactions = currentMonthExpenses.take(2).toList();
        }
      }

      return ProjectionResult(
        estimatedEndOfMonthBalance: projectedBalance,
        upcomingFixedExpensesTotal: simulatedFixedExpenses,
        exceptionalTransactions: exceptionalTransactions,
      );
    } catch (e) {
      return const ProjectionResult(
        estimatedEndOfMonthBalance: 0,
        upcomingFixedExpensesTotal: 0,
        exceptionalTransactions: [],
      );
    }
  }

  // ============================================================================
  // STATISTIQUES & ANALYTICS
  // ============================================================================

  /// Obtient les statistiques globales de l'utilisateur
  Future<Map<String, dynamic>> getUserStats(String userId) async {
    try {
      final accounts = await getAccounts(userId);
      final transactions = await getTransactions(userId);
      final goals = await getGoals(userId);
      final ious = await getIOUsStream(userId).first;

      final totalBalance = accounts.fold(0.0, (sum, acc) => sum + acc.balance);
      
      final totalIncome = transactions
          .where((t) => t.type == app_transaction.TransactionType.income)
          .fold(0.0, (sum, t) => sum + t.amount);
      
      final totalExpenses = transactions
          .where((t) => t.type == app_transaction.TransactionType.expense)
          .fold(0.0, (sum, t) => sum + t.amount);

      final totalGoalsAmount = goals.fold(0.0, (sum, g) => sum + g.currentAmount);
      
      final totalDebt = ious
          .where((iou) => iou.type == IOUType.payable)
          .fold(0.0, (sum, iou) => sum + (iou.amount - iou.paidAmount));

      return {
        'totalBalance': totalBalance,
        'totalIncome': totalIncome,
        'totalExpenses': totalExpenses,
        'totalGoalsAmount': totalGoalsAmount,
        'totalDebt': totalDebt,
        'accountsCount': accounts.length,
        'transactionsCount': transactions.length,
        'goalsCount': goals.length,
        'iousCount': ious.length,
      };
    } catch (e) {
      throw Exception('Erreur lors du calcul des statistiques: $e');
    }
  }

  /// Vérifie si l'utilisateur est administrateur
  Future<bool> isUserAdmin(String userId) async {
    try {
      final profile = await getUserProfile(userId);
      return profile?.role == 'admin';
    } catch (e) {
      return false;
    }
  }

  /// Exporte toutes les données utilisateur (pour backup/migration)
  Future<Map<String, dynamic>> exportUserData(String userId) async {
    try {
      final profile = await getUserProfile(userId);
      final accounts = await getAccounts(userId);
      final transactions = await getTransactions(userId);
      final categories = await getCategories(userId);
      final goals = await getGoals(userId);
      final ious = await getIOUsStream(userId).first;
      final budget = await getCurrentBudgetPlan(userId);

      return {
        'profile': profile?.toMap(),
        'accounts': accounts.map((a) => a.toMap()).toList(),
        'transactions': transactions.map((t) => t.toMap()).toList(),
        'categories': categories.map((c) => c.toMap()).toList(),
        'goals': goals.map((g) => g.toMap()).toList(),
        'ious': ious.map((i) => i.toMap()).toList(),
        'budget': budget,
        'exportDate': DateTime.now().toIso8601String(),
      };
    } catch (e) {
      throw Exception('Erreur lors de l\'export des données: $e');
    }
  }
}
