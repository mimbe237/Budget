import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Simple localization layer (fr/en) with manual dictionary + basic caching.
class AppLocalizations {
  AppLocalizations(this.locale);

  final Locale locale;

  static Locale _globalLocale = const Locale('fr');

  static const supportedLocales = [
    Locale('fr'),
    Locale('en'),
  ];

  static const _localizedValues = <String, Map<String, String>>{
    'fr': {},
    'en': {
      "ADMIN": "ADMIN",
    "Admin Panel": "Admin Panel",
    "Budget Pro": "Budget Pro",
      "Budget Pro - Application lancée avec succès!":
          "Budget Pro - App launched successfully!",
      "Budget Pro - Test": "Budget Pro - Test",
    "By BEONWEB (www.beonweb.cm)": "By BEONWEB (www.beonweb.cm)",
    "Anglais": "English",
      "Connexion": "Sign in",
      "Connexion requise": "Sign-in required",
      "Dashboard": "Dashboard",
      "EMAIL": "EMAIL",
      "Français": "French",
      "IA": "AI",
      "MMMM": "MMMM",
      "TOTAL": "TOTAL",
      "Transaction": "Transaction",
      "Transactions": "Transactions",
      "USD": "USD",
      "Version 1.0.0": "Version 1.0.0",
      "dd MMM": "dd MMM",
      "dd/MM": "dd/MM",
      "dd/MM/yyyy": "dd/MM/yyyy",
      "dd/MM/yyyy HH:mm": "dd/MM/yyyy HH:mm",
      "dd/MM/yyyy à HH:mm": "dd/MM/yyyy at HH:mm",
      "ex: Marie": "ex: Marie",
      "prenom.nom@email.com": "firstname.lastname@email.com",
      "user@example.com": "user@example.com",
      "yyyy-MM-dd": "yyyy-MM-dd",
      "✓ Firebase initialized successfully": "✓ Firebase initialized successfully",
    },
  };

  String translate(String key, {Map<String, String>? params}) {
    final languageCode = supportedLocales
            .map((l) => l.languageCode)
            .contains(locale.languageCode)
        ? locale.languageCode
        : 'fr';

    var value = _localizedValues[languageCode]?[key] ?? key;

    if (params != null) {
      params.forEach((paramKey, paramValue) {
        value = value.replaceAll('{$paramKey}', paramValue);
      });
    }

    if (languageCode == 'en' && value == key) {
      value = _autoTranslate(key);
    }

    return value;
  }

  static String translateGlobal(String key, {Map<String, String>? params}) {
    return AppLocalizations(_globalLocale).translate(key, params: params);
  }

