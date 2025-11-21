import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz;

/// Service de gestion des notifications locales (Singleton)
/// Gère les alertes de budget, objectifs et rappels quotidiens
class NotificationService {
  // Singleton
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  static NotificationService get instance => _instance;
  
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();

  bool _isInitialized = false;

  // IDs des canaux de notification
  static const String _budgetChannelId = 'budget_channel';
  static const String _budgetChannelName = 'Alertes Budget';
  static const String _budgetChannelDescription = 'Notifications pour les dépassements de budget';

  static const String _dailyChannelId = 'daily_channel';
  static const String _dailyChannelName = 'Rappels Quotidiens';
  static const String _dailyChannelDescription = 'Rappels pour enregistrer vos dépenses';

  // Préférences utilisateur (simulation - à remplacer par SharedPreferences en production)
  bool _budgetAlertsEnabled = true;
  bool _dailyRemindersEnabled = true;
  bool _goalAlertsEnabled = true;

  /// Initialise le service de notifications
  Future<void> init() async {
    if (_isInitialized) return;

    // Initialiser les fuseaux horaires
    tz.initializeTimeZones();
    
    // Configuration Android
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    // Configuration iOS
    const DarwinInitializationSettings initializationSettingsIOS =
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    // Configuration globale
    const InitializationSettings initializationSettings =
        InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsIOS,
    );

    // Initialiser le plugin
    await _notificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Demander les permissions
    await _requestPermissions();

    // Créer les canaux de notification (Android)
    await _createNotificationChannels();

