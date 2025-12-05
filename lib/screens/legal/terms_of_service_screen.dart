import 'package:flutter/material.dart';
import 'package:budget/l10n/localization_helpers.dart';

class TermsOfServiceScreen extends StatelessWidget {
  const TermsOfServiceScreen({super.key});

  static const Color _brandPrimary = Color(0xFF6C5CF7);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const TrText('Conditions d\'Utilisation'),
        backgroundColor: _brandPrimary,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const TrText(
              'Conditions d\'Utilisation',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w900,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 8),
            TrText(
              'Dernière mise à jour : 3 décembre 2025',
              style: TextStyle(color: Colors.grey[600], fontSize: 14),
            ),
            const SizedBox(height: 24),
            _buildSection(
              title: '1. Acceptation des Conditions',
              content: 'En utilisant Budget Pro, vous acceptez les présentes conditions d\'utilisation. '
                  'Si vous n\'acceptez pas ces conditions, veuillez ne pas utiliser l\'application.\n\n'
                  'Budget Pro est développé et maintenu par BEONWEB.',
            ),
            const SizedBox(height: 20),
            _buildSection(
              title: '2. Description du Service',
              content: 'Budget Pro est une application de gestion financière personnelle offrant :\n\n'
                  '• Suivi des transactions et comptes\n'
                  '• Gestion des budgets mensuels\n'
                  '• Objectifs d\'épargne et suivi de progression\n'
                  '• Gestion des dettes et créances\n'
                  '• Rapports et analyses IA\n'
                  '• Synchronisation cloud (Firebase)\n\n'
                  'Le service est fourni "tel quel" sans garantie de disponibilité continue.',
            ),
            const SizedBox(height: 20),
            _buildSection(
              title: '3. Création de Compte',
              content: 'Pour utiliser Budget Pro, vous devez :\n\n'
                  '• Avoir au moins 16 ans\n'
                  '• Fournir des informations exactes\n'
                  '• Maintenir la confidentialité de votre mot de passe\n'
                  '• Être responsable de toute activité sur votre compte\n\n'
                  'Vous pouvez également tester l\'application en mode Démo sans créer de compte.',
            ),
            const SizedBox(height: 20),
            _buildSection(
              title: '4. Utilisation Acceptable',
              content: 'Vous vous engagez à NE PAS :\n\n'
                  '• Utiliser l\'application à des fins illégales\n'
                  '• Tenter de pirater ou compromettre la sécurité\n'
                  '• Créer plusieurs comptes pour abuser du système\n'
                  '• Extraire ou copier le contenu de manière automatisée\n'
                  '• Utiliser l\'application pour blanchir de l\'argent\n\n'
                  'Toute violation peut entraîner la suspension de votre compte.',
            ),
            const SizedBox(height: 20),
            _buildSection(
              title: '5. Propriété Intellectuelle',
              content: 'Budget Pro et tous ses contenus (code, design, logos, textes) sont la propriété de BEONWEB.\n\n'
                  '• Le code source est propriétaire\n'
                  '• Les marques et logos sont protégés\n'
                  '• Toute reproduction non autorisée est interdite\n\n'
                  'Vos données financières vous appartiennent et restent votre propriété.',
            ),
            const SizedBox(height: 20),
            _buildSection(
              title: '6. Limitation de Responsabilité',
              content: 'BEONWEB ne peut être tenu responsable :\n\n'
                  '• Des pertes financières résultant de l\'utilisation de l\'application\n'
                  '• Des erreurs dans les calculs ou projections\n'
                  '• De la perte de données due à des problèmes techniques\n'
                  '• Des interruptions de service\n\n'
                  'Budget Pro est un outil d\'aide à la gestion, pas un conseil financier professionnel.',
            ),
            const SizedBox(height: 20),
            _buildSection(
              title: '7. Résiliation',
              content: 'Vous pouvez supprimer votre compte à tout moment depuis les Paramètres.\n\n'
                  'BEONWEB se réserve le droit de suspendre ou supprimer votre compte en cas de :\n\n'
                  '• Violation des présentes conditions\n'
                  '• Activité suspecte ou frauduleuse\n'
                  '• Inactivité prolongée (plus de 2 ans)\n\n'
                  'Vos données seront supprimées conformément à notre politique de confidentialité.',
            ),
            const SizedBox(height: 20),
            _buildSection(
              title: '8. Modifications',
              content: 'BEONWEB se réserve le droit de modifier ces conditions à tout moment. '
                  'Les modifications seront notifiées dans l\'application.\n\n'
                  'En continuant à utiliser Budget Pro après les modifications, vous acceptez les nouvelles conditions.',
            ),
            const SizedBox(height: 20),
            _buildSection(
              title: '9. Loi Applicable',
              content: 'Ces conditions sont régies par les lois du Cameroun.\n\n'
                  'Tout litige sera soumis aux tribunaux compétents de Yaoundé, Cameroun.',
            ),
            const SizedBox(height: 20),
            _buildSection(
              title: '10. Contact',
              content: 'Pour toute question concernant ces conditions :\n\n'
                  '• Email : support@budgetpro.app\n'
                  '• WhatsApp : +237 6 XX XX XX XX\n'
                  '• Site web : https://www.beonweb.cm',
            ),
            const SizedBox(height: 32),
            Center(
              child: TextButton.icon(
                onPressed: () => Navigator.of(context).pop(),
                icon: const Icon(Icons.arrow_back),
                label: const TrText('Retour'),
                style: TextButton.styleFrom(
                  foregroundColor: _brandPrimary,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection({required String title, required String content}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TrText(
          title,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w800,
            color: _brandPrimary,
          ),
        ),
        const SizedBox(height: 8),
        TrText(
          content,
          style: const TextStyle(
            fontSize: 14,
            height: 1.6,
            color: Colors.black87,
          ),
        ),
      ],
    );
  }
}