  static void setGlobalLocale(Locale locale) {
    _globalLocale = locale;
  }

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations) ??
        AppLocalizations(const Locale('fr'));
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  static String _autoTranslate(String input) {
    final trimmed = input.trim();
    if (trimmed.isEmpty) return trimmed;

    final phrase = _phraseOverrides[trimmed];
    if (phrase != null) return phrase;

    var text = trimmed;

    _inlineReplacements.forEach((fr, en) {
      text = text.replaceAll(fr, en);
    });

    text = text.replaceAllMapped(RegExp(r"[A-Za-zÀ-ÿ']+"), (match) {
      final word = match.group(0)!;
      final lower = word.toLowerCase();
      final replacement = _wordReplacements[lower];
      if (replacement == null) return word;
      return _preserveCase(word, replacement);
    });

    return text;
  }

  static String _preserveCase(String original, String translated) {
    if (original.isEmpty) return translated;
    if (_isAllCaps(original)) {
      return translated.toUpperCase();
    }
    if (_isCapitalized(original)) {
      return translated.isEmpty
          ? translated
          : translated[0].toUpperCase() + translated.substring(1);
    }
    return translated;
  }

  static bool _isAllCaps(String value) => value == value.toUpperCase();
  static bool _isCapitalized(String value) =>
      value.length > 1 &&
      value[0] == value[0].toUpperCase() &&
      value.substring(1) == value.substring(1).toLowerCase();

  static const Map<String, String> _phraseOverrides = {
    "Accueil": "Home",
    "Accès Instantané": "Instant access",
    "Accès au tableau de bord administrateur": "Admin dashboard access",
    "Accès rapides": "Quick access",
    "Accéder au Dashboard": "Go to dashboard",
    "Achats, factures et sorties": "Purchases, bills and expenses",
    "Actions Rapides": "Quick actions",
    "Actions administrateur": "Admin actions",
    "Ajout enregistré avec succès !": "Entry saved successfully!",
    "Ajouter dépense": "Add expense",
    "Ajouter revenu": "Add income",
    "Ajouter une dépense": "Add an expense",
    "Ajouter un revenu": "Add an income",
    "Ajoutez une note...": "Add a note...",
    "Ajoutez votre premier compte": "Add your first account",
    "Alerte immédiate si une catégorie passe au rouge":
        "Immediate alert when a category turns red",
    "Alerte quand une poche dépasse ce pourcentage de son budget.":
        "Alert when a pocket exceeds this percentage of its budget.",
    "Alertes Budget": "Budget alerts",
    "Alertes Objectifs": "Goal alerts",
    "Alertes Automatiques": "Automatic alerts",
    "Analyse intelligente de vos finances":
        "Smart analysis of your finances",
    "Analyses": "Analytics",
    "Analyses & Rapports": "Analytics & Reports",
    "Analyses IA": "AI insights",
    "Annuler toutes les notifications": "Cancel all notifications",
    "Aucun compte": "No account",
    "Aucun compte disponible. Créez-en un d'abord.":
        "No account available. Create one first.",
    "Aucun mouvement pour ce compte.": "No activity for this account.",
    "Aucun utilisateur ajouté pour le moment.": "No user added yet.",
    "Aucun utilisateur trouvé": "No user found",
    "Aucune": "None",
    "Aucune catégorie disponible.": "No category available.",
    "Aucune catégorie trouvée.": "No category found.",
    "Aucune donnée": "No data",
    "Aucune dépense": "No expense",
    "Aucune notification pour le moment.": "No notification for now.",
    "Aucune notification programmée": "No scheduled notification",
    "Aucune transaction chargée à exporter":
        "No transaction loaded to export",
    "Aucune transaction exceptionnelle détectée pour le moment.":
        "No exceptional transaction detected for now.",
    "Aucune transaction pour cette période.": "No transaction for this period.",
    "Aucune transaction récente. Ajoutez-en une !":
        "No recent transaction. Add one!",
    "Aucune transaction trouvée.": "No transaction found.",
    "Avoirs financiers": "Financial assets",
    "Bilan de fin de journée": "End-of-day balance",
    "Bloquer l'utilisateur": "Block user",
    "Budget Déséquilibré": "Unbalanced budget",
    "Budget enregistré avec succès !": "Budget saved successfully!",
    "Budget mensuel total": "Total monthly budget",
    "Budget par catégorie": "Budget by category",
    "Budget réinitialisé avec succès !": "Budget reset successfully!",
    "CSV (données chargées) copié dans le presse-papiers":
        "CSV (loaded data) copied to clipboard",
    "Cadrez vos revenus et poches en un clin d'œil":
        "Frame your income and pockets at a glance",
    "Arrondi automatique": "Automatic rounding",
    "Bonus salaire": "Salary bonus",
    "Catégorie liée au template": "Category linked to the template",
    "Ce que je dois et ce qu’on me doit":
        "What I owe and what I'm owed",
    "Cet écran sera bientôt personnalisé pour vous.":
        "This screen will soon be personalized for you.",
    "Cette action est irréversible.": "This action is irreversible.",
    "Changement de langue à venir": "Language change coming soon",
    "Changer le mot de passe": "Change password",
    "Commencez à ajouter des transactions !":
        "Start adding transactions!",
    "Commençons par quelques informations de base":
        "Let's start with some basic info",
    "Compte ajouté avec succès !": "Account added successfully!",
    "Compte modifié avec succès !": "Account updated successfully!",
    "Compte supprimé avec succès !": "Account deleted successfully!",
    "Connectez-vous pour enregistrer des revenus ou dépenses.":
        "Sign in to record income or expenses.",
    "Compte & paramètres": "Account & settings",
    "Paramètres avancés": "Advanced settings",
    "Paramètres système": "System settings",
    "Conseils Financiers": "Financial tips",
    "Couleur (hex)": "Color (hex)",
    "Croissance des inscriptions": "Signup growth",
    "Créer l'Objectif": "Create goal",
    "Créer ma première catégorie": "Create my first category",
    "Célébration quand un objectif est atteint":
        "Celebration when a goal is reached",
    "Description (optionnel)": "Description (optional)",
    "Dette/Créance enregistrée": "Debt/Receivable recorded",
    "Dettes / créances": "Debts / Receivables",
    "Dettes du mois": "Debts of the month",
    "Discipline Budgétaire 🛡️": "Budget discipline 🛡️",
    "Données temporaires générées automatiquement. Session de 2 heures.":
        "Temporary data generated automatically. 2-hour session.",
    "Déconnexion": "Log out",
    "Définissez votre allocation (doit totaliser 100%)":
        "Set your allocation (must total 100%)",
    "Dépassement de Budget": "Budget overrun",
    "Dépenses du mois": "Expenses this month",
    "Dépenses fixes restantes": "Remaining fixed expenses",
    "Désactiver le compte": "Disable account",
    "Désactivés": "Disabled",
    "Détail par Catégorie": "Category detail",
    "Détails de l'utilisateur": "User details",
    "Efface toutes les données démo puis déconnecte.":
        "Erase all demo data then log out.",
    "Effectuer le Transfert": "Perform transfer",
    "Emprunts et crédits réglés.": "Loans and credits settled.",
    "Erreur de chargement: {error}": "Loading error: {error}",
    "Export PDF à implémenter (aperçu)":
        "PDF export to be implemented (preview)",
    "Exporter CSV": "Export CSV",
    "Exporter PDF (aperçu)": "Export PDF (preview)",
    "Gère tes finances comme un Pro": "Manage your finances like a pro",
    "Gérer budget": "Manage budget",
    "Gérer catégories": "Manage categories",
    "Gérer comptes": "Manage accounts",
    "Soldes et transferts gérés.": "Balances and transfers managed.",
    "Gérer dettes": "Manage debts",
    "Gérer le partage": "Manage sharing",
    "Gérer les Catégories": "Manage Categories",
    "Gérer les catégories": "Manage categories",
    "Gérer vos catégories": "Manage your categories",
    "Historique copié (CSV)": "History copied (CSV)",
    "Historique des mouvements": "Movement history",
    "Historique du compte": "Account history",
    "Historique et filtres détaillés": "History and detailed filters",
    "Historique Récent": "Recent history",
    "Icône (emoji ou texte)": "Icon (emoji or text)",
    "Icône de l'objectif": "Goal icon",
    "Icône du compte": "Account icon",
    "Informations personnelles": "Personal information",
    "Je dois": "I owe",
    "L'allocation budgétaire doit totaliser 100%":
        "Budget allocation must total 100%",
    "La corbeille est vide": "Trash is empty",
    "La transaction sera déplacée dans la corbeille.":
        "The transaction will be moved to trash.",
    "Langue": "Language",
    "Rappels": "Reminders",
    "Tests": "Tests",
    "Actions": "Actions",
    "Mes Comptes": "My accounts",
    "Mettre à la corbeille": "Move to trash",
    "Mode Démo": "Demo mode",
    "Modification verrouillée (48h dépassées)":
        "Edition locked (48h elapsed)",
    "Modifier la transaction": "Edit transaction",
    "Modifier le Compte": "Edit account",
    "Modifier le profil": "Edit profile",
    "Modifier les dates": "Change dates",
    "Module IA bientôt disponible": "AI module coming soon",
    "Mois en cours": "Current month",
    "Montant du paiement": "Payment amount",
    "Montant initial": "Initial amount",
    "Montant à allouer": "Amount to allocate",
    "Montant à transférer": "Amount to transfer",
    "Montants rapides": "Quick amounts",
    "Mot de passe": "Password",
    "Mot de passe actuel": "Current password",
    "Mot de passe modifié avec succès": "Password changed successfully",
    "Nom de l'objectif": "Goal name",
    "Nom du compte": "Account name",
    "Notification quand un objectif est atteint":
        "Notification when a goal is reached",
    "Notifications en attente": "Pending notifications",
    "Objectifs d'Épargne": "Saving goals",
    "Objectifs financés": "Funded goals",
    "On me doit": "I'm owed",
    "Paiement partiel": "Partial payment",
    "Par Défaut": "Default",
    "Pas assez de données": "Not enough data",
    "Performance mensuelle": "Monthly performance",
    "Personnalisé": "Custom",
    "Plan Budgétaire": "Budget plan",
    "Politique de confidentialité": "Privacy policy",
    "Prénom": "First name",
    "Projections financières": "Financial projections",
    "Réactiver le compte": "Reactivate account",
    "Rechercher (description/catégorie)":
        "Search (description/category)",
    "Rechercher un utilisateur...": "Search a user...",
    "Recevoir paiement": "Receive payment",
    "Recevoir un paiement": "Receive a payment",
    "Recevoir une notification lors d'un dépassement":
        "Receive a notification when exceeding",
    "Revenus par catégorie": "Income by category",
    "Rappel Quotidien": "Daily reminder",
    "Rappel programmé à {time}": "Reminder scheduled at {time}",
    "Redirection vers le dashboard...": "Redirecting to dashboard...",
    "Réinitialiser le Budget": "Reset budget",
    "Répartition par défaut appliquée": "Default split applied",
    "Réseau": "Network",
    "Rôle": "Role",
    "Sans titre": "Untitled",
    "Sans description": "No description",
    "Se connecter": "Sign in",
    "Se déconnecter": "Log out",
    "Sélectionner la devise": "Select currency",
    "Sélectionner un compte": "Select an account",
    "Solde Insuffisant ⚠️": "Insufficient balance ⚠️",
    "Suivi Dettes & Créances": "Debt & Receivable tracking",
    "Suivi des poches et limites": "Pocket tracking and limits",
    "Suivre objectifs": "Track goals",
    "Supprimer ?": "Delete?",
    "Supprimer définitivement ?": "Delete permanently?",
    "Supprimer le compte": "Delete account",
    "Synthèse par poche": "Summary by pocket",
    "Sécurité": "Security",
    "Tester Alerte Budget": "Test budget alert",
    "Tester Alerte Objectif": "Test goal alert",
    "Tester Rappel Quotidien": "Test daily reminder",
    "Testez toutes les fonctionnalités Premium sans créer de compte.":
        "Test all premium features without creating an account.",
    "Thermomètre Budgétaire": "Budget thermometer",
    "Thermomètre budgétaire": "Budget thermometer",
    "Thème": "Theme",
    "Top Dépenses": "Top expenses",
    "Total Net": "Net total",
    "Total de la Répartition": "Total allocation",
    "Total de tous vos comptes": "Total of all your accounts",
    "Total déboursé": "Total spent",
    "Total encaissé": "Total received",
    "Total inscrits": "Total registered",
    "Total prévu": "Planned total",
    "Tous les comptes": "All accounts",
    "Toutes": "All",
    "Toutes les catégories": "All categories",
    "Toutes les erreurs de compilation ont été corrigées":
        "All compile errors have been fixed",
    "Toutes les notifications annulées": "All notifications cancelled",
    "Toutes les transactions seront supprimées définitivement. Cette action est irréversible.":
        "All transactions will be permanently deleted. This action is irreversible.",
    "Transaction restaurée": "Transaction restored",
    "Transaction supprimée définitivement": "Transaction permanently deleted",
    "Transactions (Budget)": "Transactions (Budget)",
    "Transactions exceptionnelles surveillées":
        "Exceptional transactions monitored",
    "Transactions récentes": "Recent transactions",
    "Transferts": "Transfers",
    "Transférer de l'argent": "Transfer money",
    "Type de compte": "Account type",
    "Utilisateur": "User",
    "Utilisateurs": "Users",
    "Utilisateurs ayant accès": "Users with access",
    "Vers le compte": "To account",
    "Veuillez renseigner tous les champs": "Please fill all fields",
    "Veuillez sélectionner un compte.": "Please select an account.",
    "Veuillez sélectionner une catégorie.": "Please select a category.",
    "Veuillez vous connecter": "Please sign in",
    "Veuillez vous connecter pour gérer vos comptes":
        "Please sign in to manage your accounts",
    "Vider la corbeille": "Empty trash",
    "Vider la corbeille ?": "Empty the trash?",
    "Virement épargne": "Savings transfer",
    "Visualisez vos données et insights IA":
        "Visualize your data and AI insights",
    "Voir les détails": "See details",
    "Voir notifications en attente": "View pending notifications",
    "Voir tout": "See all",
    "Volume": "Volume",
    "Votre budget est configuré et prêt à l'emploi":
        "Your budget is set up and ready to use",
    "Votre devise par défaut": "Your default currency",
    "Votre prénom": "Your first name",
    "Voulez-vous vraiment vous déconnecter ?":
        "Do you really want to log out?",
    "Veuillez vous connecter.": "Please sign in.",
    "Vous devez enregistrer un revenu ou une entrée de fonds avant d'ajouter une dépense.":
        "You must record income before adding an expense.",
    "Vous devez être connecté pour ajouter une transaction.":
        "You must be logged in to add a transaction.",
    "Vue 360° des flux financiers": "360° view of financial flows",
    "Vue d'ensemble": "Overview",
    "À propos": "About",
    "Économisé": "Saved",
    "Épargne Directe": "Direct savings",
    "Épargne et projets d'avenir": "Savings and future projects",
    "Évolution du Cashflow": "Cash flow evolution",
    "Êtes-vous sûr de vouloir vous déconnecter ?":
        "Are you sure you want to log out?",
    "ℹ️ Alertes budget désactivées": "ℹ️ Budget alerts disabled",
    "ℹ️ Alertes objectifs désactivées": "ℹ️ Goal alerts disabled",
    "ℹ️ Rappels quotidiens désactivés": "ℹ️ Daily reminders disabled",
    "⚠️ Exécutez \"flutterfire configure\" pour configurer Firebase correctement":
        "⚠️ Run \"flutterfire configure\" to set up Firebase correctly",
    "⚠️ L'application continuera avec MockDataService":
        "⚠️ The app will continue with MockDataService",
    "⚠️ NotificationService non initialisé":
        "⚠️ NotificationService not initialized",
    "✅ Canaux de notification créés": "✅ Notification channels created",
    "✅ L'application fonctionne!": "✅ The app is working!",
    "✅ NotificationService initialisé avec succès":
        "✅ NotificationService initialized successfully",
    "✅ Permission Android accordée": "✅ Android permission granted",
    "✅ Permission iOS accordée": "✅ iOS permission granted",
    "✓ Le solde du compte a été mis à jour automatiquement":
        "✓ Account balance updated automatically",
    "✓ Les deux comptes ont été mis à jour atomiquement":
        "✓ Both accounts were updated atomically",
    "✓ Profil utilisateur créé": "✓ User profile created",
    "✓ Transfert effectué": "✓ Transfer completed",
    "🎉 Félicitations !": "🎉 Congratulations!",
    "🎉 Objectif Atteint !": "🎉 Goal reached!",
    "👋 Bienvenue !": "👋 Welcome!",
    "💰 Vos Comptes": "💰 Your accounts",
    "📅 Rappel mensuel programmé": "📅 Monthly reminder scheduled",
    "📊 Plan Budgétaire": "📊 Budget plan",
    "🚫 Rappel mensuel annulé": "🚫 Monthly reminder cancelled",
    "🚫 Rappel quotidien annulé": "🚫 Daily reminder cancelled",
    "🚫 Toutes les notifications annulées": "🚫 All notifications cancelled",
  };

  static const Map<String, String> _inlineReplacements = {
    "d\\'": "d'",
    "l\\'": "l'",
  };

  static const Map<String, String> _wordReplacements = {
    'admin': 'admin',
    'accueil': 'home',
    'accès': 'access',
    'rapides': 'quick',
    'achats': 'purchases',
    'factures': 'bills',
    'sorties': 'outflows',
    'actions': 'actions',
    'administrateur': 'admin',
    'ajout': 'add',
    'ajouter': 'add',
    // duplicates consolidated above
    'recevoir': 'receive',
    'dépense': 'expense',
    'dépenses': 'expenses',
    'revenu': 'income',
    'revenus': 'income',
    'compte': 'account',
    'comptes': 'accounts',
    'budget': 'budget',
    'budgétaire': 'budget',
    'répartition': 'allocation',
    'catégorie': 'category',
    'catégories': 'categories',
    'poche': 'pocket',
    'poches': 'pockets',
    'alerte': 'alert',
    'alertes': 'alerts',
    'notification': 'notification',
    'notifications': 'notifications',
    'automatique': 'automatic',
    'automatiques': 'automatic',
    'objectif': 'goal',
    'objectifs': 'goals',
    'épargne': 'savings',
    'démo': 'demo',
    'transaction': 'transaction',
    'transactions': 'transactions',
    'argent': 'money',
    "l'argent": 'money',
    "d'argent": 'money',
    'avenir': 'future',
    "l'avenir": 'the future',
    'solde': 'balance',
    'restant': 'remaining',
    'historique': 'history',
    'détail': 'detail',
    'détails': 'details',
    'nom': 'name',
    'prénom': 'first name',
    'mot': 'word',
    'passe': 'password',
    'profil': 'profile',
    'email': 'email',
    'adresse': 'address',
    'erreur': 'error',
    'erreurs': 'errors',
    'montant': 'amount',
    'cible': 'target',
    'initial': 'initial',
    'provenance': 'source',
    'source': 'source',
    'destinataire': 'target',
    'compte source': 'source account',
    'compte destinataire': 'destination account',
    'transfert': 'transfer',
    'transférer': 'transfer',
    'année': 'year',
    'mois': 'month',
    'jour': 'day',
    'sélectionner': 'select',
    'créer': 'create',
    'modifier': 'edit',
    'supprimer': 'delete',
    'enregistrer': 'save',
    'confirmer': 'confirm',
    'réinitialiser': 'reset',
    // handled earlier
    'dépassement': 'overrun',
    'toutes': 'all',
    'tous': 'all',
    'aucun': 'no',
    'aucune': 'no',
    'aucunes': 'no',
    'vide': 'empty',
    'éléments': 'items',
    'supprimés': 'deleted',
    'restaurée': 'restored',
    'données': 'data',
    'automatiquement': 'automatically',
    'session': 'session',
    'heure': 'hour',
    'minutes': 'minutes',
    'mensuel': 'monthly',
    'mensuels': 'monthly',
    'quotidien': 'daily',
    'quotidiens': 'daily',
    'rappel': 'reminder',
    'rappels': 'reminders',
    'période': 'period',
    'filtre': 'filter',
    'filtres': 'filters',
    'programmé': 'scheduled',
    'programmée': 'scheduled',
    'programmées': 'scheduled',
    'gérer': 'manage',
    'valider': 'validate',
    'appliquer': 'apply',
    'fermer': 'close',
    'annuler': 'cancel',
    'continuer': 'continue',
    'projet': 'project',
    'projets': 'projects',
    'prêt': 'loan',
    'prêté': 'lent',
    'emprunté': 'borrowed',
    'remboursé': 'repaid',
    'remboursement': 'repayment',
    'créance': 'receivable',
    'dette': 'debt',
    'dettes': 'debts',
    'payer': 'pay',
    'paiement': 'payment',
    'partiel': 'partial',
    'montants': 'amounts',
    'récent': 'recent',
    'restaurer': 'restore',
    'vider': 'empty',
    'corbeille': 'trash',
    'définitivement': 'permanently',
    'charger': 'load',
    'chargée': 'loaded',
    'exporter': 'export',
    'importer': 'import',
    'partage': 'sharing',
    'invitation': 'invitation',
    'envoyer': 'send',
    'configurer': 'configure',
    'suivi': 'tracking',
    'analyse': 'analysis',
    'rapports': 'reports',
    'visualisez': 'visualize',
    'flux': 'flows',
    'financiers': 'financial',
    'inscrit': 'registered',
    'inscrits': 'registered',
    'utilisateur': 'user',
    'utilisateurs': 'users',
    'bloqués': 'blocked',
    'inactifs': 'inactive',
    'actifs': 'active',
    'volume': 'volume',
    'role': 'role',
    'rôle': 'role',
    'statut': 'status',
    'devise': 'currency',
    'euro': 'euro',
    'eur': 'eur',
    'usd': 'usd',
    'xaf': 'xaf',
    'valeur': 'value',
    'date': 'date',
    'heure du rappel': 'reminder time',
    'nom complet': 'full name',
    'système': 'system',
    'paramètres': 'settings',
    'test': 'test',
    'tester': 'test',
    'support': 'support',
    'aide': 'help',
    'sécurité': 'security',
    'préférences': 'preferences',
    'langue': 'language',
    'centre': 'center',
    'propos': 'about',
    'politique': 'policy',
    'confidentialité': 'privacy',
    'aperçu': 'preview',
    'prochaine': 'next',
    'périodes': 'periods',
    'sélectionnée': 'selected',
    'trimestre': 'quarter',
    'custom': 'custom',
    'personnalisé': 'custom',
    'valide': 'valid',
    'séparés': 'separated',
    'virgules': 'commas',
    'ajoutez': 'add',
    'note': 'note',
    'notes': 'notes',
    'tags': 'tags',
  };
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) =>
      ['fr', 'en'].contains(locale.languageCode);

  @override
  Future<AppLocalizations> load(Locale locale) =>
      SynchronousFuture(AppLocalizations(locale));

  @override
  bool shouldReload(covariant LocalizationsDelegate<AppLocalizations> old) =>
      false;
}

