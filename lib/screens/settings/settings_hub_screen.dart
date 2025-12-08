import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:budget/l10n/localization_helpers.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../constants/app_design.dart';
import '../../services/currency_service.dart';
import '../../services/firestore_service.dart';
import '../../services/theme_service.dart';
import '../profile/profile_settings_screen.dart';
import '../settings/notification_settings_screen.dart';
import '../budget/budget_planner_screen.dart';
import '../auth/login_screen.dart';
import '../../widgets/currency_conversion_dialog.dart';
import '../../providers/locale_provider.dart';

/// Page unifiée Profil & Paramètres
class SettingsHubScreen extends StatelessWidget {
  const SettingsHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final currencyService = context.watch<CurrencyService>();
    final localeProvider = context.watch<LocaleProvider>();
    final themeProvider = context.watch<ThemeProvider>();

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
            title: '⚠️ Zone Danger',
            backgroundColor: Colors.red.shade50,
            children: [
              _Tile(
                icon: Icons.delete_forever,
                title: 'Réinitialisation complète',
                subtitle: 'Supprimer l\'historique et données soldées',
                iconColor: Colors.red,
                onTap: () => _showResetDialog(context),
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
            ],
          ),
          const SizedBox(height: AppDesign.spacingMedium),
          const _LogoutCard(),
          const SizedBox(height: AppDesign.spacingLarge),
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

class _LogoutCard extends StatelessWidget {
  const _LogoutCard();

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(AppDesign.radiusLarge),
      child: Material(
        color: Colors.transparent,
        child: Ink(
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppDesign.dangerRed, AppDesign.primaryPink],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: AppDesign.mediumShadow,
          ),
          child: InkWell(
            borderRadius: BorderRadius.circular(AppDesign.radiusLarge),
            onTap: () => _handleLogout(context),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppDesign.paddingLarge,
                vertical: AppDesign.paddingMedium,
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.16),
                      borderRadius: BorderRadius.circular(AppDesign.radiusMedium),
                    ),
                    child: const Icon(
                      Icons.logout,
                      color: Colors.white,
                      size: 22,
                    ),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        TrText(
                          'Déconnexion',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 16,
                          ),
                        ),
                        SizedBox(height: 4),
                        TrText(
                          'Quitter et revenir à la connexion',
                          style: TextStyle(
                            color: Colors.white70,
                            fontSize: 13,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(
                    Icons.arrow_forward_ios,
                    size: 16,
                    color: Colors.white,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.children, this.backgroundColor});

  final String title;
  final List<Widget> children;
  final Color? backgroundColor;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TrText(
          title,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w800,
            color: backgroundColor != null ? Colors.red.shade700 : null,
          ),
        ),
        const SizedBox(height: 8),
        Card(
          color: backgroundColor,
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
    this.iconColor,
    required this.onTap,
  });

  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? trailing;
  final Color? iconColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: iconColor ?? AppDesign.primaryIndigo),
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

Future<void> _handleLogout(BuildContext context) async {
  await FirestoreService().cleanupDemoDataOnLogout();
  await FirestoreService().logout();
  if (!context.mounted) return;
  Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
    MaterialPageRoute(builder: (_) => const LoginScreen()),
    (route) => false,
  );
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

Future<void> _showResetDialog(BuildContext context) async {
  final userId = FirestoreService().currentUserId;
  if (userId == null) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: TrText('Vous devez être connecté')),
    );
    return;
  }

  bool agreedToTerms = false;
  int countdown = 5;

  await showDialog(
    context: context,
    barrierDismissible: false,
    builder: (ctx) => StatefulBuilder(
      builder: (context, setState) {
        // Démarrer le countdown
        if (countdown > 0) {
          Future.delayed(const Duration(seconds: 1), () {
            if (countdown > 0) {
              setState(() => countdown--);
            }
          });
        }

        return AlertDialog(
          title: Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Colors.red.shade700, size: 32),
              const SizedBox(width: 12),
              const Expanded(
                child: TrText(
                  'Réinitialisation Complète',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.orange.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.orange.shade200),
                  ),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TrText(
                        '🗑️ Sera supprimé :',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      SizedBox(height: 8),
                      TrText('✓ Toutes les transactions'),
                      TrText('✓ Objectifs complétés'),
                      TrText('✓ Dettes soldées'),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.green.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.green.shade200),
                  ),
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TrText(
                        '✅ Sera conservé :',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      SizedBox(height: 8),
                      TrText('✓ Comptes et soldes'),
                      TrText('✓ Catégories'),
                      TrText('✓ Objectifs actifs'),
                      TrText('✓ Dettes actives'),
                      TrText('✓ Budget et paramètres'),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Checkbox(
                      value: agreedToTerms,
                      onChanged: countdown == 0
                          ? (val) => setState(() => agreedToTerms = val ?? false)
                          : null,
                    ),
                    const Expanded(
                      child: TrText(
                        'Je comprends que cette action est irréversible',
                        style: TextStyle(fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const TrText('Annuler'),
            ),
            ElevatedButton(
              onPressed: (countdown == 0 && agreedToTerms)
                  ? () async {
                      Navigator.pop(ctx);
                      // Si l'utilisateur a un compte email/mot de passe, demander la confirmation.
                      final requiresPassword = _requiresPasswordReauth();
                      bool confirmed = true;
                      if (requiresPassword) {
                        confirmed = await _confirmWithPassword(context);
                      }
                      if (confirmed && context.mounted) {
                        await _performReset(context, userId);
                      }
                    }
                  : null,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red.shade700,
                foregroundColor: Colors.white,
              ),
              child: countdown > 0
                  ? TrText('Patientez ($countdown s)')
                  : const TrText('Réinitialiser'),
            ),
          ],
        );
      },
    ),
  );
}

