import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter/material.dart';
import 'package:budget/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Play Store screenshots', () {
    testWidgets('Navigate key screens and capture', (WidgetTester tester) async {
      app.main();
      await tester.pumpAndSettle(const Duration(seconds: 3));

      // 1. Auth screen (login)
      await tester.pumpAndSettle();
      await takeScreenshot(tester, name: '01_auth_login');

      // Switch to signup tab if exists
      final signupTab = find.textContaining('Inscrire', findRichText: true);
      if (signupTab.evaluate().isNotEmpty) {
        await tester.tap(signupTab);
        await tester.pumpAndSettle();
        await takeScreenshot(tester, name: '02_auth_signup');
      }

      // Demo login if button exists
      final demoBtn = find.textContaining('Demo');
      if (demoBtn.evaluate().isNotEmpty) {
        await tester.tap(demoBtn);
      } else {
        // Fallback: fill fields minimally
        final email = find.byType(TextFormField).at(0);
        final pass = find.byType(TextFormField).at(1);
        await tester.enterText(email, 'demo123@budgetpro.net');
        await tester.enterText(pass, 'password123');
        final submit = find.textContaining('Se connecter');
        if (submit.evaluate().isNotEmpty) {
          await tester.tap(submit);
        }
      }
      await tester.pumpAndSettle(const Duration(seconds: 3));
      await takeScreenshot(tester, name: '03_dashboard');

      // Navigate Transactions list
      final transactionsLabel = find.textContaining('Transactions');
      if (transactionsLabel.evaluate().isNotEmpty) {
        await tester.tap(transactionsLabel);
        await tester.pumpAndSettle();
        await takeScreenshot(tester, name: '04_transactions_list');
      }

      // Open add transaction form if floating action button exists
      final fab = find.byType(FloatingActionButton);
      if (fab.evaluate().isNotEmpty) {
        await tester.tap(fab);
        await tester.pumpAndSettle();
        await takeScreenshot(tester, name: '05_transaction_form');
        // Close modal if open
        final close = find.byIcon(Icons.close);
        if (close.evaluate().isNotEmpty) {
          await tester.tap(close);
          await tester.pumpAndSettle();
        } else {
          await tester.pageBack();
          await tester.pumpAndSettle();
        }
      }

      // Navigate Budget planner
      final budgetLabel = find.textContaining('Budget');
      if (budgetLabel.evaluate().isNotEmpty) {
        await tester.tap(budgetLabel);
        await tester.pumpAndSettle();
        await takeScreenshot(tester, name: '06_budget_planner');
      }

      // Navigate Goals
      final goalsLabel = find.textContaining('Objectifs');
      if (goalsLabel.evaluate().isNotEmpty) {
        await tester.tap(goalsLabel);
        await tester.pumpAndSettle();
        await takeScreenshot(tester, name: '07_goals');
      }

      // Navigate Debts/IOU
      final iouLabel = find.textContaining('Dettes')
          .evaluate()
          .isNotEmpty
          ? find.textContaining('Dettes')
          : find.textContaining('IOU');
      if (iouLabel.evaluate().isNotEmpty) {
        await tester.tap(iouLabel);
        await tester.pumpAndSettle();
        await takeScreenshot(tester, name: '08_iou');
      }

      // Settings/Profile
      final settingsIcon = find.byIcon(Icons.settings);
      if (settingsIcon.evaluate().isNotEmpty) {
        await tester.tap(settingsIcon);
        await tester.pumpAndSettle();
        await takeScreenshot(tester, name: '09_settings');
      }
    });
  });
}

Future<void> takeScreenshot(WidgetTester tester, {required String name}) async {
  // The screenshots package hooks into this via driver; here we just ensure settled state
  await tester.pumpAndSettle();
}
