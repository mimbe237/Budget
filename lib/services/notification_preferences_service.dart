import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'notification_service.dart';

/// Service de gestion des préférences de notification
class NotificationPreferencesService extends ChangeNotifier {
  static final NotificationPreferencesService _instance = NotificationPreferencesService._internal();
  factory NotificationPreferencesService() => _instance;
  NotificationPreferencesService._internal();

  static const String _dailyReminderKey = 'daily_reminder_enabled';
  static const String _budgetAlertsKey = 'budget_alerts_enabled';
  static const String _goalAlertsKey = 'goal_alerts_enabled';
  static const String _budgetThresholdKey = 'budget_alert_threshold';

  bool _dailyReminderEnabled = true;
  bool _budgetAlertsEnabled = true;
  bool _goalAlertsEnabled = true;
  double _budgetAlertThreshold = 0.85;
  bool _initialized = false;

  bool get dailyReminderEnabled => _dailyReminderEnabled;
  bool get budgetAlertsEnabled => _budgetAlertsEnabled;
  bool get goalAlertsEnabled => _goalAlertsEnabled;
  double get budgetAlertThreshold => _budgetAlertThreshold;
  bool get initialized => _initialized;

  /// Charge les préférences sauvegardées
  Future<void> loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    
    _dailyReminderEnabled = prefs.getBool(_dailyReminderKey) ?? true;
    _budgetAlertsEnabled = prefs.getBool(_budgetAlertsKey) ?? true;
    _goalAlertsEnabled = prefs.getBool(_goalAlertsKey) ?? true;
    _budgetAlertThreshold = prefs.getDouble(_budgetThresholdKey) ?? 0.85;

    // Synchroniser avec NotificationService
    final notifService = NotificationService.instance;
    await notifService.setBudgetAlertsEnabled(_budgetAlertsEnabled);
    await notifService.setBudgetAlertThreshold(_budgetAlertThreshold);
    
    _initialized = true;
    notifyListeners();
  }

  /// Active/Désactive le rappel quotidien
  Future<void> setDailyReminderEnabled(bool enabled) async {
    _dailyReminderEnabled = enabled;
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_dailyReminderKey, enabled);
    
    notifyListeners();
  }

  /// Active/Désactive les alertes budget
  Future<void> setBudgetAlertsEnabled(bool enabled) async {
    _budgetAlertsEnabled = enabled;
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_budgetAlertsKey, enabled);
    
    // Synchroniser avec NotificationService
    await NotificationService.instance.setBudgetAlertsEnabled(enabled);
    
    notifyListeners();
  }

  /// Active/Désactive les alertes objectifs
  Future<void> setGoalAlertsEnabled(bool enabled) async {
    _goalAlertsEnabled = enabled;
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_goalAlertsKey, enabled);
    
    notifyListeners();
  }

  /// Définit le seuil d'alerte budget (0.0 à 1.0)
  Future<void> setBudgetAlertThreshold(double threshold) async {
    _budgetAlertThreshold = threshold.clamp(0.5, 1.2);
    
    final prefs = await SharedPreferences.getInstance();
    await prefs.setDouble(_budgetThresholdKey, _budgetAlertThreshold);
    
    // Synchroniser avec NotificationService
    await NotificationService.instance.setBudgetAlertThreshold(_budgetAlertThreshold);
    
    notifyListeners();
  }
}
