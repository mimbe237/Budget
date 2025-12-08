// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for French (`fr`).
class AppLocalizationsFr extends AppLocalizations {
  AppLocalizationsFr([String locale = 'fr']) : super(locale);

  @override
  String get app_title => 'Budget Pro';

  @override
  String get onboarding_welcome_title => '👋 Bienvenue !';

  @override
  String get onboarding_welcome_subtitle =>
      'Quelques informations pour personnaliser votre expérience';

  @override
  String get your_name_label => 'Votre nom';

  @override
  String get name_hint => 'Ex: Jean Dupont';

  @override
  String get enter_name_error => 'Veuillez entrer votre nom';

  @override
  String get default_currency_label => 'Votre devise par défaut';

  @override
  String get monthly_income_label => 'Revenu mensuel moyen (optionnel)';

  @override
  String get invalid_amount_error => 'Montant invalide';

  @override
  String get required_field_error => 'Champ requis';

  @override
  String get next => 'Suivant';

  @override
  String get previous => 'Précédent';

  @override
  String get finish => 'Terminer';

  @override
  String get quick_setup_title => '⚡ Configuration Rapide';

  @override
  String get quick_setup_subtitle =>
      'Créez votre premier compte. Le reste peut être complété plus tard.';

  @override
  String get first_account_header => '💳 Votre premier compte';

  @override
  String get account_name_label => 'Nom du compte';

  @override
  String get account_name_hint => 'Ex: Compte Courant';

  @override
  String get account_balance_label => 'Solde actuel';

  @override
  String get icon_label => 'Icône';

  @override
  String get budget_header => '🎯 Budget mensuel';

  @override
  String get define_budget => 'Définir un budget';

  @override
  String get control_spending => 'Contrôlez vos dépenses mensuelles';

  @override
  String get budget_amount_label => 'Montant du budget';

  @override
  String get goal_header => '🏆 Premier objectif';

  @override
  String get create_savings_goal => 'Créer un objectif d\'épargne';

  @override
  String get set_target => 'Définissez une cible à atteindre';

  @override
  String get goal_name_label => 'Nom de l\'objectif';

  @override
  String get goal_name_hint => 'Ex: Vacances, Voiture';

  @override
  String get goal_target_label => 'Montant cible';

  @override
  String get note_add_more =>
      'Vous pourrez ajouter plus de comptes, catégories et objectifs depuis le tableau de bord.';

  @override
  String get required_chip => 'Requis';

  @override
  String get optional_chip => 'Optionnel';

  @override
  String get congrats_title => '🎉 Félicitations !';

  @override
  String get congrats_subtitle =>
      'Votre budget est configuré et prêt à l\'emploi';

  @override
  String get go_to_dashboard => 'Accéder au Dashboard';

  @override
  String get select_account_error => 'Veuillez sélectionner un compte.';

  @override
  String get select_category_error => 'Veuillez sélectionner une catégorie.';

  @override
  String get must_be_logged_in_error =>
      'Vous devez être connecté pour ajouter une transaction.';

  @override
  String get budget_discipline_title => 'Discipline Budgétaire 🛡️';

  @override
  String get budget_discipline_body =>
      'Vous devez enregistrer un revenu avant d\'ajouter une dépense.\n\nVotre solde actuel est insuffisant.';

  @override
  String get understood => 'Compris';

  @override
  String get insufficient_balance_title => 'Solde Insuffisant ⚠️';

  @override
  String insufficient_balance_body(Object balance, Object expense) {
    return 'Cette dépense de $expense dépasse le solde disponible de $balance sur ce compte.\n\nVeuillez choisir un autre compte ou enregistrer un revenu.';
  }

  @override
  String get ok => 'OK';

  @override
  String get login_subtitle => 'Prenez le contrôle de vos finances.';

  @override
  String get login_subsubtitle => 'Facilement. Rapidement. Automatiquement.';

  @override
  String get login_title => 'Connexion';

  @override
  String get login_secure => 'Sécurisée & chiffrée';

  @override
  String get login_failed => 'Connexion impossible. Vérifiez vos identifiants.';

  @override
  String get email_label => 'Email';

  @override
  String get email_required => 'Email requis';

  @override
  String get email_invalid => 'Email invalide';

  @override
  String get password_label => 'Mot de passe';

  @override
  String get password_required => 'Mot de passe requis';

  @override
  String get password_too_short => 'Au moins 6 caractères';

  @override
  String get forgot_password => 'Mot de passe oublié ?';

  @override
  String get dashboard_title => 'Tableau de bord';

  @override
  String get recent_history => 'Historique récent';

  @override
  String get quick_actions => 'Actions rapides';

  @override
  String get total_balance => 'Solde total';

  @override
  String get debts_iou => 'Dettes / Créances';

  @override
  String get goals => 'Objectifs';

  @override
  String get notifications => 'Notifications';

  @override
  String get settings => 'Paramètres';

  @override
  String get notifications_coming => 'Notifications à venir';

