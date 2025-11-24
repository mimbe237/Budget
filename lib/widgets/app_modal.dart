import 'package:flutter/material.dart';

/// Utilitaire pour afficher des modals bottom sheet cohérentes
/// Gère automatiquement le scroll, viewInsets clavier, et style uniforme
Future<T?> showAppModal<T>(
  BuildContext context,
  Widget child, {
  double heightFactor = 0.85,
  bool isDismissible = true,
  bool enableDrag = true,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    isDismissible: isDismissible,
    enableDrag: enableDrag,
    backgroundColor: Colors.transparent,
    builder: (_) => FractionallySizedBox(
      heightFactor: heightFactor,
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: const BorderRadius.vertical(
            top: Radius.circular(28),
          ),
        ),
        child: child,
      ),
    ),
  );
}

/// Wrapper pour le contenu des modals avec gestion du clavier
class ModalContent extends StatelessWidget {
  final Widget child;
  final EdgeInsets? padding;

  const ModalContent({
    super.key,
    required this.child,
    this.padding,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: padding ??
          EdgeInsets.only(
            left: 16,
            right: 16,
            top: 12,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
      child: child,
    );
  }
}
