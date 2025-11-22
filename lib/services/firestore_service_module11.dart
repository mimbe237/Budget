import 'package:cloud_firestore/cloud_firestore.dart' as fs;
import 'package:firebase_auth/firebase_auth.dart';

// ---------------------------------------------------------------------------
// Modèles (autonomes dans ce fichier)
// ---------------------------------------------------------------------------

class UserProfile {
  final String userId;
  final String displayName;
  final String? firstName;
  final String? lastName;
  final String? email;
  final String? photoUrl;
  final String? role; // 'user', 'premium', 'admin'
  final String? status; // 'active', 'blocked', 'disabled'
  final String currency;
  final DateTime createdAt;
  final DateTime updatedAt;

  UserProfile({
    required this.userId,
    required this.displayName,
    this.firstName,
    this.lastName,
    this.email,
    this.photoUrl,
    this.role = 'user',
    this.status = 'active',
    this.currency = 'EUR',
    required this.createdAt,
    required this.updatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'displayName': displayName,
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'photoUrl': photoUrl,
      'role': role,
      'status': status,
      'currency': currency,
      'createdAt': fs.Timestamp.fromDate(createdAt),
      'updatedAt': fs.Timestamp.fromDate(updatedAt),
    };
  }

  factory UserProfile.fromMap(Map<String, dynamic> map, String documentId) {
    return UserProfile(
      userId: documentId,
      displayName: map['displayName'] ?? '',
      firstName: map['firstName'],
      lastName: map['lastName'],
      email: map['email'],
      photoUrl: map['photoUrl'],
      role: map['role'] ?? 'user',
      status: map['status'] ?? 'active',
      currency: map['currency'] ?? 'EUR',
      createdAt: (map['createdAt'] as fs.Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as fs.Timestamp).toDate(),
    );
  }
}

enum AccountType { checking, savings, cash, creditCard, investment, mobileWallet, other }

class Account {
  final String accountId;
  final String userId;
  final String name;
  final AccountType type;
  final double balance;
  final String currency;
  final String? icon;
  final String? color;
  final List<String> sharedWithUIDs;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  Account({
    required this.accountId,
    required this.userId,
    required this.name,
    required this.type,
    required this.balance,
    this.currency = 'EUR',
    this.icon,
    this.color,
    this.sharedWithUIDs = const [],
    this.isActive = true,
    required this.createdAt,
    required this.updatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'accountId': accountId,
      'userId': userId,
      'name': name,
      'type': type.name,
      'balance': balance,
      'currency': currency,
      'icon': icon,
      'color': color,
      'sharedWithUIDs': sharedWithUIDs,
      'isActive': isActive,
      'createdAt': fs.Timestamp.fromDate(createdAt),
      'updatedAt': fs.Timestamp.fromDate(updatedAt),
    };
  }

  factory Account.fromMap(Map<String, dynamic> map, String documentId) {
    return Account(
      accountId: documentId,
      userId: map['userId'] ?? '',
      name: map['name'] ?? '',
      type: AccountType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => AccountType.other,
      ),
      balance: (map['balance'] ?? 0).toDouble(),
      currency: map['currency'] ?? 'EUR',
      icon: map['icon'],
      color: map['color'],
      sharedWithUIDs: List<String>.from(map['sharedWithUIDs'] ?? []),
      isActive: map['isActive'] ?? true,
      createdAt: (map['createdAt'] as fs.Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as fs.Timestamp).toDate(),
    );
  }
}

enum TransactionType { income, expense, transfer }

class Transaction {
  final String transactionId;
  final String userId;
  final String accountId;
  final String? categoryId;
  final String? category;
  final TransactionType type;
  final double amount;
  final String? description;
  final String? note;
  final DateTime date;
  final String? toAccountId;
  final List<String>? tags;
  final String? receiptUrl;
  final DateTime createdAt;
  final DateTime updatedAt;

  Transaction({
    required this.transactionId,
    required this.userId,
    required this.accountId,
    this.categoryId,
    this.category,
    required this.type,
    required this.amount,
    this.description,
    this.note,
    required this.date,
    this.toAccountId,
    this.tags,
    this.receiptUrl,
    required this.createdAt,
    required this.updatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'transactionId': transactionId,
      'userId': userId,
      'accountId': accountId,
      'categoryId': categoryId,
      'category': category,
      'type': type.name,
      'amount': amount,
      'description': description,
      'note': note,
      'date': fs.Timestamp.fromDate(date),
      'toAccountId': toAccountId,
      'tags': tags,
      'receiptUrl': receiptUrl,
      'createdAt': fs.Timestamp.fromDate(createdAt),
      'updatedAt': fs.Timestamp.fromDate(updatedAt),
    };
  }

