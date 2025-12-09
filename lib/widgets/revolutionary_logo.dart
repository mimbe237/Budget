import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:budget/l10n/localization_helpers.dart';

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
    final mediaQuery = MediaQuery.maybeOf(context);
    final isMobile = mediaQuery != null && mediaQuery.size.width < 600;
    final showFullLockup = withText && !isMobile;
    final semantics = t('Budget Pro');

    Widget buildSvg() {
      if (showFullLockup) {
        // Full lockup (icône + texte) for marketing/hero contexts; drop text on mobile.
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

    // Fallback PNG si le SVG ne se charge pas (protection runtime)
    Widget buildPngFallback() {
      return Image.asset(
        'assets/images/logo-icon.png',
        width: size,
        height: size,
        semanticLabel: semantics,
        fit: BoxFit.contain,
      );
    }

    try {
      return buildSvg();
    } catch (_) {
      return buildPngFallback();
    }
  }
}
