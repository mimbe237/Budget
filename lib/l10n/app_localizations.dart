import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_fr.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('fr')
  ];

  /// No description provided for @app_title.
  ///
  /// In en, this message translates to:
  /// **'Budget Pro'**
  String get app_title;

  /// No description provided for @onboarding_welcome_title.
  ///
  /// In en, this message translates to:
  /// **'👋 Welcome!'**
  String get onboarding_welcome_title;

  /// No description provided for @onboarding_welcome_subtitle.
  ///
  /// In en, this message translates to:
  /// **'A few details to personalize your experience'**
  String get onboarding_welcome_subtitle;

  /// No description provided for @your_name_label.
  ///
  /// In en, this message translates to:
  /// **'Your name'**
  String get your_name_label;

  /// No description provided for @name_hint.
  ///
  /// In en, this message translates to:
  /// **'e.g., John Doe'**
  String get name_hint;

  /// No description provided for @enter_name_error.
  ///
  /// In en, this message translates to:
  /// **'Please enter your name'**
  String get enter_name_error;

  /// No description provided for @default_currency_label.
  ///
  /// In en, this message translates to:
  /// **'Your default currency'**
  String get default_currency_label;

  /// No description provided for @monthly_income_label.
  ///
  /// In en, this message translates to:
  /// **'Average monthly income (optional)'**
  String get monthly_income_label;

  /// No description provided for @invalid_amount_error.
  ///
  /// In en, this message translates to:
  /// **'Invalid amount'**
  String get invalid_amount_error;

  /// No description provided for @required_field_error.
  ///
  /// In en, this message translates to:
  /// **'Field required'**
  String get required_field_error;

  /// No description provided for @next.
  ///
  /// In en, this message translates to:
  /// **'Next'**
  String get next;

  /// No description provided for @previous.
  ///
  /// In en, this message translates to:
  /// **'Previous'**
  String get previous;

  /// No description provided for @finish.
  ///
  /// In en, this message translates to:
  /// **'Finish'**
  String get finish;

  /// No description provided for @quick_setup_title.
  ///
  /// In en, this message translates to:
  /// **'⚡ Quick Setup'**
  String get quick_setup_title;

  /// No description provided for @quick_setup_subtitle.
  ///
  /// In en, this message translates to:
  /// **'Create your first account. You can complete the rest later.'**
  String get quick_setup_subtitle;

  /// No description provided for @first_account_header.
  ///
  /// In en, this message translates to:
  /// **'💳 Your first account'**
  String get first_account_header;

  /// No description provided for @account_name_label.
  ///
  /// In en, this message translates to:
  /// **'Account name'**
  String get account_name_label;

  /// No description provided for @account_name_hint.
  ///
  /// In en, this message translates to:
  /// **'e.g., Checking'**
  String get account_name_hint;

  /// No description provided for @account_balance_label.
  ///
  /// In en, this message translates to:
  /// **'Current balance'**
  String get account_balance_label;

  /// No description provided for @icon_label.
  ///
  /// In en, this message translates to:
  /// **'Icon'**
  String get icon_label;

  /// No description provided for @budget_header.
  ///
  /// In en, this message translates to:
  /// **'🎯 Monthly budget'**
  String get budget_header;

  /// No description provided for @define_budget.
  ///
  /// In en, this message translates to:
  /// **'Define a budget'**
  String get define_budget;

  /// No description provided for @control_spending.
  ///
  /// In en, this message translates to:
  /// **'Control your monthly spending'**
  String get control_spending;

  /// No description provided for @budget_amount_label.
  ///
  /// In en, this message translates to:
  /// **'Budget amount'**
  String get budget_amount_label;

  /// No description provided for @goal_header.
  ///
  /// In en, this message translates to:
  /// **'🏆 First goal'**
  String get goal_header;

  /// No description provided for @create_savings_goal.
  ///
  /// In en, this message translates to:
  /// **'Create a savings goal'**
  String get create_savings_goal;

  /// No description provided for @set_target.
  ///
  /// In en, this message translates to:
  /// **'Set a target to reach'**
  String get set_target;

  /// No description provided for @goal_name_label.
  ///
  /// In en, this message translates to:
  /// **'Goal name'**
  String get goal_name_label;

  /// No description provided for @goal_name_hint.
  ///
  /// In en, this message translates to:
  /// **'e.g., Vacation, Car'**
  String get goal_name_hint;

  /// No description provided for @goal_target_label.
  ///
  /// In en, this message translates to:
  /// **'Target amount'**
  String get goal_target_label;

  /// No description provided for @note_add_more.
  ///
  /// In en, this message translates to:
  /// **'You can add more accounts, categories and goals from the dashboard.'**
  String get note_add_more;

  /// No description provided for @required_chip.
  ///
  /// In en, this message translates to:
  /// **'Required'**
  String get required_chip;

  /// No description provided for @optional_chip.
  ///
  /// In en, this message translates to:
  /// **'Optional'**
  String get optional_chip;

  /// No description provided for @congrats_title.
  ///
  /// In en, this message translates to:
  /// **'🎉 Congratulations!'**
  String get congrats_title;

  /// No description provided for @congrats_subtitle.
  ///
  /// In en, this message translates to:
  /// **'Your budget is configured and ready to use'**
  String get congrats_subtitle;

  /// No description provided for @go_to_dashboard.
  ///
  /// In en, this message translates to:
  /// **'Go to Dashboard'**
  String get go_to_dashboard;

  /// No description provided for @select_account_error.
  ///
  /// In en, this message translates to:
  /// **'Please select an account.'**
  String get select_account_error;

  /// No description provided for @select_category_error.
  ///
  /// In en, this message translates to:
  /// **'Please select a category.'**
  String get select_category_error;

  /// No description provided for @must_be_logged_in_error.
  ///
  /// In en, this message translates to:
  /// **'You must be logged in to add a transaction.'**
  String get must_be_logged_in_error;

  /// No description provided for @budget_discipline_title.
  ///
  /// In en, this message translates to:
  /// **'Budget Discipline 🛡️'**
  String get budget_discipline_title;

  /// No description provided for @budget_discipline_body.
  ///
  /// In en, this message translates to:
  /// **'You must record an income before adding an expense.\n\nYour current balance is insufficient.'**
  String get budget_discipline_body;

  /// No description provided for @understood.
  ///
  /// In en, this message translates to:
  /// **'Understood'**
  String get understood;

  /// No description provided for @insufficient_balance_title.
  ///
  /// In en, this message translates to:
  /// **'Insufficient Balance ⚠️'**
  String get insufficient_balance_title;

  /// No description provided for @insufficient_balance_body.
  ///
  /// In en, this message translates to:
  /// **'This expense of {expense} exceeds the available balance of {balance} on this account.\n\nPlease choose another account or record an income.'**
  String insufficient_balance_body(Object balance, Object expense);

  /// No description provided for @ok.
  ///
  /// In en, this message translates to:
  /// **'OK'**
  String get ok;

  /// No description provided for @login_subtitle.
  ///
  /// In en, this message translates to:
  /// **'Take control of your finances.'**
  String get login_subtitle;

  /// No description provided for @login_subsubtitle.
  ///
  /// In en, this message translates to:
  /// **'Easily. Quickly. Automatically.'**
  String get login_subsubtitle;

  /// No description provided for @login_title.
  ///
  /// In en, this message translates to:
  /// **'Login'**
  String get login_title;

  /// No description provided for @login_secure.
  ///
  /// In en, this message translates to:
  /// **'Secure & encrypted'**
  String get login_secure;

  /// No description provided for @login_failed.
  ///
  /// In en, this message translates to:
  /// **'Login failed. Check your credentials.'**
  String get login_failed;

  /// No description provided for @email_label.
  ///
  /// In en, this message translates to:
  /// **'Email'**
  String get email_label;

  /// No description provided for @email_required.
  ///
  /// In en, this message translates to:
  /// **'Email required'**
  String get email_required;

  /// No description provided for @email_invalid.
  ///
  /// In en, this message translates to:
  /// **'Invalid email'**
  String get email_invalid;

  /// No description provided for @password_label.
  ///
  /// In en, this message translates to:
  /// **'Password'**
  String get password_label;

  /// No description provided for @password_required.
  ///
  /// In en, this message translates to:
  /// **'Password required'**
  String get password_required;

  /// No description provided for @password_too_short.
  ///
  /// In en, this message translates to:
  /// **'At least 6 characters'**
  String get password_too_short;

  /// No description provided for @forgot_password.
  ///
  /// In en, this message translates to:
  /// **'Forgot password?'**
  String get forgot_password;

  /// No description provided for @dashboard_title.
  ///
  /// In en, this message translates to:
  /// **'Dashboard'**
  String get dashboard_title;

  /// No description provided for @recent_history.
  ///
  /// In en, this message translates to:
  /// **'Recent history'**
  String get recent_history;

  /// No description provided for @quick_actions.
  ///
  /// In en, this message translates to:
  /// **'Quick actions'**
  String get quick_actions;

  /// No description provided for @total_balance.
  ///
  /// In en, this message translates to:
  /// **'Total balance'**
  String get total_balance;

  /// No description provided for @debts_iou.
  ///
  /// In en, this message translates to:
  /// **'Debts / Credits'**
  String get debts_iou;

  /// No description provided for @goals.
  ///
  /// In en, this message translates to:
  /// **'Goals'**
  String get goals;

  /// No description provided for @notifications.
  ///
  /// In en, this message translates to:
  /// **'Notifications'**
  String get notifications;

  /// No description provided for @settings.
  ///
  /// In en, this message translates to:
  /// **'Settings'**
  String get settings;

  /// No description provided for @notifications_coming.
  ///
  /// In en, this message translates to:
  /// **'Notifications coming soon'**
  String get notifications_coming;

  /// No description provided for @transactions_count.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0 {No transactions} one {1 transaction} other {{count} transactions}}'**
  String transactions_count(num count);

  /// No description provided for @goals_count.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0 {No goals} one {1 goal} other {{count} goals}}'**
  String goals_count(num count);

  /// No description provided for @debts_count.
  ///
  /// In en, this message translates to:
  /// **'{count, plural, =0 {No debts} one {1 debt} other {{count} debts}}'**
  String debts_count(num count);

  /// No description provided for @login_success.
  ///
  /// In en, this message translates to:
  /// **'Login successful!'**
  String get login_success;

  /// No description provided for @login_error.
  ///
  /// In en, this message translates to:
  /// **'Login error'**
  String get login_error;

  /// No description provided for @user_not_found.
  ///
  /// In en, this message translates to:
  /// **'No user found with this email'**
  String get user_not_found;

  /// No description provided for @wrong_password.
  ///
  /// In en, this message translates to:
  /// **'Incorrect password'**
  String get wrong_password;

  /// No description provided for @invalid_email_format.
  ///
  /// In en, this message translates to:
  /// **'Invalid email format'**
  String get invalid_email_format;

  /// No description provided for @user_disabled.
  ///
  /// In en, this message translates to:
  /// **'This account has been disabled'**
  String get user_disabled;

  /// No description provided for @too_many_requests.
  ///
  /// In en, this message translates to:
  /// **'Too many attempts. Please try again later'**
  String get too_many_requests;

  /// No description provided for @error.
  ///
  /// In en, this message translates to:
  /// **'Error'**
  String get error;

  /// No description provided for @reset_password.
  ///
  /// In en, this message translates to:
  /// **'Reset password'**
  String get reset_password;

  /// No description provided for @reset_password_desc.
  ///
  /// In en, this message translates to:
  /// **'Enter your email to receive a reset link'**
  String get reset_password_desc;

  /// No description provided for @cancel.
  ///
  /// In en, this message translates to:
  /// **'Cancel'**
  String get cancel;

  /// No description provided for @send.
  ///
  /// In en, this message translates to:
  /// **'Send'**
  String get send;

  /// No description provided for @reset_email_sent.
  ///
  /// In en, this message translates to:
  /// **'Reset email sent'**
  String get reset_email_sent;

  /// No description provided for @google_login_soon.
  ///
  /// In en, this message translates to:
  /// **'Google login coming soon'**
  String get google_login_soon;

  /// No description provided for @facebook_login_soon.
  ///
  /// In en, this message translates to:
  /// **'Facebook login coming soon'**
  String get facebook_login_soon;

  /// No description provided for @no_account.
  ///
  /// In en, this message translates to:
  /// **'No account yet?'**
  String get no_account;

  /// No description provided for @create_account.
  ///
  /// In en, this message translates to:
  /// **'Create account'**
  String get create_account;

  /// No description provided for @account_created.
  ///
  /// In en, this message translates to:
  /// **'Account created successfully! Please log in again'**
  String get account_created;

  /// No description provided for @email_hint.
  ///
  /// In en, this message translates to:
  /// **'user@example.com'**
  String get email_hint;

  /// No description provided for @phone_hint.
  ///
  /// In en, this message translates to:
  /// **'6 12 34 56 78'**
  String get phone_hint;

  /// No description provided for @country.
  ///
  /// In en, this message translates to:
  /// **'Country'**
  String get country;

  /// No description provided for @confirm_password.
  ///
  /// In en, this message translates to:
  /// **'Confirm password'**
  String get confirm_password;

  /// No description provided for @create_my_account.
  ///
  /// In en, this message translates to:
  /// **'Create my account'**
  String get create_my_account;

  /// No description provided for @passwords_no_match.
  ///
  /// In en, this message translates to:
  /// **'Passwords do not match'**
  String get passwords_no_match;

  /// No description provided for @password_too_weak.
  ///
  /// In en, this message translates to:
  /// **'Password too weak (minimum 8 characters)'**
  String get password_too_weak;

  /// No description provided for @email_already_used.
  ///
  /// In en, this message translates to:
  /// **'This email is already in use'**
  String get email_already_used;

  /// No description provided for @min_8_chars.
  ///
  /// In en, this message translates to:
  /// **'Minimum 8 characters'**
  String get min_8_chars;

  /// No description provided for @confirmation_required.
  ///
  /// In en, this message translates to:
  /// **'Confirmation required'**
  String get confirmation_required;

  /// No description provided for @whatsapp_optional.
  ///
  /// In en, this message translates to:
  /// **'WhatsApp  (optional)'**
  String get whatsapp_optional;

  /// No description provided for @secure_connection.
  ///
  /// In en, this message translates to:
  /// **'Secure connection'**
  String get secure_connection;

  /// No description provided for @secure_encrypted.
  ///
  /// In en, this message translates to:
  /// **'Secure & encrypted'**
  String get secure_encrypted;

  /// No description provided for @developed_by.
  ///
  /// In en, this message translates to:
  /// **'Developed by'**
  String get developed_by;

  /// No description provided for @remember_me.
  ///
  /// In en, this message translates to:
  /// **'Remember me'**
  String get remember_me;

  /// No description provided for @or_continue_with.
  ///
  /// In en, this message translates to:
  /// **'Or continue with'**
  String get or_continue_with;

  /// No description provided for @google.
  ///
  /// In en, this message translates to:
  /// **'Google'**
  String get google;

  /// No description provided for @facebook.
  ///
  /// In en, this message translates to:
  /// **'Facebook'**
  String get facebook;

  /// No description provided for @already_account.
  ///
  /// In en, this message translates to:
  /// **'Already have an account?'**
  String get already_account;

  /// No description provided for @login.
  ///
  /// In en, this message translates to:
  /// **'Login'**
  String get login;

  /// No description provided for @privacy.
  ///
  /// In en, this message translates to:
  /// **'Privacy'**
  String get privacy;

  /// No description provided for @terms.
  ///
  /// In en, this message translates to:
  /// **'Terms'**
  String get terms;

  /// No description provided for @support.
  ///
  /// In en, this message translates to:
  /// **'Support'**
  String get support;

  /// No description provided for @documentation.
  ///
  /// In en, this message translates to:
  /// **'Documentation'**
  String get documentation;

  /// No description provided for @whatsapp_support.
  ///
  /// In en, this message translates to:
  /// **'WhatsApp Support'**
  String get whatsapp_support;

  /// No description provided for @welcome_intro.
  ///
  /// In en, this message translates to:
  /// **'Stay in control of your accounts, budgets, and goals.'**
  String get welcome_intro;

  /// No description provided for @choose_language.
  ///
  /// In en, this message translates to:
  /// **'Choose your language'**
  String get choose_language;

  /// No description provided for @pick_language.
  ///
  /// In en, this message translates to:
  /// **'Pick your language'**
  String get pick_language;

  /// No description provided for @language_applied_everywhere.
  ///
  /// In en, this message translates to:
  /// **'We\'\'ll use it everywhere (login, dashboard, notifications).'**
  String get language_applied_everywhere;

  /// No description provided for @change_later_settings.
  ///
  /// In en, this message translates to:
  /// **'You can change it later in Settings.'**
  String get change_later_settings;

  /// No description provided for @secure_login_encrypted.
  ///
  /// In en, this message translates to:
  /// **'Secure login, encrypted data.'**
  String get secure_login_encrypted;

  /// No description provided for @french_label.
  ///
  /// In en, this message translates to:
  /// **'Français'**
  String get french_label;

  /// No description provided for @french_code.
  ///
  /// In en, this message translates to:
  /// **'Français (FR)'**
  String get french_code;

  /// No description provided for @english_label.
  ///
  /// In en, this message translates to:
  /// **'English'**
  String get english_label;

  /// No description provided for @english_code.
  ///
  /// In en, this message translates to:
  /// **'English (EN)'**
  String get english_code;

  /// No description provided for @income.
  ///
  /// In en, this message translates to:
  /// **'Income'**
  String get income;

  /// No description provided for @expense.
  ///
  /// In en, this message translates to:
  /// **'Expense'**
  String get expense;

  /// No description provided for @transfer.
  ///
  /// In en, this message translates to:
  /// **'Transfer'**
  String get transfer;

  /// No description provided for @incomplete.
  ///
  /// In en, this message translates to:
  /// **'Incomplete'**
  String get incomplete;

  /// No description provided for @history.
  ///
  /// In en, this message translates to:
  /// **'History'**
  String get history;

  /// No description provided for @overspend.
  ///
  /// In en, this message translates to:
  /// **'Overspend'**
  String get overspend;

  /// No description provided for @balanced.
  ///
  /// In en, this message translates to:
  /// **'Balanced'**
  String get balanced;

  /// No description provided for @welcome_title.
  ///
  /// In en, this message translates to:
  /// **'Welcome'**
  String get welcome_title;

  /// No description provided for @welcome_login_msg.
  ///
  /// In en, this message translates to:
  /// **'Sign in to personalize your dashboard and manage your budgets.'**
  String get welcome_login_msg;

  /// No description provided for @dashboard_error_title.
  ///
  /// In en, this message translates to:
  /// **'Home'**
  String get dashboard_error_title;

  /// No description provided for @dashboard_error_body.
  ///
  /// In en, this message translates to:
  /// **'Unable to load your data right now.'**
  String get dashboard_error_body;

  /// No description provided for @dashboard_empty_title.
  ///
  /// In en, this message translates to:
  /// **'Start by creating an account'**
  String get dashboard_empty_title;

  /// No description provided for @dashboard_empty_body.
  ///
  /// In en, this message translates to:
  /// **'Add an account and a first budget to activate your dashboard.'**
  String get dashboard_empty_body;

  /// No description provided for @coaching_ahead.
  ///
  /// In en, this message translates to:
  /// **'You are spending {delta}% slower than planned.'**
  String coaching_ahead(String delta);

  /// No description provided for @coaching_behind.
  ///
  /// In en, this message translates to:
  /// **'You are spending {delta}% faster than planned.'**
  String coaching_behind(String delta);

  /// No description provided for @greeting_morning.
  ///
  /// In en, this message translates to:
  /// **'Good morning'**
  String get greeting_morning;

  /// No description provided for @greeting_afternoon.
  ///
  /// In en, this message translates to:
  /// **'Good afternoon'**
  String get greeting_afternoon;

  /// No description provided for @greeting_evening.
  ///
  /// In en, this message translates to:
  /// **'Good evening'**
  String get greeting_evening;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'fr'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'fr':
      return AppLocalizationsFr();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
