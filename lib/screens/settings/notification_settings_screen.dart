import 'package:flutter/material.dart';
import '../../services/notification_service.dart';
import '../../constants/app_design.dart';
import '../../widgets/revolutionary_logo.dart';
import 'package:budget/l10n/localization_helpers.dart';

/// Écran de paramètres des notifications
class NotificationSettingsScreen extends StatefulWidget {
  const NotificationSettingsScreen({super.key});

  @override
  State<NotificationSettingsScreen> createState() => _NotificationSettingsScreenState();
}

class _NotificationSettingsScreenState extends State<NotificationSettingsScreen> {
  final NotificationService _notificationService = NotificationService.instance;
  
  bool _budgetAlertsEnabled = true;
  bool _dailyRemindersEnabled = true;
  bool _goalAlertsEnabled = true;
  TimeOfDay _reminderTime = const TimeOfDay(hour: 20, minute: 0);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppDesign.backgroundGrey,
      appBar: AppBar(
        title: Row(
          children: [
            const RevolutionaryLogo(size: 32),
            const SizedBox(width: 12),
            const TrText(
              'Notifications',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: AppDesign.primaryIndigo,
              ),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 0,
      ),
      body: ListView(
        children: [
          const SizedBox(height: 16),
          
          // Section Alertes
          _buildSectionHeader('Alertes Automatiques'),
          _buildSwitchTile(
            title: t('Alertes Budget'),
            subtitle: t("Recevoir une notification lors d'un dépassement"),
            icon: Icons.warning_amber,
            iconColor: AppDesign.expenseColor,
            value: _budgetAlertsEnabled,
            onChanged: (value) async {
              setState(() {
                _budgetAlertsEnabled = value;
              });
              await _notificationService.setBudgetAlertsEnabled(value);
              if (value) {
                _showTestNotification('budget');
              }
            },
          ),
          _buildSwitchTile(
            title: t('Alertes Objectifs'),
            subtitle: t('Notification quand un objectif est atteint'),
            icon: Icons.flag,
            iconColor: AppDesign.primaryPurple,
            value: _goalAlertsEnabled,
            onChanged: (value) async {
              setState(() {
                _goalAlertsEnabled = value;
              });
              await _notificationService.setGoalAlertsEnabled(value);
              if (value) {
                _showTestNotification('goal');
              }
            },
          ),
          
          const SizedBox(height: 24),
          
          // Section Rappels
          _buildSectionHeader('Rappels'),
          _buildSwitchTile(
            title: t('Rappel Quotidien'),
            subtitle: 'Recevoir un rappel chaque jour à ${_reminderTime.format(context)}',
            icon: Icons.schedule,
            iconColor: AppDesign.primaryIndigo,
            value: _dailyRemindersEnabled,
            onChanged: (value) async {
              setState(() {
                _dailyRemindersEnabled = value;
              });
              await _notificationService.setDailyRemindersEnabled(value);
              
              if (value) {
                await _notificationService.scheduleDailyReminder(_reminderTime);
              }
            },
          ),
          if (_dailyRemindersEnabled)
            _buildTimePicker(),
          
          const SizedBox(height: 24),
          
          // Section Tests
          _buildSectionHeader('Tests'),
          _buildTestButton(
            title: t('Tester Alerte Budget'),
            icon: Icons.notifications_active,
            color: AppDesign.expenseColor,
            onPressed: () => _showTestNotification('budget'),
          ),
          _buildTestButton(
            title: t('Tester Alerte Objectif'),
            icon: Icons.emoji_events,
            color: AppDesign.incomeColor,
            onPressed: () => _showTestNotification('goal'),
          ),
          _buildTestButton(
            title: t('Tester Rappel Quotidien'),
            icon: Icons.alarm,
            color: AppDesign.primaryIndigo,
            onPressed: () => _showTestNotification('daily'),
          ),
          
          const SizedBox(height: 24),
          
          // Section Actions
          _buildSectionHeader('Actions'),
          _buildActionButton(
            title: t('Voir notifications en attente'),
            icon: Icons.pending_actions,
            onPressed: _showPendingNotifications,
          ),
          _buildActionButton(
            title: t('Paramètres système'),
            icon: Icons.settings,
            onPressed: () async {
              await _notificationService.openNotificationSettings();
            },
          ),
          _buildActionButton(
            title: t('Annuler toutes les notifications'),
            icon: Icons.clear_all,
            color: AppDesign.expenseColor,
            onPressed: () async {
              await _notificationService.cancelAllNotifications();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: TrText('Toutes les notifications annulées')),
                );
              }
            },
          ),
          
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: TrText(
        title,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Colors.grey,
        ),
      ),
    );
  }

  Widget _buildSwitchTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: SwitchListTile(
        title: TrText(
          title,
          style: const TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: TrText(subtitle),
        secondary: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: iconColor.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: iconColor),
        ),
        value: value,
        onChanged: onChanged,
        activeColor: AppDesign.primaryIndigo,
      ),
    );
  }

  Widget _buildTimePicker() {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppDesign.primaryIndigo.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.access_time, color: AppDesign.primaryIndigo),
        ),
        title: const TrText(
          'Heure du rappel',
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        subtitle: TrText(_reminderTime.format(context)),
        trailing: const Icon(Icons.edit),
        onTap: () async {
          final TimeOfDay? picked = await showTimePicker(
            context: context,
            initialTime: _reminderTime,
          );
          if (picked != null) {
            setState(() {
              _reminderTime = picked;
            });
            await _notificationService.scheduleDailyReminder(picked);
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: TrText('Rappel programmé à ${picked.format(context)}')),
              );
            }
          }
        },
      ),
    );
  }

  Widget _buildTestButton({
    required String title,
    required IconData icon,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color),
        ),
        title: TrText(title),
        trailing: const Icon(Icons.play_arrow),
        onTap: onPressed,
      ),
    );
  }

  Widget _buildActionButton({
    required String title,
    required IconData icon,
    Color? color,
    required VoidCallback onPressed,
  }) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: ListTile(
        leading: Icon(icon, color: color ?? AppDesign.primaryIndigo),
        title: TrText(title),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
        onTap: onPressed,
      ),
    );
  }

  void _showTestNotification(String type) async {
    switch (type) {
      case 'budget':
        await _notificationService.showBudgetExceededNotification('Alimentation');
        break;
      case 'goal':
        await _notificationService.showGoalReachedNotification('Vacances Bali');
        break;
      case 'daily':
        // Pour tester immédiatement
        await _notificationService.scheduleDailyReminder(
          TimeOfDay.fromDateTime(DateTime.now().add(const Duration(seconds: 5))),
        );
        break;
    }
    
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: TrText('Notification test envoyée !'),
          duration: Duration(seconds: 2),
        ),
      );
    }
  }

  void _showPendingNotifications() async {
    final pending = await _notificationService.getPendingNotifications();
    
    if (!mounted) return;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const TrText('Notifications en attente'),
        content: pending.isEmpty
            ? const TrText('Aucune notification programmée')
            : SizedBox(
                width: double.maxFinite,
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: pending.length,
                  itemBuilder: (context, index) {
                    final notif = pending[index];
                    return ListTile(
                      leading: const Icon(Icons.schedule),
                      title: TrText(notif.title ?? 'Sans titre'),
                      subtitle: TrText(notif.body ?? 'Sans description'),
                    );
                  },
                ),
              ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const TrText('Fermer'),
          ),
        ],
      ),
    );
  }
}
