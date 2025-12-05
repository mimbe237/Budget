import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:budget/l10n/localization_helpers.dart';
import 'package:firebase_auth/firebase_auth.dart';
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

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  bool _isPasswordVisible = false;
  bool _isLoading = false;

  Color get _primary => const Color(0xFF6A4CFF);
  final AppSettingsService _settingsService = AppSettingsService();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _onLogin(String email, String password) async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isLoading = true);
    try {
      await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: email.trim(),
        password: password,
      );
      
      if (!mounted) return;
      // Navigation to home screen happens in main.dart based on auth state
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Connexion réussie!')),
      );
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;
      String message = 'Erreur de connexion';
      
      if (e.code == 'user-not-found') {
        message = 'Utilisateur non trouvé';
      } else if (e.code == 'wrong-password') {
        message = 'Mot de passe incorrect';
      } else if (e.code == 'invalid-email') {
        message = 'Email invalide';
      } else if (e.code == 'user-disabled') {
        message = 'Compte désactivé';
      } else if (e.code == 'too-many-requests') {
        message = 'Trop de tentatives. Réessayez plus tard';
      }
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
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
                  const SnackBar(content: Text('Compte créé! Veuillez vous connecter')),
                );
              }).catchError((e) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('Erreur: $e')),
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
        backgroundColor: cs.surfaceVariant.withOpacity(0.4),
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
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
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          const SizedBox(height: 6),
                          Center(
                            child: Column(
                              children: [
                                const RevolutionaryLogo(size: 60, withText: false),
                                const SizedBox(height: 12),
                                Text(
                                  AppLocalizations.of(context)!.tr('app_title'),
                                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                                  textAlign: TextAlign.center,
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
                          const SizedBox(height: 6),
                          _buildLoginButton(),
                          const SizedBox(height: 16),
                          _buildSeparator(),
                          const SizedBox(height: 14),
                          _buildSocialButtons(),
                          const SizedBox(height: 20),
                          _buildFooterLinks(context),
                          const SizedBox(height: 12),
                          _buildCreateAccount(),
                        ],
                      ),
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

  Widget _buildEmailField() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      padding: EdgeInsets.zero,
      child: TextFormField(
        controller: _emailController,
        keyboardType: TextInputType.emailAddress,
        textInputAction: TextInputAction.next,
        autofillHints: const [AutofillHints.email],
        decoration: InputDecoration(
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
        decoration: InputDecoration(
          labelText: AppLocalizations.of(context)!.tr('password_label'),
          prefixIcon: const Icon(Icons.lock_outline),
          suffixIcon: IconButton(
            icon: Icon(_isPasswordVisible ? Icons.visibility_off : Icons.visibility),
            onPressed: () => setState(() => _isPasswordVisible = !_isPasswordVisible),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: BorderSide(color: _primary, width: 1.4),
          ),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
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
