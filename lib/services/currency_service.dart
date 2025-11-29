import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import 'dart:ui';

/// Service de gestion de la devise utilisateur
class CurrencyService extends ChangeNotifier {
  static final CurrencyService _instance = CurrencyService._internal();
  factory CurrencyService() => _instance;
  CurrencyService._internal();

  static const String _currencyKey = 'selected_currency';
  
  // Devise par défaut (préférée: XAF / FCFA)
  String _currentCurrency = 'XAF';
  bool _initialized = false;

  String get currentCurrency => _currentCurrency;
  String get currencySymbol => getCurrencySymbol(_currentCurrency);
  bool get initialized => _initialized;

  /// Liste des devises supportées avec leurs symboles
  static const Map<String, String> supportedCurrencies = {
    'EUR': '€',
    'XAF': 'FCFA',  // Franc CFA (Afrique Centrale)
    'USD': '\$',
    'GBP': '£',
    'CHF': 'Fr',
    'JPY': '¥',
    'CAD': 'C\$',
    'XOF': 'FCFA',  // Franc CFA (Afrique de l'Ouest)
  };

  /// Noms complets des devises
  static const Map<String, String> currencyNames = {
    'EUR': 'Euro',
    'USD': 'Dollar américain',
    'GBP': 'Livre sterling',
    'CHF': 'Franc suisse',
    'JPY': 'Yen japonais',
    'CAD': 'Dollar canadien',
    'XAF': 'Franc CFA (BEAC)',
    'XOF': 'Franc CFA (BCEAO)',
  };

  /// Taux de conversion approximatifs par rapport à l'EUR (à jour régulièrement)
  static const Map<String, double> exchangeRates = {
    'EUR': 1.0,
    'USD': 1.09,
    'GBP': 0.86,
    'CHF': 0.96,
    'JPY': 163.0,
    'CAD': 1.48,
    'XAF': 655.957,  // Taux fixe EUR/XAF
    'XOF': 655.957,  // Taux fixe EUR/XOF (identique XAF)
  };

  /// Mapping pays → devise suggérée
  static const Map<String, String> countryToCurrency = {
    'CM': 'XAF',
    'CI': 'XOF',
    'FR': 'EUR',
    'US': 'USD',
    'GB': 'GBP',
    'CH': 'CHF',
    'CA': 'CAD',
    'JP': 'JPY',
  };

  /// Charge la devise sauvegardée
  Future<void> loadCurrency() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_currencyKey);
    
    if (saved != null && supportedCurrencies.containsKey(saved)) {
      _currentCurrency = saved;
    }
    
    _initialized = true;
    notifyListeners();
  }

  /// Change la devise et la sauvegarde
  Future<void> setCurrency(String currencyCode) async {
    if (!supportedCurrencies.containsKey(currencyCode)) {
      throw ArgumentError('Currency not supported: $currencyCode');
    }

    _currentCurrency = currencyCode;
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_currencyKey, currencyCode);
    
    notifyListeners();
  }

  /// Obtient le symbole d'une devise
  String getCurrencySymbol(String currencyCode) {
    return supportedCurrencies[currencyCode] ?? '€';
  }

  /// Obtient le nom complet d'une devise
  String getCurrencyName(String currencyCode) {
    return currencyNames[currencyCode] ?? currencyCode;
  }

  /// Devine une devise à partir d'un code pays (ISO) si supportée
  static String? guessCurrencyFromCountry(String? countryCode) {
    if (countryCode == null) return null;
    final upper = countryCode.toUpperCase();
    final guess = countryToCurrency[upper];
    if (guess != null && supportedCurrencies.containsKey(guess)) return guess;
    return null;
  }

  /// Devine une devise à partir de la locale
  static String? guessCurrencyFromLocale(Locale locale) {
    return guessCurrencyFromCountry(locale.countryCode);
  }

  /// Convertit un montant d'une devise à une autre
  double convertAmount(double amount, String fromCurrency, String toCurrency) {
    if (fromCurrency == toCurrency) return amount;
    
    final fromRate = exchangeRates[fromCurrency] ?? 1.0;
    final toRate = exchangeRates[toCurrency] ?? 1.0;
    
    // Conversion via EUR comme devise pivot
    final amountInEur = amount / fromRate;
    return amountInEur * toRate;
  }

  /// Formate un montant avec la devise spécifiée (ou actuelle par défaut)
  String formatAmount(double amount, [String? currency, bool showSymbol = true]) {
    final targetCurrency = currency ?? _currentCurrency;
    final symbol = showSymbol ? getCurrencySymbol(targetCurrency) : '';

    // Supprimer les décimales si inutiles, sinon garder 2 décimales
    final bool hasCents = (amount % 1).abs() > 0.0001;
    final decimals = targetCurrency == 'JPY' ? 0 : (hasCents ? 2 : 0);
    
    // Format avec séparateurs de milliers
    final formatter = NumberFormat('#,##0${decimals > 0 ? '.00' : ''}', 'fr_FR');
    final formatted = formatter.format(amount);

    return '$formatted\u202F$symbol'.trim(); // \u202F = espace fine insécable
  }

  /// Obtient la liste formatée des devises pour l'UI
  List<String> getFormattedCurrencyList() {
    return supportedCurrencies.entries
        .map((e) => '${e.key} (${e.value})')
        .toList();
  }

  /// Parse le code devise depuis le format UI (ex: "EUR (€)" -> "EUR")
  String parseCurrencyCode(String formatted) {
    final code = formatted.split(' ').first;
    // Normaliser certaines entrées UI: "FCA" ou "FCFA" vers XAF
    if (code.toUpperCase() == 'FCA' || code.toUpperCase() == 'FCFA') return 'XAF';
    return code;
  }
}
