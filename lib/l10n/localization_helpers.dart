import 'package:flutter/material.dart';
import 'app_localizations.dart';

export 'app_localizations.dart';

/// Shared translation helpers using gen_l10n generated classes
class LocalizationHelper {
  static Locale currentLocale = const Locale('fr');

  static void setLocale(Locale locale) {
    currentLocale = locale;
  }

  /// Resolve a translation key using the provided context
  /// Falls back to the key itself if not found
  static String resolve(String key,
      {String? languageCode, Map<String, String>? params}) {
    // Since we're using gen_l10n, keys are resolved via getters, not strings
    // This fallback just returns the key - use AppLocalizations.of(context) instead
    return key;
  }
}

/// Global translation function - requires a context to work properly
/// For use in widgets with BuildContext
/// DEPRECATED: Use AppLocalizations.of(context)! instead
@Deprecated('Use AppLocalizations.of(context)! for translations')
String t(String key, {Map<String, String>? params, Locale? locale}) {
  // Return the key as fallback - proper translation requires BuildContext
  return key;
}

extension AppLocalizationsX on AppLocalizations {
  /// Translate a key using the AppLocalizations instance
  /// Uses the generated getters for this locale
  String tr(String key, {Map<String, String>? params}) {
    try {
      // Switch on key to return appropriate getter
      switch (key) {
        case 'app_title':
          return app_title;
        case 'onboarding_welcome_title':
          return onboarding_welcome_title;
        case 'onboarding_welcome_subtitle':
          return onboarding_welcome_subtitle;
        case 'your_name_label':
          return your_name_label;
        case 'name_hint':
          return name_hint;
        case 'enter_name_error':
          return enter_name_error;
        case 'default_currency_label':
          return default_currency_label;
        case 'monthly_income_label':
          return monthly_income_label;
        case 'invalid_amount_error':
          return invalid_amount_error;
        case 'required_field_error':
          return required_field_error;
        case 'next':
          return next;
        case 'previous':
          return previous;
        case 'finish':
          return finish;
        case 'quick_setup_title':
          return quick_setup_title;
        case 'quick_setup_subtitle':
          return quick_setup_subtitle;
        case 'first_account_header':
          return first_account_header;
        case 'account_name_label':
          return account_name_label;
        case 'account_name_hint':
          return account_name_hint;
        case 'account_balance_label':
          return account_balance_label;
        case 'icon_label':
          return icon_label;
        case 'budget_header':
          return budget_header;
        case 'define_budget':
          return define_budget;
        case 'control_spending':
          return control_spending;
        case 'budget_amount_label':
          return budget_amount_label;
        case 'goal_header':
          return goal_header;
        case 'create_savings_goal':
          return create_savings_goal;
        case 'set_target':
          return set_target;
        case 'goal_name_label':
          return goal_name_label;
        case 'goal_name_hint':
          return goal_name_hint;
        case 'goal_target_label':
          return goal_target_label;
        case 'note_add_more':
          return note_add_more;
        case 'required_chip':
          return required_chip;
        case 'optional_chip':
          return optional_chip;
        case 'congrats_title':
          return congrats_title;
        case 'congrats_subtitle':
          return congrats_subtitle;
        case 'go_to_dashboard':
          return go_to_dashboard;
        case 'select_account_error':
          return select_account_error;
        case 'select_category_error':
          return select_category_error;
        case 'must_be_logged_in_error':
          return must_be_logged_in_error;
        case 'budget_discipline_title':
          return budget_discipline_title;
        case 'budget_discipline_body':
          return budget_discipline_body;
        case 'understood':
          return understood;
        case 'insufficient_balance_title':
          return insufficient_balance_title;
        case 'insufficient_balance_body':
          if (params != null && params.containsKey('expense') && params.containsKey('balance')) {
            return insufficient_balance_body(params['balance']!, params['expense']!);
          }
          return insufficient_balance_body('0', '0');
        case 'ok':
          return ok;
        case 'login_subtitle':
          return login_subtitle;
        case 'login_subsubtitle':
          return login_subsubtitle;
        case 'login_title':
          return login_title;
        case 'login_secure':
          return login_secure;
        case 'login_failed':
          return login_failed;
        case 'email_label':
          return email_label;
        case 'email_required':
          return email_required;
        case 'email_invalid':
          return email_invalid;
        case 'password_label':
          return password_label;
        case 'password_required':
          return password_required;
        case 'password_too_short':
          return password_too_short;
        case 'forgot_password':
          return forgot_password;
        case 'dashboard_title':
          return dashboard_title;
        case 'recent_history':
          return recent_history;
        case 'quick_actions':
          return quick_actions;
        case 'total_balance':
          return total_balance;
        case 'debts_iou':
          return debts_iou;
        case 'goals':
          return goals;
        case 'notifications':
          return notifications;
        case 'settings':
          return settings;
        case 'notifications_coming':
          return notifications_coming;
        default:
          return key;
      }
    } catch (e) {
      return key;
    }
  }
}

class TrText extends StatelessWidget {
  final String data;
  final TextStyle? style;
  final TextAlign? textAlign;
  final int? maxLines;
  final TextOverflow? overflow;
  final bool? softWrap;

  const TrText(this.data,
      {super.key,
      this.style,
      this.textAlign,
      this.maxLines,
      this.overflow,
      this.softWrap});

  @override
  Widget build(BuildContext context) {
    final appLocalizations = AppLocalizations.of(context);
    final value = appLocalizations?.tr(data) ?? data;
    return Text(
      value,
      style: style,
      textAlign: textAlign,
      maxLines: maxLines,
      overflow: overflow,
      softWrap: softWrap,
    );
  }
}

class SelectableTrText extends StatelessWidget {
  final String data;
  final TextStyle? style;
  final TextAlign? textAlign;

  const SelectableTrText(this.data, {super.key, this.style, this.textAlign});

  @override
  Widget build(BuildContext context) {
    final appLocalizations = AppLocalizations.of(context);
    final value = appLocalizations?.tr(data) ?? data;
    return SelectableText(
      value,
      style: style,
      textAlign: textAlign,
    );
  }
}

class RichTrText extends StatelessWidget {
  final String data;
  final TextStyle? style;
  final TextAlign? textAlign;

  const RichTrText(this.data, {super.key, this.style, this.textAlign});

  @override
  Widget build(BuildContext context) {
    final appLocalizations = AppLocalizations.of(context);
    final value = appLocalizations?.tr(data) ?? data;
    return RichText(
      textAlign: textAlign ?? TextAlign.start,
      text: TextSpan(
        text: value,
        style: style ?? DefaultTextStyle.of(context).style,
      ),
    );
  }
}

