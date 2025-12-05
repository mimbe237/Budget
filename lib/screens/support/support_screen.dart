import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:budget/l10n/localization_helpers.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/app_settings_service.dart';

class SupportScreen extends StatefulWidget {
  const SupportScreen({super.key});

  @override
  State<SupportScreen> createState() => _SupportScreenState();
}

class _SupportScreenState extends State<SupportScreen> {
  static const Color _brandPrimary = Color(0xFF6C5CF7);
  final _settingsService = AppSettingsService();
  
  String _supportEmail = 'support@budgetpro.app';
  String _whatsappNumber = '+237612345678';
  String _websiteUrl = 'https://www.beonweb.cm';
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    await _settingsService.loadSettings();
    if (mounted) {
      setState(() {
        _supportEmail = _settingsService.supportEmail;
        _whatsappNumber = _settingsService.whatsappNumber;
        _websiteUrl = _settingsService.websiteUrl;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: const TrText('Support & Assistance'),
          backgroundColor: _brandPrimary,
          foregroundColor: Colors.white,
          elevation: 0,
        ),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const TrText('Support & Assistance'),
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
              'Besoin d\'aide ?',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.w900,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 8),
            const TrText(
              'Nous sommes là pour vous aider. Choisissez votre moyen de contact préféré.',
              style: TextStyle(
                fontSize: 14,
                color: Colors.black54,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 32),
            _buildContactCard(
              context: context,
              icon: Icons.email_outlined,
              title: 'Email',
              subtitle: 'Réponse sous 24h',
              value: _supportEmail,
              color: const Color(0xFF0EA5E9),
              onTap: () => _launchEmail(context),
            ),
            const SizedBox(height: 16),
            _buildContactCard(
              context: context,
              icon: Icons.chat_bubble_outline,
              title: 'WhatsApp',
              subtitle: 'Chat en direct',
              value: _whatsappNumber,
              color: const Color(0xFF25D366),
              onTap: () => _launchWhatsApp(context),
            ),
            const SizedBox(height: 16),
            _buildContactCard(
              context: context,
              icon: Icons.language,
              title: 'Site Web',
              subtitle: 'Plus d\'informations',
              value: _websiteUrl,
              color: _brandPrimary,
              onTap: () => _launchWebsite(context),
            ),
            const SizedBox(height: 32),
            const Divider(),
            const SizedBox(height: 24),
            const TrText(
              'Questions Fréquentes',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w800,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 16),
            _buildFAQItem(
              question: 'Comment synchroniser mes données ?',
              answer: 'Vos données se synchronisent automatiquement avec Firebase dès que vous êtes connecté à Internet.',
            ),
            const SizedBox(height: 12),
            _buildFAQItem(
              question: 'Puis-je utiliser l\'app hors ligne ?',
              answer: 'Oui, Budget Pro fonctionne hors ligne. Vos modifications seront synchronisées à la reconnexion.',
            ),
            const SizedBox(height: 12),
            _buildFAQItem(
              question: 'Comment supprimer mon compte ?',
              answer: 'Allez dans Paramètres → Gérer les données → Supprimer mon compte. Cette action est irréversible.',
            ),
            const SizedBox(height: 12),
            _buildFAQItem(
              question: 'Mes données sont-elles sécurisées ?',
              answer: 'Oui, toutes vos données sont chiffrées et stockées sur Firebase (Google Cloud Platform).',
            ),
            const SizedBox(height: 12),
            _buildFAQItem(
              question: 'L\'app est-elle gratuite ?',
              answer: 'Oui, Budget Pro est actuellement gratuit avec toutes les fonctionnalités Premium incluses.',
            ),
            const SizedBox(height: 32),
            Center(
              child: Column(
                children: [
                  const TrText(
                    'Développé avec ❤️ par',
                    style: TextStyle(color: Colors.black54, fontSize: 13),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => _launchWebsite(context),
                    child: const Text(
                      'BEONWEB',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: _brandPrimary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContactCard({
    required BuildContext context,
    required IconData icon,
    required String title,
    required String subtitle,
    required String value,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: color.withOpacity(0.08),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: color,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: Colors.white, size: 24),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  TrText(
                    title,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 2),
                  TrText(
                    subtitle,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 4),
                  GestureDetector(
                    onLongPress: () {
                      Clipboard.setData(ClipboardData(text: value));
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: TrText('$value copié !'),
                          duration: const Duration(seconds: 2),
                        ),
                      );
                    },
                    child: Text(
                      value,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: color,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward_ios, color: color, size: 18),
          ],
        ),
      ),
    );
  }

  Widget _buildFAQItem({required String question, required String answer}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.help_outline, color: _brandPrimary, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: TrText(
                  question,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                    color: Colors.black87,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.only(left: 28),
            child: TrText(
              answer,
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey[700],
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _launchEmail(BuildContext context) async {
    final Uri emailUri = Uri(
      scheme: 'mailto',
      path: _supportEmail,
      query: 'subject=Support Budget Pro',
    );
    try {
      if (await canLaunchUrl(emailUri)) {
        await launchUrl(emailUri);
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: TrText('Impossible d\'ouvrir l\'application email')),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: TrText('Erreur : $e')),
        );
      }
    }
  }

  Future<void> _launchWhatsApp(BuildContext context) async {
    final cleanNumber = _whatsappNumber.replaceAll(RegExp(r'[^0-9]'), '');
    final Uri whatsappUri = Uri.parse('https://wa.me/$cleanNumber?text=Bonjour, j\'ai besoin d\'aide avec Budget Pro');
    try {
      if (await canLaunchUrl(whatsappUri)) {
        await launchUrl(whatsappUri, mode: LaunchMode.externalApplication);
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: TrText('WhatsApp n\'est pas installé')),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: TrText('Erreur : $e')),
        );
      }
    }
  }

  Future<void> _launchWebsite(BuildContext context) async {
    final Uri websiteUri = Uri.parse(_websiteUrl);
    try {
      if (await canLaunchUrl(websiteUri)) {
        await launchUrl(websiteUri, mode: LaunchMode.externalApplication);
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: TrText('Impossible d\'ouvrir le navigateur')),
          );
        }
      }
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: TrText('Erreur : $e')),
        );
      }
    }
  }
}
