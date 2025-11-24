import 'package:flutter/material.dart';
import '../../constants/app_design.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../auth/auth_screen.dart';
import '../dashboard/dashboard_screen.dart';
import '../accounts/account_management_screen.dart';
import '../budget/budget_planner_screen.dart';
import '../transactions/transaction_form_screen.dart';
import '../goals/goal_funding_screen.dart' show CreateGoalModal;
import '../ious/iou_tracking_screen.dart' show AddIOUModal;
import '../settings/notification_settings_screen.dart';
import '../reports/analysis_hub_screen.dart';
import '../../models/transaction.dart' as app_transaction;
import '../../services/firestore_service.dart';
import '../profile/profile_settings_screen.dart';
import 'package:budget/l10n/app_localizations.dart';
import 'package:provider/provider.dart';
import 'package:provider/provider.dart';

/// Shell de navigation principal avec BottomNavigationBar et menu d'actions rapides
class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _selectedNavIndex = 0;

  @override
  void initState() {
    super.initState();
    // Vérifier si la session démo a expiré
    FirestoreService().checkDemoExpiration();
  }

  // Aligne exactement les index avec la BottomNavigationBar (5 items, slot 2 réservé au FAB)
  final List<Widget> _stackScreens = const [
    DashboardScreen(),                 // 0 Accueil
    BudgetPlannerScreen(),             // 1 Budget
    SizedBox.shrink(),                 // 2 emplacement FAB (non utilisé)
    AccountManagementScreen(),         // 3 Comptes
    AnalysisHubScreen(),               // 4 Analyses & Rapports
  ];

  @override
  Widget build(BuildContext context) {
    final localeProvider = context.watch<LocaleProvider>();

    return Scaffold(
      extendBody: true,
      body: Stack(
        children: [
          SafeArea(
            bottom: false,
            child: IndexedStack(
              index: _selectedNavIndex,
              children: _stackScreens,
            ),
          ),
          // Bouton profil global en haut à droite
          Positioned(
            right: 12,
            top: MediaQuery.of(context).padding.top + 10,
            child: SafeArea(
              child: Material(
                color: Colors.white,
                shape: const CircleBorder(),
                elevation: 4,
                child: IconButton(
                  icon: const Icon(Icons.person_outline_rounded, color: AppDesign.primaryIndigo),
                  tooltip: t('Compte & paramètres'),
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const ProfileSettingsScreen()),
                    );
                  },
                ),
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _selectedNavIndex,
        onTap: (index) {
          // Gérer le clic sur les items (skip l'index 2 car c'est le FAB)
          if (index == 2) {
            _showQuickActionsMenu(context);
          } else {
            setState(() {
              _selectedNavIndex = index;
            });
          }
        },
        type: BottomNavigationBarType.fixed,
        selectedItemColor: const Color(0xFF5E35B1), // Violet premium
        unselectedItemColor: Colors.grey[400],
        selectedFontSize: 12,
        unselectedFontSize: 11,
        elevation: 0,
        backgroundColor: Colors.white,
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.home_outlined),
            activeIcon: const Icon(Icons.home_rounded),
            label: t('Accueil'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.pie_chart_outline_rounded),
            activeIcon: const Icon(Icons.pie_chart_rounded),
            label: t('Budget'),
          ),
          const BottomNavigationBarItem(
            icon: SizedBox.shrink(), // Espace vide pour le FAB
            label: '',
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.account_balance_wallet_outlined),
            activeIcon: const Icon(Icons.account_balance_wallet_rounded),
            label: t('Comptes'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.bar_chart_rounded),
            activeIcon: const Icon(Icons.bar_chart),
            label: t('Analyses'),
          ),
        ],
      ),
      floatingActionButton: Container(
        width: 64,
        height: 64,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: const LinearGradient(
            colors: [
              Color(0xFF5E35B1), // Violet
              Color(0xFF3F51B5), // Bleu
            ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF5E35B1).withValues(alpha: 0.4),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () => _showQuickActionsMenu(context),
            borderRadius: BorderRadius.circular(32),
            child: const Icon(
              Icons.add_rounded,
              color: Colors.white,
              size: 32,
            ),
          ),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
    );
  }

  void _showQuickActionsMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => const QuickActionsMenu(),
    );
  }
}

