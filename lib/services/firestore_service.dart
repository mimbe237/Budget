import 'dart:async';
import 'dart:math' as math;

import 'package:intl/intl.dart';
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

  // Compte démo partagé
  static const String demoEmail = 'demo123@budgetpro.net';
  static const String demoPassword = 'demo123';
  static const Duration demoTtl = Duration(hours: 2);

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  Timer? _demoCleanupTimer;

  // Getters pour les collections principales
  CollectionReference get _usersCollection => _firestore.collection('users');

  /// Obtenir l'ID de l'utilisateur connecté
  String? get currentUserId => _auth.currentUser?.uid;
  bool get isCurrentUserDemo =>
      _auth.currentUser?.email?.toLowerCase() == demoEmail;

  // ===================================
  // I. FONCTION CRITIQUE DE RÉINITIALISATION
  // ===================================

  Future<void> resetAllUserData() async {
    if (currentUserId == null) {
      throw Exception("Utilisateur non connecté. Impossible de réinitialiser.");
    }
    
    // Référence au document utilisateur
    final userRef = _usersCollection.doc(currentUserId);
    
    // Liste des sous-collections à supprimer (celles que nous avons définies)
    const collectionsToDelete = [
      'accounts',
      'transactions',
      'budgets',
      'goals',
      'ious',
      'categories' // Si vous avez des catégories utilisateur stockées ici
    ];
    
    // AVERTISSEMENT : La suppression de sous-collections dans Firestore nécessite 
    // de supprimer tous les documents à l'intérieur de la sous-collection, 
    // Firestore n'a pas de fonction `deleteCollection` native côté client.
    
    for (final collectionName in collectionsToDelete) {
      final collectionRef = userRef.collection(collectionName);
      
      // Récupérer tous les documents de la sous-collection
      final snapshot = await collectionRef.get();
      
      // Utiliser un batch pour supprimer tous les documents efficacement
      final batch = _firestore.batch();
      for (final doc in snapshot.docs) {
        batch.delete(doc.reference);
      }
      
      await batch.commit();
      print("Collection $collectionName réinitialisée pour l'utilisateur.");
    }

    // Supprimer et recréer le profil utilisateur pour effacer les métadonnées
    await userRef.delete();
    
    // Redémarrer l'application ou forcer une déconnexion pour relancer l'onboarding
    await _auth.signOut(); 
    print("Réinitialisation complète des données de l'utilisateur effectuée.");
  }

  // ===================================
  // II. Autres méthodes (Logout, etc.)
  // ===================================
  
  Future<void> logout() async {
    await _auth.signOut();
  }

  /// Purge et regarnit les données du compte démo (appelé après login démo)
  Future<void> ensureDemoDataset({Duration ttl = demoTtl}) async {
    final user = _auth.currentUser;
    if (!_isDemoUser(user)) return;

    final userId = user!.uid;
    final now = DateTime.now();
    final expiresAt = now.add(ttl);

    // Nettoyer les sous-collections pour repartir d'un état sain
    await _wipeUserCollections(userId);

    // Profil minimal pour le mode démo
    await _usersCollection.doc(userId).set({
      'userId': userId,
      'displayName': 'Compte Démo',
      'email': user.email,
      'currency': 'EUR',
      'isDemo': true,
      'demoExpiresAt': Timestamp.fromDate(expiresAt),
      'updatedAt': Timestamp.fromDate(now),
      'createdAt': FieldValue.serverTimestamp(),
    }, SetOptions(merge: true));

    // Créer les catégories par défaut
    await createDefaultCategories(userId);

    // Comptes et transactions exemples
    await _seedDemoAccountsAndTransactions(userId);

    // Planifier un nettoyage auto après TTL (déconnexion incluse)
    _startDemoTimer(ttl);
  }

  void _startDemoTimer(Duration ttl) {
    _demoCleanupTimer?.cancel();
    _demoCleanupTimer = Timer(ttl, () async {
      print("Session démo expirée. Nettoyage...");
      await cleanupDemoDataOnLogout();
      await _auth.signOut();
    });
  }

  /// Vérifie si la session démo a expiré (à appeler au démarrage)
  Future<void> checkDemoExpiration() async {
    final user = _auth.currentUser;
    if (!_isDemoUser(user)) return;
    
    try {
      final doc = await _usersCollection.doc(user!.uid).get();
      if (!doc.exists) return;
      
      final data = doc.data() as Map<String, dynamic>;
      final expiresAt = (data['demoExpiresAt'] as Timestamp?)?.toDate();
      
      if (expiresAt != null) {
        if (DateTime.now().isAfter(expiresAt)) {
           print("Session démo expirée détectée au démarrage.");
           await cleanupDemoDataOnLogout();
           await _auth.signOut();
        } else {
           // Reprendre le timer
           final remaining = expiresAt.difference(DateTime.now());
           _startDemoTimer(remaining);
        }
      }
    } catch (e) {
      print("Erreur lors de la vérification de l'expiration démo: $e");
    }
  }

  /// Nettoyage des données démo lors de la déconnexion
  Future<void> cleanupDemoDataOnLogout() async {
    _demoCleanupTimer?.cancel();
    final user = _auth.currentUser;
    if (!_isDemoUser(user)) return;
    final userId = user!.uid;
    
    // 1. Tout effacer (données utilisateur)
    await _wipeUserCollections(userId);
    
    // 2. Restaurer les données par défaut (pour que le compte reste "propre" mais rempli)
    await createDefaultCategories(userId);
    await _seedDemoAccountsAndTransactions(userId);

    // 3. Marquer comme nettoyé
    await _usersCollection.doc(userId).set({
      'isDemo': true,
      'demoLastCleanup': FieldValue.serverTimestamp(),
      'demoExpiresAt': FieldValue.delete(), // Plus d'expiration active
    }, SetOptions(merge: true));
  }

  bool _isDemoUser(User? user) =>
      user?.email?.toLowerCase() == demoEmail.toLowerCase();

  Future<void> _wipeUserCollections(String userId) async {
    const collectionsToDelete = [
      'accounts',
      'transactions',
      'budgets',
      'goals',
      'ious',
      'categories',
    ];

    final userRef = _usersCollection.doc(userId);
    for (final collectionName in collectionsToDelete) {
      final colRef = userRef.collection(collectionName);
      final snapshot = await colRef.get();
      for (final doc in snapshot.docs) {
        await doc.reference.delete();
      }
    }
  }

  /// Obtenir les transactions avec pagination (retourne QuerySnapshot pour gérer le curseur)
  Future<QuerySnapshot> getTransactionsPagedSnapshot(
    String userId, {
    int limit = 20,
    DocumentSnapshot? startAfterDocument,
    app_transaction.TransactionType? type,
    String? accountId,
    String? categoryId,
    DateTime? startDate,
    DateTime? endDate,
  }) async {
    try {
      Query query = _transactionsCollection(userId).where('isDeleted', isEqualTo: false);

      if (accountId != null) query = query.where('accountId', isEqualTo: accountId);
      if (categoryId != null) query = query.where('categoryId', isEqualTo: categoryId);
      if (type != null) query = query.where('type', isEqualTo: type.name);
      if (startDate != null) query = query.where('date', isGreaterThanOrEqualTo: Timestamp.fromDate(startDate));
      if (endDate != null) query = query.where('date', isLessThanOrEqualTo: Timestamp.fromDate(endDate));

      query = query.orderBy('date', descending: true).limit(limit);

      if (startAfterDocument != null) {
        query = query.startAfterDocument(startAfterDocument);
      }

      return await query.get();
    } catch (e) {
      throw Exception('Erreur pagination: $e');
    }
  }

  Future<void> _seedDemoAccountsAndTransactions(String userId) async {
    final batch = _firestore.batch();
    final now = DateTime.now();
    final random = math.Random();

    // 1. Création des comptes (IDs générés manuellement pour le batch)
    final mainAccountId = _accountsCollection(userId).doc().id;
    final savingsAccountId = _accountsCollection(userId).doc().id;
    final cashAccountId = _accountsCollection(userId).doc().id;

    // Soldes initiaux (calculés en mémoire)
    double mainBalance = 0;
    double savingsBalance = 0;
    double cashBalance = 0;

    // Récupération des catégories
    final categories = await getCategories(userId);
    String? getCatId(String name) {
      try {
        return categories.firstWhere((c) => c.name == name).categoryId;
      } catch (e) {
        return null;
      }
    }

    final salaryCat = getCatId('Salaire');
    final housingCat = getCatId('Logement');
    final foodCat = getCatId('Alimentation');
    final transportCat = getCatId('Transport');
    final leisureCat = getCatId('Loisirs');
    final billsCat = getCatId('Factures');
    final healthCat = getCatId('Santé');

    // 2. Génération des transactions sur 6 mois
    // On génère environ 150 transactions
    // ~25 transactions par mois
    
    for (int i = 5; i >= 0; i--) {
      final monthDate = DateTime(now.year, now.month - i, 1);
      final daysInMonth = DateTime(monthDate.year, monthDate.month + 1, 0).day;
      
      // Salaire (le 28 ou 30 du mois)
      final salaryDate = DateTime(monthDate.year, monthDate.month, 28);
      if (salaryDate.isBefore(now)) {
        final amount = 3200.0 + random.nextInt(200); // Salaire variable
        mainBalance += amount;
        _addBatchTransaction(
          batch, userId, mainAccountId, salaryCat, 
          app_transaction.TransactionType.income, amount, 
          'Salaire ${DateFormat('MMMM').format(salaryDate)}', salaryDate
        );
      }

      // Loyer (le 5 du mois)
      final rentDate = DateTime(monthDate.year, monthDate.month, 5);
      if (rentDate.isBefore(now)) {
        const amount = 1200.0;
        mainBalance -= amount;
        _addBatchTransaction(
          batch, userId, mainAccountId, housingCat, 
          app_transaction.TransactionType.expense, amount, 
          'Loyer', rentDate
        );
      }

      // Factures (Internet, Électricité) - vers le 10
      final billsDate = DateTime(monthDate.year, monthDate.month, 10);
      if (billsDate.isBefore(now)) {
        final amount = 150.0 + random.nextDouble() * 50;
        mainBalance -= amount;
        _addBatchTransaction(
          batch, userId, mainAccountId, billsCat, 
          app_transaction.TransactionType.expense, amount, 
          'Factures (Élec/Internet)', billsDate
        );
      }

      // Épargne (Virement vers livret) - vers le 15
      final savingsDate = DateTime(monthDate.year, monthDate.month, 15);
      if (savingsDate.isBefore(now)) {
        final amount = 300.0 + random.nextInt(200);
        mainBalance -= amount;
        savingsBalance += amount;
        _addBatchTransaction(
          batch, userId, mainAccountId, null, 
          app_transaction.TransactionType.transfer, amount, 
          'Épargne mensuelle', savingsDate,
          toAccountId: savingsAccountId
        );
      }

      // Dépenses courantes (Courses, Loisirs, Transport)
      // ~20 transactions aléatoires par mois
      for (int j = 0; j < 20; j++) {
        final day = 1 + random.nextInt(daysInMonth);
        final txDate = DateTime(monthDate.year, monthDate.month, day, random.nextInt(23), random.nextInt(59));
        
        if (txDate.isAfter(now)) continue;

        final typeRoll = random.nextDouble();
        
        if (typeRoll < 0.6) {
          // Courses (60%)
          final amount = 30.0 + random.nextDouble() * 100;
          mainBalance -= amount;
          _addBatchTransaction(
            batch, userId, mainAccountId, foodCat, 
            app_transaction.TransactionType.expense, amount, 
            'Courses Supermarché', txDate
          );
        } else if (typeRoll < 0.8) {
          // Loisirs (20%)
          final amount = 15.0 + random.nextDouble() * 60;
          mainBalance -= amount;
          _addBatchTransaction(
            batch, userId, mainAccountId, leisureCat, 
            app_transaction.TransactionType.expense, amount, 
            'Sortie / Loisir', txDate
          );
        } else if (typeRoll < 0.9) {
          // Transport (10%)
          final amount = 10.0 + random.nextDouble() * 40;
          cashBalance -= amount; // Payé en cash souvent
          _addBatchTransaction(
            batch, userId, cashAccountId, transportCat, 
            app_transaction.TransactionType.expense, amount, 
            'Transport / Essence', txDate
          );
        } else {
          // Santé / Divers (10%)
          final amount = 20.0 + random.nextDouble() * 50;
          mainBalance -= amount;
          _addBatchTransaction(
            batch, userId, mainAccountId, healthCat, 
            app_transaction.TransactionType.expense, amount, 
            'Pharmacie / Santé', txDate
          );
        }
      }
    }

    // 3. Ajout des comptes au batch avec les soldes calculés
    batch.set(_accountsCollection(userId).doc(mainAccountId), Account(
      accountId: mainAccountId, userId: userId, name: 'Compte courant', 
      type: AccountType.checking, balance: mainBalance, icon: '💳', color: '#5E35B1',
      createdAt: now, updatedAt: now
    ).toMap());

    batch.set(_accountsCollection(userId).doc(savingsAccountId), Account(
      accountId: savingsAccountId, userId: userId, name: 'Épargne', 
      type: AccountType.savings, balance: savingsBalance, icon: '🐷', color: '#4CAF50',
      createdAt: now, updatedAt: now
    ).toMap());

    batch.set(_accountsCollection(userId).doc(cashAccountId), Account(
      accountId: cashAccountId, userId: userId, name: 'Espèces', 
      type: AccountType.cash, balance: cashBalance, icon: '💵', color: '#FF9800',
      createdAt: now, updatedAt: now
    ).toMap());

    // 4. Création d'un objectif
    await addGoal(
      userId: userId,
      name: 'Vacances Été',
      targetAmount: 2000,
      targetDate: now.add(const Duration(days: 180)),
      icon: '✈️',
      color: '#0ea5e9',
    );
    
    // 5. Création d'un budget
    await saveBudgetPlan(
      userId: userId,
      totalBudget: 2500,
      categoryAllocations: {
        if (housingCat != null) housingCat: 1200,
        if (foodCat != null) foodCat: 600,
        if (transportCat != null) transportCat: 200,
        if (leisureCat != null) leisureCat: 300,
      },
    );

    // 6. Commit final
    await batch.commit();
  }

  void _addBatchTransaction(
    WriteBatch batch, 
    String userId, 
    String accountId, 
    String? categoryId, 
    app_transaction.TransactionType type, 
    double amount, 
    String description, 
    DateTime date,
    {String? toAccountId}
  ) {
    final docRef = _transactionsCollection(userId).doc();
    final tx = app_transaction.Transaction(
      transactionId: docRef.id,
      userId: userId,
      accountId: accountId,
      categoryId: categoryId,
      type: type,
      amount: amount,
      description: description,
      date: date,
      toAccountId: toAccountId,
      createdAt: DateTime.now(),
      updatedAt: DateTime.now(),
    );
    batch.set(docRef, tx.toMap());
  }

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

  /// Variante: crée un profil à partir d'un modèle UserProfile complet
  Future<void> createUserProfileFromModel(UserProfile user) async {
    try {
      await _usersCollection.doc(user.userId).set(user.toMap());
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

  /// Crée les comptes par défaut pour un nouvel utilisateur (Courant, Épargne, Espèces)
  Future<void> createDefaultAccounts(String userId) async {
    try {
      final accounts = await getAccounts(userId);
      if (accounts.isNotEmpty) return; // L'utilisateur a déjà des comptes

      // Création en parallèle pour la rapidité
      await Future.wait([
        addAccount(
          userId: userId,
          name: 'Compte Courant',
          type: AccountType.checking,
          icon: '💳',
          color: '#6366F1', // Indigo
          balance: 0.0,
        ),
        addAccount(
          userId: userId,
          name: 'Épargne',
          type: AccountType.savings,
          icon: '🐷',
          color: '#4CAF50', // Green
          balance: 0.0,
        ),
        addAccount(
          userId: userId,
          name: 'Espèces',
          type: AccountType.cash,
          icon: '💵',
          color: '#FF9800', // Orange
          balance: 0.0,
        ),
        addAccount(
          userId: userId,
          name: 'Mobile Money',
          type: AccountType.mobileWallet,
          icon: '📱',
          color: '#9C27B0', // Purple
          balance: 0.0,
        ),
      ]);
    } catch (e) {
      print('Erreur lors de la création des comptes par défaut: $e');
      // On ne lance pas d'exception pour ne pas bloquer le flux principal
    }
  }

  /// Crée des catégories par défaut si aucune n'existe encore pour l'utilisateur
  Future<void> createDefaultCategories(String userId) async {
    try {
      final categories = await getCategories(userId);
      
      // Vérifier si on a des catégories pour chaque type
      final hasIncome = categories.any((c) => c.type == CategoryType.income);
      final hasExpense = categories.any((c) => c.type == CategoryType.expense);

      final defaults = <Map<String, dynamic>>[];

      if (!hasIncome) {
        defaults.addAll([
          {'name': 'Salaire', 'type': CategoryType.income, 'icon': '💼', 'color': '#22c55e'},
          {'name': 'Prime', 'type': CategoryType.income, 'icon': '🎁', 'color': '#16a34a'},
          {'name': 'Investissements', 'type': CategoryType.income, 'icon': '📈', 'color': '#0ea5e9'},
        ]);
      }

      if (!hasExpense) {
        defaults.addAll([
          {'name': 'Logement', 'type': CategoryType.expense, 'icon': '🏠', 'color': '#f97316'},
          {'name': 'Transport', 'type': CategoryType.expense, 'icon': '🚌', 'color': '#f59e0b'},
          {'name': 'Alimentation', 'type': CategoryType.expense, 'icon': '🛒', 'color': '#ef4444'},
          {'name': 'Santé', 'type': CategoryType.expense, 'icon': '🩺', 'color': '#22c55e'},
          {'name': 'Loisirs', 'type': CategoryType.expense, 'icon': '🎬', 'color': '#a855f7'},
          {'name': 'Factures', 'type': CategoryType.expense, 'icon': '💡', 'color': '#6366f1'},
        ]);
      }

      if (defaults.isEmpty) return;

      await Future.wait(defaults.map((cat) {
        return addCategory(
          userId: userId,
          name: cat['name'] as String,
          type: cat['type'] as CategoryType,
          icon: cat['icon'] as String,
          color: cat['color'] as String,
          isDefault: true,
        );
      }));
    } catch (e) {
      print('Erreur lors de la création des catégories par défaut: $e');
    }
  }

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

  /// Met à jour le solde d'un compte (incrément ou décrément)
  Future<void> updateAccountBalance(String userId, String accountId, double amount) async {
    try {
      await _firestore.runTransaction((transaction) async {
        final accountRef = _accountsCollection(userId).doc(accountId);
        final snapshot = await transaction.get(accountRef);
        if (!snapshot.exists) {
          throw Exception('Compte introuvable');
        }
        transaction.update(accountRef, {
          'balance': FieldValue.increment(amount),
          'updatedAt': Timestamp.fromDate(DateTime.now()),
        });
      });
    } catch (e) {
      throw Exception('Erreur lors de la mise à jour du solde: $e');
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

  /// Wrapper: transactions récentes pour le dashboard
  Stream<List<app_transaction.Transaction>> getRecentTransactionsStream(
    String userId, {
    int limit = 10,
  }) {
    return getTransactionsStream(userId, limit: limit);
  }

  /// Wrapper: transactions du mois courant (pour budget)
  Stream<List<app_transaction.Transaction>> getMonthlyTransactionsStream(
    String userId, {
    int limit = 500,
  }) {
    final now = DateTime.now();
    final startOfMonth = DateTime(now.year, now.month, 1);
    return getTransactionsStream(
      userId,
      startDate: startOfMonth,
      endDate: now,
      limit: limit,
    );
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

  /// Mise à jour simple d'une transaction (sans recalcul des soldes)
  Future<void> updateTransactionBasic({
    required String userId,
    required String transactionId,
    double? amount,
    String? description,
    String? categoryId,
    DateTime? date,
    String? note,
  }) async {
    try {
      final updates = <String, dynamic>{
        'updatedAt': Timestamp.fromDate(DateTime.now()),
      };
      if (amount != null) updates['amount'] = amount;
      if (description != null) updates['description'] = description;
      if (categoryId != null) updates['categoryId'] = categoryId;
      if (date != null) updates['date'] = Timestamp.fromDate(date);
      if (note != null) updates['note'] = note;

      await _transactionsCollection(userId).doc(transactionId).update(updates);
    } catch (e) {
      throw Exception('Erreur lors de la mise à jour de la transaction: $e');
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
  // CORBEILLE & SUPPRESSION LOGIQUE (SOFT DELETE)
  // ============================================================================

  /// Supprime logiquement une transaction (déplace vers la corbeille)
  /// Met à jour le solde du compte comme si la transaction était annulée
  Future<void> softDeleteTransaction(String userId, String transactionId) async {
    try {
      await _firestore.runTransaction((transaction) async {
        // 1. Récupérer la transaction
        final transactionDocRef = _transactionsCollection(userId).doc(transactionId);
        final transactionSnapshot = await transaction.get(transactionDocRef);
        
        if (!transactionSnapshot.exists) {
          throw Exception('La transaction n\'existe pas');
        }

        final transactionData = transactionSnapshot.data() as Map<String, dynamic>;
        
        // Si déjà supprimée, on ne fait rien
        if (transactionData['isDeleted'] == true) return;

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
            newBalance -= amount;
            break;
          case app_transaction.TransactionType.expense:
            newBalance += amount;
            break;
          case app_transaction.TransactionType.transfer:
            newBalance += amount;
            
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

        // 5. Marquer la transaction comme supprimée (Soft Delete)
        transaction.update(transactionDocRef, {
          'isDeleted': true,
          'deletedAt': Timestamp.fromDate(now),
          'updatedAt': Timestamp.fromDate(now),
        });
      });
    } catch (e) {
      throw Exception('Erreur lors de la suppression logique: $e');
    }
  }

  /// Restaure une transaction depuis la corbeille
  /// Ré-applique l'impact sur le solde
  Future<void> restoreTransaction(String userId, String transactionId) async {
    try {
      await _firestore.runTransaction((transaction) async {
        // 1. Récupérer la transaction
        final transactionDocRef = _transactionsCollection(userId).doc(transactionId);
        final transactionSnapshot = await transaction.get(transactionDocRef);
        
        if (!transactionSnapshot.exists) {
          throw Exception('La transaction n\'existe pas');
        }

        final transactionData = transactionSnapshot.data() as Map<String, dynamic>;
        
        // Si non supprimée, on ne fait rien
        if (transactionData['isDeleted'] != true) return;

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

        // 3. Ré-appliquer l'opération sur le solde
        double newBalance = currentBalance;
        final now = DateTime.now();
        
        switch (type) {
          case app_transaction.TransactionType.income:
            newBalance += amount;
            break;
          case app_transaction.TransactionType.expense:
            newBalance -= amount;
            break;
          case app_transaction.TransactionType.transfer:
            newBalance -= amount;
            
            // Ré-appliquer sur le compte de destination
            if (toAccountId != null) {
              final toAccountDocRef = _accountsCollection(userId).doc(toAccountId);
              final toAccountSnapshot = await transaction.get(toAccountDocRef);
              
              if (toAccountSnapshot.exists) {
                final toAccountData = toAccountSnapshot.data() as Map<String, dynamic>;
                final toCurrentBalance = (toAccountData['balance'] ?? 0).toDouble();
                
                transaction.update(toAccountDocRef, {
                  'balance': toCurrentBalance + amount,
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

        // 5. Restaurer la transaction (enlever flag isDeleted)
        transaction.update(transactionDocRef, {
          'isDeleted': false,
          'deletedAt': FieldValue.delete(),
          'updatedAt': Timestamp.fromDate(now),
        });
      });
    } catch (e) {
      throw Exception('Erreur lors de la restauration: $e');
    }
  }

  /// Stream des transactions dans la corbeille
  Stream<List<app_transaction.Transaction>> getDeletedTransactionsStream(String userId) {
    return _transactionsCollection(userId)
        .where('isDeleted', isEqualTo: true)
        .orderBy('deletedAt', descending: true)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        return app_transaction.Transaction.fromMap(
          doc.data() as Map<String, dynamic>,
          doc.id,
        );
      }).toList();
    });
  }

  /// Nettoyage automatique de la corbeille (supprime définitivement après 30 jours)
  Future<void> runTrashCleanup(String userId) async {
    try {
      final thirtyDaysAgo = DateTime.now().subtract(const Duration(days: 30));
      
      final snapshot = await _transactionsCollection(userId)
          .where('isDeleted', isEqualTo: true)
          .where('deletedAt', isLessThan: Timestamp.fromDate(thirtyDaysAgo))
          .get();

      final batch = _firestore.batch();
      for (final doc in snapshot.docs) {
        batch.delete(doc.reference);
      }
      
      if (snapshot.docs.isNotEmpty) {
        await batch.commit();
        print('${snapshot.docs.length} transactions supprimées définitivement de la corbeille.');
      }
    } catch (e) {
      print('Erreur lors du nettoyage de la corbeille: $e');
    }
  }
  
  /// Suppression définitive immédiate (depuis la corbeille)
  Future<void> deleteTransactionPermanently(String userId, String transactionId) async {
    try {
      await _transactionsCollection(userId).doc(transactionId).delete();
    } catch (e) {
      throw Exception('Erreur lors de la suppression définitive: $e');
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

  /// Mettre à jour une catégorie existante
  Future<void> updateCategory({
    required String userId,
    required String categoryId,
    String? name,
    CategoryType? type,
    String? icon,
    String? color,
  }) async {
    try {
      final updates = <String, dynamic>{
        'updatedAt': Timestamp.fromDate(DateTime.now()),
      };
      if (name != null) updates['name'] = name;
      if (type != null) updates['type'] = type.name;
      if (icon != null) updates['icon'] = icon;
      if (color != null) updates['color'] = color;

      await _categoriesCollection(userId).doc(categoryId).update(updates);
    } catch (e) {
      throw Exception('Erreur lors de la mise à jour de la catégorie: $e');
    }
  }

  /// Obtenir toutes les catégories (Stream)
  Stream<List<Category>> getCategoriesStream(
    String userId, {
    CategoryType? type,
  }) {
    // Note: L'index composite (isActive ASC, name ASC) est requis pour cette requête
    // MODIFICATION: Suppression de orderBy('name') pour éviter l'erreur d'index manquant
    // Le tri sera fait côté client (Dart)
    Query query = _categoriesCollection(userId).where('isActive', isEqualTo: true);

    if (type != null) {
      query = query.where('type', isEqualTo: type.name);
    }

    return query.snapshots().map((snapshot) {
      final categories = snapshot.docs.map((doc) {
        return Category.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      }).toList();
      
      // Tri côté client
      categories.sort((a, b) => a.name.compareTo(b.name));
      
      return categories;
    });
  }

  /// Obtenir toutes les catégories actives (fetch ponctuel)
  Future<List<Category>> getCategories(
    String userId, {
    CategoryType? type,
  }) async {
    try {
      // Note: L'index composite (isActive ASC, name ASC) est requis pour cette requête
      Query query = _categoriesCollection(userId).where('isActive', isEqualTo: true);

      if (type != null) {
        query = query.where('type', isEqualTo: type.name);
      }

      final snapshot = await query.orderBy('name').get();
      return snapshot.docs
          .map((doc) => Category.fromMap(doc.data() as Map<String, dynamic>, doc.id))
          .toList();
    } catch (e) {
      // Fallback si l'index n'est pas encore prêt: on trie côté client
      print('Index manquant, tri côté client: $e');
      Query query = _categoriesCollection(userId).where('isActive', isEqualTo: true);
      
      if (type != null) {
        query = query.where('type', isEqualTo: type.name);
      }
      
      final snapshot = await query.get();
      final categories = snapshot.docs
          .map((doc) => Category.fromMap(doc.data() as Map<String, dynamic>, doc.id))
          .toList();
          
      categories.sort((a, b) => a.name.compareTo(b.name));
      return categories;
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

      final totalBalance = accounts.fold(0.0, (currentSum, acc) => currentSum + acc.balance);
      
      final totalIncome = transactions
          .where((t) => t.type == app_transaction.TransactionType.income)
          .fold(0.0, (currentSum, t) => currentSum + t.amount);
      
      final totalExpenses = transactions
          .where((t) => t.type == app_transaction.TransactionType.expense)
          .fold(0.0, (currentSum, t) => currentSum + t.amount);

      final totalGoalsAmount = goals.fold(0.0, (currentSum, g) => currentSum + g.currentAmount);
      
      final totalDebt = ious
          .where((iou) => iou.type == IOUType.payable)
          .fold(0.0, (currentSum, iou) => currentSum + (iou.amount - iou.paidAmount));

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
