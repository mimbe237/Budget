import 'package:flutter/material.dart';
import 'package:budget/l10n/localization_helpers.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  static const Color _brandPrimary = Color(0xFF6C5CF7);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const TrText('Politique de Confidentialité'),
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
              'Politique de Confidentialité',
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
              title: '1. Collecte des Données',
              content: 'Budget Pro collecte uniquement les informations nécessaires au fonctionnement de l\'application :\n\n'
                  '• Email et mot de passe (authentification Firebase)\n'
                  '• Numéro WhatsApp (optionnel, pour le support)\n'
                  '• Données financières (transactions, budgets, objectifs)\n'
                  '• Préférences (langue, devise, thème)\n\n'
                  'Toutes vos données financières sont stockées de manière sécurisée sur Firebase Cloud Firestore.',
            ),
            const SizedBox(height: 20),
            _buildSection(
              title: '2. Utilisation des Données',
              content: 'Vos données sont utilisées exclusivement pour :\n\n'
                  '• Fournir les fonctionnalités de l\'application\n'
                  '• Générer des rapports et analyses personnalisés\n'
                  '• Synchroniser vos données entre appareils\n'
                  '• Améliorer l\'expérience utilisateur\n\n'
                  'Nous ne vendons jamais vos données à des tiers.',
            ),
            const SizedBox(height: 20),
            _buildSection(
              title: '3. Sécurité',
              content: 'Budget Pro utilise Firebase Authentication et Cloud Firestore pour garantir la sécurité de vos données :\n\n'
                  '• Chiffrement des données en transit (HTTPS/TLS)\n'
                  '• Authentification sécurisée par Firebase\n'
                  '• Règles de sécurité Firestore strictes\n'
                  '• Accès limité aux données (uniquement votre compte)',
            ),
            const SizedBox(height: 20),
            _buildSection(
              title: '4. Partage des Données',
              content: 'Vos données personnelles ne sont partagées qu\'avec :\n\n'
                  '• Firebase (Google Cloud Platform) - hébergement sécurisé\n'
                  '• Aucun tiers commercial ou publicitaire\n\n'
                  'Budget Pro ne contient aucune publicité et ne monétise pas vos données.',
            ),
            const SizedBox(height: 20),
            _buildSection(
              title: '5. Vos Droits',
              content: 'Conformément au RGPD, vous disposez des droits suivants :\n\n'
                  '• Droit d\'accès à vos données\n'
                  '• Droit de rectification\n'
                  '• Droit de suppression (depuis les Paramètres)\n'
                  '• Droit à la portabilité (export CSV/PDF)\n'
                  '• Droit d\'opposition\n\n'
                  'Pour exercer ces droits, contactez-nous via l\'application.',
            ),
            const SizedBox(height: 20),
            _buildSection(
              title: '6. Cookies et Tracking',
              content: 'Budget Pro n\'utilise aucun cookie de tracking publicitaire. Les seuls cookies utilisés sont :\n\n'
                  '• Cookies de session Firebase (authentification)\n'
                  '• Préférences locales (langue, thème)\n\n'
                  'Aucun tracking analytics tiers n\'est implémenté.',
            ),
            const SizedBox(height: 20),
            _buildSection(
              title: '7. Contact',
              content: 'Pour toute question concernant cette politique de confidentialité :\n\n'
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
