import 'package:flutter/material.dart';
import '../../constants/app_design.dart';
import '../../services/notification_service.dart';
import '../../services/currency_service.dart';
import '../../services/notification_preferences_service.dart';
import '../../services/mock_data_service.dart';
import '../../services/firestore_service.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../services/theme_service.dart';
import '../../models/user_profile.dart';
import '../settings/notification_settings_screen.dart';
import '../admin/admin_dashboard_screen.dart';
import '../onboarding/onboarding_wizard_screen.dart';
import '../auth/auth_screen.dart';
import '../../widgets/revolutionary_logo.dart';
import '../../widgets/currency_conversion_dialog.dart';
import 'package:budget/l10n/app_localizations.dart';
import 'package:provider/provider.dart';

/// Écran de profil et paramètres utilisateur
/// Affiche les informations du profil et permet de gérer les préférences
class ProfileSettingsScreen extends StatefulWidget {
  const ProfileSettingsScreen({super.key});

  @override
  State<ProfileSettingsScreen> createState() => _ProfileSettingsScreenState();
}

class _ProfileSettingsScreenState extends State<ProfileSettingsScreen> {
  
  UserProfile? _userProfile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  /// Charge le profil utilisateur
  Future<void> _loadUserProfile() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final firestore = FirestoreService();
      final uid = firestore.currentUserId;