  factory Transaction.fromMap(Map<String, dynamic> map, String documentId) {
    return Transaction(
      transactionId: documentId,
      userId: map['userId'] ?? '',
      accountId: map['accountId'] ?? '',
      categoryId: map['categoryId'],
      category: map['category'],
      type: TransactionType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => TransactionType.expense,
      ),
      amount: (map['amount'] ?? 0).toDouble(),
      description: map['description'],
      note: map['note'],
      date: (map['date'] as fs.Timestamp).toDate(),
      toAccountId: map['toAccountId'],
      tags: map['tags'] != null ? List<String>.from(map['tags']) : null,
      receiptUrl: map['receiptUrl'],
      createdAt: (map['createdAt'] as fs.Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as fs.Timestamp).toDate(),
    );
  }
}

enum CategoryType { income, expense }

class Category {
  final String categoryId;
  final String userId;
  final String name;
  final CategoryType type;
  final String icon;
  final String color;
  final bool isDefault;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  Category({
    required this.categoryId,
    required this.userId,
    required this.name,
    required this.type,
    required this.icon,
    required this.color,
    this.isDefault = false,
    this.isActive = true,
    required this.createdAt,
    required this.updatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'categoryId': categoryId,
      'userId': userId,
      'name': name,
      'type': type.name,
      'icon': icon,
      'color': color,
      'isDefault': isDefault,
      'isActive': isActive,
      'createdAt': fs.Timestamp.fromDate(createdAt),
      'updatedAt': fs.Timestamp.fromDate(updatedAt),
    };
  }

  factory Category.fromMap(Map<String, dynamic> map, String documentId) {
    return Category(
      categoryId: documentId,
      userId: map['userId'] ?? '',
      name: map['name'] ?? '',
      type: CategoryType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => CategoryType.expense,
      ),
      icon: map['icon'] ?? '📁',
      color: map['color'] ?? '#808080',
      isDefault: map['isDefault'] ?? false,
      isActive: map['isActive'] ?? true,
      createdAt: (map['createdAt'] as fs.Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as fs.Timestamp).toDate(),
    );
  }
}

enum GoalStatus { active, completed, cancelled }

class Goal {
  final String goalId;
  final String userId;
  final String name;
  final String? description;
  final double targetAmount;
  final double currentAmount;
  final DateTime targetDate;
  final String? icon;
  final String? color;
  final GoalStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;

  Goal({
    required this.goalId,
    required this.userId,
    required this.name,
    this.description,
    required this.targetAmount,
    this.currentAmount = 0.0,
    required this.targetDate,
    this.icon,
    this.color,
    this.status = GoalStatus.active,
    required this.createdAt,
    required this.updatedAt,
  });

  Map<String, dynamic> toMap() {
    return {
      'goalId': goalId,
      'userId': userId,
      'name': name,
      'description': description,
      'targetAmount': targetAmount,
      'currentAmount': currentAmount,
      'targetDate': fs.Timestamp.fromDate(targetDate),
      'icon': icon,
      'color': color,
      'status': status.name,
      'createdAt': fs.Timestamp.fromDate(createdAt),
      'updatedAt': fs.Timestamp.fromDate(updatedAt),
    };
  }

  factory Goal.fromMap(Map<String, dynamic> map, String documentId) {
    return Goal(
      goalId: documentId,
      userId: map['userId'] ?? '',
      name: map['name'] ?? '',
      description: map['description'],
      targetAmount: (map['targetAmount'] ?? 0).toDouble(),
      currentAmount: (map['currentAmount'] ?? 0).toDouble(),
      targetDate: (map['targetDate'] as fs.Timestamp).toDate(),
      icon: map['icon'],
      color: map['color'],
      status: GoalStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => GoalStatus.active,
      ),
      createdAt: (map['createdAt'] as fs.Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as fs.Timestamp).toDate(),
    );
  }
}

enum IOUType { iOwe, owedToMe, payable, receivable }
enum IOUStatus { pending, partiallyPaid, paid, cancelled, active, completed }

class IOU {
  final String iouId;
  final String userId;
  final IOUType type;
  final String personName;
  final String? personEmail;
  final String? personPhone;
  final double amount;
  final double paidAmount;
  final String? description;
  final DateTime dueDate;
  final IOUStatus status;
  final DateTime createdAt;
  final DateTime updatedAt;

  IOU({
    required this.iouId,
    required this.userId,
    required this.type,
    required this.personName,
    this.personEmail,
    this.personPhone,
    required this.amount,
    this.paidAmount = 0.0,
    this.description,
    required this.dueDate,
    this.status = IOUStatus.pending,
    required this.createdAt,
    required this.updatedAt,
  });

  double get currentBalance => amount - paidAmount;

  Map<String, dynamic> toMap() {
    return {
      'iouId': iouId,
      'userId': userId,
      'type': type.name,
      'personName': personName,
      'personEmail': personEmail,
      'personPhone': personPhone,
      'amount': amount,
      'paidAmount': paidAmount,
      'description': description,
      'dueDate': fs.Timestamp.fromDate(dueDate),
      'status': status.name,
      'createdAt': fs.Timestamp.fromDate(createdAt),
      'updatedAt': fs.Timestamp.fromDate(updatedAt),
    };
  }

