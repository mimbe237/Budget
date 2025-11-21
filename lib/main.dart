import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_fonts/google_fonts.dart';
import 'services/mock_data_service.dart';
import 'screens/onboarding/onboarding_wizard_screen.dart';
import 'screens/transactions/transaction_form_screen.dart';
import 'screens/dashboard/dashboard_screen.dart';
import 'screens/accounts/account_management_screen.dart';
import 'screens/budget/budget_planner_screen.dart';
import 'screens/ious/iou_tracking_screen.dart';
import 'screens/goals/goal_funding_screen.dart';
import 'screens/navigation/main_navigation_shell.dart';
import 'screens/auth/auth_screen.dart';
import 'models/transaction.dart' as app_transaction;

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
  
  runApp(const BudgetApp());
}

class BudgetApp extends StatelessWidget {
  const BudgetApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Budget Personnel',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6366F1), // Indigo moderne
          brightness: Brightness.light,
        ),
        
        // Typographie moderne avec Google Fonts
        textTheme: GoogleFonts.interTextTheme(),
        
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
          seedColor: const Color(0xFF6366F1),
          brightness: Brightness.dark,
        ),
        textTheme: GoogleFonts.interTextTheme(ThemeData.dark().textTheme),
        cardTheme: CardThemeData(
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
        ),
      ),
      
      themeMode: ThemeMode.system,
      // Utiliser AuthWrapper pour gérer l'authentification
      home: const AuthWrapper(),
    );
  }
}

/// Widget qui gère l'état d'authentification
class AuthWrapper extends StatelessWidget {
  const AuthWrapper({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        // En attente de la vérification de l'état
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        // Utilisateur connecté → MainNavigationShell
        if (snapshot.hasData && snapshot.data != null) {
          return const MainNavigationShell();
        }

        // Utilisateur non connecté → AuthScreen
        return const AuthScreen();
      },
    );
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: const DashboardScreen(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showTransactionTypeDialog(context),
        backgroundColor: const Color(0xFF6366F1),
        icon: const Icon(Icons.add),
        label: const Text('Transaction'),
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
            const Text(
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
        backgroundColor: color.withOpacity(0.1),
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
          Text(
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