class LocaleProvider extends ChangeNotifier {
  Locale _locale = const Locale('fr');
  bool _initialized = false;

  Locale get locale => _locale;
  bool get initialized => _initialized;

  Future<void> loadLocale() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('preferred_locale');
    if (saved != null && AppLocalizations.supportedLocales
        .map((e) => e.languageCode)
        .contains(saved)) {
      _locale = Locale(saved);
    } else {
      final systemLocale =
          WidgetsBinding.instance.platformDispatcher.locale.languageCode;
      _locale = AppLocalizations.supportedLocales
              .any((l) => l.languageCode == systemLocale)
          ? Locale(systemLocale)
          : const Locale('fr');
    }
    AppLocalizations.setGlobalLocale(_locale);
    _initialized = true;
    notifyListeners();
  }

  Future<void> setLocale(Locale locale) async {
    if (!isSupported(locale)) return;
    _locale = Locale(locale.languageCode);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('preferred_locale', _locale.languageCode);
    AppLocalizations.setGlobalLocale(_locale);
    notifyListeners();
  }

  bool isSupported(Locale locale) => AppLocalizations.supportedLocales
      .map((e) => e.languageCode)
      .contains(locale.languageCode);
}

extension LocalizationContextExt on BuildContext {
  AppLocalizations get loc => AppLocalizations.of(this);
  String tr(String key, {Map<String, String>? params}) =>
      loc.translate(key, params: params);
}