  @override
  String transactions_count(num count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count transactions',
      one: '1 transaction',
      zero: 'Aucune transaction',
    );
    return '$_temp0';
  }

  @override
  String goals_count(num count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count objectifs',
      one: '1 objectif',
      zero: 'Aucun objectif',
    );
    return '$_temp0';
  }

  @override
  String debts_count(num count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count dettes',
      one: '1 dette',
      zero: 'Aucune dette',
    );
    return '$_temp0';
  }

  @override
  String get login_success => 'Connexion réussie!';

  @override
  String get login_error => 'Erreur de connexion';

  @override
  String get user_not_found => 'Aucun utilisateur trouvé avec cet email';

  @override
  String get wrong_password => 'Mot de passe incorrect';

  @override
  String get invalid_email_format => 'Format d\'email invalide';

  @override
  String get user_disabled => 'Ce compte a été désactivé';

  @override
  String get too_many_requests =>
      'Trop de tentatives. Veuillez réessayer plus tard';

  @override
  String get error => 'Erreur';

  @override
  String get reset_password => 'Réinitialiser le mot de passe';

  @override
  String get reset_password_desc =>
      'Entrez votre email pour recevoir un lien de réinitialisation';

  @override
  String get cancel => 'Annuler';

  @override
  String get send => 'Envoyer';

  @override
  String get reset_email_sent => 'Email de réinitialisation envoyé';

  @override
  String get google_login_soon => 'Connexion Google bientôt disponible';

  @override
  String get facebook_login_soon => 'Connexion Facebook bientôt disponible';

  @override
  String get no_account => 'Pas encore de compte ?';

  @override
  String get create_account => 'Créer un compte';

  @override
  String get account_created =>
      'Compte créé avec succès! Veuillez vous reconnecter';

  @override
  String get email_hint => 'user@example.com';

  @override
  String get phone_hint => '6 12 34 56 78';

  @override
  String get country => 'Pays';

  @override
  String get confirm_password => 'Confirmer le mot de passe';

  @override
  String get create_my_account => 'Créer mon compte';

  @override
  String get passwords_no_match => 'Les mots de passe ne correspondent pas';

  @override
  String get password_too_weak =>
      'Mot de passe trop faible (minimum 8 caractères)';

  @override
  String get email_already_used => 'Cet email est déjà utilisé';

  @override
  String get min_8_chars => 'Minimum 8 caractères';

  @override
  String get confirmation_required => 'Confirmation requise';

  @override
  String get whatsapp_optional => 'WhatsApp  (optionnel)';

  @override
  String get secure_connection => 'Connexion sécurisée';

  @override
  String get secure_encrypted => 'Sécurisé & chiffré';

  @override
  String get developed_by => 'Développé par';

  @override
  String get remember_me => 'Se souvenir de moi';

  @override
  String get or_continue_with => 'Ou continuer avec';

  @override
  String get google => 'Google';

  @override
  String get facebook => 'Facebook';

  @override
  String get already_account => 'Déjà un compte ?';

  @override
  String get login => 'Se connecter';

  @override
  String get privacy => 'Confidentialité';

  @override
  String get terms => 'Conditions';

  @override
  String get support => 'Support';

  @override
  String get documentation => 'Documentation';

  @override
  String get whatsapp_support => 'WhatsApp Support';

  @override
  String get welcome_intro =>
      'Pilotez vos comptes, budgets et objectifs en toute simplicité.';

  @override
  String get choose_language => 'Choisissez votre langue';

  @override
  String get pick_language => 'Pick your language';

  @override
  String get language_applied_everywhere =>
      'Cette langue sera appliquée partout (connexion, tableau de bord, notifications).';

  @override
  String get change_later_settings =>
      'Vous pouvez le changer plus tard dans les paramètres.';

  @override
  String get secure_login_encrypted =>
      'Connexion sécurisée, données chiffrées.';

  @override
  String get french_label => 'Français';

  @override
  String get french_code => 'Français (FR)';

  @override
  String get english_label => 'English';

  @override
  String get english_code => 'English (EN)';

  @override
  String get income => 'Revenus';

  @override
  String get expense => 'Dépenses';

  @override
  String get transfer => 'Transfert';

  @override
  String get incomplete => 'Incomplet';

  @override
  String get history => 'Historique';

  @override
  String get overspend => 'Dépassement';

  @override
  String get balanced => 'Équilibré';

  @override
  String get welcome_title => 'Bienvenue';

  @override
  String get welcome_login_msg =>
      'Connectez-vous pour personnaliser votre page d’accueil et suivre vos budgets.';

  @override
  String get dashboard_error_title => 'Accueil';

  @override
  String get dashboard_error_body =>
      'Impossible de charger vos données pour le moment.';

  @override
  String get dashboard_empty_title => 'Commencez par créer un compte';

  @override
  String get dashboard_empty_body =>
      'Ajoutez un compte et un premier budget pour activer votre tableau de bord.';

  @override
  String coaching_ahead(String delta) {
    return 'Vous dépensez $delta% plus lentement que prévu.';
  }

  @override
  String coaching_behind(String delta) {
    return 'Vous dépensez $delta% plus vite que prévu.';
  }
}
