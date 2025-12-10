import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../providers/locale_provider.dart';
import 'package:budget/l10n/app_localizations.dart';
import '../../widgets/revolutionary_logo.dart';
import '../../l10n/app_localizations.dart';

class WelcomeLanguageScreen extends StatelessWidget {
  const WelcomeLanguageScreen({super.key, required this.onLanguageSelected});

  final ValueChanged<String> onLanguageSelected;

  Future<void> _handleSelection(BuildContext context, String languageCode) async {
    final localeProvider = context.read<LocaleProvider>();
    await localeProvider.setLocale(Locale(languageCode));
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('intro_seen', true);
    onLanguageSelected(languageCode);
  }

  @override
  Widget build(BuildContext context) {
    final Color primary = const Color(0xFF6C5CF7);
    final Color secondary = const Color(0xFF00D9FF);

    return Scaffold(
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isWide = constraints.maxWidth >= 900;
          return Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  primary.withOpacity(0.14),
                  secondary.withOpacity(0.12),
                  Colors.white,
                ],
              ),
            ),
            child: Stack(
              children: [
                Positioned(
                  top: -40,
                  left: -30,
                  child: _blurCircle(140, primary.withOpacity(0.15)),
                ),
                Positioned(
                  bottom: -50,
                  right: -20,
                  child: _blurCircle(160, secondary.withOpacity(0.12)),
                ),
                SafeArea(
                  child: Center(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 20),
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 1200),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            const SizedBox(height: 10),
                            const RevolutionaryLogo(size: 80),
                            const SizedBox(height: 12),
                            Text(
                              'Budget Pro',
                              style: TextStyle(
                                fontSize: isWide ? 30 : 26,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -0.4,
                                color: Colors.black.withOpacity(0.9),
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Pilotez vos finances comme un Pro | Manage your finances like a Pro',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                fontSize: 14,
                                height: 1.45,
                                color: Colors.black.withOpacity(0.72),
                              ),
                            ),
                            const SizedBox(height: 32),
                            _languageColumns(
                              context: context,
                              primary: primary,
                              secondary: secondary,
                              isWide: isWide,
                            ),
                            const SizedBox(height: 16),
                            _footNote(primary),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _languageColumns({
    required BuildContext context,
    required Color primary,
    required Color secondary,
    required bool isWide,
  }) {
    final loc = AppLocalizations.of(context)!;
    final currentLang = context.watch<LocaleProvider>().locale.languageCode;
    final leftData = _LanguageCardData(
      code: 'fr',
      flag: '🇫🇷',
      title: 'Choisissez votre langue',
      subtitle: 'Cette langue s’applique partout (connexion, tableau de bord, notifications).',
      buttonLabel: loc.french_label,
      buttonDescription: loc.french_code,
      color: primary,
    );

    final rightData = _LanguageCardData(
      code: 'en',
      flag: '🇬🇧',
      title: 'Choose your language',
      subtitle: 'This language applies everywhere (login, dashboard, notifications).',
      buttonLabel: loc.english_label,
      buttonDescription: loc.english_code,
      color: Colors.black87,
      gradient: const LinearGradient(
        colors: [Colors.black87, Color(0xFF2F2F2F)],
      ),
    );

    final leftCard = _languageCard(
      context: context,
      data: leftData,
      isSelected: currentLang == leftData.code,
      secondary: secondary,
    );

    final rightCard = _languageCard(
      context: context,
      data: rightData,
      isSelected: currentLang == rightData.code,
      secondary: secondary,
    );

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.8),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: primary.withOpacity(0.08),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: isWide
          ? Row(
              children: [
                Expanded(child: leftCard),
                const SizedBox(width: 14),
                Expanded(child: rightCard),
              ],
            )
          : Column(
              children: [
                leftCard,
                const SizedBox(height: 14),
                rightCard,
              ],
            ),
    );
  }

  Widget _languageCard({
    required BuildContext context,
    required _LanguageCardData data,
    required bool isSelected,
    required Color secondary,
  }) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 4),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isSelected ? data.color.withOpacity(0.28) : Colors.grey.withOpacity(0.16),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 14,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(data.flag, style: const TextStyle(fontSize: 22)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  data.title,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                    color: Colors.black.withOpacity(0.9),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            data.subtitle,
            style: TextStyle(fontSize: 13, color: Colors.black.withOpacity(0.7), height: 1.4),
          ),
          const SizedBox(height: 20),
          _languageButton(
            context: context,
            label: data.buttonLabel,
            description: data.buttonDescription,
            color: data.color,
            onTap: () => _handleSelection(context, data.code),
            leading: data.flag,
            isSelected: isSelected,
            gradient: data.gradient,
          ),
        ],
      ),
    );
  }

  Widget _languageButton({
    required BuildContext context,
    required String label,
    required String description,
    required Color color,
    required VoidCallback onTap,
    bool isSelected = false,
    String? leading,
    Gradient? gradient,
  }) {
    final borderColor = isSelected ? Colors.white : Colors.transparent;
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: DecoratedBox(
        decoration: BoxDecoration(
          gradient: gradient ??
              LinearGradient(
                colors: isSelected ? [color, color.withOpacity(0.9)] : [color.withOpacity(0.9), color.withOpacity(0.85)],
              ),
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.18),
              blurRadius: 16,
              offset: const Offset(0, 8),
            ),
          ],
          border: Border.all(color: borderColor, width: 1.4),
        ),
        child: ElevatedButton(
          onPressed: onTap,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  if (leading != null) ...[
                    Text(
                      leading,
                      style: const TextStyle(fontSize: 20),
                    ),
                    const SizedBox(width: 10),
                  ],
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        label,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        description,
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.white.withOpacity(0.85),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              const Icon(Icons.arrow_forward, color: Colors.white),
            ],
          ),
        ),
      ),
    );
  }

  Widget _footNote(Color primary) {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.shield, size: 16, color: primary),
            const SizedBox(width: 6),
            Text(
              'Sécurisé & chiffré | Secure & encrypted',
              style: TextStyle(fontSize: 12, color: Colors.black.withOpacity(0.7)),
            ),
          ],
        ),
        const SizedBox(height: 6),
        Container(
          height: 4,
          width: 120,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(4),
            gradient: LinearGradient(colors: [primary, primary.withOpacity(0.6)]),
          ),
        ),
      ],
    );
  }

  Widget _blurCircle(double size, Color color) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
        boxShadow: [
          BoxShadow(
            color: color,
            blurRadius: 60,
            spreadRadius: 30,
          ),
        ],
      ),
    );
  }
}

class _LanguageCardData {
  final String code;
  final String flag;
  final String title;
  final String subtitle;
  final String buttonLabel;
  final String buttonDescription;
  final Color color;
  final Gradient? gradient;

  const _LanguageCardData({
    required this.code,
    required this.flag,
    required this.title,
    required this.subtitle,
    required this.buttonLabel,
    required this.buttonDescription,
    required this.color,
    this.gradient,
  });
}
