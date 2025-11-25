import 'package:cloud_firestore/cloud_firestore.dart';

enum IOUType {
  iOwe, // Je dois
  owedToMe, // On me doit
  payable, // Alias pour iOwe
  receivable, // Alias pour owedToMe
}

enum IOUStatus {
  pending,
  partiallyPaid,
  paid,
  cancelled,
  active, // Alias pour pending
  completed, // Alias pour paid
}

class IOU {
  final String iouId;
  final String userId;
  final IOUType type;
  final String personName;
  final String partyName; // Alias pour personName
  final String? personEmail;
  final String? personPhone;
  final double amount;
  final double originalAmount; // Alias pour amount
  final double paidAmount;
  final String? description;
  final DateTime dueDate;
  final IOUStatus status;
  final String icon;
  final DateTime createdAt;
  final DateTime updatedAt;

  IOU({
    required this.iouId,
    required this.userId,
    required this.type,
    required this.personName,
    String? partyName,
    this.personEmail,
    this.personPhone,
    required this.amount,
    double? originalAmount,
    this.paidAmount = 0.0,
    this.description,
    required this.dueDate,
    this.status = IOUStatus.pending,
    this.icon = '🤝',
    required this.createdAt,
    required this.updatedAt,
  })  : partyName = partyName ?? personName,
        originalAmount = originalAmount ?? amount;

  // Calcul du solde actuel
  double get currentBalance => amount - paidAmount;

  // Calcul du montant restant
  double get remainingAmount => amount - paidAmount;

  // Calcul du pourcentage payé
  double get paidPercentage {
    if (amount <= 0) return 0;
    return (paidAmount / amount * 100).clamp(0, 100);
  }

  // Conversion vers Map pour Firestore
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
      'dueDate': Timestamp.fromDate(dueDate),
      'status': status.name,
      'icon': icon,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  // Création depuis Map Firestore
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
      dueDate: (map['dueDate'] as Timestamp).toDate(),
      status: IOUStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => IOUStatus.pending,
      ),
      icon: map['icon'] ?? '🤝',
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }

  // Copie avec modifications
  IOU copyWith({
    String? iouId,
    String? userId,
    IOUType? type,
    String? personName,
    String? personEmail,
    String? personPhone,
    double? amount,
    double? paidAmount,
    String? description,
    DateTime? dueDate,
    IOUStatus? status,
    String? icon,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return IOU(
      iouId: iouId ?? this.iouId,
      userId: userId ?? this.userId,
      type: type ?? this.type,
      personName: personName ?? this.personName,
      personEmail: personEmail ?? this.personEmail,
      personPhone: personPhone ?? this.personPhone,
      amount: amount ?? this.amount,
      paidAmount: paidAmount ?? this.paidAmount,
      description: description ?? this.description,
      dueDate: dueDate ?? this.dueDate,
      status: status ?? this.status,
      icon: icon ?? this.icon,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
