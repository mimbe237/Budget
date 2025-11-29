import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:budget/l10n/app_localizations.dart';
import '../../constants/app_design.dart';
import '../../services/currency_service.dart';
import '../../services/firestore_service.dart';
import '../../services/theme_service.dart';
import '../profile/profile_settings_screen.dart';
import '../settings/notification_settings_screen.dart';
import '../budget/budget_planner_screen.dart';
import '../accounts/account_management_screen.dart';
import '../auth/auth_screen.dart';

/// Page unifiée Profil & Paramètres
class SettingsHubScreen extends StatelessWidget {
  const SettingsHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final currencyService = context.watch<CurrencyService>();
    final localeProvider = context.watch<LocaleProvider>();
    final themeProvider = context.watch<ThemeProvider>();
    final userId = FirestoreService().currentUserId;

    return Scaffold(
      appBar: AppBar(
        title: const TrText('Profil & Paramètres'),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(AppDesign.paddingLarge),
        children: [
          _ProfileHeader(onEdit: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const ProfileSettingsScreen()),
            );
          }),
          const SizedBox(height: AppDesign.spacingLarge),
          _Section(
            title: 'Général',
            children: [
              _Tile(
                icon: Icons.language,
                title: 'Langue',
                trailing: Text(localeProvider.locale.languageCode.toUpperCase()),
                onTap: () async {
                  await _showLanguageSheet(context, localeProvider);
                },
              ),
              _Tile(
                icon: Icons.currency_exchange,
                title: 'Devise',
                trailing: Text(currencyService.currentCurrency),
                onTap: () async {
                  await _showCurrencySheet(context, currencyService);
                },
              ),
              _Tile(
                icon: Icons.brightness_6,
                title: 'Thème',
                trailing: Switch(
                  value: themeProvider.themeMode == ThemeMode.dark,
                  onChanged: (_) => themeProvider.toggleTheme(),
                  activeColor: AppDesign.primaryIndigo,
                ),
                onTap: () => themeProvider.toggleTheme(),
              ),
            ],
          ),
          _Section(
            title: 'Budget & Alertes',
            children: [
              _Tile(
                icon: Icons.pie_chart_rounded,
                title: 'Plan budgétaire',
                subtitle: 'Répartition des poches et seuils',
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const BudgetPlannerScreen()),
                ),
              ),
              _Tile(
                icon: Icons.notifications_active_outlined,
                title: 'Notifications',
                subtitle: 'Alertes budget, rappels factures',
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const NotificationSettingsScreen()),
                ),
              ),
            ],
          ),
          _Section(
            title: 'Sécurité',
            children: [
              _Tile(
                icon: Icons.lock_outline,
                title: 'Sécurité du compte',
                subtitle: 'Mot de passe / 2FA / sessions',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ProfileSettingsScreen()),
                  );
                },
              ),
              _Tile(
                icon: Icons.logout,
                title: 'Déconnexion',
                onTap: () async {
                  await FirestoreService().cleanupDemoDataOnLogout();
                  await FirestoreService().logout();
                  if (!context.mounted) return;
                  Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
                    MaterialPageRoute(builder: (_) => const AuthScreen()),
                    (route) => false,
                  );
                },
              ),
            ],
          ),
          _Section(
            title: 'Données & confidentialité',
            children: [
              _Tile(
                icon: Icons.download_outlined,
                title: 'Export / Sauvegarde',
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: TrText('Export disponible dans une prochaine version')),
                  );
                },
              ),
              _Tile(
                icon: Icons.delete_outline,
                title: 'Réinitialiser les données',
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: TrText('Réinitialisation disponible dans Profil avancé')),
                  );
                },
              ),
              _Tile(
                icon: Icons.policy_outlined,
                title: 'Confidentialité & CGU',
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: TrText('Lien vers la politique de confidentialité')),
                  );
                },
              ),
            ],
          ),
          _Section(
            title: 'Support',
            children: [
              _Tile(
                icon: Icons.help_outline,
                title: 'Aide & FAQ',
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: TrText('FAQ disponible dans une prochaine version')),
                  );
                },
              ),
              _Tile(
                icon: Icons.contact_support_outlined,
                title: 'Contact',
                onTap: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: TrText('Contact support prochainement')),
                  );
                },
              ),
              _Tile(
                icon: Icons.account_balance_wallet_outlined,
                title: 'Comptes financiers',
                subtitle: 'Gérer vos comptes et soldes',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const AccountManagementScreen()),
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader({required this.onEdit});

  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final userId = FirestoreService().currentUserId;
    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppDesign.radiusLarge),
      ),
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(AppDesign.paddingLarge),
        child: Row(
          children: [
            CircleAvatar(
              radius: 28,
              backgroundColor: AppDesign.primaryIndigo.withValues(alpha: 0.1),
              child: const Icon(Icons.person, color: AppDesign.primaryIndigo, size: 28),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: FutureBuilder(
                future: userId != null ? FirestoreService().getUserProfile(userId) : null,
                builder: (context, snapshot) {
                  final name = snapshot.data?.displayName ?? 'Utilisateur';
                  final email = snapshot.data?.email ?? '';
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TrText(
                        name,
                        style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                      ),
                      if (email.isNotEmpty)
                        TrText(
                          email,
                          style: const TextStyle(color: Colors.grey),
                        ),
                    ],
                  );
                },
              ),
            ),
            TextButton.icon(
              onPressed: onEdit,
              icon: const Icon(Icons.edit, size: 16),
              label: const TrText('Modifier'),
            ),
          ],
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.children});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TrText(
          title,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 8),
        Card(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppDesign.radiusLarge),
          ),
          child: Column(
            children: children,
          ),
        ),
        const SizedBox(height: AppDesign.spacingLarge),
      ],
    );
  }
}

