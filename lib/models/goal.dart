import 'package:cloud_firestore/cloud_firestore.dart';

enum GoalStatus {
  active,
  completed,
  cancelled,
}

class Goal {
  final String goalId;
  final String userId;
  final String name;
  final String? description;
  final double targetAmount;
  final double currentAmount;
  final DateTime targetDate;
  final DateTime? deadline; // Alias pour targetDate (compatibilité)
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
    DateTime? deadline,
    this.icon,
    this.color,
    this.status = GoalStatus.active,
    required this.createdAt,
    required this.updatedAt,
  }) : deadline = deadline ?? targetDate;

  // Calcul du pourcentage de progression
  double get progressPercentage {
    if (targetAmount <= 0) return 0;
    return (currentAmount / targetAmount * 100).clamp(0, 100);
  }

  // Conversion vers Map pour Firestore
  Map<String, dynamic> toMap() {
    return {
      'goalId': goalId,
      'userId': userId,
      'name': name,
      'description': description,
      'targetAmount': targetAmount,
      'currentAmount': currentAmount,
      'targetDate': Timestamp.fromDate(targetDate),
      'icon': icon,
      'color': color,
      'status': status.name,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  // Création depuis Map Firestore
  factory Goal.fromMap(Map<String, dynamic> map, String documentId) {
    return Goal(
      goalId: documentId,
      userId: map['userId'] ?? '',
      name: map['name'] ?? '',
      description: map['description'],
      targetAmount: (map['targetAmount'] ?? 0).toDouble(),
      currentAmount: (map['currentAmount'] ?? 0).toDouble(),
      targetDate: (map['targetDate'] as Timestamp).toDate(),
      icon: map['icon'],
      color: map['color'],
      status: GoalStatus.values.firstWhere(
        (e) => e.name == map['status'],
        orElse: () => GoalStatus.active,
      ),
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }

  // Copie avec modifications
  Goal copyWith({
    String? goalId,
    String? userId,
    String? name,
    String? description,
    double? targetAmount,
    double? currentAmount,
    DateTime? targetDate,
    String? icon,
    String? color,
    GoalStatus? status,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Goal(
      goalId: goalId ?? this.goalId,
      userId: userId ?? this.userId,
      name: name ?? this.name,
      description: description ?? this.description,
      targetAmount: targetAmount ?? this.targetAmount,
      currentAmount: currentAmount ?? this.currentAmount,
      targetDate: targetDate ?? this.targetDate,
      icon: icon ?? this.icon,
      color: color ?? this.color,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
