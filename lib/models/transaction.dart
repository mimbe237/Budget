import 'package:cloud_firestore/cloud_firestore.dart';

enum TransactionType {
  income,
  expense,
  transfer,
}

class Transaction {
  final String transactionId;
  final String userId;
  final String accountId;
  final String? categoryId;
  final String? category; // Nom de la catégorie (pour compatibilité)
  final TransactionType type;
  final double amount;
  final String? description;
  final String? note;
  final DateTime date;
  final String? toAccountId; // Pour les transferts
  final List<String>? tags;
  final String? receiptUrl;
  final bool isDeleted;
  final DateTime? deletedAt;
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
    this.isDeleted = false,
    this.deletedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  // Verrouillage après 48h
  bool get isLocked => DateTime.now().difference(createdAt).inHours > 48;

  // Conversion vers Map pour Firestore
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
      'date': Timestamp.fromDate(date),
      'toAccountId': toAccountId,
      'tags': tags,
      'receiptUrl': receiptUrl,
      'isDeleted': isDeleted,
      'deletedAt': deletedAt != null ? Timestamp.fromDate(deletedAt!) : null,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  // Création depuis Map Firestore
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
      date: (map['date'] as Timestamp).toDate(),
      toAccountId: map['toAccountId'],
      tags: map['tags'] != null ? List<String>.from(map['tags']) : null,
      receiptUrl: map['receiptUrl'],
      isDeleted: map['isDeleted'] ?? false,
      deletedAt: map['deletedAt'] != null ? (map['deletedAt'] as Timestamp).toDate() : null,
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }

  // Copie avec modifications
  Transaction copyWith({
    String? transactionId,
    String? userId,
    String? accountId,
    String? categoryId,
    String? category,
    TransactionType? type,
    double? amount,
    String? description,
    String? note,
    DateTime? date,
    String? toAccountId,
    List<String>? tags,
    String? receiptUrl,
    bool? isDeleted,
    DateTime? deletedAt,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Transaction(
      transactionId: transactionId ?? this.transactionId,
      userId: userId ?? this.userId,
      accountId: accountId ?? this.accountId,
      categoryId: categoryId ?? this.categoryId,
      category: category ?? this.category,
      type: type ?? this.type,
      amount: amount ?? this.amount,
      description: description ?? this.description,
      note: note ?? this.note,
      date: date ?? this.date,
      toAccountId: toAccountId ?? this.toAccountId,
      tags: tags ?? this.tags,
      receiptUrl: receiptUrl ?? this.receiptUrl,
      isDeleted: isDeleted ?? this.isDeleted,
      deletedAt: deletedAt ?? this.deletedAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
