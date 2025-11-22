import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../services/firestore_service.dart';
import '../navigation/main_navigation_shell.dart';
import '../../widgets/revolutionary_logo.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({Key? key}) : super(key: key);

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  static const String _demoEmail = FirestoreService.demoEmail;
  static const String _demoPassword = FirestoreService.demoPassword;

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
        const Text(
          'Mode Démo',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        const Text(
          'Testez toutes les fonctionnalités Premium sans créer de compte.',
          textAlign: TextAlign.center,
          style: TextStyle(color: Colors.black54, fontSize: 14),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: const Color(0xFF00796B).withOpacity(0.08),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFF00796B).withOpacity(0.2)),
          ),
          child: Column(
            children: [
              const Icon(Icons.flash_on_rounded, size: 40, color: Color(0xFF00796B)),
              const SizedBox(height: 16),
              const Text(
                'Accès Instantané',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: Color(0xFF00796B),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Données temporaires générées automatiquement. Session de 2 heures.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.black54, fontSize: 13),
              ),
              const SizedBox(height: 24),
              _buildCredentialChip(label: 'Email', value: _demoEmail),
              const SizedBox(height: 12),
              _buildCredentialChip(label: 'Mot de passe', value: _demoPassword),
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
              backgroundColor: const Color(0xFF00796B),
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: const Icon(Icons.play_arrow_rounded),
            label: const Text(
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
        border: Border.all(color: const Color(0xFF00796B).withOpacity(0.15)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: Colors.black.withOpacity(0.6),
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          SelectableText(
            value,
            style: const TextStyle(
              color: Color(0xFF00796B),
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
        const SizedBox(height: 16),
        const Text(
          'Bienvenue',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.w800,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Connectez-vous pour gérer vos finances',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 14,
            color: Colors.black54,
          ),
        ),
        const SizedBox(height: 24),
        if (!_isLogin) ...[
          TextFormField(
            controller: _nameController,
            decoration: InputDecoration(
              labelText: 'Nom complet',
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
            labelText: 'Email',
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
            labelText: 'Mot de passe',
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
            child: const Text(
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
                  child: Text(
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
              backgroundColor: const Color(0xFF00796B),
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
                : Text(
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
          child: RichText(
            text: TextSpan(
              text: _isLogin ? 'Pas encore de compte ? ' : 'Déjà un compte ? ',
              style: const TextStyle(color: Colors.black54),
              children: [
                TextSpan(
                  text: _isLogin ? 'Créer un compte' : 'Se connecter',
                  style: const TextStyle(
                    color: Color(0xFF00796B),
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
    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 450),
              child: Card(
                elevation: 6,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Form(
                    key: _formKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const RevolutionaryLogo(size: 60),
                        const SizedBox(height: 24),
                        // Custom Tab Bar
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F3F6),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: const Color(0xFFE0E6ED)),
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
                                      color: _currentTabIndex == 0 ? const Color(0xFFE8F5EF) : Colors.transparent,
                                      borderRadius: BorderRadius.circular(12),
                                      boxShadow: _currentTabIndex == 0
                                          ? [
                                              BoxShadow(
                                                color: const Color(0xFF00796B).withOpacity(0.08),
                                                blurRadius: 10,
                                                offset: const Offset(0, 3),
                                              ),
                                            ]
                                          : null,
                                    ),
                                    child: Text(
                                      'Connexion',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        fontWeight: _currentTabIndex == 0 ? FontWeight.w800 : FontWeight.w600,
                                        color: _currentTabIndex == 0 ? const Color(0xFF00796B) : Colors.grey.shade600,
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
                                      color: _currentTabIndex == 1 ? const Color(0xFFE8F5EF) : Colors.transparent,
                                      borderRadius: BorderRadius.circular(12),
                                      boxShadow: _currentTabIndex == 1
                                          ? [
                                              BoxShadow(
                                                color: const Color(0xFF00796B).withOpacity(0.08),
                                                blurRadius: 10,
                                                offset: const Offset(0, 3),
                                              ),
                                            ]
                                          : null,
                                    ),
                                    child: Text(
                                      'Démo',
                                      textAlign: TextAlign.center,
                                      style: TextStyle(
                                        fontWeight: _currentTabIndex == 1 ? FontWeight.w800 : FontWeight.w600,
                                        color: _currentTabIndex == 1 ? const Color(0xFF00796B) : Colors.grey.shade600,
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
              ),
            ),
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
          child: Text(
            'Ou continuer avec',
            style: TextStyle(color: Colors.black.withOpacity(0.6), fontWeight: FontWeight.w600),
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
              color: background.withOpacity(0.25),
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