    _isInitialized = true;
    debugPrint('✅ NotificationService initialisé avec succès');
  }

  /// Demande les permissions de notification
  Future<void> _requestPermissions() async {
    // Android 13+ (API 33+)
    if (await _notificationsPlugin
            .resolvePlatformSpecificImplementation<
                AndroidFlutterLocalNotificationsPlugin>()
            ?.requestNotificationsPermission() ??
        false) {
      debugPrint('✅ Permission Android accordée');
    }

    // iOS
    final bool? iosGranted = await _notificationsPlugin
        .resolvePlatformSpecificImplementation<
            IOSFlutterLocalNotificationsPlugin>()
        ?.requestPermissions(
          alert: true,
          badge: true,
          sound: true,
        );

    if (iosGranted ?? false) {
      debugPrint('✅ Permission iOS accordée');
    }
  }

  /// Crée les canaux de notification Android
  Future<void> _createNotificationChannels() async {
    final androidPlugin = _notificationsPlugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();

    if (androidPlugin == null) return;

    // Canal pour les alertes budget (Priorité Haute)
    const AndroidNotificationChannel budgetChannel = AndroidNotificationChannel(
      _budgetChannelId,
      _budgetChannelName,
      description: _budgetChannelDescription,
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
      showBadge: true,
    );

    // Canal pour les rappels quotidiens (Priorité Moyenne)
    const AndroidNotificationChannel dailyChannel = AndroidNotificationChannel(
      _dailyChannelId,
      _dailyChannelName,
      description: _dailyChannelDescription,
      importance: Importance.defaultImportance,
      playSound: true,
      enableVibration: false,
      showBadge: true,
    );

    await androidPlugin.createNotificationChannel(budgetChannel);
    await androidPlugin.createNotificationChannel(dailyChannel);

    debugPrint('✅ Canaux de notification créés');
  }

  /// Callback lors du clic sur une notification
  void _onNotificationTapped(NotificationResponse response) {
    debugPrint('Notification tapée: ${response.id}, payload: ${response.payload}');
    // TODO: Gérer la navigation selon le payload
    // Par exemple: naviguer vers l'écran de budget si payload = 'budget_exceeded'
  }

  // =========================================================================
  // GESTION DES PRÉFÉRENCES (Simulation)
  // =========================================================================

  /// Vérifie si les alertes de budget sont activées
  bool _isBudgetAlertEnabled() {
    // TODO: Remplacer par SharedPreferences.getBool('budget_alerts_enabled')
    return _budgetAlertsEnabled;
  }

  /// Vérifie si les rappels quotidiens sont activés
  bool _isDailyReminderEnabled() {
    // TODO: Remplacer par SharedPreferences.getBool('daily_reminders_enabled')
    return _dailyRemindersEnabled;
  }

  /// Vérifie si les alertes d'objectifs sont activées
  bool _isGoalAlertEnabled() {
    // TODO: Remplacer par SharedPreferences.getBool('goal_alerts_enabled')
    return _goalAlertsEnabled;
  }

  /// Active/Désactive les alertes de budget
  Future<void> setBudgetAlertsEnabled(bool enabled) async {
    _budgetAlertsEnabled = enabled;
    // TODO: SharedPreferences.setBool('budget_alerts_enabled', enabled)
    debugPrint('Alertes budget: ${enabled ? "activées" : "désactivées"}');
  }

  /// Active/Désactive les rappels quotidiens
  Future<void> setDailyRemindersEnabled(bool enabled) async {
    _dailyRemindersEnabled = enabled;
    // TODO: SharedPreferences.setBool('daily_reminders_enabled', enabled)
    
    if (!enabled) {
      await cancelDailyReminder();
    }
    debugPrint('Rappels quotidiens: ${enabled ? "activés" : "désactivés"}');
  }

  /// Active/Désactive les alertes d'objectifs
  Future<void> setGoalAlertsEnabled(bool enabled) async {
    _goalAlertsEnabled = enabled;
    // TODO: SharedPreferences.setBool('goal_alerts_enabled', enabled)
    debugPrint('Alertes objectifs: ${enabled ? "activées" : "désactivées"}');
  }

  // =========================================================================
  // NOTIFICATIONS INSTANTANÉES
  // =========================================================================

  /// Affiche une notification de dépassement de budget
  Future<void> showBudgetExceededNotification(String categoryName) async {
    if (!_isInitialized) {
      debugPrint('⚠️ NotificationService non initialisé');
      return;
    }

    if (!_isBudgetAlertEnabled()) {
      debugPrint('ℹ️ Alertes budget désactivées');
      return;
    }

    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      _budgetChannelId,
      _budgetChannelName,
      channelDescription: _budgetChannelDescription,
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
      color: Color(0xFFEF5350), // Rouge
      playSound: true,
      enableVibration: true,
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notificationsPlugin.show(
      categoryName.hashCode, // ID unique basé sur la catégorie
      'Attention ! Budget dépassé 🚨',
      'Votre budget "$categoryName" a été dépassé. Consultez vos dépenses.',
      notificationDetails,
      payload: 'budget_exceeded:$categoryName',
    );

    debugPrint('📢 Notification budget envoyée: $categoryName');
  }

  /// Affiche une notification de félicitations pour objectif atteint
  Future<void> showGoalReachedNotification(String goalName) async {
    if (!_isInitialized) {
      debugPrint('⚠️ NotificationService non initialisé');
      return;
    }

    if (!_isGoalAlertEnabled()) {
      debugPrint('ℹ️ Alertes objectifs désactivées');
      return;
    }

    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      _budgetChannelId,
      _budgetChannelName,
      channelDescription: _budgetChannelDescription,
      importance: Importance.high,
      priority: Priority.high,
      icon: '@mipmap/ic_launcher',
      color: Color(0xFF66BB6A), // Vert
      playSound: true,
      enableVibration: true,
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notificationsPlugin.show(
      goalName.hashCode, // ID unique basé sur l'objectif
      'Félicitations ! 🎉',
      'Objectif "$goalName" atteint ! Vous avez réussi votre défi.',
      notificationDetails,
      payload: 'goal_reached:$goalName',
    );

    debugPrint('🎉 Notification objectif envoyée: $goalName');
  }

  /// Affiche une notification d'échéance IOU proche
  Future<void> showIOUDueSoonNotification(String partyName, int daysRemaining) async {
    if (!_isInitialized) return;

    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      _budgetChannelId,
      _budgetChannelName,
      importance: Importance.defaultImportance,
      priority: Priority.defaultPriority,
      icon: '@mipmap/ic_launcher',
      color: Color(0xFFFFA726), // Orange
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notificationsPlugin.show(
      partyName.hashCode,
      'Échéance proche ⏰',
      'Dette avec "$partyName" à régler dans $daysRemaining jour${daysRemaining > 1 ? 's' : ''}.',
      notificationDetails,
      payload: 'iou_due:$partyName',
    );

    debugPrint('⏰ Notification IOU envoyée: $partyName');
  }

  // =========================================================================
  // NOTIFICATIONS PROGRAMMÉES
  // =========================================================================

  /// Programme un rappel quotidien
  Future<void> scheduleDailyReminder(TimeOfDay time) async {
    if (!_isInitialized) {
      debugPrint('⚠️ NotificationService non initialisé');
      return;
    }

    if (!_isDailyReminderEnabled()) {
      debugPrint('ℹ️ Rappels quotidiens désactivés');
      return;
    }

    // Annuler l'ancien rappel s'il existe
    await cancelDailyReminder();

    // Créer la date/heure pour le rappel
    final now = DateTime.now();
    var scheduledDate = DateTime(
      now.year,
      now.month,
      now.day,
      time.hour,
      time.minute,
    );

    // Si l'heure est déjà passée aujourd'hui, programmer pour demain
    if (scheduledDate.isBefore(now)) {
      scheduledDate = scheduledDate.add(const Duration(days: 1));
    }

    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      _dailyChannelId,
      _dailyChannelName,
      channelDescription: _dailyChannelDescription,
      importance: Importance.defaultImportance,
      priority: Priority.defaultPriority,
      icon: '@mipmap/ic_launcher',
      color: Color(0xFF5E35B1), // Violet
      playSound: true,
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails notificationDetails = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notificationsPlugin.zonedSchedule(
      0, // ID fixe pour le rappel quotidien
      'N\'oubliez pas vos dépenses ! 📝',
      'Prenez 2 minutes pour enregistrer vos dépenses du jour.',
      tz.TZDateTime.from(scheduledDate, tz.local),
      notificationDetails,
      androidScheduleMode: AndroidScheduleMode.exactAllowWhileIdle,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
      matchDateTimeComponents: DateTimeComponents.time, // Répéter tous les jours
      payload: 'daily_reminder',
    );

    debugPrint('📅 Rappel quotidien programmé à ${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}');
  }

  /// Annule le rappel quotidien
  Future<void> cancelDailyReminder() async {
    await _notificationsPlugin.cancel(0); // ID 0 = rappel quotidien
    debugPrint('🚫 Rappel quotidien annulé');
  }

  /// Annule toutes les notifications
  Future<void> cancelAllNotifications() async {
    await _notificationsPlugin.cancelAll();
    debugPrint('🚫 Toutes les notifications annulées');
  }

  /// Annule une notification spécifique par ID
  Future<void> cancelNotification(int id) async {
    await _notificationsPlugin.cancel(id);
    debugPrint('🚫 Notification $id annulée');
  }

  // =========================================================================
  // UTILITAIRES
  // =========================================================================

  /// Obtient les notifications actives en attente
  Future<List<PendingNotificationRequest>> getPendingNotifications() async {
    return await _notificationsPlugin.pendingNotificationRequests();
  }

  /// Vérifie si les notifications sont autorisées
  Future<bool> areNotificationsEnabled() async {
    if (!_isInitialized) return false;

    final androidImpl = _notificationsPlugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    
    if (androidImpl != null) {
      return await androidImpl.areNotificationsEnabled() ?? false;
    }

    return true; // iOS géré par le système
  }

  /// Ouvre les paramètres de notification de l'application
  Future<void> openNotificationSettings() async {
    final androidImpl = _notificationsPlugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();
    
    await androidImpl?.requestNotificationsPermission();
  }
}
