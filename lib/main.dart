import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'l10n/app_localizations.dart';
import 'services/currency_service.dart';
import 'services/notification_preferences_service.dart';
import 'screens/navigation/main_navigation_shell.dart';
import 'screens/auth/auth_screen.dart';
import 'screens/dashboard/dashboard_screen.dart';
import 'screens/transactions/transaction_form_screen.dart';
import 'models/transaction.dart' as app_transaction;
import 'widgets/branding_splash.dart';
import 'services/theme_service.dart';
import 'services/notification_service.dart';
import 'services/translation_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
    // Initialisation de Firebase
    try {
      await Firebase.initializeApp(
        options: DefaultFirebaseOptions.currentPlatform,
      );
      print('✓ Firebase initialized successfully');
    } catch (e) {
      print('⚠️ Firebase initialization failed: $e');
      print('⚠️ L\'application continuera avec MockDataService');
      print('⚠️ Exécutez "flutterfire configure" pour configurer Firebase correctement');
    }

  // Initialisation des notifications locales (permet les alertes budget/objectifs)
  try {
    await NotificationService().init();
  } catch (e) {
    debugPrint('⚠️ NotificationService init failed: $e');
  }
  
  // Charger les traductions Firestore au démarrage
  try {
    await TranslationService().startRealtime();
  } catch (e) {
    debugPrint('⚠️ TranslationService load failed: $e');
  }
  
  runApp(const AppBootstrap());
}

class AppBootstrap extends StatelessWidget {
  const AppBootstrap({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LocaleProvider()..loadLocale()),
        ChangeNotifierProvider(create: (_) => CurrencyService()..loadCurrency()),
        ChangeNotifierProvider(create: (_) => NotificationPreferencesService()..loadPreferences()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()..loadTheme()),
        ChangeNotifierProvider(create: (_) => TranslationService()),
      ],
      child: const BudgetApp(),
    );
  }
}

class BudgetApp extends StatelessWidget {
  const BudgetApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final localeProvider = context.watch<LocaleProvider>();
    final themeProvider = context.watch<ThemeProvider>();

    return MaterialApp(
      title: t('Budget Pro'),
      debugShowCheckedModeBanner: false,
      builder: (context, child) {
        // Empêche le clavier de compresser les écrans : hauteur stable quel que soit le formulaire
        final mq = MediaQuery.of(context);
        return MediaQuery(
          data: mq.copyWith(viewInsets: EdgeInsets.zero),
          child: child ?? const SizedBox.shrink(),
        );
      },
      locale: localeProvider.locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ],
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6C5CF7), // Couleur principale du logo
          brightness: Brightness.light,
        ),

        // Typographie par défaut (système) pour un chargement plus rapide
        visualDensity: VisualDensity.adaptivePlatformDensity,

        // Coins arrondis pour tout
        cardTheme: CardThemeData(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
        
        // Boutons modernes
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            elevation: 0,
          ),
        ),
        
        // Input fields arrondis
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide.none,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: Color(0xFF6366F1), width: 2),
          ),
        ),
        
        // AppBar moderne
        appBarTheme: AppBarTheme(
          elevation: 0,
          centerTitle: true,
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.black87,
          titleTextStyle: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.black87,
          ),
        ),
      ),
      
      // Theme sombre
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6C5CF7),
          brightness: Brightness.dark,
          surface: const Color(0xFF111827),
          background: const Color(0xFF0B1220),
          tertiary: const Color(0xFF8B5CF6),
        ),
        scaffoldBackgroundColor: const Color(0xFF0B1220),
        canvasColor: const Color(0xFF0B1220),
        cardColor: const Color(0xFF111827),
        textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme).apply(
          bodyColor: Colors.grey[100],
          displayColor: Colors.grey[100],
        ),
        appBarTheme: AppBarTheme(
          elevation: 0,
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.grey[100],
          titleTextStyle: GoogleFonts.inter(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.grey[50],
          ),
        ),
        cardTheme: CardThemeData(
          elevation: 0,
          color: const Color(0xFF111827),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
        bottomNavigationBarTheme: BottomNavigationBarThemeData(
          backgroundColor: const Color(0xFF0F172A),
          selectedItemColor: const Color(0xFF8B5CF6),
          unselectedItemColor: Colors.grey[500],
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF8B5CF6),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
            ),
            elevation: 0,
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFF111827),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: Colors.grey.withValues(alpha: 0.2)),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: BorderSide(color: Colors.grey.withValues(alpha: 0.25)),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(16),
            borderSide: const BorderSide(color: Color(0xFF8B5CF6), width: 2),
          ),
          labelStyle: TextStyle(color: Colors.grey[300]),
          hintStyle: TextStyle(color: Colors.grey[500]),
        ),
      ),
      
      themeMode: themeProvider.themeMode,
      // Utiliser AuthWrapper pour gérer l'authentification
      home: const AuthWrapper(),
    );
  }
}

/// Widget qui gère l'état d'authentification
class AuthWrapper extends StatefulWidget {
  const AuthWrapper({Key? key}) : super(key: key);

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _showSplash = true;

  @override
  void initState() {
    super.initState();
    // Timeout pour éviter le blocage sur splash
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted && _showSplash) {
        setState(() {
          _showSplash = false;
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    // Vérifier si Firebase est initialisé
    try {
      return StreamBuilder<User?>(
        stream: FirebaseAuth.instance.authStateChanges(),
        builder: (context, snapshot) {
          // En attente de la vérification de l'état → splash brandé
          if (snapshot.connectionState == ConnectionState.waiting && _showSplash) {
            return const BrandingSplash();
          }

          // Utilisateur connecté → MainNavigationShell
          if (snapshot.hasData && snapshot.data != null) {
            return const MainNavigationShell();
          }

          // Utilisateur non connecté → AuthScreen
          return const AuthScreen();
        },
      );
    } catch (e) {
      // Si Firebase n'est pas initialisé, afficher directement AuthScreen
      debugPrint('⚠️ Firebase Auth not available: $e');
      return const AuthScreen();
    }
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: const MainNavigationShell(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showTransactionTypeDialog(context),
        backgroundColor: const Color(0xFF6366F1),
        icon: const Icon(Icons.add),
        label: const TrText('Transaction'),
      ),
    );
  }
  
  void _showTransactionTypeDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const TrText(
              'Nouvelle Transaction',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: _buildTransactionTypeButton(
                    context,
                    'Dépense',
                    Icons.remove_circle,
                    Colors.red,
                    app_transaction.TransactionType.expense,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildTransactionTypeButton(
                    context,
                    'Revenu',
                    Icons.add_circle,
                    Colors.green,
                    app_transaction.TransactionType.income,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildTransactionTypeButton(
              context,
              'Transfert',
              Icons.swap_horiz,
              Colors.blue,
              app_transaction.TransactionType.transfer,
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildTransactionTypeButton(
    BuildContext context,
    String label,
    IconData icon,
    Color color,
    app_transaction.TransactionType type,
  ) {
    return ElevatedButton(
      onPressed: () {
        Navigator.pop(context);
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => TransactionFormScreen(transactionType: type),
          ),
        );
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: color.withValues(alpha: 0.1),
        foregroundColor: color,
        padding: const EdgeInsets.symmetric(vertical: 20),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
        elevation: 0,
      ),
      child: Column(
        children: [
          Icon(icon, size: 32),
          const SizedBox(height: 8),
          TrText(
            label,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}
