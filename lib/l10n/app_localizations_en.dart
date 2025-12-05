// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get app_title => 'Budget Pro';

  @override
  String get onboarding_welcome_title => '👋 Welcome!';

  @override
  String get onboarding_welcome_subtitle =>
      'A few details to personalize your experience';

  @override
  String get your_name_label => 'Your name';

  @override
  String get name_hint => 'e.g., John Doe';

  @override
  String get enter_name_error => 'Please enter your name';

  @override
  String get default_currency_label => 'Your default currency';

  @override
  String get monthly_income_label => 'Average monthly income (optional)';

  @override
  String get invalid_amount_error => 'Invalid amount';

  @override
  String get required_field_error => 'Field required';

  @override
  String get next => 'Next';

  @override
  String get previous => 'Previous';

  @override
  String get finish => 'Finish';

  @override
  String get quick_setup_title => '⚡ Quick Setup';

  @override
  String get quick_setup_subtitle =>
      'Create your first account. You can complete the rest later.';

  @override
  String get first_account_header => '💳 Your first account';

  @override
  String get account_name_label => 'Account name';

  @override
  String get account_name_hint => 'e.g., Checking';

  @override
  String get account_balance_label => 'Current balance';

  @override
  String get icon_label => 'Icon';

  @override
  String get budget_header => '🎯 Monthly budget';

  @override
  String get define_budget => 'Define a budget';

  @override
  String get control_spending => 'Control your monthly spending';

  @override
  String get budget_amount_label => 'Budget amount';

  @override
  String get goal_header => '🏆 First goal';

  @override
  String get create_savings_goal => 'Create a savings goal';

  @override
  String get set_target => 'Set a target to reach';

  @override
  String get goal_name_label => 'Goal name';

  @override
  String get goal_name_hint => 'e.g., Vacation, Car';

  @override
  String get goal_target_label => 'Target amount';

  @override
  String get note_add_more =>
      'You can add more accounts, categories and goals from the dashboard.';

  @override
  String get required_chip => 'Required';

  @override
  String get optional_chip => 'Optional';

  @override
  String get congrats_title => '🎉 Congratulations!';

  @override
  String get congrats_subtitle => 'Your budget is configured and ready to use';

  @override
  String get go_to_dashboard => 'Go to Dashboard';

  @override
  String get select_account_error => 'Please select an account.';

  @override
  String get select_category_error => 'Please select a category.';

  @override
  String get must_be_logged_in_error =>
      'You must be logged in to add a transaction.';

  @override
  String get budget_discipline_title => 'Budget Discipline 🛡️';

  @override
  String get budget_discipline_body =>
      'You must record an income before adding an expense.\n\nYour current balance is insufficient.';

  @override
  String get understood => 'Understood';

  @override
  String get insufficient_balance_title => 'Insufficient Balance ⚠️';

  @override
  String insufficient_balance_body(Object balance, Object expense) {
    return 'This expense of $expense exceeds the available balance of $balance on this account.\n\nPlease choose another account or record an income.';
  }

  @override
  String get ok => 'OK';

  @override
  String get login_subtitle => 'Take control of your finances.';

  @override
  String get login_subsubtitle => 'Easily. Quickly. Automatically.';

  @override
  String get login_title => 'Login';

  @override
  String get login_secure => 'Secure & encrypted';

  @override
  String get login_failed => 'Login failed. Check your credentials.';

  @override
  String get email_label => 'Email';

  @override
  String get email_required => 'Email required';

  @override
  String get email_invalid => 'Invalid email';

  @override
  String get password_label => 'Password';

  @override
  String get password_required => 'Password required';

  @override
  String get password_too_short => 'At least 6 characters';

  @override
  String get forgot_password => 'Forgot password?';

  @override
  String get dashboard_title => 'Dashboard';

  @override
  String get recent_history => 'Recent history';

  @override
  String get quick_actions => 'Quick actions';

  @override
  String get total_balance => 'Total balance';

  @override
  String get debts_iou => 'Debts / Credits';

  @override
  String get goals => 'Goals';

  @override
  String get notifications => 'Notifications';

  @override
  String get settings => 'Settings';

  @override
  String get notifications_coming => 'Notifications coming soon';

  @override
  String transactions_count(num count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count transactions',
      one: '1 transaction',
      zero: 'No transactions',
    );
    return '$_temp0';
  }

  @override
  String goals_count(num count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count goals',
      one: '1 goal',
      zero: 'No goals',
    );
    return '$_temp0';
  }

  @override
  String debts_count(num count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count debts',
      one: '1 debt',
      zero: 'No debts',
    );
    return '$_temp0';
  }
}
