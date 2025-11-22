import 'package:flutter/material.dart';
import '../constants/app_design.dart';

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
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [
                Color(0xFF6366F1), // Indigo
                Color(0xFF8B5CF6), // Purple
                Color(0xFFEC4899), // Pink
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(size * 0.3),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF6366F1).withOpacity(0.4),
                blurRadius: size * 0.2,
                offset: Offset(0, size * 0.1),
              ),
            ],
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              // The "B" or symbol
              Icon(
                Icons.auto_graph_rounded,
                color: Colors.white,
                size: size * 0.6,
              ),
              // A small spark
              Positioned(
                top: size * 0.15,
                right: size * 0.15,
                child: Container(
                  width: size * 0.15,
                  height: size * 0.15,
                  decoration: const BoxDecoration(
                    color: Colors.amber,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (withText) ...[
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'BUDGET',
                style: TextStyle(
                  fontSize: size * 0.4,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.2,
                  color: AppDesign.primaryIndigo,
                  height: 1.0,
                ),
              ),
              Text(
                'REVOLUTION',
                style: TextStyle(
                  fontSize: size * 0.3,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2.0,
                  color: AppDesign.primaryPurple,
                  height: 1.0,
                ),
              ),
            ],
          ),
        ],
      ],
    );
  }
}
