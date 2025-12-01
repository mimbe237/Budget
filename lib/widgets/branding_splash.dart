import 'package:flutter/material.dart';
import 'revolutionary_logo.dart';

/// Simple brand-first splash to display while auth state initializes.
class BrandingSplash extends StatelessWidget {
  const BrandingSplash({super.key});

  static const _bg = Color(0xFFF7F8FB);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 320),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(22),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(26),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.06),
                      blurRadius: 22,
                      offset: const Offset(0, 10),
                    ),
                  ],
                ),
                child: const RevolutionaryLogo(size: 96, withText: false),
              ),
              const SizedBox(height: 24),
              const Text(
                'Budget Pro',
                style: TextStyle(
                  color: Colors.black87,
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  letterSpacing: -0.2,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Initialisation en cours...',
                style: TextStyle(
                  color: Colors.black54,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 20),
              const SizedBox(
                height: 4,
                width: 180,
                child: LinearProgressIndicator(
                  backgroundColor: Color(0xFFE6E8F0),
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF6C5CF7)),
                  minHeight: 4,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
