import '../services/translation_service.dart';

/// Script d'initialisation des traductions de base
/// À exécuter une fois pour peupler Firestore avec les clés essentielles
class TranslationInitializer {
  static final TranslationService _translationService = TranslationService();

  /// Traductions de base essentielles pour l'application
  static const Map<String, Map<String, String>> baseTranslations = {
    // Navigation & General
    'Budget Pro': {
      'fr': 'Budget Pro',
      'en': 'Budget Pro',
      'category': 'general',
    },
    'Accueil': {
      'fr': 'Accueil',
      'en': 'Home',
      'category': 'navigation',
    },
    'Transactions': {
      'fr': 'Transactions',
      'en': 'Transactions',
      'category': 'navigation',
    },
    'Comptes': {
      'fr': 'Comptes',
      'en': 'Accounts',
      'category': 'navigation',
    },
    'Budgets': {
      'fr': 'Budgets',
      'en': 'Budgets',
      'category': 'navigation',
    },
    'Objectifs': {
      'fr': 'Objectifs',
      'en': 'Goals',
      'category': 'navigation',
    },
    'Paramètres': {
      'fr': 'Paramètres',
      'en': 'Settings',
      'category': 'navigation',
    },
    
    // Dashboard
    'Bienvenue': {
      'fr': 'Bienvenue',
      'en': 'Welcome',
      'category': 'dashboard',
    },
    'Revenu du mois': {
      'fr': 'Revenu du mois',
      'en': 'Monthly Income',
      'category': 'dashboard',
    },
    'Dépenses du mois': {
      'fr': 'Dépenses du mois',
      'en': 'Monthly Expenses',
      'category': 'dashboard',
    },
    'Dettes du mois': {
      'fr': 'Dettes du mois',
      'en': 'Monthly Debts',
      'category': 'dashboard',
    },
    'Objectifs financés': {
      'fr': 'Objectifs financés',
      'en': 'Funded Goals',
      'category': 'dashboard',
    },
    'Total encaissé': {
      'fr': 'Total encaissé',
      'en': 'Total Received',
      'category': 'dashboard',
    },
    'Total déboursé': {
      'fr': 'Total déboursé',
      'en': 'Total Spent',
      'category': 'dashboard',
    },
    'Remboursements & échéances': {
      'fr': 'Remboursements & échéances',
      'en': 'Payments & Deadlines',
      'category': 'dashboard',
    },
    'Progression': {
      'fr': 'Progression',
      'en': 'Progress',
      'category': 'dashboard',
    },
    'Transactions récentes': {
      'fr': 'Transactions récentes',
      'en': 'Recent Transactions',
      'category': 'dashboard',
    },
    
    // Transactions
    'Nouvelle Dépense': {
      'fr': 'Nouvelle Dépense',
      'en': 'New Expense',
      'category': 'transactions',
    },
    'Nouveau Revenu': {
      'fr': 'Nouveau Revenu',
      'en': 'New Income',
      'category': 'transactions',
    },
    'Montant': {
      'fr': 'Montant',
      'en': 'Amount',
      'category': 'transactions',
    },
    'Description': {
      'fr': 'Description',
      'en': 'Description',
      'category': 'transactions',
    },
    'Catégorie': {
      'fr': 'Catégorie',
      'en': 'Category',
      'category': 'transactions',
    },
    'Date': {
      'fr': 'Date',
      'en': 'Date',
      'category': 'transactions',
    },
    'Revenu': {
      'fr': 'Revenu',
      'en': 'Income',
      'category': 'transactions',
    },
    'Dépense': {
      'fr': 'Dépense',
      'en': 'Expense',
      'category': 'transactions',
    },
    'Transfert': {
      'fr': 'Transfert',
      'en': 'Transfer',
      'category': 'transactions',
    },
    
    // Actions
    'Enregistrer': {
      'fr': 'Enregistrer',
      'en': 'Save',
      'category': 'actions',
    },
    'Annuler': {
      'fr': 'Annuler',
      'en': 'Cancel',
      'category': 'actions',
    },
    'Modifier': {
      'fr': 'Modifier',
      'en': 'Edit',
      'category': 'actions',
    },
    'Supprimer': {
      'fr': 'Supprimer',
      'en': 'Delete',
      'category': 'actions',
    },
    'Confirmer': {
      'fr': 'Confirmer',
      'en': 'Confirm',
      'category': 'actions',
    },
    'Fermer': {
      'fr': 'Fermer',
      'en': 'Close',
      'category': 'actions',
    },
    
    // Auth
    'Connexion': {
      'fr': 'Connexion',
      'en': 'Sign In',
      'category': 'auth',
    },
    'Inscription': {
      'fr': 'Inscription',
      'en': 'Sign Up',
      'category': 'auth',
    },
    'Email': {
      'fr': 'Email',
      'en': 'Email',
      'category': 'auth',
    },
    'Mot de passe': {
      'fr': 'Mot de passe',
      'en': 'Password',
      'category': 'auth',
    },
    'Déconnexion': {
      'fr': 'Déconnexion',
      'en': 'Sign Out',
      'category': 'auth',
    },
    
    // Settings
    'Gestion des Traductions': {
      'fr': 'Gestion des Traductions',
      'en': 'Translation Management',
      'category': 'settings',
    },
    'Langue': {
      'fr': 'Langue',
      'en': 'Language',
      'category': 'settings',
    },
    'Devise': {
      'fr': 'Devise',
      'en': 'Currency',
      'category': 'settings',
    },
    'Thème': {
      'fr': 'Thème',
      'en': 'Theme',
      'category': 'settings',
    },
    'Notifications': {
      'fr': 'Notifications',
      'en': 'Notifications',
      'category': 'settings',
    },
    
    // Messages
    'Succès': {
      'fr': 'Succès',
      'en': 'Success',
      'category': 'messages',
    },
    'Erreur': {
      'fr': 'Erreur',
      'en': 'Error',
      'category': 'messages',
    },
    'Chargement...': {
      'fr': 'Chargement...',
      'en': 'Loading...',
      'category': 'messages',
    },
    'Aucune donnée': {
      'fr': 'Aucune donnée',
      'en': 'No data',
      'category': 'messages',
    },
  };