extension LocalizationStringExt on String {
  String tr(BuildContext context, {Map<String, String>? params}) =>
      AppLocalizations.of(context).translate(this, params: params);

  String trGlobal({Map<String, String>? params}) =>
      AppLocalizations.translateGlobal(this, params: params);
}

String t(String key, {Map<String, String>? params}) =>
    AppLocalizations.translateGlobal(key, params: params);

/// Drop-in replacement for Text that goes through the localization layer.
class TrText extends StatelessWidget {
  const TrText(
    this.data, {
    super.key,
    this.style,
    this.strutStyle,
    this.textAlign,
    this.textDirection,
    this.locale,
    this.softWrap,
    this.overflow,
    this.textScaler,
    this.maxLines,
    this.semanticsLabel,
    this.textWidthBasis,
    this.textHeightBehavior,
    this.selectionColor,
  });

  final String data;
  final TextStyle? style;
  final StrutStyle? strutStyle;
  final TextAlign? textAlign;
  final TextDirection? textDirection;
  final Locale? locale;
  final bool? softWrap;
  final TextOverflow? overflow;
  final TextScaler? textScaler;
  final int? maxLines;
  final String? semanticsLabel;
  final TextWidthBasis? textWidthBasis;
  final TextHeightBehavior? textHeightBehavior;
  final Color? selectionColor;

