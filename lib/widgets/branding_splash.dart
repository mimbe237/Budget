import 'package:flutter/material.dart';
import 'revolutionary_logo.dart';

/// Simple brand-first splash to display while auth state initializes.
class BrandingSplash extends StatelessWidget {
  const BrandingSplash({super.key});

  static const _bg = Color(0xFF5E5CE6); // simpler flat background to reduce paint cost

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
              strokeWidth: 3,
            ),
            SizedBox(height: 24),
            Text(
              'Budget Pro',
              style: TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 8),
            Text(
              'Chargement...',
              style: TextStyle(
                color: Colors.white70,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
// Simplified splash: removed logo and glow to minimize initial frame work.