/// Menu d'actions rapides élégant
class QuickActionsMenu extends StatelessWidget {
  const QuickActionsMenu({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.1),
            blurRadius: 20,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Padding(
          padding: MediaQuery.of(context).viewInsets,
          child: SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Handle bar (poignée pour glisser)
                Container(
                  margin: const EdgeInsets.only(top: 14),
                  width: 48,
                  height: 5,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
                
                // En-tête
                Padding(
                  padding: const EdgeInsets.fromLTRB(24, 20, 16, 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          TrText(
                            'Actions Rapides',
                            style: TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.bold,
                              letterSpacing: -0.5,
                            ),
                          ),
                          SizedBox(height: 4),
                          TrText(
                            'Que souhaitez-vous faire ?',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          shape: BoxShape.circle,
                        ),
                        child: IconButton(
                          icon: const Icon(Icons.close, size: 20),
                          onPressed: () => Navigator.pop(context),
                          color: Colors.grey[700],
                        ),
                      ),
                    ],
                  ),
                ),
                
                // Liste des actions
                Padding(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                  child: Column(
                    children: [
                      _buildActionCard(
                        context: context,
                        icon: Icons.trending_up_rounded,
                        iconColor: AppDesign.incomeColor,
                        iconBackgroundColor: AppDesign.incomeColor.withValues(alpha: 0.12),
                        title: t('Revenu'),
                        description: 'Enregistrez un nouveau revenu...',
                        onTap: () {
                          Navigator.pop(context);
                          Future.microtask(() {
                            Navigator.of(context, rootNavigator: true).push(
                              MaterialPageRoute(
                                builder: (ctx) => const TransactionFormScreen(
                                  transactionType: app_transaction.TransactionType.income,
                                ),
                              ),
                            );
                          });
                        },
                      ),
                      const SizedBox(height: 14),
                      _buildActionCard(
                        context: context,
                        icon: Icons.trending_down_rounded,
                        iconColor: AppDesign.expenseColor,
                        iconBackgroundColor: AppDesign.expenseColor.withValues(alpha: 0.12),
                        title: t('Dépense'),
                        description: 'Suivez instantanément une dépense...',
                        onTap: () {
                          Navigator.pop(context);
                          Future.microtask(() {
                            Navigator.of(context, rootNavigator: true).push(
                              MaterialPageRoute(
                                builder: (ctx) => const TransactionFormScreen(
                                  transactionType: app_transaction.TransactionType.expense,
                                ),
                              ),
                            );
                          });
                        },
                      ),
                      const SizedBox(height: 14),
                      _buildActionCard(
                        context: context,
                        icon: Icons.flag_rounded,
                        iconColor: AppDesign.primaryPurple,
                        iconBackgroundColor: AppDesign.primaryPurple.withValues(alpha: 0.12),
                        title: t('Objectif'),
                        description: 'Définissez un objectif d\'épargne...',
                        onTap: () {
                          Navigator.pop(context);
                          Future.microtask(() {
                            showModalBottomSheet(
                              context: context,
                              useRootNavigator: true,
                              isScrollControlled: true,
                              shape: const RoundedRectangleBorder(
                                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                              ),
                              builder: (modalCtx) => CreateGoalModal(
                                onGoalCreated: (_) {
                                  Navigator.pop(modalCtx);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: TrText('Objectif créé avec succès')),
                                  );
                                },
                              ),
                            );
                          });
                        },
                      ),
                      const SizedBox(height: 14),
                      _buildActionCard(
                        context: context,
                        icon: Icons.handshake_rounded,
                        iconColor: const Color(0xFFFB8C00),
                        iconBackgroundColor: const Color(0xFFFB8C00).withValues(alpha: 0.12),
                        title: t('Dettes'),
                        description: 'Enregistrez un nouvel emprunt...',
                        onTap: () {
                          Navigator.pop(context);
                          Future.microtask(() {
                            showModalBottomSheet(
                              context: context,
                              useRootNavigator: true,
                              isScrollControlled: true,
                              shape: const RoundedRectangleBorder(
                                borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
                              ),
                              builder: (modalCtx) => AddIOUModal(
                                onIOUAdded: (_) {
                                  Navigator.pop(modalCtx);
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(content: TrText('Dette/Créance enregistrée')),
                                  );
                                },
                              ),
                            );
                          });
                        },
                      ),
                      const SizedBox(height: 14),
                      _buildLogoutButton(context),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildActionCard({
    required BuildContext context,
    required IconData icon,
    required Color iconColor,
    required Color iconBackgroundColor,
    required String title,
    required String description,
    required VoidCallback onTap,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: Colors.grey[200]!,
          width: 1,
        ),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(18),
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Row(
              children: [
                // Icône dans cercle coloré
                Container(
                  width: 58,
                  height: 58,
                  decoration: BoxDecoration(
                    color: iconBackgroundColor,
                    shape: BoxShape.circle,
                  ),
                  child: Icon(
                    icon,
                    color: iconColor,
                    size: 28,
                  ),
                ),
                const SizedBox(width: 16),
                
                // Texte
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TrText(
                        title,
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 5),
                      TrText(
                        description,
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey[600],
                          height: 1.3,
                          fontWeight: FontWeight.w500,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(width: 8),
                
                // Flèche
                Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 16,
                  color: Colors.grey[400],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLogoutButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton.icon(
        icon: const Icon(Icons.logout, color: AppDesign.expenseColor),
        label: const TrText(
          'Se déconnecter',
          style: TextStyle(
            color: AppDesign.expenseColor,
            fontWeight: FontWeight.bold,
          ),
        ),
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 14),
          side: const BorderSide(color: AppDesign.expenseColor),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        onPressed: () async {
          Navigator.pop(context);
          await FirestoreService().cleanupDemoDataOnLogout();
          await FirebaseAuth.instance.signOut();
          Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
            MaterialPageRoute(builder: (_) => const AuthScreen()),
            (route) => false,
          );
        },
      ),
    );
  }
}

