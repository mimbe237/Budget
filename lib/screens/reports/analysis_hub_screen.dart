import 'package:flutter/material.dart';
import '../../constants/app_design.dart';
import '../ai_analysis/ai_analysis_screen.dart';
import 'advanced_reports_screen.dart';
import '../../widgets/modern_page_app_bar.dart';
import 'package:budget/l10n/app_localizations.dart';
import '../transactions/transactions_list_screen.dart';

class AnalysisHubScreen extends StatefulWidget {
  const AnalysisHubScreen({super.key});

  @override
  State<AnalysisHubScreen> createState() => _AnalysisHubScreenState();
}

class _AnalysisHubScreenState extends State<AnalysisHubScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < 600;
    return Scaffold(
      appBar: ModernPageAppBar(
        title: t('Analyses & Rapports'),
        subtitle: t('Visualisez vos données et insights IA'),
        icon: Icons.bar_chart_rounded,
        showProfile: true,
        showHome: !isMobile,
        hideLogoOnMobile: true,
        actions: [
          IconButton(
            tooltip: t('Historique des transactions'),
            icon: const Icon(Icons.history, color: AppDesign.primaryIndigo),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const TransactionsListScreen(),
                ),
              );
            },
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppDesign.primaryIndigo,
          unselectedLabelColor: Colors.grey,
          indicatorColor: AppDesign.primaryIndigo,
          indicatorWeight: 3,
          tabs: const [
            Tab(
              icon: Icon(Icons.bar_chart_rounded),
              text: 'Rapports',
            ),
            Tab(
              icon: Icon(Icons.smart_toy_outlined),
              text: 'Assistant IA',
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          AdvancedReportsScreen(),
          AIAnalysisScreen(),
        ],
      ),
    );
  }
}