Future<bool> _confirmWithPassword(BuildContext context) async {
  final passwordController = TextEditingController();
  bool passwordVisible = false;
  
  final result = await showDialog<bool>(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.lock_outline, color: Colors.red.shade700),
            const SizedBox(width: 12),
            const Expanded(
              child: TrText(
                'Confirmer avec mot de passe',
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const TrText(
              'Entrez votre mot de passe pour confirmer la réinitialisation :',
              style: TextStyle(fontSize: 14),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: passwordController,
              obscureText: !passwordVisible,
              autofocus: true,
              decoration: InputDecoration(
                labelText: 'Mot de passe',
                border: const OutlineInputBorder(),
                prefixIcon: const Icon(Icons.lock),
                suffixIcon: IconButton(
                  icon: Icon(
                    passwordVisible ? Icons.visibility_off : Icons.visibility,
                  ),
                  onPressed: () => setState(() => passwordVisible = !passwordVisible),
                ),
              ),
              onSubmitted: (_) {
                if (passwordController.text.isNotEmpty) {
                  Navigator.pop(ctx, true);
                }
              },
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const TrText('Annuler'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (passwordController.text.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: TrText('Veuillez entrer votre mot de passe'),
                    backgroundColor: Colors.orange,
                  ),
                );
                return;
              }
              
              // Vérifier le mot de passe avec Firebase Auth
              try {
                final user = FirebaseAuth.instance.currentUser;
                if (user == null || user.email == null) {
                  Navigator.pop(ctx, false);
                  return;
                }
                
                // Tenter une réauthentification
                final credential = EmailAuthProvider.credential(
                  email: user.email!,
                  password: passwordController.text,
                );
                
                await user.reauthenticateWithCredential(credential);
                Navigator.pop(ctx, true);
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: TrText('Mot de passe incorrect'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red.shade700,
              foregroundColor: Colors.white,
            ),
            child: const TrText('Confirmer'),
          ),
        ],
      ),
    ),
  );
  
  passwordController.dispose();
  return result ?? false;
}

bool _requiresPasswordReauth() {
  final user = FirebaseAuth.instance.currentUser;
  if (user == null) return false;
  // Si l'utilisateur n'a pas de provider "password", inutile de demander un mot de passe
  return user.providerData.any((p) => p.providerId == 'password');
}

Future<void> _performReset(BuildContext context, String userId) async {
  if (!context.mounted) return;
  
  showDialog(
    context: context,
    barrierDismissible: false,
    builder: (_) => const Center(
      child: Card(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              TrText('Réinitialisation en cours...'),
            ],
          ),
        ),
      ),
    ),
  );

  try {
    // Créer un backup avant
    await FirestoreService().createBackupBeforeReset(userId);
    
    // Effectuer la réinitialisation
    await FirestoreService().fullDataReset(userId);
    
    if (context.mounted) {
      Navigator.pop(context); // Fermer le loader
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: TrText('✓ Réinitialisation réussie. Un backup a été créé.'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 4),
          ),
        );
      }
    }
  } catch (e) {
    if (context.mounted) {
      Navigator.pop(context); // Fermer le loader
      
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: TrText('Erreur: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }
}

Future<void> _showCurrencySheet(
  BuildContext context,
  CurrencyService currencyService,
) async {
  final oldCurrency = currencyService.currentCurrency;
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
              if (code == oldCurrency) return;

              await showCurrencyConversionDialog(
                context: context,
                oldCurrency: oldCurrency,
                newCurrency: code,
                onConvert: () async {
                  final userId = FirestoreService().currentUserId;
                  if (userId != null) {
                    // Conversion réelle des montants
                    await FirestoreService().convertUserDataCurrency(
                      userId: userId,
                      oldCurrency: oldCurrency,
                      newCurrency: code,
                    );
                  }
                  await currencyService.setCurrency(code);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: TrText('Conversion complète en $code effectuée')),
                    );
                  }
                },
                onDisplayOnly: () async {
                  await currencyService.setCurrency(code);
                  final userId = FirestoreService().currentUserId;
                  if (userId != null) {
                    await FirestoreService().updateUserProfile(userId, {'currency': code});
                  }
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: TrText('Affichage changé en $code (sans conversion)')),
                    );
                  }
                },
              );
            },
          );
        }).toList(),
      ),
    ),
  );
}