  @override
  Widget build(BuildContext context) {
    final translated = AppLocalizations.of(context).translate(data);
    return Text(
      translated,
      key: key,
      style: style,
      strutStyle: strutStyle,
      textAlign: textAlign,
      textDirection: textDirection,
      locale: locale,
      softWrap: softWrap,
      overflow: overflow,
      textScaler: textScaler,
      maxLines: maxLines,
      semanticsLabel: semanticsLabel,
      textWidthBasis: textWidthBasis,
      textHeightBehavior: textHeightBehavior,
      selectionColor: selectionColor,
    );
  }
}

/// Selectable text wrapper with translation support.
class SelectableTrText extends StatelessWidget {
  const SelectableTrText(
    this.data, {
    super.key,
    this.style,
    this.textAlign,
    this.textDirection,
    this.showCursor = false,
    this.maxLines,
    this.cursorWidth = 2.0,
    this.cursorRadius,
    this.cursorColor,
  });

  final String data;
  final TextStyle? style;
  final TextAlign? textAlign;
  final TextDirection? textDirection;
  final bool showCursor;
  final int? maxLines;
  final double cursorWidth;
  final Radius? cursorRadius;
  final Color? cursorColor;

  @override
  Widget build(BuildContext context) {
    final translated = AppLocalizations.of(context).translate(data);
    return SelectableText(
      translated,
      style: style,
      textAlign: textAlign,
      textDirection: textDirection,
      showCursor: showCursor,
      maxLines: maxLines,
      cursorWidth: cursorWidth,
      cursorRadius: cursorRadius,
      cursorColor: cursorColor,
    );
  }
}

/// Rich text wrapper that translates the root span text recursively.
class RichTrText extends StatelessWidget {
  const RichTrText({super.key, required this.text});

  final TextSpan text;

  TextSpan _translateSpan(BuildContext context, TextSpan span) {
    final loc = AppLocalizations.of(context);
    return TextSpan(
      text: span.text != null ? loc.translate(span.text!) : null,
      style: span.style,
      children: span.children
          ?.map((child) => child is TextSpan ? _translateSpan(context, child) : child)
          .toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Text.rich(_translateSpan(context, text));
  }
}
