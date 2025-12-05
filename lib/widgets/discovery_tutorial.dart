import 'package:flutter/material.dart';
import 'package:budget/l10n/localization_helpers.dart';

/// Widget de découverte interactif avec slides pour présenter les fonctionnalités
/// Peut être passé avec le bouton "Passer"
class DiscoveryTutorial extends StatefulWidget {
  final VoidCallback onComplete;
  final VoidCallback? onSkip;

  const DiscoveryTutorial({
    super.key,
    required this.onComplete,
    this.onSkip,
  });

  @override
  State<DiscoveryTutorial> createState() => _DiscoveryTutorialState();
}

class _DiscoveryTutorialState extends State<DiscoveryTutorial> {
  static const Color _brandPrimary = Color(0xFF6C5CF7);
  static const Color _brandSecondary = Color(0xFFC542C1);
  
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<_TutorialSlide> _slides = [
    _TutorialSlide(
      icon: '💰',
      titleKey: 'Transactions Intelligentes',
      titleKeyEn: 'Smart Transactions',
      descriptionKey: 'Suivez chaque dépense et revenu. Organisez par catégorie, compte et période.',
      descriptionKeyEn: 'Track every expense and income. Organize by category, account, and period.',
      color: Color(0xFF6C5CF7),
    ),
    _TutorialSlide(
      icon: '🎯',
      titleKey: 'Budgets Prévisionnels',
      titleKeyEn: 'Budget Planning',
      descriptionKey: 'Définissez des budgets mensuels par catégorie. Recevez des alertes avant dépassement.',
      descriptionKeyEn: 'Set monthly budgets by category. Get alerts before overspending.',
      color: Color(0xFF4CAF50),
    ),
    _TutorialSlide(
      icon: '🏆',
      titleKey: 'Objectifs d\'Épargne',
      titleKeyEn: 'Savings Goals',
      descriptionKey: 'Créez des objectifs avec montant cible et date limite. Suivez votre progression.',
      descriptionKeyEn: 'Create goals with target amounts and deadlines. Track your progress.',
      color: Color(0xFFFF9800),
    ),
    _TutorialSlide(
      icon: '🤖',
      titleKey: 'Assistant IA',
      titleKeyEn: 'AI Assistant',
      descriptionKey: 'Posez des questions sur vos finances. Obtenez des conseils personnalisés et analyses.',
      descriptionKeyEn: 'Ask questions about your finances. Get personalized advice and insights.',
      color: Color(0xFFC542C1),
    ),
    _TutorialSlide(
      icon: '📊',
      titleKey: 'Tableau de Bord',
      titleKeyEn: 'Dashboard',
      descriptionKey: 'Vue d\'ensemble de vos finances. Graphiques, tendances et statistiques en temps réel.',
      descriptionKeyEn: 'Overview of your finances. Charts, trends, and real-time statistics.',
      color: Color(0xFF2196F3),
    ),
  ];

  void _nextPage() {
    if (_currentPage < _slides.length - 1) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeInOut,
      );
    } else {
      widget.onComplete();
    }
  }

  void _skip() {
    if (widget.onSkip != null) {
      widget.onSkip!();
    } else {
      widget.onComplete();
    }
  }

  @override
  Widget build(BuildContext context) {
    final languageCode = Localizations.localeOf(context).languageCode;
    final isEnglish = languageCode == 'en';

    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            _brandPrimary.withOpacity(0.05),
            _brandSecondary.withOpacity(0.05),
          ],
        ),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // Header avec bouton Passer
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  TrText(
                    'Découverte',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: _brandPrimary,
                    ),
                  ),
                  TextButton(
                    onPressed: _skip,
                    child: TrText(
                      'Passer',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 16,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // PageView avec slides
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                },
                itemCount: _slides.length,
                itemBuilder: (context, index) {
                  final slide = _slides[index];
                  return _buildSlide(
                    slide,
                    isEnglish,
                  );
                },
              ),
            ),

            // Indicateurs de page
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  _slides.length,
                  (index) => AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: _currentPage == index ? 24 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(4),
                      color: _currentPage == index
                          ? _slides[index].color
                          : Colors.grey[300],
                    ),
                  ),
                ),
              ),
            ),

            // Bouton Suivant / Terminer
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _nextPage,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _slides[_currentPage].color,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    elevation: 2,
                  ),
                  child: TrText(
                    _currentPage == _slides.length - 1 ? 'Commencer' : 'Suivant',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSlide(_TutorialSlide slide, bool isEnglish) {
    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Icône animée
          TweenAnimationBuilder<double>(
            tween: Tween(begin: 0.0, end: 1.0),
            duration: const Duration(milliseconds: 500),
            builder: (context, value, child) {
              return Transform.scale(
                scale: value,
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    color: slide.color.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Text(
                      slide.icon,
                      style: const TextStyle(fontSize: 64),
                    ),
                  ),
                ),
              );
            },
          ),

          const SizedBox(height: 32),

          // Titre
          Text(
            isEnglish ? slide.titleKeyEn : slide.titleKey,
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: slide.color,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 16),

          // Description
          Text(
            isEnglish ? slide.descriptionKeyEn : slide.descriptionKey,
            style: TextStyle(
              fontSize: 16,
              color: Colors.grey[700],
              height: 1.5,
            ),
            textAlign: TextAlign.center,
          ),

          const SizedBox(height: 40),

          // Décoration visuelle
          Container(
            width: 80,
            height: 4,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(2),
              gradient: LinearGradient(
                colors: [
                  slide.color.withOpacity(0.3),
                  slide.color,
                  slide.color.withOpacity(0.3),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }
}

class _TutorialSlide {
  final String icon;
  final String titleKey;
  final String titleKeyEn;
  final String descriptionKey;
  final String descriptionKeyEn;
  final Color color;

  _TutorialSlide({
    required this.icon,
    required this.titleKey,
    required this.titleKeyEn,
    required this.descriptionKey,
    required this.descriptionKeyEn,
    required this.color,
  });
}
