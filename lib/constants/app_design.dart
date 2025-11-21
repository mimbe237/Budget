import 'package:flutter/material.dart';

/// Constantes de design pour l'application
class AppDesign {
  AppDesign._();

  // ============================================================================
  // COULEURS VIVES ET MODERNES
  // ============================================================================
  
  static const Color primaryIndigo = Color(0xFF6366F1);
  static const Color primaryPurple = Color(0xFF8B5CF6);
  static const Color primaryPink = Color(0xFFEC4899);
  
  static const Color successGreen = Color(0xFF10B981);
  static const Color warningOrange = Color(0xFFF59E0B);
  static const Color dangerRed = Color(0xFFEF4444);
  static const Color infoBlue = Color(0xFF3B82F6);
  static const Color backgroundGrey = Color(0xFFF5F7FA); // Fond gris clair
  
  static const Color incomeColor = Color(0xFF10B981); // Vert
  static const Color expenseColor = Color(0xFFEF4444); // Rouge
  static const Color transferColor = Color(0xFF3B82F6); // Bleu
  
  // ============================================================================
  // COULEURS POUR CATÉGORIES (avec emojis correspondants)
  // ============================================================================
  
  static const Map<String, Color> categoryColors = {
    'alimentation': Color(0xFFEF4444),    // 🍔
    'transport': Color(0xFF3B82F6),       // 🚗
    'logement': Color(0xFF8B5CF6),        // 🏠
    'santé': Color(0xFF10B981),           // 🏥
    'loisirs': Color(0xFFF59E0B),         // 🎮
    'shopping': Color(0xFFEC4899),        // 🛍️
    'éducation': Color(0xFF6366F1),       // 📚
    'services': Color(0xFF14B8A6),        // 💼
    'autre': Color(0xFF6B7280),           // 📁
  };

  // ============================================================================
  // COULEURS POUR TYPES DE COMPTES
  // ============================================================================
  
  static const Map<String, Color> accountColors = {
    'checking': Color(0xFF3B82F6),      // Compte courant - Bleu
    'savings': Color(0xFF10B981),       // Épargne - Vert
    'cash': Color(0xFFF59E0B),          // Espèces - Orange
    'creditCard': Color(0xFFEC4899),    // Carte de crédit - Rose
    'investment': Color(0xFF8B5CF6),    // Investissement - Violet
    'other': Color(0xFF6B7280),         // Autre - Gris
  };

  // ============================================================================
  // BORDURES ARRONDIES
  // ============================================================================
  
  static const double radiusSmall = 12.0;
  static const double radiusMedium = 16.0;
  static const double radiusLarge = 20.0;
  static const double radiusXLarge = 24.0;
  
  static BorderRadius get smallRadius => BorderRadius.circular(radiusSmall);
  static BorderRadius get mediumRadius => BorderRadius.circular(radiusMedium);
  static BorderRadius get largeRadius => BorderRadius.circular(radiusLarge);
  static BorderRadius get xLargeRadius => BorderRadius.circular(radiusXLarge);

  // ============================================================================
  // ESPACEMENTS
  // ============================================================================
  
  static const double spacingXSmall = 4.0;
  static const double spacingSmall = 8.0;
  static const double spacingMedium = 16.0;
  static const double spacingLarge = 24.0;
  static const double spacingXLarge = 32.0;

  // Padding (aliases pour compatibilité)
  static const double paddingSmall = spacingSmall;
  static const double paddingMedium = spacingMedium;
  static const double paddingLarge = spacingLarge;

  // Border radius (aliases pour compatibilité)
  static const double borderRadiusSmall = radiusSmall;
  static const double borderRadiusMedium = radiusMedium;
  static const double borderRadiusLarge = radiusLarge;

  // ============================================================================
  // OMBRES
  // ============================================================================
  
  static List<BoxShadow> get softShadow => [
    BoxShadow(
      color: Colors.black.withOpacity(0.05),
      blurRadius: 10,
      offset: const Offset(0, 4),
    ),
  ];
  
  static List<BoxShadow> get mediumShadow => [
    BoxShadow(
      color: Colors.black.withOpacity(0.1),
      blurRadius: 20,
      offset: const Offset(0, 8),
    ),
  ];

  // ============================================================================
  // ANIMATIONS
  // ============================================================================
  
  static const Duration animationDurationFast = Duration(milliseconds: 200);
  static const Duration animationDurationNormal = Duration(milliseconds: 300);
  static const Duration animationDurationSlow = Duration(milliseconds: 500);
  
  static const Curve animationCurve = Curves.easeInOut;
  static const Curve animationCurveBounce = Curves.easeOutBack;

  // ============================================================================
  // ICÔNES PAR DÉFAUT
  // ============================================================================
  
  static const Map<String, String> defaultIcons = {
    'alimentation': '🍔',
    'transport': '🚗',
    'logement': '🏠',
    'santé': '🏥',
    'loisirs': '🎮',
    'shopping': '🛍️',
    'éducation': '📚',
    'services': '💼',
    'salaire': '💰',
    'investissement': '📈',
    'autre': '📁',
  };

  // ============================================================================
  // HELPERS
  // ============================================================================
  
  /// Obtenir une couleur en fonction du montant (positif = vert, négatif = rouge)
  static Color getAmountColor(double amount) {
    return amount >= 0 ? successGreen : dangerRed;
  }
  
  /// Obtenir une couleur en fonction du type de transaction
  static Color getTransactionTypeColor(String type) {
    switch (type) {
      case 'income':
        return incomeColor;
      case 'expense':
        return expenseColor;
      case 'transfer':
        return transferColor;
      default:
        return Colors.grey;
    }
  }
}

/// Extension pour ajouter des méthodes utiles aux couleurs
extension ColorExtension on Color {
  /// Obtenir une version plus claire de la couleur
  Color get lighter {
    return Color.lerp(this, Colors.white, 0.3)!;
  }
  
  /// Obtenir une version plus foncée de la couleur
  Color get darker {
    return Color.lerp(this, Colors.black, 0.2)!;
  }
}
