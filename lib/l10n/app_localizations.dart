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
