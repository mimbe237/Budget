import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../constants/app_design.dart';
import '../../models/user_profile.dart';
import 'package:intl/intl.dart';
import '../../widgets/revolutionary_logo.dart';
import 'package:budget/l10n/app_localizations.dart';
import 'translation_management_screen.dart';

/// Écran d'administration (ADMIN SEULEMENT)
/// Permet de superviser la plateforme et gérer les utilisateurs
class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  int _currentTabIndex = 0;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  // Données factices - Liste de tous les utilisateurs de la plateforme
  final List<UserProfile> _allUsers = [
    UserProfile(
      userId: '1',
      displayName: 'Jean Dupont',
      firstName: 'Jean',
      lastName: 'Dupont',
      email: 'jean.dupont@example.com',
      currency: 'EUR',
      role: 'user',
      status: 'active',
      createdAt: DateTime(2024, 1, 15),
      updatedAt: DateTime(2024, 1, 15),
    ),
    UserProfile(
      userId: '2',
      displayName: 'Marie Martin',
      firstName: 'Marie',
      lastName: 'Martin',
      email: 'marie.martin@example.com',
      currency: 'EUR',
      role: 'premium',
      status: 'active',
      createdAt: DateTime(2024, 3, 22),
      updatedAt: DateTime(2024, 3, 22),
    ),
    UserProfile(
      userId: '3',
      displayName: 'Pierre Dubois',
      firstName: 'Pierre',
      lastName: 'Dubois',
      email: 'pierre.dubois@example.com',
      currency: 'EUR',
      role: 'user',
      status: 'blocked',
      createdAt: DateTime(2024, 5, 10),
      updatedAt: DateTime(2024, 5, 10),
    ),
    UserProfile(
      userId: '4',
      displayName: 'Sophie Bernard',
      firstName: 'Sophie',
      lastName: 'Bernard',
      email: 'sophie.bernard@example.com',
      currency: 'EUR',
      role: 'user',
      status: 'active',
      createdAt: DateTime(2024, 6, 5),
      updatedAt: DateTime(2024, 6, 5),
    ),
    UserProfile(
      userId: '5',
      displayName: 'Luc Petit',
      firstName: 'Luc',
      lastName: 'Petit',
      email: 'luc.petit@example.com',
      currency: 'EUR',
      role: 'user',
      status: 'disabled',
      createdAt: DateTime(2024, 7, 18),
      updatedAt: DateTime(2024, 7, 18),
    ),
    UserProfile(
      userId: '6',
      displayName: 'Emma Robert',
      firstName: 'Emma',
      lastName: 'Robert',
      email: 'emma.robert@example.com',
      currency: 'EUR',
      role: 'premium',
      status: 'active',
      createdAt: DateTime(2024, 8, 12),
      updatedAt: DateTime(2024, 8, 12),
    ),
    UserProfile(
      userId: '7',
      displayName: 'Thomas Richard',
      firstName: 'Thomas',
      lastName: 'Richard',
      email: 'thomas.richard@example.com',
      currency: 'EUR',
      role: 'user',
      status: 'blocked',
      createdAt: DateTime(2024, 9, 3),
      updatedAt: DateTime(2024, 9, 3),
    ),
    UserProfile(
      userId: '8',
      displayName: 'Julie Durand',
      firstName: 'Julie',
      lastName: 'Durand',
      email: 'julie.durand@example.com',
      currency: 'EUR',
      role: 'user',
      status: 'active',
      createdAt: DateTime(2024, 10, 20),
      updatedAt: DateTime(2024, 10, 20),
    ),
    UserProfile(
      userId: '9',
      displayName: 'Marc Moreau',
      firstName: 'Marc',
      lastName: 'Moreau',
      email: 'marc.moreau@example.com',
      currency: 'EUR',
      role: 'admin',
      status: 'active',
      createdAt: DateTime(2023, 12, 1),
      updatedAt: DateTime(2023, 12, 1),
    ),
    UserProfile(
      userId: '10',
      displayName: 'Alice Simon',
      firstName: 'Alice',
      lastName: 'Simon',
      email: 'alice.simon@example.com',
      currency: 'EUR',
      role: 'user',
      status: 'active',
      createdAt: DateTime(2024, 11, 8),
      updatedAt: DateTime(2024, 11, 8),
    ),
  ];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  // Statistiques calculées
  int get _totalUsers => _allUsers.length;
  int get _blockedUsers => _allUsers.where((u) => u.status == 'blocked').length;
  int get _disabledUsers => _allUsers.where((u) => u.status == 'disabled').length;
  double get _totalTransactionVolume => 1247853.50; // Volume factice

  // Filtrer les utilisateurs selon la recherche
  List<UserProfile> get _filteredUsers {
    if (_searchQuery.isEmpty) return _allUsers;
    
    return _allUsers.where((user) {
      final fullName = '${user.firstName ?? ''} ${user.lastName ?? ''}'.toLowerCase();
      final email = (user.email ?? '').toLowerCase();
      final query = _searchQuery.toLowerCase();
      
      return fullName.contains(query) || email.contains(query);
    }).toList();
  }

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
              'Administration',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: AppDesign.expenseColor,
              ),
            ),
          ],
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: AppDesign.expenseColor),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: AppDesign.expenseColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              children: [
                Icon(Icons.admin_panel_settings, size: 18, color: AppDesign.expenseColor),
                SizedBox(width: 6),
                TrText(
                  'ADMIN',
                  style: TextStyle(
                    color: AppDesign.expenseColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentTabIndex,
        children: [
          _buildStatsTab(),
          _buildUserManagementTab(),
          _buildTranslationsTab(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentTabIndex,
        onTap: (index) {
          setState(() {
            _currentTabIndex = index;
          });
        },
        selectedItemColor: AppDesign.expenseColor,
        unselectedItemColor: Colors.grey,
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.bar_chart),
            label: t('Statistiques'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.people),
            label: t('Utilisateurs'),
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.translate),
            label: t('Traductions'),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // ONGLET 1 : STATISTIQUES
  // =========================================================================

  Widget _buildStatsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const TrText(
            'Vue d\'ensemble',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: AppDesign.primaryIndigo,
            ),
          ),
          const SizedBox(height: 20),
          
          // KPIs en grille
          Row(
            children: [
              Expanded(
                child: _buildKPICard(
                  title: t('Utilisateurs'),
                  value: _totalUsers.toString(),
                  icon: Icons.people,
                  color: AppDesign.primaryIndigo,
                  subtitle: t('Total inscrits'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildKPICard(
                  title: t('Bloqués'),
                  value: _blockedUsers.toString(),
                  icon: Icons.block,
                  color: AppDesign.expenseColor,
                  subtitle: t('Comptes bloqués'),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          Row(
            children: [
              Expanded(
                child: _buildKPICard(
                  title: t('Désactivés'),
                  value: _disabledUsers.toString(),
                  icon: Icons.pause_circle,
                  color: Colors.orange,
                  subtitle: t('Comptes inactifs'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildKPICard(
                  title: t('Volume'),
                  value: '${(_totalTransactionVolume / 1000).toStringAsFixed(0)}K€',
                  icon: Icons.euro,
                  color: AppDesign.incomeColor,
                  subtitle: t('Transactions'),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 32),
          
          // Graphique de croissance
          const TrText(
            'Croissance des inscriptions',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          _buildGrowthChart(),
          
          const SizedBox(height: 32),
          
          // Répartition par rôle
          const TrText(
            'Répartition par rôle',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          
          _buildRoleDistribution(),
        ],
      ),
    );
  }

  Widget _buildKPICard({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
    required String subtitle,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 16),
          TrText(
            value,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          TrText(
            subtitle,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGrowthChart() {
    return Container(
      height: 220,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: LineChart(
        LineChartData(
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            horizontalInterval: 2,
            getDrawingHorizontalLine: (value) {
              return FlLine(
                color: Colors.grey[200],
                strokeWidth: 1,
              );
            },
          ),
          titlesData: FlTitlesData(
            show: true,
            rightTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            topTitles: const AxisTitles(
              sideTitles: SideTitles(showTitles: false),
            ),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 30,
                interval: 1,
                getTitlesWidget: (value, meta) {
                  const months = ['Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov'];
                  if (value.toInt() >= 0 && value.toInt() < months.length) {
                    return Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: TrText(
                        months[value.toInt()],
                        style: TextStyle(
                          color: Colors.grey[600],
                          fontSize: 11,
                        ),
                      ),
                    );
                  }
                  return const TrText('');
                },
              ),
            ),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 35,
                interval: 2,
                getTitlesWidget: (value, meta) {
                  return TrText(
                    value.toInt().toString(),
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 11,
                    ),
                  );
                },
              ),
            ),
          ),
          borderData: FlBorderData(show: false),
          minX: 0,
          maxX: 5,
          minY: 0,
          maxY: 10,
          lineBarsData: [
            LineChartBarData(
              spots: const [
                FlSpot(0, 3),
                FlSpot(1, 4),
                FlSpot(2, 5),
                FlSpot(3, 6),
                FlSpot(4, 7),
                FlSpot(5, 8),
              ],
              isCurved: true,
              color: AppDesign.primaryIndigo,
              barWidth: 3,
              isStrokeCapRound: true,
              dotData: FlDotData(
                show: true,
                getDotPainter: (spot, percent, barData, index) {
                  return FlDotCirclePainter(
                    radius: 4,
                    color: AppDesign.primaryIndigo,
                    strokeWidth: 2,
                    strokeColor: Colors.white,
                  );
                },
              ),
              belowBarData: BarAreaData(
                show: true,
                color: AppDesign.primaryIndigo.withValues(alpha: 0.1),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRoleDistribution() {
    final usersCount = _allUsers.where((u) => u.role == 'user').length;
    final premiumCount = _allUsers.where((u) => u.role == 'premium').length;
    final adminCount = _allUsers.where((u) => u.role == 'admin').length;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          _buildRoleItem('Utilisateurs', usersCount, AppDesign.primaryIndigo),
          const SizedBox(height: 12),
          _buildRoleItem('Premium', premiumCount, AppDesign.primaryPurple),
          const SizedBox(height: 12),
          _buildRoleItem('Administrateurs', adminCount, AppDesign.expenseColor),
        ],
      ),
    );
  }

  Widget _buildRoleItem(String label, int count, Color color) {
    final percentage = (_totalUsers > 0 ? (count / _totalUsers * 100) : 0).toStringAsFixed(1);
    
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: TrText(
            label,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        TrText(
          count.toString(),
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(width: 8),
        TrText(
          '($percentage%)',
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  // =========================================================================
  // ONGLET 2 : GESTION DES UTILISATEURS
  // =========================================================================

  Widget _buildUserManagementTab() {
    return Column(
      children: [
        // Barre de recherche
        Container(
          color: Colors.white,
          padding: const EdgeInsets.all(16),
          child: TextField(
            controller: _searchController,
            onChanged: (value) {
              setState(() {
                _searchQuery = value;
              });
            },
            decoration: InputDecoration(
              hintText: t('Rechercher un utilisateur...'),
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchQuery.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        setState(() {
                          _searchQuery = '';
                        });
                      },
                    )
                  : null,
              filled: true,
              fillColor: Colors.grey[100],
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.symmetric(vertical: 12),
            ),
          ),
        ),
        
        // En-tête de la liste
        Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Row(
            children: [
              TrText(
                '${_filteredUsers.length} utilisateur${_filteredUsers.length > 1 ? 's' : ''}',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
        
        const Divider(height: 1),
        
        // Liste des utilisateurs
        Expanded(
          child: _filteredUsers.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.search_off,
                        size: 64,
                        color: Colors.grey[400],
                      ),
                      const SizedBox(height: 16),
                      TrText(
                        'Aucun utilisateur trouvé',
                        style: TextStyle(
                          fontSize: 16,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                )
              : ListView.separated(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: _filteredUsers.length,
                  separatorBuilder: (context, index) => const Divider(height: 1, indent: 72),
                  itemBuilder: (context, index) {
                    final user = _filteredUsers[index];
                    return _buildUserTile(user);
                  },
                ),
        ),
      ],
    );
  }

  Widget _buildUserTile(UserProfile user) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      leading: CircleAvatar(
        radius: 24,
        backgroundColor: _getUserRoleColor(user.role ?? 'user').withValues(alpha: 0.1),
        child: TrText(
          '${(user.firstName ?? 'U')[0]}${(user.lastName ?? 'U')[0]}'.toUpperCase(),
          style: TextStyle(
            fontWeight: FontWeight.bold,
            color: _getUserRoleColor(user.role ?? 'user'),
          ),
        ),
      ),
      title: Row(
        children: [
          Expanded(
            child: TrText(
              '${user.firstName ?? 'Unknown'} ${user.lastName ?? 'User'}',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
          ),
          _buildStatusBadge(user.status ?? 'active'),
        ],
      ),
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 4),
          TrText(
            user.email ?? 'No email',
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              _buildRoleBadge(user.role ?? 'user'),
              const SizedBox(width: 8),
              TrText(
                'Inscrit: ${DateFormat('dd/MM/yyyy').format(user.createdAt)}',
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey[500],
                ),
              ),
            ],
          ),
        ],
      ),
      trailing: IconButton(
        icon: const Icon(Icons.more_vert),
        onPressed: () => _showUserActionsModal(user),
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color color;
    String label;
    IconData icon;

    switch (status) {
      case 'active':
        color = AppDesign.incomeColor;
        label = 'Actif';
        icon = Icons.check_circle;
        break;
      case 'blocked':
        color = AppDesign.expenseColor;
        label = 'Bloqué';
        icon = Icons.block;
        break;
      case 'disabled':
        color = Colors.grey;
        label = 'Désactivé';
        icon = Icons.pause_circle;
        break;
      default:
        color = Colors.grey;
        label = status;
        icon = Icons.help;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          TrText(
            label,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRoleBadge(String role) {
    Color color = _getUserRoleColor(role);
    String label = role == 'admin' ? 'Admin' : role == 'premium' ? 'Premium' : 'User';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: TrText(
        label,
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }

  Color _getUserRoleColor(String role) {
    switch (role) {
      case 'admin':
        return AppDesign.expenseColor;
      case 'premium':
        return AppDesign.primaryPurple;
      default:
        return AppDesign.primaryIndigo;
    }
  }

  // =========================================================================
  // MODAL D'ACTIONS ADMIN
  // =========================================================================

  void _showUserActionsModal(UserProfile user) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // En-tête
            Row(
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: _getUserRoleColor(user.role ?? 'user').withValues(alpha: 0.1),
                  child: TrText(
                    '${(user.firstName ?? 'U')[0]}${(user.lastName ?? 'U')[0]}'.toUpperCase(),
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                      color: _getUserRoleColor(user.role ?? 'user'),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TrText(
                        '${user.firstName ?? 'Unknown'} ${user.lastName ?? 'User'}',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      TrText(
                        user.email ?? 'No email',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            
            const SizedBox(height: 24),
            
            const TrText(
              'Actions administrateur',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: Colors.grey,
              ),
            ),
            
            const SizedBox(height: 16),
            
            // Boutons d'action
            if (user.status != 'blocked')
              _buildActionButton(
                icon: Icons.block,
                label: t("Bloquer l'utilisateur"),
                color: AppDesign.expenseColor,
                onPressed: () {
                  _changeUserStatus(user, 'blocked');
                  Navigator.pop(context);
                },
              ),
            
            if (user.status != 'disabled')
              _buildActionButton(
                icon: Icons.pause_circle,
                label: t('Désactiver le compte'),
                color: Colors.orange,
                onPressed: () {
                  _changeUserStatus(user, 'disabled');
                  Navigator.pop(context);
                },
              ),
            
            if (user.status != 'active')
              _buildActionButton(
                icon: Icons.check_circle,
                label: t('Réactiver le compte'),
                color: AppDesign.incomeColor,
                onPressed: () {
                  _changeUserStatus(user, 'active');
                  Navigator.pop(context);
                },
              ),
            
            const SizedBox(height: 12),
            
            _buildActionButton(
              icon: Icons.info_outline,
              label: t('Voir les détails'),
              color: AppDesign.primaryIndigo,
              onPressed: () {
                Navigator.pop(context);
                _showUserDetails(user);
              },
            ),
            
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      child: Material(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          onTap: onPressed,
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Icon(icon, color: color, size: 24),
                const SizedBox(width: 16),
                Expanded(
                  child: TrText(
                    label,
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: color,
                    ),
                  ),
                ),
                Icon(Icons.arrow_forward_ios, size: 16, color: color),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _changeUserStatus(UserProfile user, String newStatus) {
    setState(() {
      // Mettre à jour le statut dans la liste
      final index = _allUsers.indexWhere((u) => u.userId == user.userId);
      if (index != -1) {
        _allUsers[index] = user.copyWith(
          status: newStatus,
          updatedAt: DateTime.now(),
        );
      }
    });

    // Afficher un message de confirmation
    String message;
    switch (newStatus) {
      case 'blocked':
        message = 'Utilisateur bloqué avec succès';
        break;
      case 'disabled':
        message = 'Compte désactivé avec succès';
        break;
      case 'active':
        message = 'Compte réactivé avec succès';
        break;
      default:
        message = 'Statut modifié';
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: TrText(message),
        backgroundColor: AppDesign.incomeColor,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _showUserDetails(UserProfile user) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const TrText('Détails de l\'utilisateur'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDetailRow('ID', user.userId),
            _buildDetailRow('Nom complet', '${user.firstName ?? 'Unknown'} ${user.lastName ?? 'User'}'),
            _buildDetailRow('Email', user.email ?? 'No email'),
            _buildDetailRow('Rôle', user.role ?? 'user'),
            _buildDetailRow('Statut', user.status ?? 'active'),
            _buildDetailRow('Devise', user.currency),
            _buildDetailRow('Inscrit le', DateFormat('dd/MM/yyyy à HH:mm').format(user.createdAt)),
          ],
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

  // =========================================================================
  // ONGLET 3 : TRADUCTIONS
  // =========================================================================

  Widget _buildTranslationsTab() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.translate,
              size: 80,
              color: AppDesign.primaryIndigo.withValues(alpha: 0.3),
            ),
            const SizedBox(height: 24),
            const TrText(
              'Gestion des Traductions',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 12),
            const TrText(
              'Gérez toutes les traductions de l\'application en temps réel',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const TranslationManagementScreen(),
                  ),
                );
              },
              icon: const Icon(Icons.arrow_forward),
              label: const TrText('Ouvrir l\'éditeur'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppDesign.primaryIndigo,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: TrText(
              '$label:',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 13,
              ),
            ),
          ),
          Expanded(
            child: TrText(
              value,
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey[700],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