/// Placeholder simple pour l'onglet Profil (à remplacer par un futur écran dédié)
class ProfilePlaceholderScreen extends StatelessWidget {
  const ProfilePlaceholderScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppDesign.backgroundGrey,
      appBar: AppBar(
        title: const TrText(
          'Profil',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: AppDesign.primaryIndigo,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: Center(
        child: Container(
          margin: const EdgeInsets.all(24),
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: const [
              Icon(Icons.person_outline_rounded, size: 48, color: AppDesign.primaryIndigo),
              SizedBox(height: 12),
              TrText(
                'Profil à venir',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 6),
              TrText(
                'Cet écran sera bientôt personnalisé pour vous.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Écran de profil simple (DEPRECATED - remplacé par ProfileSettingsScreen)
class _ProfileScreen extends StatelessWidget {
  const _ProfileScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppDesign.backgroundGrey,
      appBar: AppBar(
        title: const TrText(
          'Profil',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: AppDesign.primaryIndigo,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // En-tête avec avatar
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: const BoxDecoration(
                color: Colors.white,
              ),
              child: Column(
                children: [
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppDesign.primaryIndigo,
                          AppDesign.primaryPurple,
                        ],
                      ),
                      shape: BoxShape.circle,
                    ),
                    child: const Center(
                      child: TrText(
                        'U',
                        style: TextStyle(
                          fontSize: 48,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  const TrText(
                    'Utilisateur',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  TrText(
                    'user@example.com',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Sections du profil
            _buildSection(
              title: t('Compte'),
              items: [
                _buildListItem(
                  icon: Icons.person_outline,
                  title: t('Informations personnelles'),
                  onTap: () {},
                ),
                _buildListItem(
                  icon: Icons.lock_outline,
                  title: t('Sécurité'),
                  onTap: () {},
                ),
                _buildListItem(
                  icon: Icons.notifications_outlined,
                  title: t('Notifications'),
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const NotificationSettingsScreen(),
                      ),
                    );
                  },
                ),
                _buildListItem(
                  icon: Icons.auto_graph,
                  title: t('Analyses IA'),
                  trailing: const Icon(Icons.stars, size: 16, color: AppDesign.primaryPurple),
                  onTap: () {
                    // Placeholder pour l'écran d'analyse IA
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: TrText('Module IA bientôt disponible')),
                    );
                    /*
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const AIAnalysisScreen(),
                      ),
                    );
                    */
                  },
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            _buildSection(
              title: t('Préférences'),
              items: [
                _buildListItem(
                  icon: Icons.palette_outlined,
                  title: t('Thème'),
                  onTap: () {},
                ),
                _buildListItem(
                  icon: Icons.language,
                  title: t('Langue'),
                  trailing: const TrText('Français'),
                  onTap: () {
                    // TODO: Implement language switcher
                  },
                ),
                _buildListItem(
                  icon: Icons.euro,
                  title: t('Devise'),
                  trailing: const TrText('EUR (€)'),
                  onTap: () {},
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            _buildSection(
              title: t('Support'),
              items: [
                _buildListItem(
                  icon: Icons.help_outline,
                  title: t("Centre d'aide"),
                  onTap: () {},
                ),
                _buildListItem(
                  icon: Icons.info_outline,
                  title: t('À propos'),
                  onTap: () {},
                ),
                _buildListItem(
                  icon: Icons.privacy_tip_outlined,
                  title: t('Politique de confidentialité'),
                  onTap: () {},
                ),
              ],
            ),
            
            const SizedBox(height: 16),
            
            // Bouton de déconnexion
            Padding(
              padding: const EdgeInsets.all(16),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const TrText('Déconnexion'),
                        content: const TrText('Voulez-vous vraiment vous déconnecter ?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: const TrText('Annuler'),
                          ),
                          ElevatedButton(
                            onPressed: () {
                              // TODO: Implémenter la déconnexion
                              Navigator.pop(context);
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppDesign.expenseColor,
                            ),
                            child: const TrText('Déconnexion'),
                          ),
                        ],
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppDesign.expenseColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                  child: const TrText(
                    'Se déconnecter',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Version
            TrText(
              'Version 1.0.0',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[500],
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildSection({
    required String title,
    required List<Widget> items,
  }) {
    return Container(
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: TrText(
              title,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
          ),
          ...items,
        ],
      ),
    );
  }

  Widget _buildListItem({
    required IconData icon,
    required String title,
    Widget? trailing,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: AppDesign.primaryIndigo),
      title: TrText(title),
      trailing: trailing ?? const Icon(Icons.arrow_forward_ios, size: 16),
      onTap: onTap,
    );
  }

  void _showLanguageSheet(
    BuildContext context,
    LocaleProvider localeProvider,
  ) {
    final current = localeProvider.locale.languageCode;

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const TrText(
                'Langue',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              ListTile(
                leading: const Icon(Icons.flag_outlined),
                title: const TrText('Français'),
                trailing: current == 'fr'
                    ? const Icon(Icons.check, color: AppDesign.primaryIndigo)
                    : null,
                onTap: () async {
                  await localeProvider.setLocale(const Locale('fr'));
                  Navigator.pop(sheetContext);
                },
              ),
              ListTile(
                leading: const Icon(Icons.flag_circle_outlined),
                title: const TrText('Anglais'),
                trailing: current == 'en'
                    ? const Icon(Icons.check, color: AppDesign.primaryIndigo)
                    : null,
                onTap: () async {
                  await localeProvider.setLocale(const Locale('en'));
                  Navigator.pop(sheetContext);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
