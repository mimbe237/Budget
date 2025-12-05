import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:budget/l10n/localization_helpers.dart';
import 'revolutionary_logo.dart';

class FooterBrand extends StatelessWidget {
  const FooterBrand({super.key});

  Future<void> _openSite() async {
    final uri = Uri.parse('https://www.beonweb.cm');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(
            top: BorderSide(color: Color(0xFFE8EAED), width: 1),
          ),
        ),
        child: Center(
          child: InkWell(
            onTap: _openSite,
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: const [
                  RevolutionaryLogo(size: 22),
                  SizedBox(width: 8),
                  TrText(
                    'by BEONWEB (www.beonweb.cm)',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.black54,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
