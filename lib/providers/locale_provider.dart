import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../l10n/localization_helpers.dart';

/// Manages app locale and persistence across restarts.
class LocaleProvider extends ChangeNotifier {
  Locale _locale = const Locale('fr');

  Locale get locale => _locale;

  /// Load saved locale from SharedPreferences.
  Future<void> loadLocale() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedLang = prefs.getString('languageCode') ?? 'fr';
      _locale = Locale(savedLang);
      LocalizationHelper.setLocale(_locale);
      notifyListeners();
    } catch (e) {
      debugPrint('⚠️ Error loading locale: $e');
    }
  }

  /// Set and persist locale.
  Future<void> setLocale(Locale locale) async {
    if (locale.languageCode == _locale.languageCode) return;
    _locale = locale;
    LocalizationHelper.setLocale(_locale);
    notifyListeners();
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('languageCode', locale.languageCode);
    } catch (e) {
      debugPrint('⚠️ Error saving locale: $e');
    }
  }
}
