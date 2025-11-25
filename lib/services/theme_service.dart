import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Provider de thème clair/sombre avec persistance.
class ThemeProvider extends ChangeNotifier {
  static const _themeKey = 'preferred_theme_mode';

  ThemeMode _themeMode = ThemeMode.system;
  bool _initialized = false;

  ThemeMode get themeMode => _themeMode;
  bool get initialized => _initialized;

  Future<void> loadTheme() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_themeKey);
    switch (saved) {
      case 'light':
        _themeMode = ThemeMode.light;
        break;
      case 'dark':
        _themeMode = ThemeMode.dark;
        break;
      default:
        _themeMode = ThemeMode.system;
    }
    _initialized = true;
    notifyListeners();
  }

  Future<void> setTheme(ThemeMode mode) async {
    _themeMode = mode;
    final prefs = await SharedPreferences.getInstance();
    final value = switch (mode) {
      ThemeMode.light => 'light',
      ThemeMode.dark => 'dark',
      ThemeMode.system => 'system',
    };
    await prefs.setString(_themeKey, value);
    notifyListeners();
  }

  Future<void> toggleTheme() {
    // Bascule rapide clair/sombre, sinon revient à clair.
    final next = _themeMode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark;
    return setTheme(next);
  }

  String label(BuildContext context) {
    return switch (_themeMode) {
      ThemeMode.light => 'Clair',
      ThemeMode.dark => 'Sombre',
      ThemeMode.system => 'Système',
    };
  }
}
