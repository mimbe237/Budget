import 'package:flutter/material.dart';
import '../../constants/app_design.dart';
import '../../services/notification_service.dart';
import '../../services/mock_data_service.dart';
import '../../services/firestore_service.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../models/user_profile.dart';
import '../settings/settings_hub_screen.dart';
import '../admin/admin_dashboard_screen.dart';
import '../onboarding/onboarding_wizard_screen.dart';
import '../auth/login_screen.dart';
import '../../widgets/revolutionary_logo.dart';
import 'package:budget/l10n/localization_helpers.dart';

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
      resizeToAvoidBottomInset: false,
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
                  
                  _buildSectionHeader('Profil'),
                  _buildProfileSummaryCard(),

                  const SizedBox(height: 24),

                  _buildSectionHeader('Actions'),
                  _buildActionsCard(),

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
              MaterialPageRoute(builder: (_) => const LoginScreen()),
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

  /// Carte synthèse du profil
  Widget _buildProfileSummaryCard() {
    final display = _userProfile?.displayName ?? t('Utilisateur');
    final email = _userProfile?.email ?? '-';
    final phone = _userProfile?.phoneNumber ?? '-';
    final currency = _userProfile?.currency ?? '-';
    final country = _userProfile?.countryCode ?? '-';

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
          ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppDesign.primaryIndigo.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.person_outline,
                color: AppDesign.primaryIndigo,
                size: 24,
              ),
            ),
            title: TrText(
              display,
              style: const TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
            subtitle: TrText(
              email,
              style: const TextStyle(color: Colors.grey),
            ),
            trailing: TextButton.icon(
              onPressed: _showProfileEditDialog,
              icon: const Icon(Icons.edit, size: 16),
              label: const TrText('Modifier'),
            ),
          ),
          const Divider(height: 1),
          _infoRow(Icons.flag_outlined, t('Pays'), country),
          const Divider(height: 1),
          _infoRow(Icons.currency_exchange, t('Devise'), currency),
          const Divider(height: 1),
          _infoRow(Icons.phone_iphone, t('Téléphone / WhatsApp'), phone),
        ],
      ),
    );
  }

  /// Actions condensées (renvoi vers le hub paramétrage)
  Widget _buildActionsCard() {
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
      child: ListTile(
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
          'Paramètres complets',
          style: TextStyle(
            fontWeight: FontWeight.w700,
            fontSize: 15,
          ),
        ),
        subtitle: const TrText(
          'Langue, notifications, sécurité, données',
          style: TextStyle(fontSize: 13),
        ),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const SettingsHubScreen(),
            ),
          );
        },
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
