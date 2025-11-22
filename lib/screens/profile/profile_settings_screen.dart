import 'package:flutter/material.dart';
import '../../constants/app_design.dart';
import '../../services/notification_service.dart';
import '../../services/mock_data_service.dart';
import '../../services/firestore_service.dart';
import '../../models/user_profile.dart';
import '../settings/notification_settings_screen.dart';
import '../admin/admin_dashboard_screen.dart';
import '../onboarding/onboarding_wizard_screen.dart';
import '../auth/auth_screen.dart';
import '../../widgets/revolutionary_logo.dart';

/// Écran de profil et paramètres utilisateur
/// Affiche les informations du profil et permet de gérer les préférences
class ProfileSettingsScreen extends StatefulWidget {
  const ProfileSettingsScreen({super.key});

  @override
  State<ProfileSettingsScreen> createState() => _ProfileSettingsScreenState();
}

class _ProfileSettingsScreenState extends State<ProfileSettingsScreen> {
  final NotificationService _notificationService = NotificationService.instance;
  final MockDataService _dataService = MockDataService();
  
  UserProfile? _userProfile;
  bool _isLoading = true;

  // États des notifications (synchronisés avec NotificationService)
  bool _dailyReminderEnabled = true;
  bool _budgetAlertsEnabled = true;
  bool _goalAlertsEnabled = true;
  double _budgetAlertThreshold = 0.85;

