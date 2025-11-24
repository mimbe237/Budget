import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:budget/l10n/app_localizations.dart';

class RevolutionaryLogo extends StatelessWidget {
  final double size;
  final bool withText;

  const RevolutionaryLogo({
    super.key,
    this.size = 40,
    this.withText = false,
  });

  @override
  Widget build(BuildContext context) {
    final semantics = t('Budget Pro');
    if (withText) {
      // Full lockup (icône + texte) for marketing/hero contexts.
      return SvgPicture.asset(
        'assets/images/logo-full.svg',
        height: size * 1.6,
        semanticsLabel: semantics,
        fit: BoxFit.fitHeight,
      );
    }

    // Icon-only for compact UI (app bars, badges, splash).
    return SvgPicture.asset(
      'assets/images/logo-icon.svg',
      width: size,
      height: size,
      semanticsLabel: semantics,
    );
  }
}
