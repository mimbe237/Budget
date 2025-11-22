import 'package:flutter/material.dart';

import '../constants/app_design.dart';
import '../screens/navigation/main_navigation_shell.dart';
import 'revolutionary_logo.dart';

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
  });

  @override
  Size get preferredSize => Size.fromHeight(toolbarHeight + (bottom?.preferredSize.height ?? 0));

  @override
  Widget build(BuildContext context) {
    final combinedActions = <Widget>[];
    if (showHome) {
      combinedActions.add(
        IconButton(
          tooltip: 'Accueil',
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

    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      toolbarHeight: toolbarHeight,
      centerTitle: false,
      titleSpacing: 16,
      title: Row(
        children: [
          const RevolutionaryLogo(size: 48),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Colors.black54,
                  ),
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
