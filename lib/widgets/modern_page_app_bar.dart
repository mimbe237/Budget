import 'package:flutter/material.dart';

import '../constants/app_design.dart';
import '../screens/navigation/main_navigation_shell.dart';
import 'revolutionary_logo.dart';
import 'package:budget/l10n/app_localizations.dart';
import '../screens/profile/profile_settings_screen.dart';
import '../screens/settings/notification_settings_screen.dart';
import '../screens/auth/auth_screen.dart';
import '../services/firestore_service.dart';
import '../services/theme_service.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:provider/provider.dart';

class ModernPageAppBar extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final List<Widget>? actions;
  final PreferredSizeWidget? bottom;
  final Color accentColor;
  final double toolbarHeight;
  final bool showHome;
  final VoidCallback? onHomeTap;
  final bool showProfile;
  final Color? backgroundColor;
  final bool hideLogoOnMobile;

  const ModernPageAppBar({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    this.actions,
    this.bottom,
    this.accentColor = AppDesign.primaryIndigo,
    this.toolbarHeight = 82,
    this.showHome = true,
    this.onHomeTap,
    this.showProfile = true,
    this.backgroundColor = Colors.white,
    this.hideLogoOnMobile = false,
  });

  @override
  Size get preferredSize => Size.fromHeight(toolbarHeight + (bottom?.preferredSize.height ?? 0));

  @override
  Widget build(BuildContext context) {
    final isCompact = MediaQuery.of(context).size.width < 430;
    final showLogo = !(hideLogoOnMobile && isCompact);

    final combinedActions = <Widget>[];
    if (showHome) {
      combinedActions.add(
        IconButton(
          tooltip: t('Accueil'),
          icon: const Icon(Icons.home_outlined, color: AppDesign.primaryIndigo),
          onPressed: onHomeTap ??
              () {
                Navigator.of(context).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const MainNavigationShell()),
                  (_) => false,
                );
              },
        ),
      );
    }
    if (actions != null) {
      combinedActions.addAll(actions!);
    }
    if (showProfile) {
      combinedActions.add(
        Padding(
          padding: const EdgeInsets.only(right: 8),
          child: PopupMenuButton<int>(
            tooltip: t('Profil'),
            offset: const Offset(0, 42),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            itemBuilder: (context) => const [
              PopupMenuItem<int>(value: 0, child: TrText('Profil')),
              PopupMenuItem<int>(value: 1, child: TrText('Paramètres')),
              PopupMenuItem<int>(value: 2, child: TrText('Déconnexion')),
              PopupMenuItem<int>(value: 3, child: TrText('Basculer le thème')),
            ],
            onSelected: (value) async {
              if (value == 0) {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const ProfileSettingsScreen()),
                );
              } else if (value == 1) {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const NotificationSettingsScreen()),
                );
              } else if (value == 2) {
                await FirestoreService().cleanupDemoDataOnLogout();
                await FirebaseAuth.instance.signOut();
                if (!context.mounted) return;
                Navigator.of(context, rootNavigator: true).pushAndRemoveUntil(
                  MaterialPageRoute(builder: (_) => const AuthScreen()),
                  (route) => false,
                );
              } else if (value == 3) {
                if (!context.mounted) return;
                await context.read<ThemeProvider>().toggleTheme();
              }
            },
            child: CircleAvatar(
              backgroundColor: accentColor.withValues(alpha: 0.12),
              child: Icon(Icons.person_outline, color: accentColor),
            ),
          ),
        ),
      );
    }

    return AppBar(
      backgroundColor: backgroundColor ?? Colors.white,
      elevation: 0,
      toolbarHeight: toolbarHeight,
      centerTitle: false,
      titleSpacing: isCompact ? 12 : 16,
      title: isCompact
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                if (showLogo) ...[
                  const RevolutionaryLogo(size: 48),
                  const SizedBox(height: 10),
                ],
                TrText(
                  title,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: Colors.black87,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                TrText(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Colors.black54,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            )
          : Row(
              children: [
                if (showLogo) ...[
                  const RevolutionaryLogo(size: 48),
                  const SizedBox(width: 12),
                ],
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      TrText(
                        title,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: Colors.black87,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 2),
                      TrText(
                        subtitle,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Colors.black54,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
      actions: combinedActions,
      bottom: bottom,
    );
  }
}
