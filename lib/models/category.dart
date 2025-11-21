import 'package:cloud_firestore/cloud_firestore.dart';

enum CategoryType {
  income,
  expense,
}

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

  // Alias pour compatibilité
  String get id => categoryId;

  // Conversion vers Map pour Firestore
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
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  // Création depuis Map Firestore
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
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }

  // Copie avec modifications
  Category copyWith({
    String? categoryId,
    String? userId,
    String? name,
    CategoryType? type,
    String? icon,
    String? color,
    bool? isDefault,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Category(
      categoryId: categoryId ?? this.categoryId,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      type: type ?? this.type,
      icon: icon ?? this.icon,
      color: color ?? this.color,
      isDefault: isDefault ?? this.isDefault,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
