import 'package:cloud_firestore/cloud_firestore.dart';

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
  final String languageCode;
  final String? countryCode;
  final String? phoneNumber;
  final bool needsOnboarding;
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
    this.languageCode = 'fr',
    this.countryCode,
    this.phoneNumber,
    this.needsOnboarding = false,
    required this.createdAt,
    required this.updatedAt,
  });

  // Conversion vers Map pour Firestore
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
      'languageCode': languageCode,
      'countryCode': countryCode,
      'phoneNumber': phoneNumber,
      'needsOnboarding': needsOnboarding,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  // Création depuis Map Firestore
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
      languageCode: map['languageCode'] ?? 'fr',
      countryCode: map['countryCode'],
      phoneNumber: map['phoneNumber'],
      needsOnboarding: (map['needsOnboarding'] as bool?) ?? false,
      createdAt: (map['createdAt'] as Timestamp).toDate(),
      updatedAt: (map['updatedAt'] as Timestamp).toDate(),
    );
  }

  // Copie avec modifications
  UserProfile copyWith({
    String? userId,
    String? displayName,
    String? firstName,
    String? lastName,
    String? email,
    String? photoUrl,
    String? role,
    String? status,
    String? currency,
    String? languageCode,
    String? countryCode,
    String? phoneNumber,
    bool? needsOnboarding,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return UserProfile(
      userId: userId ?? this.userId,
      displayName: displayName ?? this.displayName,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      photoUrl: photoUrl ?? this.photoUrl,
      role: role ?? this.role,
      status: status ?? this.status,
      currency: currency ?? this.currency,
      languageCode: languageCode ?? this.languageCode,
      countryCode: countryCode ?? this.countryCode,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      needsOnboarding: needsOnboarding ?? this.needsOnboarding,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}
