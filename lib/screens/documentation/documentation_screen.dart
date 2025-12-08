import 'package:flutter/material.dart';
import 'package:budget/l10n/localization_helpers.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../providers/locale_provider.dart';
import '../../services/app_settings_service.dart';

class DocumentationScreen extends StatefulWidget {
  const DocumentationScreen({super.key});

  @override
  State<DocumentationScreen> createState() => _DocumentationScreenState();
}

class _DocumentationScreenState extends State<DocumentationScreen> {
  int _selectedTabIndex = 0;
  final AppSettingsService _settingsService = AppSettingsService();

  @override
  Widget build(BuildContext context) {
    final langCode = context.read<LocaleProvider>().locale.languageCode;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    const primary = Color(0xFF6C5CF7);
    const secondary = Color(0xFF00D9FF);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Documentation'),
        centerTitle: true,
        elevation: 0,
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              primary.withOpacity(0.08),
              secondary.withOpacity(0.05),
              Colors.white,
            ],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 1080),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: 8),
                    _buildHeroHeader(langCode),
                    const SizedBox(height: 12),
                    Card(
                      elevation: 3,
                      shadowColor: Colors.black12,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        child: SingleChildScrollView(
                          scrollDirection: Axis.horizontal,
                          child: Row(
                            children: [
                              _buildTab(0, '📖 Guide', context),
                              _buildTab(1, '❓ FAQ', context),
                              _buildTab(2, '💡 Tutoriels', context),
                              _buildTab(3, '🔧 Dépannage', context),
                              _buildTab(4, '⚙️ Paramètres', context),
                              _buildTab(5, 'ℹ️ À propos', context),
                            ],
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Expanded(
                      child: SingleChildScrollView(
                        padding: const EdgeInsets.fromLTRB(4, 8, 4, 16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Card(
                              elevation: 3,
                              shadowColor: Colors.black12,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                              child: Padding(
                                padding: const EdgeInsets.all(18.0),
                                child: _buildTabContent(_selectedTabIndex, langCode),
                              ),
                            ),
                            const SizedBox(height: 20),
                            _buildSignature(),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeroHeader(String langCode) {
    final isFr = langCode == 'fr';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          isFr ? 'Ressources & Support' : 'Resources & Support',
          style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 4),
        Text(
          isFr
              ? 'Guides, tutoriels, dépannage et paramètres en un seul endroit.'
              : 'Guides, tutorials, troubleshooting and settings in one place.',
          style: TextStyle(fontSize: 14, color: Colors.grey[700]),
        ),
      ],
    );
  }

  Widget _buildSignature() {
    return GestureDetector(
      onTap: () {
        final url = _settingsService.websiteUrl;
        if (url.isNotEmpty) {
          launchUrl(
            Uri.parse(url),
            mode: LaunchMode.externalApplication,
          );
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: const Color(0xFF6C5CF7).withOpacity(0.08),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: const Color(0xFF6C5CF7).withOpacity(0.2),
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'BEONWEB • ',
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: Color(0xFF6C5CF7),
              ),
            ),
            Text(
              'Support & Site',
              style: TextStyle(fontSize: 13, color: Colors.grey[700]),
            ),
            const SizedBox(width: 6),
            Icon(
              Icons.open_in_new,
              size: 14,
              color: Colors.grey[700],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTab(int index, String label, BuildContext context) {
    final isSelected = _selectedTabIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedTabIndex = index),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF6C5CF7).withOpacity(0.14) : Colors.transparent,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? const Color(0xFF6C5CF7) : Colors.grey.withOpacity(0.25),
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
            color: isSelected ? const Color(0xFF6C5CF7) : Colors.grey[800],
          ),
        ),
      ),
    );
  }

  Widget _buildTabContent(int index, String langCode) {
    switch (index) {
      case 0:
        return _buildGuide(langCode);
      case 1:
        return _buildFAQ(langCode);
      case 2:
        return _buildTutorials(langCode);
      case 3:
        return _buildTroubleshooting(langCode);
      case 4:
        return _buildSettings(langCode);
      case 5:
        return _buildAbout(langCode);
      default:
        return const SizedBox.shrink();
    }
  }

  Widget _buildGuide(String langCode) {
    final isFr = langCode == 'fr';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle(isFr ? '📋 Guide Complet' : '📋 Complete Guide'),
        const SizedBox(height: 16),
        _buildDocSection(
          title: isFr ? '1. Créer un Budget' : '1. Create a Budget',
          content: isFr
              ? 'Allez dans l\'onglet Budgets et cliquez sur "Ajouter un budget". Définissez votre allocation mensuelle par catégorie (Alimentation, Transport, Loisirs, etc.).'
              : 'Go to the Budgets tab and click "Add Budget". Set your monthly allocation by category (Food, Transport, Entertainment, etc.).',
        ),
        const SizedBox(height: 16),
        _buildDocSection(
          title: isFr ? '2. Enregistrer une Transaction' : '2. Record a Transaction',
          content: isFr
              ? 'Accédez à l\'onglet Transactions et appuyez sur "+". Choisissez le type (Dépense/Revenu), la catégorie et le montant. Les transactions sont automatiquement sauvegardées.'
              : 'Go to Transactions tab and press "+". Choose the type (Expense/Income), category and amount. Transactions are automatically saved.',
        ),
        const SizedBox(height: 16),
        _buildDocSection(
          title: isFr ? '3. Visualiser vos Dépenses' : '3. Visualize Your Spending',
          content: isFr
              ? 'Le Tableau de bord affiche un aperçu avec graphiques. Vous pouvez voir vos dépenses par catégorie et comparer avec votre budget.'
              : 'The Dashboard shows an overview with charts. You can see your expenses by category and compare with your budget.',
        ),
        const SizedBox(height: 16),
        _buildDocSection(
          title: isFr ? '4. Gérer Plusieurs Devises' : '4. Manage Multiple Currencies',
          content: isFr
              ? 'Dans les paramètres, changez votre devise par défaut. L\'app convertit automatiquement les montants pour afficher le total.'
              : 'In settings, change your default currency. The app automatically converts amounts to display the total.',
        ),
        const SizedBox(height: 16),
        _buildDocSection(
          title: isFr ? '5. Exporter vos Données' : '5. Export Your Data',
          content: isFr
              ? 'Allez dans Paramètres > Données et téléchargez vos transactions en CSV ou PDF pour l\'analyse externe.'
              : 'Go to Settings > Data and download your transactions as CSV or PDF for external analysis.',
        ),
        const SizedBox(height: 24),
        _buildInfoBox(
          isFr
              ? '✨ Conseil: Définissez vos budgets au début du mois et vérifiez votre progression chaque semaine.'
              : '✨ Tip: Set your budgets at the start of the month and check your progress every week.',
        ),
      ],
    );
  }

  Widget _buildFAQ(String langCode) {
    final isFr = langCode == 'fr';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle(isFr ? '❓ Questions Fréquentes' : '❓ Frequently Asked Questions'),
        const SizedBox(height: 16),
        _buildFAQItem(
          question: isFr ? 'Comment changer ma devise ?' : 'How do I change my currency?',
          answer: isFr
              ? 'Allez dans l\'app > Paramètres > Devise. Sélectionnez la devise de votre choix parmi les 180+ devises supportées.'
              : 'Go to App > Settings > Currency. Select your preferred currency from 180+ supported currencies.',
        ),
        const SizedBox(height: 12),
        _buildFAQItem(
          question: isFr ? 'Puis-je supprimer une transaction ?' : 'Can I delete a transaction?',
          answer: isFr
              ? 'Oui, appuyez longuement sur une transaction et sélectionnez "Supprimer". Vous pouvez annuler l\'action dans les 5 secondes.'
              : 'Yes, long press on a transaction and select "Delete". You can undo within 5 seconds.',
        ),
        const SizedBox(height: 12),
        _buildFAQItem(
          question: isFr ? 'Mes données sont-elles sécurisées ?' : 'Are my data secure?',
          answer: isFr
              ? 'Oui, toutes vos données sont chiffrées et stockées sur Firebase. Nous ne partageons jamais vos informations personnelles.'
              : 'Yes, all your data is encrypted and stored on Firebase. We never share your personal information.',
        ),
        const SizedBox(height: 12),
        _buildFAQItem(
          question: isFr ? 'Puis-je exporter mes données ?' : 'Can I export my data?',
          answer: isFr
              ? 'Oui, dans Paramètres > Données, vous pouvez exporter en CSV, JSON ou PDF à tout moment.'
              : 'Yes, in Settings > Data, you can export as CSV, JSON or PDF anytime.',
        ),
        const SizedBox(height: 12),
        _buildFAQItem(
          question: isFr ? 'Comment synchroniser entre appareils ?' : 'How do I sync between devices?',
          answer: isFr
              ? 'Connectez-vous avec le même compte Firebase sur chaque appareil. Vos données se synchronisent automatiquement en temps réel.'
              : 'Sign in with the same Firebase account on each device. Your data syncs automatically in real-time.',
        ),
      ],
    );
  }

  Widget _buildTutorials(String langCode) {
    final isFr = langCode == 'fr';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle(isFr ? '💡 Tutoriels Étape par Étape' : '💡 Step-by-Step Tutorials'),
        const SizedBox(height: 8),
        Text(
          isFr
              ? 'Suivez des parcours courts pour maîtriser la configuration, les transactions et l’analyse.'
              : 'Follow short tracks to master setup, transactions, and analysis.',
          style: TextStyle(color: Colors.grey[700], fontSize: 13),
        ),
        const SizedBox(height: 16),
        _buildTutorial(
          title: isFr ? '🎯 Débuter en 5 Minutes' : '🎯 Get Started in 5 Minutes',
          steps: isFr
              ? [
                  '1. Créez votre compte avec votre email',
                  '2. Sélectionnez votre pays et devise',
                  '3. Définissez votre budget mensuel',
                  '4. Ajoutez votre première transaction',
                  '5. Consultez votre tableau de bord',
                ]
              : [
                  '1. Create your account with your email',
                  '2. Select your country and currency',
                  '3. Set your monthly budget',
                  '4. Add your first transaction',
                  '5. Check your dashboard',
                ],
        ),
        const SizedBox(height: 16),
        _buildTutorial(
          title: isFr ? '📊 Analyser vos Dépenses' : '📊 Analyze Your Spending',
          steps: isFr
              ? [
                  '1. Allez au Tableau de bord',
                  '2. Regardez le graphique en camembert',
                  '3. Analysez le rapport budget/réalisé',
                  '4. Identifiez les catégories de surspend',
                  '5. Ajustez votre budget le mois suivant',
                ]
              : [
                  '1. Go to Dashboard',
                  '2. Look at the pie chart',
                  '3. Analyze budget vs actual ratio',
                  '4. Identify overspending categories',
                  '5. Adjust your budget next month',
                ],
        ),
        const SizedBox(height: 16),
        _buildTutorial(
          title: isFr ? '🔒 Sécuriser votre Compte' : '🔒 Secure Your Account',
          steps: isFr
              ? [
                  '1. Utilisez un mot de passe fort (8+ caractères)',
                  '2. Activez l\'authentification 2FA si disponible',
                  '3. Gardez votre email à jour',
                  '4. Ne partagez jamais votre mot de passe',
                  '5. Connectez-vous régulièrement',
                ]
              : [
                  '1. Use a strong password (8+ characters)',
                  '2. Enable 2FA authentication if available',
                  '3. Keep your email updated',
                  '4. Never share your password',
                  '5. Log in regularly',
                ],
        ),
      ],
    );
  }

  Widget _buildSettings(String langCode) {
    final isFr = langCode == 'fr';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle(isFr ? '⚙️ Paramètres & Configuration' : '⚙️ Settings & Configuration'),
        const SizedBox(height: 16),
        _buildSettingsItem(
          icon: Icons.language,
          title: isFr ? 'Langue' : 'Language',
          description: isFr
              ? 'Changez la langue de l\'interface entre Français et Anglais'
              : 'Switch between French and English interface',
        ),
        const SizedBox(height: 12),
        _buildSettingsItem(
          icon: Icons.currency_exchange,
          title: isFr ? 'Devise' : 'Currency',
          description: isFr
              ? 'Choisissez votre devise par défaut parmi 180+ options'
              : 'Choose your default currency from 180+ options',
        ),
        const SizedBox(height: 12),
        _buildSettingsItem(
          icon: Icons.notifications,
          title: isFr ? 'Notifications' : 'Notifications',
          description: isFr
              ? 'Activez les alertes budget et rappels de transaction'
              : 'Enable budget alerts and transaction reminders',
        ),
        const SizedBox(height: 12),
        _buildSettingsItem(
          icon: Icons.dark_mode,
          title: isFr ? 'Thème Sombre' : 'Dark Theme',
          description: isFr
              ? 'Passez au mode sombre pour réduire la fatigue oculaire'
              : 'Switch to dark mode to reduce eye strain',
        ),
        const SizedBox(height: 12),
        _buildSettingsItem(
          icon: Icons.backup,
          title: isFr ? 'Sauvegarde' : 'Backup',
          description: isFr
              ? 'Sauvegardez automatiquement vos données tous les jours'
              : 'Automatically backup your data daily',
        ),
        const SizedBox(height: 12),
        _buildSettingsItem(
          icon: Icons.verified_user,
          title: isFr ? 'Confidentialité' : 'Privacy',
          description: isFr
              ? 'Gérez vos paramètres de confidentialité et de données'
              : 'Manage your privacy and data settings',
        ),
        const SizedBox(height: 24),
        _buildInfoBox(
          isFr
              ? '💾 Vos données sont synchronisées en temps réel sur tous vos appareils.'
              : '💾 Your data is synced in real-time across all your devices.',
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.bold,
        color: Color(0xFF6C5CF7),
      ),
    );
  }

  Widget _buildDocSection({required String title, required String content}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF6C5CF7).withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: const Color(0xFF6C5CF7).withOpacity(0.3),
            ),
          ),
          child: Text(
            content,
            style: const TextStyle(
              fontSize: 14,
              color: Colors.black87,
              height: 1.5,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFAQItem({required String question, required String answer}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            question,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Color(0xFF6C5CF7),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            answer,
            style: const TextStyle(
              fontSize: 13,
              color: Colors.black87,
              height: 1.4,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTutorial({required String title, required List<String> steps}) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.blue.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.blue.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: Colors.blue,
            ),
          ),
          const SizedBox(height: 12),
          ...steps.map((step) => Padding(
            padding: const EdgeInsets.symmetric(vertical: 4),
            child: Text(
              step,
              style: const TextStyle(
                fontSize: 13,
                color: Colors.black87,
                height: 1.4,
              ),
            ),
          )),
        ],
      ),
    );
  }

  Widget _buildSettingsItem({
    required IconData icon,
    required String title,
    required String description,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.green.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.green.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.green, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: const TextStyle(
                    fontSize: 12,
                    color: Colors.grey,
                    height: 1.3,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoBox(String content) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.amber.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.amber.withOpacity(0.5)),
      ),
      child: Text(
        content,
        style: const TextStyle(
          fontSize: 13,
          color: Colors.black87,
          height: 1.4,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }

  Widget _buildTroubleshooting(String langCode) {
    final isFr = langCode == 'fr';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle(isFr ? '🔧 Dépannage' : '🔧 Troubleshooting'),
        const SizedBox(height: 16),
        _buildTroubleshootingItem(
          problem: isFr ? '❌ Impossible de se connecter' : '❌ Cannot log in',
          solution: isFr
              ? '1. Vérifiez votre connexion Internet\n2. Assurez-vous que le Caps Lock est désactivé\n3. Réinitialisez votre mot de passe avec "Mot de passe oublié"\n4. Videz le cache de l\'app'
              : '1. Check your Internet connection\n2. Make sure Caps Lock is off\n3. Reset your password using "Forgot password"\n4. Clear app cache',
        ),
        const SizedBox(height: 12),
        _buildTroubleshootingItem(
          problem: isFr ? '❌ Les données ne se synchronisent pas' : '❌ Data not syncing',
          solution: isFr
              ? '1. Vérifiez votre connexion Internet\n2. Fermez et rouvrez l\'app\n3. Vérifiez que vous êtes connecté au bon compte\n4. Vérifiez les permissions de l\'app'
              : '1. Check your Internet connection\n2. Close and reopen the app\n3. Verify you\'re logged into the correct account\n4. Check app permissions',
        ),
        const SizedBox(height: 12),
        _buildTroubleshootingItem(
          problem: isFr ? '❌ Erreur lors de l\'ajout d\'une transaction' : '❌ Error adding transaction',
          solution: isFr
              ? '1. Vérifiez que tous les champs sont remplis\n2. Vérifiez que le montant est valide\n3. Vérifiez votre connexion Internet\n4. Réessayez après quelques secondes'
              : '1. Verify all fields are filled\n2. Verify the amount is valid\n3. Check your Internet connection\n4. Retry after a few seconds',
        ),
        const SizedBox(height: 12),
        _buildTroubleshootingItem(
          problem: isFr ? '❌ L\'app est lente' : '❌ App is slow',
          solution: isFr
              ? '1. Fermez les autres apps\n2. Redémarrez votre appareil\n3. Videz le cache: Paramètres > Stockage > Vider le cache\n4. Mettez à jour l\'app vers la dernière version'
              : '1. Close other apps\n2. Restart your device\n3. Clear cache: Settings > Storage > Clear Cache\n4. Update app to latest version',
        ),
        const SizedBox(height: 12),
        _buildTroubleshootingItem(
          problem: isFr ? '❌ Graphiques vides ou incorrects' : '❌ Empty or incorrect charts',
          solution: isFr
              ? '1. Assurez-vous d\'avoir ajouté des transactions\n2. Vérifiez la plage de dates sélectionnée\n3. Vérifiez que le budget est défini\n4. Rafraîchissez l\'écran (glissez vers le bas)'
              : '1. Ensure you\'ve added transactions\n2. Check the selected date range\n3. Verify budget is set\n4. Refresh the screen (pull down)',
        ),
        const SizedBox(height: 24),
        _buildInfoBox(
          isFr
              ? '💬 Si le problème persiste, contactez le support via WhatsApp en cliquant sur "WhatsApp Support" dans l\'accueil.'
              : '💬 If the issue persists, contact support via WhatsApp by clicking "WhatsApp Support" on the home page.',
        ),
      ],
    );
  }

  Widget _buildTroubleshootingItem({
    required String problem,
    required String solution,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.red.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.red.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            problem,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.red,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            solution,
            style: const TextStyle(
              fontSize: 13,
              color: Colors.black87,
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAbout(String langCode) {
    final isFr = langCode == 'fr';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildSectionTitle(isFr ? 'ℹ️ À propos de Budget' : 'ℹ️ About Budget'),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF6C5CF7).withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: const Color(0xFF6C5CF7).withOpacity(0.3),
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isFr ? '💰 Budget Intelligent' : '💰 Intelligent Budget',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF6C5CF7),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                isFr
                    ? 'Version 1.0.0 • Développé avec passion pour vous aider à gérer vos finances'
                    : 'Version 1.0.0 • Built with passion to help you manage your finances',
                style: const TextStyle(
                  fontSize: 13,
                  color: Colors.black87,
                  height: 1.5,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        _buildAboutSection(
          title: isFr ? '✨ Caractéristiques Principales' : '✨ Key Features',
          items: isFr
              ? [
                  '✓ Gestion de budgets multi-catégories',
                  '✓ Suivi en temps réel des dépenses',
                  '✓ Support de 180+ devises',
                  '✓ Graphiques et analyses détaillés',
                  '✓ Synchronisation multi-appareils',
                  '✓ Données chiffrées et sécurisées',
                  '✓ Interface multilingue (FR/EN)',
                  '✓ Export de données (CSV, PDF, JSON)',
                ]
              : [
                  '✓ Multi-category budget management',
                  '✓ Real-time expense tracking',
                  '✓ Support for 180+ currencies',
                  '✓ Detailed charts and analytics',
                  '✓ Multi-device synchronization',
                  '✓ Encrypted and secure data',
                  '✓ Multilingual interface (FR/EN)',
                  '✓ Data export (CSV, PDF, JSON)',
                ],
        ),
        const SizedBox(height: 20),
        _buildAboutSection(
          title: isFr ? '🔒 Sécurité & Confidentialité' : '🔒 Security & Privacy',
          items: isFr
              ? [
                  '• Authentification Firebase sécurisée',
                  '• Chiffrement des données en transit et au repos',
                  '• Pas de partage de données personnelles',
                  '• Conformité RGPD',
                  '• Sauvegardes automatiques',
                  '• Contrôle total sur vos données',
                ]
              : [
                  '• Secure Firebase authentication',
                  '• Data encryption in transit and at rest',
                  '• No personal data sharing',
                  '• GDPR compliant',
                  '• Automatic backups',
                  '• Full control over your data',
                ],
        ),
        const SizedBox(height: 20),
        _buildAboutSection(
          title: isFr ? '👥 Nous Contacter' : '👥 Contact Us',
          items: isFr
              ? [
                  '📧 Email: support@budgetapp.com',
                  '💬 WhatsApp: Disponible dans l\'app',
                  '🐛 Signaler un bug: Via le formulaire de support',
                  '💡 Suggestion: Partagez vos idées avec nous',
                ]
              : [
                  '📧 Email: support@budgetapp.com',
                  '💬 WhatsApp: Available in the app',
                  '🐛 Report a bug: Via the support form',
                  '💡 Suggestion: Share your ideas with us',
                ],
        ),
        const SizedBox(height: 20),
        _buildInfoBox(
          isFr
              ? '❤️ Merci d\'utiliser Budget! Vos retours nous aident à nous améliorer continuellement.'
              : '❤️ Thank you for using Budget! Your feedback helps us improve continuously.',
        ),
        const SizedBox(height: 20),
        Center(
          child: Text(
            isFr
                ? '© 2025 Budget App. Tous droits réservés.'
                : '© 2025 Budget App. All rights reserved.',
            style: const TextStyle(
              fontSize: 12,
              color: Colors.grey,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAboutSection({
    required String title,
    required List<String> items,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF6C5CF7),
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: items
                .map((item) => Padding(
              padding: const EdgeInsets.symmetric(vertical: 6),
              child: Text(
                item,
                style: const TextStyle(
                  fontSize: 13,
                  color: Colors.black87,
                  height: 1.4,
                ),
              ),
            ))
                .toList(),
          ),
        ),
      ],
    );
  }
}