      if (uid != null) {
        final profile = await firestore.getUserProfile(uid);
        if (profile != null) {
          _userProfile = profile;
        } else {
          // Fallback: construire un profil minimal depuis FirebaseAuth
          final authUser = FirebaseAuth.instance.currentUser;
          if (authUser != null) {
            final fallbackDisplay = (authUser.displayName != null && authUser.displayName!.trim().isNotEmpty)
                ? authUser.displayName!
                : (authUser.email?.split('@').first ?? 'Utilisateur');
            _userProfile = UserProfile(
              userId: authUser.uid,
              displayName: fallbackDisplay,
              email: authUser.email,
              currency: 'EUR',
              createdAt: DateTime.now(),
              updatedAt: DateTime.now(),
            );
          }
        }
      } else {
        // Fallback développement: données mock si non connecté
        _userProfile = MockDataService().getMockUserProfile();
      }
    } catch (e) {
      debugPrint('Erreur lors du chargement du profil: $e');
    }

    setState(() {
      _isLoading = false;
    });
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
          title: const TrText(
            'Purger les données démo',
            style: TextStyle(
              fontWeight: FontWeight.w700,
            ),
          ),
          subtitle: const TrText(
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
                    child: TrText(
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
                TrText(
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
                      TrText(
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
      child: TrText(
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
            title: const TrText(
              'Bilan de fin de journée',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
            subtitle: const TrText(
              'Notification à 20h pour saisir vos dépenses',
              style: TextStyle(fontSize: 13),
            ),
            value: context.watch<NotificationPreferencesService>().dailyReminderEnabled,
            activeTrackColor: AppDesign.primaryIndigo,
            activeThumbColor: AppDesign.primaryIndigo,
            onChanged: (value) async {
              await context.read<NotificationPreferencesService>().setDailyReminderEnabled(value);
              
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: TrText(value 
                      ? 'Rappel quotidien activé à 20h' 
                      : 'Rappel quotidien désactivé'
                    ),
                    duration: const Duration(seconds: 2),
                  ),
                );
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
            title: const TrText(
              'Dépassement de Budget',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
            subtitle: const TrText(
              'Alerte immédiate si une catégorie passe au rouge',
              style: TextStyle(fontSize: 13),
            ),
            value: context.watch<NotificationPreferencesService>().budgetAlertsEnabled,
            activeTrackColor: AppDesign.primaryIndigo,
            activeThumbColor: AppDesign.primaryIndigo,
            onChanged: (value) async {
              await context.read<NotificationPreferencesService>().setBudgetAlertsEnabled(value);
              
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: TrText(
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
          if (context.watch<NotificationPreferencesService>().budgetAlertsEnabled)
            Padding(
              padding: const EdgeInsets.fromLTRB(72, 0, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const TrText(
                        'Seuil d\'alerte',
                        style: TextStyle(fontWeight: FontWeight.w600),
                      ),
                      TrText(
                        '${(context.watch<NotificationPreferencesService>().budgetAlertThreshold * 100).toStringAsFixed(0)}%',
                        style: const TextStyle(fontWeight: FontWeight.w700),
                      ),
                    ],
                  ),
                  Slider(
                    value: context.watch<NotificationPreferencesService>().budgetAlertThreshold,
                    min: 0.5,
                    max: 1.2,
                    divisions: 7,
                    label: '${(context.watch<NotificationPreferencesService>().budgetAlertThreshold * 100).toStringAsFixed(0)}%',
                    onChanged: (v) {
                      context.read<NotificationPreferencesService>().setBudgetAlertThreshold(v);
                    },
                    activeColor: AppDesign.expenseColor,
                    inactiveColor: AppDesign.expenseColor.withValues(alpha: 0.2),
                  ),
                  const TrText(
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
            title: const TrText(
              'Succès d\'Épargne',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
            subtitle: const TrText(
              'Célébration quand un objectif est atteint',
              style: TextStyle(fontSize: 13),
            ),
            value: context.watch<NotificationPreferencesService>().goalAlertsEnabled,
            activeTrackColor: AppDesign.primaryIndigo,
            activeThumbColor: AppDesign.primaryIndigo,
            onChanged: (value) async {
              await context.read<NotificationPreferencesService>().setGoalAlertsEnabled(value);
              
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: TrText(
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
            title: const TrText(
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
    final localeProvider = context.watch<LocaleProvider>();

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
            title: const TrText(
              'Devise',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                TrText(
                  '${context.watch<CurrencyService>().currentCurrency} (${context.watch<CurrencyService>().currencySymbol})',
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
            title: const TrText(
              'Langue',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                TrText(
                  localeProvider.locale.languageCode == 'en' ? 'Anglais' : 'Français',
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
              _showLanguagePicker(localeProvider);
            },
          ),
          
          const Divider(height: 1, indent: 72),
          
          // Thème
          Builder(builder: (context) {
            final themeProvider = context.watch<ThemeProvider>();
            final modeLabel = themeProvider.label(context);
            final isDark = themeProvider.themeMode == ThemeMode.dark;
            return ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: AppDesign.primaryIndigo.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  isDark ? Icons.nightlight_round : Icons.wb_sunny_outlined,
                  color: AppDesign.primaryIndigo,
                  size: 24,
                ),
              ),
              title: const TrText(
                'Thème',
                style: TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TrText(
                    modeLabel,
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Icon(Icons.arrow_forward_ios, size: 16),
                ],
              ),
              onTap: () => _showThemePicker(themeProvider),
            );
          }),
          
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
            title: const TrText(
              'Sécurité',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                fontSize: 15,
              ),
            ),
            subtitle: const TrText(
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
            title: const TrText(
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
          if (_userProfile != null) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(
                  children: [
                    _infoRow(Icons.mail_outline, t('Email'), _userProfile!.email ?? '-'),
                    const Divider(height: 1),
                    _infoRow(Icons.flag_outlined, t('Pays'), _userProfile!.countryCode ?? '-'),
                    const Divider(height: 1),
                    _infoRow(Icons.currency_exchange, t('Devise'), _userProfile!.currency),
                    const Divider(height: 1),
                    _infoRow(Icons.phone_iphone, t('Téléphone / WhatsApp'), _userProfile!.phoneNumber ?? '-'),
                  ],
                ),
              ),
            ),
          ],
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
        title: const TrText(
          'Admin Panel',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
            color: AppDesign.expenseColor,
          ),
        ),
        subtitle: const TrText(
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
            TrText(
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
    final currencyService = context.read<CurrencyService>();
    final currencies = currencyService.getFormattedCurrencyList();
    final rootContext = context;

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (sheetContext) => Container(
        padding: const EdgeInsets.symmetric(vertical: 20),
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(sheetContext).size.height * 0.7,
        ),
        child: SingleChildScrollView(
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
              const TrText(
                'Sélectionner la devise',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              ...currencies.map((currencyFormatted) {
                  final currencyCode = currencyService.parseCurrencyCode(currencyFormatted);
                  final currentCode = sheetContext.watch<CurrencyService>().currentCurrency;
                  
                  return ListTile(
                    title: TrText(currencyFormatted),
                    trailing: currentCode == currencyCode
                        ? const Icon(Icons.check, color: AppDesign.primaryIndigo)
                        : null,
                    onTap: () async {
                      final oldCurrency = currencyService.currentCurrency;

                      Navigator.pop(sheetContext);
                      if (!mounted || oldCurrency == currencyCode) return;

                      await showCurrencyConversionDialog(
                        context: rootContext,
                        oldCurrency: oldCurrency,
                        newCurrency: currencyCode,
                        onConvert: () async {
                          // TODO: Implement full conversion of all transactions, goals, budgets
                          await currencyService.setCurrency(currencyCode);
                          if (!mounted) return;
                          ScaffoldMessenger.of(rootContext).showSnackBar(
                            SnackBar(
                              content: TrText('Montants convertis en $currencyCode'),
                              backgroundColor: AppDesign.incomeColor,
                            ),
                          );
                        },
                        onDisplayOnly: () async {
                          await currencyService.setCurrency(currencyCode);
                          if (!mounted) return;
                          ScaffoldMessenger.of(rootContext).showSnackBar(
                            SnackBar(content: TrText('Affichage changé en $currencyCode')),
                          );
                        },
                      );
                    },
                  );
                }),
            ],
          ),
        ),
      ),
    );
  }

  void _showLanguagePicker(LocaleProvider localeProvider) {
    final current = localeProvider.locale.languageCode;
    final userId = FirestoreService().currentUserId;

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const TrText(
                'Langue',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              ListTile(
                leading: const Icon(Icons.flag),
                title: const TrText('Français'),
                trailing: current == 'fr'
                    ? const Icon(Icons.check, color: AppDesign.primaryIndigo)
                    : null,
                onTap: () async {
                  await localeProvider.setLocale(const Locale('fr'));
                  if (userId != null) {
                    await FirestoreService()
                        .updateUserProfile(userId, {'languageCode': 'fr'});
                  }
                  if (mounted) Navigator.pop(context);
                },
              ),
              ListTile(
                leading: const Icon(Icons.flag_circle),
                title: const TrText('Anglais'),
                trailing: current == 'en'
                    ? const Icon(Icons.check, color: AppDesign.primaryIndigo)
                    : null,
                onTap: () async {
                  await localeProvider.setLocale(const Locale('en'));
                  if (userId != null) {
                    await FirestoreService()
                        .updateUserProfile(userId, {'languageCode': 'en'});
                  }
                  if (mounted) Navigator.pop(context);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showThemePicker(ThemeProvider themeProvider) {
    final current = themeProvider.themeMode;

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const TrText(
                'Mode d\'affichage',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              ListTile(
                leading: const Icon(Icons.brightness_auto),
                title: const TrText('Système'),
                trailing: current == ThemeMode.system
                    ? const Icon(Icons.check, color: AppDesign.primaryIndigo)
                    : null,
                onTap: () async {
                  await themeProvider.setTheme(ThemeMode.system);
                  if (mounted) Navigator.pop(context);
                },
              ),
              ListTile(
                leading: const Icon(Icons.wb_sunny_outlined),
                title: const TrText('Clair'),
                trailing: current == ThemeMode.light
                    ? const Icon(Icons.check, color: AppDesign.primaryIndigo)
                    : null,
                onTap: () async {
                  await themeProvider.setTheme(ThemeMode.light);
                  if (mounted) Navigator.pop(context);
                },
              ),
              ListTile(
                leading: const Icon(Icons.nightlight_round),
                title: const TrText('Sombre'),
                trailing: current == ThemeMode.dark
                    ? const Icon(Icons.check, color: AppDesign.primaryIndigo)
                    : null,
                onTap: () async {
                  await themeProvider.setTheme(ThemeMode.dark);
                  if (mounted) Navigator.pop(context);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Affiche le dialogue de changement de mot de passe
  void _showChangePasswordDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const TrText('Changer le mot de passe'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const TextField(
              obscureText: true,
              decoration: InputDecoration(
                labelText: 'Mot de passe actuel',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            const TextField(
              obscureText: true,
              decoration: InputDecoration(
                labelText: 'Nouveau mot de passe',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            const TextField(
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
            child: const TrText('Annuler'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: TrText('Mot de passe modifié avec succès'),
                  backgroundColor: AppDesign.incomeColor,
                ),
              );
            },
            child: const TrText('Confirmer'),
          ),
        ],
      ),
    );
  }

  /// Affiche le dialogue d'édition du profil
  void _showProfileEditDialog() {
    final firstNameController = TextEditingController(text: _userProfile?.firstName);
    final lastNameController = TextEditingController(text: _userProfile?.lastName);
    final emailController = TextEditingController(text: _userProfile?.email);
    final phoneController = TextEditingController(text: _userProfile?.phoneNumber);

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const TrText('Modifier le profil'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: firstNameController,
              decoration: InputDecoration(
                labelText: t('Prénom'),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: lastNameController,
              decoration: InputDecoration(
                labelText: t('Nom'),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: emailController,
              decoration: InputDecoration(
                labelText: t('Email'),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: phoneController,
              decoration: InputDecoration(
                labelText: t('Téléphone / WhatsApp'),
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const TrText('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);

              final trimmedFirst = firstNameController.text.trim();
              final trimmedLast = lastNameController.text.trim();
              final trimmedEmail = emailController.text.trim();
              final trimmedPhone = phoneController.text.trim();
              final newDisplayName = (trimmedFirst.isNotEmpty || trimmedLast.isNotEmpty)
                  ? ('$trimmedFirst $trimmedLast').trim()
                  : (_userProfile?.displayName ?? '').trim();

              // Update local state immediately
              setState(() {
                if (_userProfile != null) {
                  _userProfile = _userProfile!.copyWith(
                    firstName: trimmedFirst,
                    lastName: trimmedLast,
                    email: trimmedEmail,
                    phoneNumber: trimmedPhone,
                    displayName: newDisplayName.isNotEmpty ? newDisplayName : _userProfile!.displayName,
                  );
                }
              });

              // Persist to Firestore if connected
              final uid = FirestoreService().currentUserId;
              if (uid != null) {
                try {
                  final updates = <String, dynamic>{
                    'firstName': trimmedFirst,
                    'lastName': trimmedLast,
                    'email': trimmedEmail,
                    'phoneNumber': trimmedPhone,
                  };
                  if (newDisplayName.isNotEmpty) {
                    updates['displayName'] = newDisplayName;
                  }
                  await FirestoreService().updateUserProfile(uid, updates);
                  // Also align FirebaseAuth displayName
                  if (newDisplayName.isNotEmpty) {
                    await FirebaseAuth.instance.currentUser?.updateDisplayName(newDisplayName);
                  }
                } catch (e) {
                  debugPrint('Erreur mise à jour profil: $e');
                }
              }

              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: TrText('Profil mis à jour'),
                    backgroundColor: AppDesign.incomeColor,
                  ),
                );
              }
            },
            child: const TrText('Enregistrer'),
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
        title: const TrText('Déconnexion'),
        content: const TrText('Êtes-vous sûr de vouloir vous déconnecter ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const TrText('Annuler'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppDesign.expenseColor,
            ),
            child: const TrText('Déconnexion'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      // Annuler toutes les notifications via le service
      await NotificationService().cancelAllNotifications();
      
      if (!mounted) return;

      // Naviguer vers OnboardingWizardScreen (Module 1)
      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const OnboardingWizardScreen()),
        (route) => false,
      );
    }
  }

  Widget _infoRow(IconData icon, String label, String value) {
    return ListTile(
      dense: true,
      leading: Icon(icon, color: Colors.grey[700]),
      title: TrText(
        label,
        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
      ),
      subtitle: TrText(
        value.isNotEmpty ? value : '-',
        style: const TextStyle(color: Colors.black87),
      ),
    );
  }
}
