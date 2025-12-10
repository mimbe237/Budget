import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../l10n/localization_helpers.dart';
import '../l10n/app_localizations.dart';

/// Manages app locale and persistence across restarts.
class LocaleProvider extends ChangeNotifier {
  Locale _locale = WidgetsBinding.instance.platformDispatcher.locale;

  Locale _normalize(Locale locale) {
    return AppLocalizations.supportedLocales
            .any((l) => l.languageCode == locale.languageCode)
        ? locale
        : const Locale('fr');
  }

  Locale get locale => _locale;

  /// Load saved locale from SharedPreferences.
  Future<void> loadLocale() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedLang = prefs.getString('languageCode');
      final deviceLocale = WidgetsBinding.instance.platformDispatcher.locale;
      if (savedLang != null && savedLang.isNotEmpty) {
        _locale = _normalize(Locale(savedLang));
      } else {
        _locale = _normalize(deviceLocale);
      }
      LocalizationHelper.setLocale(_locale);
      notifyListeners();
    } catch (e) {
      debugPrint('⚠️ Error loading locale: $e');
    }
  }

  /// Set and persist locale.
  Future<void> setLocale(Locale locale) async {
    final changed = locale.languageCode != _locale.languageCode;
    _locale = _normalize(locale);
    LocalizationHelper.setLocale(_locale);
    if (changed) {
      notifyListeners();
    }
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('languageCode', locale.languageCode);
    } catch (e) {
      debugPrint('⚠️ Error saving locale: $e');
    }
  }
}
