import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
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
        SvgPicture.asset(
          'assets/images/logo-icon.svg',
          width: size,
          height: size,
        ),
        if (withText) ...[
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Budget',
                style: TextStyle(
                  fontSize: size * 0.35,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.2,
                  color: AppDesign.primaryIndigo,
                  height: 1.0,
                ),
              ),
              Text(
                'Pro',
                style: TextStyle(
                  fontSize: size * 0.32,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 0.3,
                  color: AppDesign.primaryIndigo,
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
