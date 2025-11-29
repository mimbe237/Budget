import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/translation_service.dart';

/// Simple localization layer (fr/en) with manual dictionary + basic caching.
/// Supporte les traductions dynamiques depuis Firestore via TranslationService
class AppLocalizations {
  AppLocalizations(this.locale);

  final Locale locale;

  static Locale _globalLocale = const Locale('fr');
  static final TranslationService _translationService = TranslationService();

  static const supportedLocales = [
    Locale('fr'),
    Locale('en'),
  ];

  // Legacy local dictionaries removed. Firestore is the single source of truth.
  static const _localizedValues = <String, Map<String, String>>{
    'fr': {},
    'en': {},
  };

  String translate(String key, {Map<String, String>? params}) {
    final languageCode = supportedLocales
            .map((l) => l.languageCode)
            .contains(locale.languageCode)
        ? locale.languageCode
        : 'fr';

    // Priority 1: Check Firestore translations (dynamic, admin-managed)
    String? mapped = _translationService.getTranslation(key, languageCode);

    // Legacy local dictionaries and auto-translate removed.

    var value = mapped ?? key;

    if (params != null) {
      params.forEach((paramKey, paramValue) {
        value = value.replaceAll('{$paramKey}', paramValue);
      });
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
  String? _profileLanguageCode;

  Locale get locale => _locale;
  bool get initialized => _initialized;
  String? get profileLanguageCode => _profileLanguageCode;

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

  Future<void> setLocale(Locale locale, {String? source}) async {
    if (!isSupported(locale)) return;
    _locale = Locale(locale.languageCode);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('preferred_locale', _locale.languageCode);
    _profileLanguageCode = locale.languageCode;
    AppLocalizations.setGlobalLocale(_locale);
    notifyListeners();
  }

  /// Permet d'appliquer une langue provenant du profil Firestore
  Future<void> setLocaleFromProfile(String languageCode) async {
    if (!isSupported(Locale(languageCode))) return;
    _profileLanguageCode = languageCode;
    await setLocale(Locale(languageCode));
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
