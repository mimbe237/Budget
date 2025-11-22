import 'package:cloud_firestore/cloud_firestore.dart';

enum AccountType {
  checking,
  savings,
  cash,
  creditCard,
  investment,
  mobileWallet,
  other,
}

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

  // Conversion vers Map pour Firestore
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
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  // Création depuis Map Firestore
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
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }

  // Copie avec modifications
  Account copyWith({
    String? accountId,
    String? userId,
    String? name,
    AccountType? type,
    double? balance,
    String? currency,
    String? icon,
    String? color,
    List<String>? sharedWithUIDs,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Account(
      accountId: accountId ?? this.accountId,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      type: type ?? this.type,
      balance: balance ?? this.balance,
      currency: currency ?? this.currency,
      icon: icon ?? this.icon,
      color: color ?? this.color,
      sharedWithUIDs: sharedWithUIDs ?? this.sharedWithUIDs,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
