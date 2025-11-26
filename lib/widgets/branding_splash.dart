import 'package:flutter/material.dart';
import 'revolutionary_logo.dart';

/// Simple brand-first splash to display while auth state initializes.
class BrandingSplash extends StatelessWidget {
  const BrandingSplash({super.key});

  static const _bg = Color(0xFF5E5CE6); // simpler flat background to reduce paint cost

  @override
  Widget build(BuildContext context) {
    return Container(
      color: _bg,
      child: const Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
          strokeWidth: 3,
        ),
      ),
    );
  }
}
// Simplified splash: removed logo and glow to minimize initial frame work.