  // Devise actuelle
  String _currentCurrency = 'EUR (€)';

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
    _loadNotificationPreferences();
  }

  /// Charge le profil utilisateur
  Future<void> _loadUserProfile() async {
    setState(() {
      _isLoading = true;
    });

    try {
      _userProfile = await _dataService.getUserProfile();
    } catch (e) {
      debugPrint('Erreur lors du chargement du profil: $e');
    }

    setState(() {
      _isLoading = false;
    });
  }

  /// Charge les préférences de notification
  Future<void> _loadNotificationPreferences() async {
    // TODO: Charger depuis SharedPreferences en production
    // Pour l'instant, on utilise les valeurs par défaut
    setState(() {
      _dailyReminderEnabled = true;
      _budgetAlertsEnabled = _notificationService.budgetAlertsEnabled;
      _budgetAlertThreshold = _notificationService.budgetAlertThreshold;
      _goalAlertsEnabled = true;
    });
  }

  /// Sauvegarde une préférence de notification
  Future<void> _saveNotificationPreference(String key, bool value) async {
    // TODO: Sauvegarder dans SharedPreferences en production
    // await SharedPreferences.getInstance().then((prefs) => prefs.setBool(key, value));
    debugPrint('Préférence sauvegardée: $key = $value');
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        backgroundColor: AppDesign.backgroundGrey,
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: AppDesign.backgroundGrey,
      body: CustomScrollView(
        slivers: [
          // AppBar avec profil
          _buildSliverAppBar(),
          
          // Contenu
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  const SizedBox(height: 24),
                  
                  // Section 2 : Centre de Notifications
                  _buildSectionHeader('Notifications'),
                  _buildNotificationSection(),
                  
                  const SizedBox(height: 24),
                  
                  // Section 3 : Système & Compte
                  _buildSectionHeader('Système & Compte'),
                  _buildSystemSection(),
                  
                  const SizedBox(height: 24),
                  
                  // Bouton Admin (conditionnel)
                  if (_userProfile?.role == 'admin') ...[
                    _buildSectionHeader('Administration'),
                    _buildAdminSection(),
                    const SizedBox(height: 24),
                  ],
                  
                  // Bouton Déconnexion
                  _buildLogoutButton(),
                  
                  const SizedBox(height: 32),

                  ..._systemExtras(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _systemExtras() {
    final items = <Widget>[];
    if (FirestoreService().isCurrentUserDemo) {
      items.add(const Divider(height: 1, indent: 72));
      items.add(
        ListTile(
          leading: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.redAccent.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Icon(
              Icons.cleaning_services_outlined,
              color: Colors.redAccent,
              size: 24,
            ),
          ),
          title: const Text(
            'Purger les données démo',
            style: TextStyle(
              fontWeight: FontWeight.w700,
            ),
          ),
          subtitle: const Text(
            'Efface toutes les données démo puis déconnecte.',
            style: TextStyle(fontSize: 12),
          ),
          trailing: const Icon(Icons.warning_amber, color: Colors.redAccent),
          onTap: () async {
            await FirestoreService().cleanupDemoDataOnLogout();
            await FirestoreService().logout();
            if (!mounted) return;
            Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
              MaterialPageRoute(builder: (_) => const AuthScreen()),
              (route) => false,
            );
          },
        ),
      );
    }
    return items;
  }

  /// AppBar avec en-tête profil
  Widget _buildSliverAppBar() {
    final first = _userProfile?.firstName ?? '';
    final last = _userProfile?.lastName ?? '';
    final display = _userProfile?.displayName ?? 'Utilisateur';

    final initials = (first.isNotEmpty || last.isNotEmpty)
        ? '${first.isNotEmpty ? first[0] : ''}${last.isNotEmpty ? last[0] : ''}'.toUpperCase()
        : display.isNotEmpty
            ? display[0].toUpperCase()
            : 'U';
    
    final fullName = (first.isNotEmpty || last.isNotEmpty)
        ? '$first $last'.trim()
        : display;
    
    final status = _userProfile?.role == 'admin'
        ? 'Administrateur'
        : _userProfile?.role == 'premium'
            ? 'Membre Premium'
            : 'Utilisateur Actif';

    return SliverAppBar(
      expandedHeight: 240,
      floating: false,
      pinned: true,
      title: const RevolutionaryLogo(size: 32),
      backgroundColor: AppDesign.primaryIndigo,
      elevation: 0,
      flexibleSpace: FlexibleSpaceBar(
        background: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [AppDesign.primaryIndigo, AppDesign.primaryPurple],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: SafeArea(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 40),
                
                // Avatar
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.white,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.2),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      initials,
                      style: const TextStyle(
                        fontSize: 40,
                        fontWeight: FontWeight.bold,
                        color: AppDesign.primaryIndigo,
                      ),
                    ),
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Nom
                Text(
                  fullName,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                
                const SizedBox(height: 6),
                
                // Statut
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        _userProfile?.role == 'admin'
                            ? Icons.admin_panel_settings
                            : _userProfile?.role == 'premium'
                                ? Icons.workspace_premium
                                : Icons.person,
                        color: Colors.white,
                        size: 16,
                      ),
                      const SizedBox(width: 6),
                      Text(
                        status,
                        style: const TextStyle(
                          fontSize: 14,
                          color: Colors.white,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  /// En-tête de section
  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Colors.grey,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  /// Section des notifications
  Widget _buildNotificationSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Rappel quotidien
          SwitchListTile(
            secondary: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppDesign.primaryIndigo.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.notifications_active,
                color: AppDesign.primaryIndigo,
                size: 24,
              ),
            ),
            title: const Text(
              'Bilan de fin de journée',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
            subtitle: const Text(
              'Notification à 20h pour saisir vos dépenses',
              style: TextStyle(fontSize: 13),
            ),
            value: _dailyReminderEnabled,
            activeTrackColor: AppDesign.primaryIndigo,
            activeThumbColor: AppDesign.primaryIndigo,
            onChanged: (value) async {
              setState(() {
                _dailyReminderEnabled = value;
              });
              
              await _notificationService.setDailyRemindersEnabled(value);
              await _saveNotificationPreference('daily_reminder', value);
              
              if (value) {
                await _notificationService.scheduleDailyReminder(
                  const TimeOfDay(hour: 20, minute: 0),
                );
                
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Rappel quotidien activé à 20h'),
                      duration: Duration(seconds: 2),
                    ),
                  );
                }
              }
            },
          ),
          
          const Divider(height: 1, indent: 72),
          
          // Alerte budget
          SwitchListTile(
            secondary: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppDesign.expenseColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.warning_amber_rounded,
                color: AppDesign.expenseColor,
                size: 24,
              ),
            ),
            title: const Text(
              'Dépassement de Budget',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
            subtitle: const Text(
              'Alerte immédiate si une catégorie passe au rouge',
              style: TextStyle(fontSize: 13),
            ),
            value: _budgetAlertsEnabled,
            activeTrackColor: AppDesign.primaryIndigo,
            activeThumbColor: AppDesign.primaryIndigo,
            onChanged: (value) async {
              setState(() {
                _budgetAlertsEnabled = value;
              });
              
              await _notificationService.setBudgetAlertsEnabled(value);
              await _saveNotificationPreference('budget_alerts', value);
              
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      value
                          ? 'Alertes budget activées'
                          : 'Alertes budget désactivées',
                    ),
                    duration: const Duration(seconds: 2),
                  ),
                );
              }
            },
          ),
          if (_budgetAlertsEnabled)
            Padding(
              padding: const EdgeInsets.fromLTRB(72, 0, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Seuil d\'alerte',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
                      Text(
                        '${(_budgetAlertThreshold * 100).toStringAsFixed(0)}%',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                  Slider(
                    value: _budgetAlertThreshold,
                    min: 0.5,
                    max: 1.2,
                    divisions: 7,
                    label: '${(_budgetAlertThreshold * 100).toStringAsFixed(0)}%',
                    onChanged: (v) {
                      setState(() => _budgetAlertThreshold = v);
                    },
                    onChangeEnd: (v) async {
                      await _notificationService.setBudgetAlertThreshold(v);
                    },
                    activeColor: AppDesign.expenseColor,
                    inactiveColor: AppDesign.expenseColor.withValues(alpha: 0.2),
                  ),
                  const Text(
                    'Alerte quand une poche dépasse ce pourcentage de son budget.',
                    style: TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                ],
              ),
            ),
          
          const Divider(height: 1, indent: 72),
          
          // Objectifs
          SwitchListTile(
            secondary: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppDesign.incomeColor.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.emoji_events,
                color: AppDesign.incomeColor,
                size: 24,
              ),
            ),
            title: const Text(
              'Succès d\'Épargne',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
            subtitle: const Text(
              'Célébration quand un objectif est atteint',
              style: TextStyle(fontSize: 13),
            ),
            value: _goalAlertsEnabled,
            activeTrackColor: AppDesign.primaryIndigo,
            activeThumbColor: AppDesign.primaryIndigo,
            onChanged: (value) async {
              setState(() {
                _goalAlertsEnabled = value;
              });
              
              await _notificationService.setGoalAlertsEnabled(value);
              await _saveNotificationPreference('goal_alerts', value);
              
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(
                      value
                          ? 'Alertes objectifs activées'
                          : 'Alertes objectifs désactivées',
                    ),
                    duration: const Duration(seconds: 2),
                  ),
                );
              }
            },
          ),
          
          const Divider(height: 1, indent: 72),
          
          // Lien vers paramètres avancés
          ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                Icons.tune,
                color: Colors.grey[700],
                size: 24,
              ),
            ),
            title: const Text(
              'Paramètres avancés',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const NotificationSettingsScreen(),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  /// Section système et compte
  Widget _buildSystemSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Devise
          ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppDesign.primaryIndigo.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.euro,
                color: AppDesign.primaryIndigo,
                size: 24,
              ),
            ),
            title: const Text(
              'Devise',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _currentCurrency,
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 14,
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.arrow_forward_ios, size: 16),
              ],
            ),
            onTap: () {
              _showCurrencyPicker();
            },
          ),
          
          const Divider(height: 1, indent: 72),
          
          // Langue
          ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppDesign.primaryPurple.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.language,
                color: AppDesign.primaryPurple,
                size: 24,
              ),
            ),
            title: const Text(
              'Langue',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Français',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 14,
                  ),
                ),
                const SizedBox(width: 8),
                const Icon(Icons.arrow_forward_ios, size: 16),
              ],
            ),
            onTap: () {
              // TODO: Implémenter la sélection de langue
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Changement de langue à venir'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
          ),
          
          const Divider(height: 1, indent: 72),
          
          // Sécurité
          ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.orange.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.lock_outline,
                color: Colors.orange,
                size: 24,
              ),
            ),
            title: const Text(
              'Sécurité',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
            subtitle: const Text(
              'Changer le mot de passe',
              style: TextStyle(fontSize: 13),
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () {
              _showChangePasswordDialog();
            },
          ),
          
          const Divider(height: 1, indent: 72),
          
          // Informations personnelles
          ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.blue.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.person_outline,
                color: Colors.blue,
                size: 24,
              ),
            ),
            title: const Text(
              'Informations personnelles',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
            trailing: const Icon(Icons.arrow_forward_ios, size: 16),
            onTap: () {
              _showProfileEditDialog();
            },
          ),
        ],
      ),
    );
  }

  /// Section admin (conditionnelle)
  Widget _buildAdminSection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppDesign.expenseColor.withValues(alpha: 0.3), width: 2),
        boxShadow: [
          BoxShadow(
            color: AppDesign.expenseColor.withValues(alpha: 0.1),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppDesign.expenseColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: const Icon(
            Icons.admin_panel_settings,
            color: AppDesign.expenseColor,
            size: 24,
          ),
        ),
        title: const Text(
          'Admin Panel',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
            color: AppDesign.expenseColor,
          ),
        ),
        subtitle: const Text(
          'Accès au tableau de bord administrateur',
          style: TextStyle(fontSize: 13),
        ),
        trailing: const Icon(
          Icons.arrow_forward_ios,
          size: 16,
          color: AppDesign.expenseColor,
        ),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const AdminDashboardScreen(),
            ),
          );
        },
      ),
    );
  }

  /// Bouton de déconnexion
  Widget _buildLogoutButton() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: ElevatedButton(
        onPressed: _handleLogout,
        style: ElevatedButton.styleFrom(
          backgroundColor: AppDesign.expenseColor,
          foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          elevation: 0,
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.logout, size: 20),
            SizedBox(width: 12),
            Text(
              'Se déconnecter',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // =========================================================================
  // ACTIONS
  // =========================================================================

  /// Affiche le sélecteur de devise
  void _showCurrencyPicker() {
    final currencies = [
      'EUR (€)',
      'USD (\$)',
      'GBP (£)',
      'CHF (Fr)',
      'JPY (¥)',
      'CAD (C\$)',
    ];

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'Sélectionner la devise',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            ...currencies.map((currency) => ListTile(
                  title: Text(currency),
                  trailing: _currentCurrency == currency
                      ? const Icon(Icons.check, color: AppDesign.primaryIndigo)
                      : null,
                  onTap: () {
                    setState(() {
                      _currentCurrency = currency;
                    });
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Devise changée en $currency')),
                    );
                  },
                )),
          ],
        ),
      ),
    );
  }

  /// Affiche le dialogue de changement de mot de passe
  void _showChangePasswordDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Changer le mot de passe'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: const [
            TextField(
              obscureText: true,
              decoration: InputDecoration(
                labelText: 'Mot de passe actuel',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 12),
            TextField(
              obscureText: true,
              decoration: InputDecoration(
                labelText: 'Nouveau mot de passe',
                border: OutlineInputBorder(),
              ),
            ),
            SizedBox(height: 12),
            TextField(
              obscureText: true,
              decoration: InputDecoration(
                labelText: 'Confirmer le mot de passe',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Mot de passe modifié avec succès'),
                  backgroundColor: AppDesign.incomeColor,
                ),
              );
            },
            child: const Text('Confirmer'),
          ),
        ],
      ),
    );
  }

  /// Affiche le dialogue d'édition du profil
  void _showProfileEditDialog() {
    final firstNameController = TextEditingController(text: _userProfile?.firstName);
    final lastNameController = TextEditingController(text: _userProfile?.lastName);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Modifier le profil'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: firstNameController,
              decoration: const InputDecoration(
                labelText: 'Prénom',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: lastNameController,
              decoration: const InputDecoration(
                labelText: 'Nom',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                // TODO: Sauvegarder via FirestoreService en production
              });
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Profil mis à jour'),
                  backgroundColor: AppDesign.incomeColor,
                ),
              );
            },
            child: const Text('Enregistrer'),
          ),
        ],
      ),
    );
  }

  /// Gère la déconnexion
  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Déconnexion'),
        content: const Text('Êtes-vous sûr de vouloir vous déconnecter ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppDesign.expenseColor,
            ),
            child: const Text('Déconnexion'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      // Annuler toutes les notifications
      await _notificationService.cancelAllNotifications();
      
      if (!mounted) return;

      // Naviguer vers OnboardingWizardScreen (Module 1)
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const OnboardingWizardScreen()),
        (route) => false,
      );
    }
  }
}