  factory IOU.fromMap(Map<String, dynamic> map, String documentId) {
    return IOU(
      iouId: documentId,
      userId: map['userId'] ?? '',
      type: IOUType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => IOUType.iOwe,
      ),
      personName: map['personName'] ?? '',
      personEmail: map['personEmail'],
      personPhone: map['personPhone'],
      amount: (map['amount'] ?? 0).toDouble(),
      paidAmount: (map['paidAmount'] ?? 0).toDouble(),
      description: map['description'],
      dueDate: (map['dueDate'] as fs.Timestamp).toDate(),
      status: IOUStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => IOUStatus.pending,
      ),
      createdAt: (map['createdAt'] as fs.Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as fs.Timestamp).toDate(),
    );
  }
}

// ---------------------------------------------------------------------------
// Service Firestore (Module 11)
// ---------------------------------------------------------------------------

class FirestoreService {
  FirestoreService._internal();
  static final FirestoreService _instance = FirestoreService._internal();
  factory FirestoreService() => _instance;

  final fs.FirebaseFirestore _firestore = fs.FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;

  fs.CollectionReference<Map<String, dynamic>> get _usersCollection =>
      _firestore.collection('users');

  String? get currentUserId => _auth.currentUser?.uid;

  // Auth & profil -----------------------------------------------------------
  Future<String> signInAnonymously() async {
    final credential = await _auth.signInAnonymously();
    return credential.user!.uid;
  }

  Future<void> createUserProfile({
    required String userId,
    required String displayName,
    String? email,
    String? photoUrl,
    String currency = 'EUR',
  }) async {
    final now = DateTime.now();
    final profile = UserProfile(
      userId: userId,
      displayName: displayName,
      email: email,
      photoUrl: photoUrl,
      currency: currency,
      createdAt: now,
      updatedAt: now,
    );

    await _usersCollection.doc(userId).set(profile.toMap());
  }

  // Comptes -----------------------------------------------------------------
  fs.CollectionReference<Map<String, dynamic>> _accountsCollection(
    String userId,
  ) =>
      _usersCollection.doc(userId).collection('accounts');

  Stream<List<Account>> getAccountsStream(String userId) {
    return _accountsCollection(userId)
        .where('isActive', isEqualTo: true)
        .orderBy('createdAt')
        .snapshots()
        .map((snapshot) {
      return snapshot.docs
          .map((doc) => Account.fromMap(doc.data(), doc.id))
          .toList();
    });
  }

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
  }

  // Transactions ------------------------------------------------------------
  fs.CollectionReference<Map<String, dynamic>> _transactionsCollection(
    String userId,
  ) =>
      _usersCollection.doc(userId).collection('transactions');

  Future<String> addTransaction({
    required String userId,
    required String accountId,
    String? categoryId,
    required TransactionType type,
    required double amount,
    String? description,
    String? note,
    DateTime? date,
    String? toAccountId,
    List<String>? tags,
    String? receiptUrl,
  }) async {
    final now = DateTime.now();
    final transactionDate = date ?? now;

    return _firestore.runTransaction<String>((fs.Transaction transaction) async {
      final accountRef = _accountsCollection(userId).doc(accountId);
      final accountSnapshot = await transaction.get(accountRef);
      if (!accountSnapshot.exists) {
        throw Exception('Compte source introuvable');
      }

      final accountData = accountSnapshot.data()!;
      final currentBalance = (accountData['balance'] ?? 0).toDouble();
      double newBalance = currentBalance;

      if (type == TransactionType.income) {
        newBalance += amount;
      } else if (type == TransactionType.expense) {
        newBalance -= amount;
      } else if (type == TransactionType.transfer) {
        if (toAccountId == null) {
          throw Exception('toAccountId requis pour un transfert');
        }
        newBalance -= amount;

        final toAccountRef = _accountsCollection(userId).doc(toAccountId);
        final toAccountSnapshot = await transaction.get(toAccountRef);
        if (!toAccountSnapshot.exists) {
          throw Exception('Compte de destination introuvable');
        }

        final toAccountData = toAccountSnapshot.data()!;
        final toCurrentBalance = (toAccountData['balance'] ?? 0).toDouble();
        transaction.update(toAccountRef, {
          'balance': toCurrentBalance + amount,
          'updatedAt': fs.Timestamp.fromDate(now),
        });
      }

      final txRef = _transactionsCollection(userId).doc();
      final tx = Transaction(
        transactionId: txRef.id,
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

      transaction.set(txRef, tx.toMap());
      transaction.update(accountRef, {
        'balance': newBalance,
        'updatedAt': fs.Timestamp.fromDate(now),
      });

      return txRef.id;
    });
  }
}