class _Tile extends StatelessWidget {
  const _Tile({
    required this.icon,
    required this.title,
    this.subtitle,
    this.trailing,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: AppDesign.primaryIndigo),
      title: TrText(
        title,
        style: const TextStyle(fontWeight: FontWeight.w600),
      ),
      subtitle: subtitle != null ? TrText(subtitle!) : null,
      trailing: trailing ?? const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}

Future<void> _showLanguageSheet(
  BuildContext context,
  LocaleProvider localeProvider,
) async {
  final current = localeProvider.locale.languageCode;
  final userId = FirestoreService().currentUserId;

  await showModalBottomSheet(
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
                if (userId != null) {
                  await FirestoreService()
                      .updateUserProfile(userId, {'languageCode': 'fr'});
                }
                Navigator.pop(sheetContext);
              },
            ),
            ListTile(
              leading: const Icon(Icons.flag_circle_outlined),
              title: const TrText('English'),
              trailing: current == 'en'
                  ? const Icon(Icons.check, color: AppDesign.primaryIndigo)
                  : null,
              onTap: () async {
                await localeProvider.setLocale(const Locale('en'));
                if (userId != null) {
                  await FirestoreService()
                      .updateUserProfile(userId, {'languageCode': 'en'});
                }
                Navigator.pop(sheetContext);
              },
            ),
          ],
        ),
      ),
    ),
  );
}

Future<void> _showCurrencySheet(
  BuildContext context,
  CurrencyService currencyService,
) async {
  await showModalBottomSheet(
    context: context,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
    ),
    builder: (sheetContext) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: CurrencyService.supportedCurrencies.keys.map((code) {
          final symbol = CurrencyService.supportedCurrencies[code]!;
          final isSelected = currencyService.currentCurrency == code;
          return ListTile(
            leading: const Icon(Icons.currency_exchange),
            title: TrText('$code ($symbol)'),
            trailing: isSelected ? const Icon(Icons.check, color: AppDesign.primaryIndigo) : null,
            onTap: () async {
              Navigator.pop(sheetContext);
              await currencyService.setCurrency(code);
              final userId = FirestoreService().currentUserId;
              if (userId != null) {
                await FirestoreService().updateUserProfile(userId, {'currency': code});
              }
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: TrText('Devise changée en $code')),
                );
              }
            },
          );
        }).toList(),
      ),
    ),
  );
}
