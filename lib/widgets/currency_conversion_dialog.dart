import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/app_design.dart';
import '../services/currency_service.dart';
import 'package:budget/l10n/localization_helpers.dart';
import 'package:budget/l10n/app_localizations.dart';
import '../l10n/app_localizations.dart';

/// Dialog shown when user switches currency
/// Offers to convert existing balances or just change display format
class CurrencyConversionDialog extends StatefulWidget {
  final String oldCurrency;
  final String newCurrency;
  final VoidCallback? onConvert;
  final VoidCallback? onDisplayOnly;

  const CurrencyConversionDialog({
    super.key,
    required this.oldCurrency,
    required this.newCurrency,
    this.onConvert,
    this.onDisplayOnly,
  });

  @override
  State<CurrencyConversionDialog> createState() => _CurrencyConversionDialogState();
}

class _CurrencyConversionDialogState extends State<CurrencyConversionDialog> {
  bool _isConverting = false;

  @override
  Widget build(BuildContext context) {
    final currencyService = context.read<CurrencyService>();
    
    // Calculate example conversion
    final exampleAmount = 1000.0;
    final convertedAmount = currencyService.convertAmount(
      exampleAmount,
      widget.oldCurrency,
      widget.newCurrency,
    );
    
    final oldSymbol = currencyService.getCurrencySymbol(widget.oldCurrency);
    final newSymbol = currencyService.getCurrencySymbol(widget.newCurrency);

    return AlertDialog(
      title: Row(
        children: [
          Icon(
            Icons.currency_exchange,
            color: AppDesign.primaryIndigo,
            size: 28,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              AppLocalizations.of(context)?.tr('Changement de devise') ?? 'Changement de devise',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Conversion example
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppDesign.primaryIndigo.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppDesign.primaryIndigo.withOpacity(0.3),
                width: 1,
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Column(
                  children: [
                    Text(
                      widget.oldCurrency,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      currencyService.formatAmount(exampleAmount, widget.oldCurrency),
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Icon(
                    Icons.arrow_forward,
                    color: AppDesign.primaryIndigo,
                    size: 24,
                  ),
                ),
                Column(
                  children: [
                    Text(
                      widget.newCurrency,
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      currencyService.formatAmount(convertedAmount, widget.newCurrency),
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: AppDesign.incomeColor,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          
          // Explanation
          Text(
            AppLocalizations.of(context)?.tr('Que souhaitez-vous faire ?') ?? 'Que souhaitez-vous faire ?',
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          
          // Option 1: Display only
          _buildOption(
            icon: Icons.visibility,
            color: AppDesign.primaryPurple,
            title: 'Changer l\'affichage uniquement',
            description: 'Les montants resteront inchangés dans la base de données, seul le format d\'affichage changera.',
            recommended: false,
          ),
          const SizedBox(height: 12),
          
          // Option 2: Convert balances
          _buildOption(
            icon: Icons.sync_alt,
            color: AppDesign.incomeColor,
            title: 'Convertir tous les montants',
            description: 'Tous vos soldes, transactions et objectifs seront convertis dans la nouvelle devise.',
            recommended: true,
          ),
          
          if (_isConverting)
            const Padding(
              padding: EdgeInsets.only(top: 16),
              child: Center(
                child: CircularProgressIndicator(),
              ),
            ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: _isConverting ? null : () => Navigator.pop(context),
          child: Text(AppLocalizations.of(context)?.tr('Annuler') ?? 'Annuler'),
        ),
        TextButton(
          onPressed: _isConverting
              ? null
              : () {
                  Navigator.pop(context);
                  widget.onDisplayOnly?.call();
                },
          child: Text(
            AppLocalizations.of(context)?.tr('Affichage seul') ?? 'Affichage seul',
            style: const TextStyle(fontWeight: FontWeight.w600),
          ),
        ),
        ElevatedButton(
          onPressed: _isConverting
              ? null
              : () async {
                  setState(() => _isConverting = true);
                  Navigator.pop(context);
                  widget.onConvert?.call();
                },
          style: ElevatedButton.styleFrom(
            backgroundColor: AppDesign.incomeColor,
            foregroundColor: Colors.white,
          ),
          child: Text(
            AppLocalizations.of(context)?.tr('Convertir') ?? 'Convertir',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }

  Widget _buildOption({
    required IconData icon,
    required Color color,
    required String title,
    required String description,
    required bool recommended,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: color.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        AppLocalizations.of(context)?.tr(title) ?? title,
                        style: TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                          color: color,
                        ),
                      ),
                    ),
                    if (recommended)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: AppDesign.incomeColor,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Text(
                          'Recommandé',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  AppLocalizations.of(context)?.tr(description) ?? description,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Shows the currency conversion dialog
Future<void> showCurrencyConversionDialog({
  required BuildContext context,
  required String oldCurrency,
  required String newCurrency,
  VoidCallback? onConvert,
  VoidCallback? onDisplayOnly,
}) {
  return showDialog(
    context: context,
    barrierDismissible: false,
    builder: (context) => CurrencyConversionDialog(
      oldCurrency: oldCurrency,
      newCurrency: newCurrency,
      onConvert: onConvert,
      onDisplayOnly: onDisplayOnly,
    ),
  );
}
