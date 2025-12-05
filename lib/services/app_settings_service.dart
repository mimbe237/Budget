import 'package:cloud_firestore/cloud_firestore.dart';

class AppSettingsService {
  static final AppSettingsService _instance = AppSettingsService._internal();
  factory AppSettingsService() => _instance;
  AppSettingsService._internal();

  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  // Valeurs par défaut
  String _whatsappNumber = '+237612345678';
  String _supportEmail = 'support@budgetpro.app';
  String _websiteUrl = 'https://www.beonweb.cm';
  
  bool _isLoaded = false;

  String get whatsappNumber => _whatsappNumber;
  String get supportEmail => _supportEmail;
  String get websiteUrl => _websiteUrl;
  String get whatsappUrl => 'https://wa.me/${_whatsappNumber.replaceAll(RegExp(r'[^0-9]'), '')}';

  /// Charge les paramètres depuis Firebase
  Future<void> loadSettings() async {
    if (_isLoaded) return;
    
    try {
      final doc = await _firestore.collection('appSettings').doc('global').get();
      
      if (doc.exists) {
        final data = doc.data();
        if (data != null) {
          _whatsappNumber = data['whatsappNumber'] ?? _whatsappNumber;
          _supportEmail = data['supportEmail'] ?? _supportEmail;
          _websiteUrl = data['websiteUrl'] ?? _websiteUrl;
        }
      }
      
      _isLoaded = true;
    } catch (e) {
      // En cas d'erreur, on garde les valeurs par défaut
      print('Erreur chargement paramètres: $e');
    }
  }

  /// Écoute les changements en temps réel
  Stream<Map<String, String>> watchSettings() {
    return _firestore
        .collection('appSettings')
        .doc('global')
        .snapshots()
        .map((snapshot) {
      if (snapshot.exists) {
        final data = snapshot.data();
        if (data != null) {
          _whatsappNumber = data['whatsappNumber'] ?? _whatsappNumber;
          _supportEmail = data['supportEmail'] ?? _supportEmail;
          _websiteUrl = data['websiteUrl'] ?? _websiteUrl;
        }
      }
      
      return {
        'whatsappNumber': _whatsappNumber,
        'supportEmail': _supportEmail,
        'websiteUrl': _websiteUrl,
        'whatsappUrl': whatsappUrl,
      };
    });
  }
}
