import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../services/firestore_service.dart';
import '../navigation/main_navigation_shell.dart';
import '../../widgets/revolutionary_logo.dart';
import 'package:budget/l10n/app_localizations.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  static const String _demoEmail = FirestoreService.demoEmail;
  static const String _demoPassword = FirestoreService.demoPassword;
  static const Color _brandPrimary = Color(0xFF6C5CF7);
  static const Color _brandSecondary = Color(0xFFC542C1);
  static const Color _brandSurface = Color(0xFFF1EEFF);

  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _nameController = TextEditingController();
  
  bool _isLogin = true;
  bool _isLoading = false;
  int _currentTabIndex = 0;
  String? _errorMessage;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _submitForm({bool isDemoLogin = false}) async {
    if (isDemoLogin && !_isLogin) {
      setState(() {
        _isLogin = true;
      });
    }
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final auth = FirebaseAuth.instance;
      final firestore = FirestoreService();

      if (_isLogin) {
        try {
          // Connexion
          await auth.signInWithEmailAndPassword(
            email: _emailController.text.trim(),
            password: _passwordController.text,
          );
        } on FirebaseAuthException catch (e) {
          // Pour le mode démo, on crée le compte si besoin
          if (isDemoLogin && e.code == 'user-not-found') {
            final userCredential = await auth.createUserWithEmailAndPassword(
              email: _emailController.text.trim(),
              password: _passwordController.text,
            );
            await firestore.createUserProfile(
              userId: userCredential.user!.uid,
              email: _emailController.text.trim(),
              displayName: 'Compte Démo',
            );
          } else {
            rethrow;
          }
        }
      } else {
        // Inscription
        final userCredential = await auth.createUserWithEmailAndPassword(
          email: _emailController.text.trim(),
          password: _passwordController.text,
        );

        // Créer le profil utilisateur dans Firestore
        await firestore.createUserProfile(
          userId: userCredential.user!.uid,
          email: _emailController.text.trim(),
          displayName: _nameController.text.trim(),
        );

        // Mettre à jour le displayName dans Firebase Auth
        await userCredential.user!.updateDisplayName(_nameController.text.trim());
      }

      if (isDemoLogin || _emailController.text.trim().toLowerCase() == FirestoreService.demoEmail.toLowerCase()) {
        await firestore.ensureDemoDataset();
      }

      // Navigation vers l'écran principal
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => const MainNavigationShell(),
          ),
        );
      }
    } on FirebaseAuthException catch (e) {
      setState(() {
        _errorMessage = _getErrorMessage(e.code);
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Une erreur est survenue. Réessayez.';
        _isLoading = false;
      });
    }
  }

  Future<void> _handleDemoLogin() async {
    if (_isLoading) return;
    setState(() {
      _isLogin = true;
      _emailController.text = _demoEmail;
      _passwordController.text = _demoPassword;
      _errorMessage = null;
    });
    await _submitForm(isDemoLogin: true);
  }

  Widget _buildDemoContent() {
    return Column(
      children: [
        const TrText(
          'Mode Démo',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        const TrText(
          'Testez toutes les fonctionnalités Premium sans créer de compte.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.black54, fontSize: 14),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: _brandSurface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _brandPrimary.withValues(alpha: 0.18)),
          ),
          child: Column(
            children: [
              const Icon(Icons.flash_on_rounded, size: 40, color: _brandPrimary),
              const SizedBox(height: 16),
              const TrText(
                'Accès Instantané',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: _brandPrimary,
                ),
              ),
              const SizedBox(height: 8),
              const TrText(
                'Données temporaires générées automatiquement. Session de 2 heures.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.black54, fontSize: 13),
              ),
              const SizedBox(height: 24),
              _buildCredentialChip(label: t('Email'), value: _demoEmail),
              const SizedBox(height: 12),
              _buildCredentialChip(label: t('Mot de passe'), value: _demoPassword),
            ],
          ),
        ),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton.icon(
            onPressed: _isLoading ? null : _handleDemoLogin,
            style: ElevatedButton.styleFrom(
              backgroundColor: _brandPrimary,
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: const Icon(Icons.play_arrow_rounded),
            label: const TrText(
              'Lancer la Démo',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildCredentialChip({required String label, required String value}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _brandPrimary.withValues(alpha: 0.15)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          TrText(
            label,
            style: TextStyle(
              color: Colors.black.withValues(alpha: 0.6),
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          SelectableTrText(
            value,
            style: const TextStyle(
              color: _brandPrimary,
              fontWeight: FontWeight.w700,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoginForm() {
    return Column(
      children: [
        const SizedBox(height: 8),
        if (!_isLogin) ...[
          TextFormField(
            controller: _nameController,
            decoration: InputDecoration(
              labelText: t('Nom complet'),
              prefixIcon: const Icon(Icons.person_outline),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            validator: (value) {
              if (value == null || value.trim().isEmpty) {
                return 'Entrez votre nom';
              }
              return null;
            },
          ),
          const SizedBox(height: 16),
        ],
        TextFormField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          decoration: InputDecoration(
            labelText: t('Email'),
            prefixIcon: const Icon(Icons.mail_outline),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          validator: (value) {
            if (value == null || !value.contains('@')) {
              return 'Entrez un email valide';
            }
            return null;
          },
        ),
        const SizedBox(height: 16),
        TextFormField(
          controller: _passwordController,
          obscureText: true,
          decoration: InputDecoration(
            labelText: t('Mot de passe'),
            prefixIcon: const Icon(Icons.lock_outline),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          validator: (value) {
            if (value == null || value.length < 6) {
              return 'Minimum 6 caractères';
            }
            return null;
          },
        ),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: () {},
            child: const TrText(
              'Mot de passe oublié ?',
              style: TextStyle(color: Colors.black54),
            ),
          ),
        ),
        if (_errorMessage != null) ...[
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.red.shade50,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.red.shade200),
            ),
            child: Row(
              children: [
                Icon(Icons.error, color: Colors.red.shade700, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: TrText(
                    _errorMessage!,
                    style: TextStyle(
                      color: Colors.red.shade700,
                      fontSize: 13,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
        ],
        SizedBox(
          width: double.infinity,
          height: 50,
          child: ElevatedButton(
            onPressed: _isLoading
                ? null
                : () {
                    if (_currentTabIndex == 1) {
                      _handleDemoLogin();
                    } else {
                      _submitForm();
                    }
                  },
            style: ElevatedButton.styleFrom(
              backgroundColor: _brandPrimary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
            child: _isLoading
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : TrText(
                    _isLogin ? 'Se connecter' : 'S\'inscrire',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 20),
        _buildSeparatorRow(),
        const SizedBox(height: 16),
        _buildSocialButtons(),
        const SizedBox(height: 20),
        GestureDetector(
          onTap: _isLoading
              ? null
              : () {
                  setState(() {
                    _isLogin = !_isLogin;
                    _errorMessage = null;
                  });
                },
          child: RichTrText(
            text: TextSpan(
              text: _isLogin ? 'Pas encore de compte ? ' : 'Déjà un compte ? ',
              style: const TextStyle(color: Colors.black54),
              children: [
                TextSpan(
                  text: _isLogin ? 'Créer un compte' : 'Se connecter',
                  style: const TextStyle(
                    color: _brandPrimary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  String _getErrorMessage(String code) {
    switch (code) {
      case 'user-not-found':
        return 'Aucun utilisateur trouvé avec cet email.';
      case 'wrong-password':
        return 'Mot de passe incorrect.';
      case 'email-already-in-use':
        return 'Cet email est déjà utilisé.';
      case 'weak-password':
        return 'Le mot de passe doit contenir au moins 6 caractères.';
      case 'invalid-email':
        return 'Email invalide.';
      default:
        return 'Erreur d\'authentification. Réessayez.';
    }
  }

  @override
  Widget build(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final isWide = width >= 960;

    return Scaffold(
      backgroundColor: const Color(0xFFF7F8FB),
      resizeToAvoidBottomInset: true,
      body: SafeArea(
        child: Align(
          alignment: Alignment.topCenter,
          child: SingleChildScrollView(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            padding: EdgeInsets.fromLTRB(
              isWide ? 48 : 20,
              28,
              isWide ? 48 : 20,
              28 + MediaQuery.of(context).viewInsets.bottom,
            ),
            child: LayoutBuilder(
              builder: (context, constraints) {
                return ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 1180),
                  child: isWide
                      ? Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(child: _buildHeroPanel()),
                            const SizedBox(width: 28),
                            SizedBox(width: 420, child: _buildAuthCard()),
                          ],
                        )
                      : Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            _buildHeroPanel(),
                            const SizedBox(height: 20),
                            _buildAuthCard(),
                          ],
                        ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeroPanel() {
    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE7EAF1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.025),
            blurRadius: 12,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              RevolutionaryLogo(size: 56, withText: false),
              const SizedBox(width: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: const [
                  TrText(
                    'Budget',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: _brandPrimary,
                      letterSpacing: -0.3,
                      height: 1.0,
                    ),
                  ),
                  TrText(
                    'Pro',
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: Colors.black87,
                      letterSpacing: -0.3,
                      height: 1.0,
                    ),
                  ),
                  TrText(
                    'Finance, budgets, dettes, IA.',
                    style: TextStyle(color: Colors.black54, fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          const TrText(
            'Maîtrisez vos finances en quelques minutes',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: Colors.black87,
              letterSpacing: -0.2,
              height: 1.2,
            ),
          ),
          const SizedBox(height: 12),
          const TrText(
            'Budgets intelligents, poches personnalisées, suivi des dettes et rapports IA en temps réel pour garder le contrôle.',
            style: TextStyle(fontSize: 13, color: Colors.black54, height: 1.5),
          ),
          const SizedBox(height: 18),
          _buildValueBullet('Répartition automatique des budgets et poches', Icons.auto_graph_rounded),
          const SizedBox(height: 10),
          _buildValueBullet('Suivi des dettes / IOU avec paiements partiels', Icons.handshake_rounded),
          const SizedBox(height: 10),
          _buildValueBullet('Rapports IA, alertes et projections mensuelles', Icons.smart_toy_outlined),
          const SizedBox(height: 22),
          _buildStoreRow(),
        ],
      ),
    );
  }

  Widget _buildValueBullet(String text, IconData icon) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: _brandPrimary.withValues(alpha: 0.12),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: _brandPrimary, size: 18),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: TrText(
            text,
            style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: Colors.black87),
          ),
        ),
      ],
    );
  }

  Widget _buildStoreRow() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE5E7EB)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.smartphone, color: _brandPrimary),
              SizedBox(width: 8),
              TrText(
                'Version mobile en cours',
                style: TextStyle(fontWeight: FontWeight.w800, color: Colors.black87),
              ),
            ],
          ),
          const SizedBox(height: 6),
          const TrText(
            'App Store & Google Play bientôt disponibles. Liens inactifs pour le moment.',
            style: TextStyle(color: Colors.black54, fontSize: 12),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _storeButton(label: 'App Store', icon: Icons.apple, enabled: false),
              const SizedBox(width: 10),
              _storeButton(label: 'Google Play', icon: Icons.android, enabled: false),
            ],
          ),
        ],
      ),
    );
  }

  Widget _storeButton({required String label, required IconData icon, bool enabled = true}) {
    return Expanded(
      child: OutlinedButton.icon(
        onPressed: enabled ? () {} : null,
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 12),
          side: BorderSide(color: enabled ? _brandPrimary : const Color(0xFFD7DBE7)),
          foregroundColor: enabled ? _brandPrimary : Colors.grey,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        icon: Icon(icon, size: 18),
        label: TrText(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w700,
            color: enabled ? _brandPrimary : Colors.grey,
          ),
        ),
      ),
    );
  }

  Widget _buildAuthCard() {
    return Card(
      elevation: 4,
      shadowColor: Colors.black.withValues(alpha: 0.04),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      RevolutionaryLogo(size: 56, withText: false),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: const [
                          TrText(
                            'Connexion',
                            style: TextStyle(
                              color: Colors.black87,
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.3,
                            ),
                          ),
                          TrText(
                            'Sécurisée par Firebase',
                            style: TextStyle(color: Colors.black54, fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE4E7F1)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _currentTabIndex = 0),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: _currentTabIndex == 0 ? _brandSurface : Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: _currentTabIndex == 0
                                ? [
                                    BoxShadow(
                                      color: _brandPrimary.withValues(alpha: 0.10),
                                      blurRadius: 10,
                                      offset: const Offset(0, 3),
                                    ),
                                  ]
                                : null,
                          ),
                          child: TrText(
                            'Connexion',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontWeight: _currentTabIndex == 0 ? FontWeight.w800 : FontWeight.w600,
                              color: _currentTabIndex == 0 ? _brandPrimary : Colors.grey.shade600,
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _currentTabIndex = 1),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: _currentTabIndex == 1 ? _brandSurface : Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                            boxShadow: _currentTabIndex == 1
                                ? [
                                    BoxShadow(
                                      color: _brandPrimary.withValues(alpha: 0.10),
                                      blurRadius: 10,
                                      offset: const Offset(0, 3),
                                    ),
                                  ]
                                : null,
                          ),
                          child: TrText(
                            'Démo',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontWeight: _currentTabIndex == 1 ? FontWeight.w800 : FontWeight.w600,
                              color: _currentTabIndex == 1 ? _brandPrimary : Colors.grey.shade600,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                child: _currentTabIndex == 0
                    ? KeyedSubtree(key: const ValueKey('login'), child: _buildLoginForm())
                    : KeyedSubtree(key: const ValueKey('demo'), child: _buildDemoContent()),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSeparatorRow() {
    return Row(
      children: [
        const Expanded(
          child: Divider(
            height: 1,
            color: Color(0xFFE0E6ED),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: TrText(
            'Ou continuer avec',
            style: TextStyle(color: Colors.black.withValues(alpha: 0.6), fontWeight: FontWeight.w600),
          ),
        ),
        const Expanded(
          child: Divider(
            height: 1,
            color: Color(0xFFE0E6ED),
          ),
        ),
      ],
    );
  }

  Widget _buildSocialButtons() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _circleSocialButton(
          icon: Icons.g_mobiledata,
          background: const Color(0xFFEA4335),
          onTap: _isLoading ? null : () {},
        ),
        const SizedBox(width: 16),
        _circleSocialButton(
          icon: Icons.facebook,
          background: const Color(0xFF1877F2),
          onTap: _isLoading ? null : () {},
        ),
      ],
    );
  }

  Widget _circleSocialButton({
    required IconData icon,
    required Color background,
    VoidCallback? onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(30),
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: background,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: background.withValues(alpha: 0.25),
              blurRadius: 12,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Icon(icon, color: Colors.white),
      ),
    );
  }
}