  /// Initialise les traductions de base dans Firestore
  static Future<void> initializeBaseTranslations() async {
    try {
      print('🚀 Initialisation des traductions de base...');
      
      await _translationService.importTranslations(
        baseTranslations,
        modifiedBy: 'system-init',
      );
      
      await _translationService.loadTranslations();
      
      print('✓ ${baseTranslations.length} traductions de base initialisées');
    } catch (e) {
      print('❌ Erreur lors de l\'initialisation: $e');
      rethrow;
    }
  }

  /// Ajoute des traductions manquantes sans écraser les existantes
  static Future<void> addMissingTranslations(Map<String, Map<String, String>> newTranslations) async {
    try {
      final existing = await _translationService.exportTranslations();
      final toAdd = <String, Map<String, String>>{};
      
      for (var entry in newTranslations.entries) {
        if (!existing.containsKey(entry.key)) {
          toAdd[entry.key] = entry.value;
        }
      }
      
      if (toAdd.isNotEmpty) {
        await _translationService.importTranslations(
          toAdd,
          modifiedBy: 'system-update',
        );
        print('✓ ${toAdd.length} nouvelles traductions ajoutées');
      } else {
        print('ℹ️ Aucune nouvelle traduction à ajouter');
      }
    } catch (e) {
      print('❌ Erreur lors de l\'ajout: $e');
      rethrow;
    }
  }

  /// Vérifie la santé du système de traduction
  static Future<Map<String, dynamic>> checkTranslationHealth() async {
    try {
      await _translationService.loadTranslations();
      final stats = _translationService.getStats();
      
      final health = {
        'status': 'ok',
        'total': stats['total'],
        'complete': stats['complete'],
        'pending': stats['pending'],
        'completionRate': stats['completionRate'],
        'lastSync': stats['lastSync'],
        'isListening': _translationService.isListening,
      };
      
      print('✓ Santé du système de traduction: ${health['completionRate']}% complet');
      return health;
    } catch (e) {
      print('❌ Erreur lors du check: $e');
      return {
        'status': 'error',
        'error': e.toString(),
      };
    }
  }
}
