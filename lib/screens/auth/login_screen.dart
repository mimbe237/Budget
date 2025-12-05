import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:budget/l10n/localization_helpers.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../legal/privacy_policy_screen.dart';
import '../legal/terms_of_service_screen.dart';
import '../support/support_screen.dart';
import '../../services/app_settings_service.dart';
import '../../widgets/revolutionary_logo.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _isLoading = false;
  bool _rememberMe = false;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  Color get _primary => const Color(0xFF6A4CFF);
  Color get _secondary => const Color(0xFF00D9FF);
  final AppSettingsService _settingsService = AppSettingsService();

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.1),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animationController, curve: Curves.easeOutCubic));
    _animationController.forward();
    _loadRememberMe();
  }

  Future<void> _loadRememberMe() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _rememberMe = prefs.getBool('remember_me') ?? false;
      if (_rememberMe) {
        _emailController.text = prefs.getString('saved_email') ?? '';
      }
    });
  }

  Future<void> _saveRememberMe() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('remember_me', _rememberMe);
    if (_rememberMe) {
      await prefs.setString('saved_email', _emailController.text.trim());
    } else {
      await prefs.remove('saved_email');
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _onLogin(String email, String password) async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    
    // Sauvegarder "Se souvenir de moi"
    await _saveRememberMe();
    
    try {
      await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
      
      if (!mounted) return;
      // Navigation to home screen happens in main.dart based on auth state
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('✓ Connexion réussie!'),
          backgroundColor: Colors.green.shade600,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;
      String message = 'Erreur de connexion';
      
      if (e.code == 'user-not-found') {
        message = 'Utilisateur non trouvé';
      } else if (e.code == 'wrong-password') {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error_outline, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(child: Text(message)),
            ],
          ),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          duration: const Duration(seconds: 4),
        ),
      );
      setState(() => _isLoading = false);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error_outline, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(child: Text('Erreur: $e')),
            ],
          ),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      setState(() => _isLoading = false);
    }
  }   );
      setState(() => _isLoading = false);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Erreur: $e')),
      );
      setState(() => _isLoading = false);
    }
  }

  void _onForgotPassword() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Réinitialiser le mot de passe'),
        content: const Text('Entrez votre email pour recevoir un lien de réinitialisation'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () {
              final email = _emailController.text;
              if (email.isNotEmpty) {
                FirebaseAuth.instance.sendPasswordResetEmail(email: email).then((_) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Email de réinitialisation envoyé')),
                  );
                }).catchError((e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Erreur: $e')),
                  );
                });
              }
            },
            child: const Text('Envoyer'),
          ),
        ],
      ),
    );
  }

  void _onLoginWithGoogle() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Google Login coming soon')),
    );
  }

  void _onLoginWithFacebook() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Facebook Login coming soon')),
    );
  }

  void _onCreateAccount() {
    _showCreateAccountDialog();
  }

  void _showCreateAccountDialog() {
    final emailCtrl = TextEditingController();
    final passwordCtrl = TextEditingController();
    final confirmPasswordCtrl = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Créer un compte'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: emailCtrl,
                decoration: const InputDecoration(
                  hintText: 'Email',
                  border: OutlineInputBorder(),
                ),
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: passwordCtrl,
                decoration: const InputDecoration(
                  hintText: 'Mot de passe',
                  border: OutlineInputBorder(),
                ),
                obscureText: true,
              ),
              const SizedBox(height: 12),
              TextField(
                controller: confirmPasswordCtrl,
                decoration: const InputDecoration(
                  hintText: 'Confirmer le mot de passe',
                  border: OutlineInputBorder(),
                ),
                obscureText: true,
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () {
              if (passwordCtrl.text != confirmPasswordCtrl.text) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Les mots de passe ne correspondent pas')),
                );
                return;
              }
              
              FirebaseAuth.instance.createUserWithEmailAndPassword(
                email: emailCtrl.text.trim(),
                password: passwordCtrl.text,
              ).then((_) {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Compte créé avec succès! Veuillez vous connecter')),
                );
                emailCtrl.clear();
                passwordCtrl.clear();
                confirmPasswordCtrl.clear();
              }).catchError((e) {
                String errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
                
                if (e is FirebaseAuthException) {
                  switch (e.code) {
                    case 'email-already-in-use':
                      errorMessage = 'Cet email est déjà utilisé. Veuillez vous connecter ou en utiliser un autre.';
                      break;
                    case 'weak-password':
                      errorMessage = 'Le mot de passe est trop faible. Utilisez au moins 8 caractères.';
                      break;
                    case 'invalid-email':
                      errorMessage = 'L\'adresse email est invalide.';
                      break;
                    case 'operation-not-allowed':
                      errorMessage = 'La création de compte est actuellement désactivée.';
                      break;
                    default:
                      errorMessage = 'Erreur: ${e.message}';
                  }
                }
                
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(errorMessage),
                    backgroundColor: Colors.red.shade700,
                    duration: const Duration(seconds: 4),
                  ),
                );
              });
            },
            child: const Text('Créer'),
          ),
        ],
      ),
    );
  }
  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final borderRadius = BorderRadius.circular(18);
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        body: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                _primary.withOpacity(0.1),
                _secondary.withOpacity(0.05),
                Colors.white,
              ],
            ),
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          Colors.white,
                          Colors.white.withOpacity(0.95),
                        ],
                      ),
                      borderRadius: borderRadius,
                      boxShadow: [
                        BoxShadow(
                          color: _primary.withOpacity(0.1),
                          blurRadius: 20,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 22),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            const SizedBox(height: 6),
                            Center(Insets.symmetric(horizontal: 24, vertical: 12),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 420),
                child: Card(
                  elevation: 4,
                  shadowColor: Colors.black.withOpacity(0.06),
                  shape: RoundedRectangleBorder(borderRadius: borderRadius),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 22),
                    child: Form(
                      key: _formKey,
                          const SizedBox(height: 18),
                          _buildEmailField(),
                          const SizedBox(height: 14),
                          _buildPasswordField(),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  SizedBox(
                ),
              ),
            ),
          ),
        ),
      ),
    ),
    );
  }                                   activeColor: _primary,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  const Text(
                                    'Se souvenir de moi',
                                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                                  ),
                                ],
                              ),
                              TextButton(
                                onPressed: _onForgotPassword,
                                child: Text(
                                  AppLocalizations.of(context)!.tr('forgot_password'),
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    color: _primary,
                                  ),
                                ),
                              ),
                            ],
                          ),      textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  AppLocalizations.of(context)!.tr('login_subtitle'),
                                  style: const TextStyle(fontSize: 13, color: Colors.black54),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 22),
                          Text(
                            AppLocalizations.of(context)!.tr('login_title'),
                            style: const TextStyle(fontSize: 23, fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            AppLocalizations.of(context)!.tr('login_secure'),
                            style: const TextStyle(fontSize: 13, color: Colors.grey),
                          ),
                          const SizedBox(height: 18),
                          _buildEmailField(),
                          const SizedBox(height: 14),
                          _buildPasswordField(),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: _onForgotPassword,
                              child: Text(
                                AppLocalizations.of(context)!.tr('forgot_password'),
                                style: const TextStyle(fontWeight: FontWeight.w600),
                              ),
                            ),
                          ),
  Widget _buildLoginButton() {
    return Container(
      height: 52,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [_primary, _primary.withOpacity(0.8)],
        ),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
            color: _primary.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: _isLoading
            ? null
            : () async {
                if (!_formKey.currentState!.validate()) return;
                setState(() => _isLoading = true);
                await _onLogin(_emailController.text.trim(), _passwordController.text);
              },
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          elevation: 0,
          shadowColor: Colors.transparent,
        ),
        child: _isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2.2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: const [
                  Icon(Icons.lock_outline, size: 18),
                  SizedBox(width: 8),
                  Text(
                    'Connexion sécurisée',
                    style: TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                ],
              ),
      ),
    );
  }     decoration: InputDecoration(
          labelText: AppLocalizations.of(context)!.tr('email_label'),
          prefixIcon: const Icon(Icons.email_outlined),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: _primary, width: 1.4),
          ),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
        ),
        validator: (value) {
          if (value == null || value.trim().isEmpty) return AppLocalizations.of(context)!.tr('email_required');
          if (!value.contains('@')) return AppLocalizations.of(context)!.tr('email_invalid');
          return null;
        },
      ),
    );
  }

  Widget _buildPasswordField() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      child: TextFormField(
        controller: _passwordController,
        obscureText: !_isPasswordVisible,
        textInputAction: TextInputAction.done,
        autofillHints: const [AutofillHints.password],
        style: const TextStyle(fontSize: 15),
        onFieldSubmitted: (_) {
          if (_formKey.currentState!.validate()) {
            _onLogin(_emailController.text.trim(), _passwordController.text);
          }
        },
        decoration: InputDecoration(
          labelText: AppLocalizations.of(context)!.tr('password_label'),
          prefixIcon: Icon(Icons.lock_outline, color: _primary),
          suffixIcon: IconButton(
            icon: Icon(
              _isPasswordVisible ? Icons.visibility_off : Icons.visibility,
              color: Colors.grey.shade600,
            ),
            onPressed: () => setState(() => _isPasswordVisible = !_isPasswordVisible),
          ),
          filled: true,
          fillColor: Colors.grey.shade50,
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: _primary, width: 2),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: Colors.grey.shade200, width: 1),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: Colors.red.shade400, width: 1),
          ),
          focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: Colors.red.shade400, width: 2),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        ),
        validator: (value) {
          if (value == null || value.isEmpty) return AppLocalizations.of(context)!.tr('password_required');
          if (value.length < 6) return AppLocalizations.of(context)!.tr('password_too_short');
          return null;
        },
      ),
    );
  }

  Widget _buildLoginButton() {
    return SizedBox(
      height: 52,
      child: ElevatedButton(
        onPressed: _isLoading
            ? null
            : () async {
                if (!_formKey.currentState!.validate()) return;
                setState(() => _isLoading = true);
                await _onLogin(_emailController.text.trim(), _passwordController.text);
              },
        style: ElevatedButton.styleFrom(
          backgroundColor: _primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          elevation: 0,
        ),
        child: _isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2.2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : const Text(
                'Connexion sécurisée',
                style: TextStyle(fontWeight: FontWeight.w700),
              ),
      ),
    );
  }

  Widget _buildSeparator() {
    return Row(
      children: const [
        Expanded(child: Divider()),
        Padding(
          padding: EdgeInsets.symmetric(horizontal: 8),
          child: Text(
            'Ou continuer avec',
            style: TextStyle(color: Colors.grey, fontSize: 12),
          ),
        ),
        Expanded(child: Divider()),
      ],
    );
  }

  Widget _buildSocialButtons() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _socialButton(
          label: 'Google',
          color: Colors.white,
          textColor: Colors.black87,
          borderColor: Colors.grey.shade300,
          icon: Icons.g_mobiledata,
          onTap: _onLoginWithGoogle,
        ),
        const SizedBox(width: 12),
        _socialButton(
          label: 'Facebook',
          color: const Color(0xFF1877F2),
          textColor: Colors.white,
          borderColor: const Color(0xFF1877F2),
          icon: Icons.facebook_rounded,
          onTap: _onLoginWithFacebook,
        ),
      ],
    );
  }

  Widget _socialButton({
    required String label,
    required Color color,
    required Color textColor,
    required Color borderColor,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return Expanded(
      child: SizedBox(
        height: 48,
        child: OutlinedButton.icon(
          onPressed: onTap,
          style: OutlinedButton.styleFrom(
            backgroundColor: color,
            foregroundColor: textColor,
            side: BorderSide(color: borderColor),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          icon: Icon(icon, size: 18, color: textColor),
          label: Text(
            label,
            style: TextStyle(
              color: textColor,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCreateAccount() {
    return Padding(
      padding: const EdgeInsets.only(top: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text('Pas encore de compte ?'),
          TextButton(
            onPressed: _onCreateAccount,
            child: Text(
              'Créer un compte',
              style: TextStyle(
                color: _primary,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooterLinks(BuildContext context) {
    final List<Widget> items = [
      _footerLink(
        context,
        icon: Icons.privacy_tip_outlined,
        label: 'Confidentialité',
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const PrivacyPolicyScreen()),
        ),
      ),
      _divider(),
      _footerLink(
        context,
        icon: Icons.description_outlined,
        label: 'Conditions',
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const TermsOfServiceScreen()),
        ),
      ),
      _divider(),
      _footerLink(
        context,
        icon: Icons.support_agent,
        label: 'Support',
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const SupportScreen()),
        ),
      ),
      _divider(),
      _footerLink(
        context,
        icon: Icons.language,
        label: 'Documentation',
        onTap: () {
          final url = _settingsService.websiteUrl;
          if (url.isNotEmpty) {
            launchUrl(
              Uri.parse(url),
              mode: LaunchMode.externalApplication,
            );
          }
        },
      ),
      _divider(),
      _footerLink(
        context,
        icon: Icons.chat_bubble_outline,
        label: 'WhatsApp Support',
        onTap: () {
          final whatsappUrl = _settingsService.whatsappUrl;
          if (whatsappUrl.isNotEmpty) {
            launchUrl(
              Uri.parse('$whatsappUrl?text=Bonjour'),
              mode: LaunchMode.externalApplication,
            );
          }
        },
      ),
    ];

    return Column(
      children: [
        const Divider(height: 24),
        Wrap(
          alignment: WrapAlignment.center,
          spacing: 12,
          runSpacing: 8,
          children: items,
        ),
      ],
    );
  }

  Widget _divider() => const SizedBox(
        height: 24,
        width: 1,
        child: VerticalDivider(color: Color(0xFFE7EAF1), thickness: 1),
      );

  Widget _footerLink(BuildContext context,
      {required IconData icon, required String label, required VoidCallback onTap}) {
    return InkWell(
      borderRadius: BorderRadius.circular(10),
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: Colors.black54),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Colors.black87),
            ),
          ],
        ),
      ),
    );
  }
}
