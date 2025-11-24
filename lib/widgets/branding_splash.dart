import 'package:flutter/material.dart';
import 'revolutionary_logo.dart';

/// Simple brand-first splash to display while auth state initializes.
class BrandingSplash extends StatelessWidget {
  const BrandingSplash({super.key});

  static const _gradientStart = Color(0xFF6C5CF7);
  static const _gradientEnd = Color(0xFFC542C1);
  static const _sunAccent = Color(0xFFF7B500);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [_gradientStart, _gradientEnd],
        ),
      ),
      child: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            RevolutionaryLogo(size: 96),
            SizedBox(height: 16),
            _GlowDot(),
            SizedBox(height: 24),
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              strokeWidth: 3,
            ),
          ],
        ),
      ),
    );
  }
}

class _GlowDot extends StatelessWidget {
  const _GlowDot();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 14,
      height: 14,
      decoration: BoxDecoration(
        color: BrandingSplash._sunAccent,
        shape: BoxShape.circle,
        boxShadow: const [
          BoxShadow(
            color: BrandingSplash._sunAccent,
            blurRadius: 18,
            spreadRadius: 4,
          ),
        ],
      ),
    );
  }
}
