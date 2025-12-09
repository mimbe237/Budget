import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:budget/l10n/localization_helpers.dart';
import 'package:budget/l10n/app_localizations.dart';
import 'package:budget/l10n/app_localizations.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:provider/provider.dart';
import '../legal/privacy_policy_screen.dart';
import '../legal/terms_of_service_screen.dart';
import '../support/support_screen.dart';
import '../../services/app_settings_service.dart';
import '../../widgets/revolutionary_logo.dart';
import '../documentation/documentation_screen.dart';
import '../../services/firestore_service.dart';
import '../../services/currency_service.dart';
import '../../providers/locale_provider.dart';
import '../../widgets/country_search_dialog.dart';

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
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle_outline, color: Colors.white),
              const SizedBox(width: 12),
              Expanded(child: Text(AppLocalizations.of(context)!.login_success)),
            ],
          ),
          backgroundColor: Colors.green.shade600,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          duration: const Duration(seconds: 2),
        ),
      );
    } on FirebaseAuthException catch (e) {
      if (!mounted) return;
      String message = AppLocalizations.of(context)!.login_error;
      
      if (e.code == 'user-not-found') {
        message = AppLocalizations.of(context)!.user_not_found;
      } else if (e.code == 'wrong-password') {
        message = AppLocalizations.of(context)!.wrong_password;
      } else if (e.code == 'invalid-email') {
        message = AppLocalizations.of(context)!.invalid_email_format;
      } else if (e.code == 'user-disabled') {
        message = AppLocalizations.of(context)!.user_disabled;
      } else if (e.code == 'too-many-requests') {
        message = AppLocalizations.of(context)!.too_many_requests;
      }
      
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
              Expanded(child: Text('${AppLocalizations.of(context)!.error}: $e')),
            ],
          ),
          backgroundColor: Colors.red.shade700,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      setState(() => _isLoading = false);
    }
  }

  void _onForgotPassword() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(AppLocalizations.of(context)!.reset_password),
        content: Text(AppLocalizations.of(context)!.reset_password_desc),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(AppLocalizations.of(context)!.cancel),
          ),
          TextButton(
            onPressed: () {
              final email = _emailController.text;
              if (email.isNotEmpty) {
                FirebaseAuth.instance.sendPasswordResetEmail(email: email).then((_) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(AppLocalizations.of(context)!.reset_email_sent)),
                  );
                }).catchError((e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Erreur: $e')),
                  );
                });
              }
            },
            child: Text(AppLocalizations.of(context)!.send),
          ),
        ],
      ),
    );
  }

  void _onLoginWithGoogle() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(AppLocalizations.of(context)!.google_login_soon)),
    );
  }

  void _onLoginWithFacebook() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(AppLocalizations.of(context)!.facebook_login_soon)),
    );
  }

  void _onCreateAccount() {
    _showCreateAccountDialog();
  }

  void _showCreateAccountDialog() {
    // Utiliser l'écran d'authentification complet à la place d'une popup
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const _SignupFullScreen(),
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
          ),
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: SlideTransition(
              position: _slideAnimation,
              child: SafeArea(
                child: Center(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 420),
                      child: Card(
                        elevation: 4,
                        shadowColor: Colors.black.withOpacity(0.06),
                        shape: RoundedRectangleBorder(borderRadius: borderRadius),
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
                                  const Center(
                                    child: Column(
                                      children: [
                                        RevolutionaryLogo(size: 90),
                                        SizedBox(height: 14),
                                        Text(
                                          'Budget Pro',
                                          style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800, letterSpacing: -0.5),
                                          textAlign: TextAlign.center,
                                        ),
                                        SizedBox(height: 4),
                                        Text(
                                          'Gérez votre budget intelligemment',
                                          style: TextStyle(fontSize: 13, color: Colors.black54),
                                          textAlign: TextAlign.center,
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 22),
                                  const SizedBox(height: 12),
                                  _buildEmailField(),
                                  const SizedBox(height: 14),
                                  _buildPasswordField(),
                                  const SizedBox(height: 8),
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.stretch,
                                    children: [
                                      Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          SizedBox(
                                            height: 24,
                                            width: 24,
                                            child: Checkbox(
                                              value: _rememberMe,
                                              onChanged: (value) => setState(() => _rememberMe = value ?? false),
                                              activeColor: _primary,
                                              shape: RoundedRectangleBorder(
                                                borderRadius: BorderRadius.circular(4),
                                              ),
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          const Flexible(
                                            child: Text(
                                              'Se souvenir de moi',
                                              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 10),
                                      Align(
                                        alignment: Alignment.centerRight,
                                        child: TextButton(
                                          onPressed: _onForgotPassword,
                                          child: Text(
                                            AppLocalizations.of(context)!.tr('forgot_password'),
                                            style: TextStyle(
                                              fontWeight: FontWeight.w600,
                                              color: _primary,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 16),
                                  _buildLoginButton(),
                                  const SizedBox(height: 16),
                                  _buildSeparator(),
                                  const SizedBox(height: 16),
                                  _buildSocialButtons(),
                                  _buildCreateAccount(),
                                  const SizedBox(height: 10),
                                  _buildFooterLinks(context),
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
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmailField() {
    return TextFormField(
      controller: _emailController,
      keyboardType: TextInputType.emailAddress,
      textInputAction: TextInputAction.next,
      autofillHints: const [AutofillHints.email],
      style: const TextStyle(fontSize: 15),
      decoration: InputDecoration(
        labelText: AppLocalizations.of(context)!.tr('email_label'),
        prefixIcon: Icon(Icons.email_outlined, color: _primary),
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
        if (value == null || value.trim().isEmpty) return AppLocalizations.of(context)!.tr('email_required');
        if (!value.contains('@')) return AppLocalizations.of(context)!.tr('email_invalid');
        return null;
      },
    );
  }

  Widget _buildPasswordField() {
    return TextFormField(
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
    );
  }

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
                children: [
                  const Icon(Icons.lock_outline, size: 18),
                  const SizedBox(width: 8),
                  Text(
                    AppLocalizations.of(context)!.secure_connection,
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildSeparator() {
    return Row(
      children: [
        const Expanded(child: Divider()),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Text(
            AppLocalizations.of(context)!.or_continue_with,
            style: const TextStyle(color: Colors.grey, fontSize: 12),
          ),
        ),
        const Expanded(child: Divider()),
      ],
    );
  }

  Widget _buildSocialButtons() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _socialButton(
          label: AppLocalizations.of(context)!.google,
          color: Colors.white,
          textColor: Colors.black87,
          borderColor: Colors.grey.shade300,
          icon: Icons.g_mobiledata,
          onTap: _onLoginWithGoogle,
        ),
        const SizedBox(width: 12),
        _socialButton(
          label: AppLocalizations.of(context)!.facebook,
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
          Text(AppLocalizations.of(context)!.no_account),
          TextButton(
            onPressed: _onCreateAccount,
            child: Text(
              AppLocalizations.of(context)!.create_account,
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
        label: AppLocalizations.of(context)!.privacy,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const PrivacyPolicyScreen()),
        ),
      ),
      _divider(),
      _footerLink(
        context,
        icon: Icons.description_outlined,
        label: AppLocalizations.of(context)!.terms,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const TermsOfServiceScreen()),
        ),
      ),
      _divider(),
      _footerLink(
        context,
        icon: Icons.support_agent,
        label: AppLocalizations.of(context)!.support,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const SupportScreen()),
        ),
      ),
      _divider(),
      _footerLink(
        context,
        icon: Icons.language,
        label: AppLocalizations.of(context)!.documentation,
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const DocumentationScreen()),
        ),
      ),
      _divider(),
      _footerLink(
        context,
        icon: Icons.chat_bubble_outline,
        label: AppLocalizations.of(context)!.whatsapp_support,
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
        const SizedBox(height: 24),
        // Signature BEONWEB
        GestureDetector(
          onTap: () {
            final url = _settingsService.websiteUrl;
            if (url.isNotEmpty) {
              launchUrl(
                Uri.parse(url),
                mode: LaunchMode.externalApplication,
              );
            }
          },
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: const Color(0xFF6C5CF7).withOpacity(0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: const Color(0xFF6C5CF7).withOpacity(0.3),
              ),
            ),
            child: Column(
              children: [
                Text(
                  AppLocalizations.of(context)!.developed_by,
                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Text(
                      'BEONWEB',
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF6C5CF7),
                      ),
                    ),
                    const SizedBox(width: 6),
                    Icon(
                      Icons.link,
                      size: 12,
                      color: Colors.grey[600],
                    ),
                  ],
                ),
              ],
            ),
          ),
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

// Widget complet de création de compte avec sélection de pays et WhatsApp
class _SignupFullScreen extends StatefulWidget {
  const _SignupFullScreen();

  @override
  State<_SignupFullScreen> createState() => _SignupFullScreenState();
}

class _SignupFullScreenState extends State<_SignupFullScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _phoneController = TextEditingController();
  
  String _selectedCountryCode = 'CM';
  bool _isLoading = false;
  String? _errorMessage;

  static const List<Map<String, String>> _countryOptions = [
    {'code': 'BJ', 'name': 'Bénin', 'nameEn': 'Benin', 'dial': '+229'},
    {'code': 'BF', 'name': 'Burkina Faso', 'nameEn': 'Burkina Faso', 'dial': '+226'},
    {'code': 'BI', 'name': 'Burundi', 'nameEn': 'Burundi', 'dial': '+257'},
    {'code': 'CM', 'name': 'Cameroun', 'nameEn': 'Cameroon', 'dial': '+237'},
    {'code': 'CF', 'name': 'Centrafrique', 'nameEn': 'Central African Republic', 'dial': '+236'},
    {'code': 'KM', 'name': 'Comores', 'nameEn': 'Comoros', 'dial': '+269'},
    {'code': 'CG', 'name': 'Congo-Brazzaville', 'nameEn': 'Congo', 'dial': '+242'},
    {'code': 'CD', 'name': 'RDC', 'nameEn': 'DR Congo', 'dial': '+243'},
    {'code': 'CI', 'name': 'Côte d\'Ivoire', 'nameEn': 'Ivory Coast', 'dial': '+225'},
    {'code': 'DJ', 'name': 'Djibouti', 'nameEn': 'Djibouti', 'dial': '+253'},
    {'code': 'GA', 'name': 'Gabon', 'nameEn': 'Gabon', 'dial': '+241'},
    {'code': 'GN', 'name': 'Guinée', 'nameEn': 'Guinea', 'dial': '+224'},
    {'code': 'MG', 'name': 'Madagascar', 'nameEn': 'Madagascar', 'dial': '+261'},
    {'code': 'ML', 'name': 'Mali', 'nameEn': 'Mali', 'dial': '+223'},
    {'code': 'NE', 'name': 'Niger', 'nameEn': 'Niger', 'dial': '+227'},
    {'code': 'RW', 'name': 'Rwanda', 'nameEn': 'Rwanda', 'dial': '+250'},
    {'code': 'SN', 'name': 'Sénégal', 'nameEn': 'Senegal', 'dial': '+221'},
    {'code': 'SC', 'name': 'Seychelles', 'nameEn': 'Seychelles', 'dial': '+248'},
    {'code': 'TD', 'name': 'Tchad', 'nameEn': 'Chad', 'dial': '+235'},
    {'code': 'TG', 'name': 'Togo', 'nameEn': 'Togo', 'dial': '+228'},
    {'code': 'VU', 'name': 'Vanuatu', 'nameEn': 'Vanuatu', 'dial': '+678'},
    {'code': 'ZA', 'name': 'Afrique du Sud', 'nameEn': 'South Africa', 'dial': '+27'},
    {'code': 'BW', 'name': 'Botswana', 'nameEn': 'Botswana', 'dial': '+267'},
    {'code': 'GM', 'name': 'Gambie', 'nameEn': 'Gambia', 'dial': '+220'},
    {'code': 'GH', 'name': 'Ghana', 'nameEn': 'Ghana', 'dial': '+233'},
    {'code': 'KE', 'name': 'Kenya', 'nameEn': 'Kenya', 'dial': '+254'},
    {'code': 'LS', 'name': 'Lesotho', 'nameEn': 'Lesotho', 'dial': '+266'},
    {'code': 'LR', 'name': 'Liberia', 'nameEn': 'Liberia', 'dial': '+231'},
    {'code': 'MW', 'name': 'Malawi', 'nameEn': 'Malawi', 'dial': '+265'},
    {'code': 'MU', 'name': 'Maurice', 'nameEn': 'Mauritius', 'dial': '+230'},
    {'code': 'NA', 'name': 'Namibie', 'nameEn': 'Namibia', 'dial': '+264'},
    {'code': 'NG', 'name': 'Nigéria', 'nameEn': 'Nigeria', 'dial': '+234'},
    {'code': 'UG', 'name': 'Ouganda', 'nameEn': 'Uganda', 'dial': '+256'},
    {'code': 'SL', 'name': 'Sierra Leone', 'nameEn': 'Sierra Leone', 'dial': '+232'},
    {'code': 'SZ', 'name': 'Eswatini', 'nameEn': 'Eswatini', 'dial': '+268'},
    {'code': 'TZ', 'name': 'Tanzanie', 'nameEn': 'Tanzania', 'dial': '+255'},
    {'code': 'ZM', 'name': 'Zambie', 'nameEn': 'Zambia', 'dial': '+260'},
    {'code': 'ZW', 'name': 'Zimbabwe', 'nameEn': 'Zimbabwe', 'dial': '+263'},
    {'code': 'BE', 'name': 'Belgique', 'nameEn': 'Belgium', 'dial': '+32'},
    {'code': 'FR', 'name': 'France', 'nameEn': 'France', 'dial': '+33'},
    {'code': 'LU', 'name': 'Luxembourg', 'nameEn': 'Luxembourg', 'dial': '+352'},
    {'code': 'MC', 'name': 'Monaco', 'nameEn': 'Monaco', 'dial': '+377'},
    {'code': 'CH', 'name': 'Suisse', 'nameEn': 'Switzerland', 'dial': '+41'},
    {'code': 'CA', 'name': 'Canada', 'nameEn': 'Canada', 'dial': '+1'},
    {'code': 'US', 'name': 'États-Unis', 'nameEn': 'United States', 'dial': '+1'},
    {'code': 'AU', 'name': 'Australie', 'nameEn': 'Australia', 'dial': '+61'},
    {'code': 'NZ', 'name': 'Nouvelle-Zélande', 'nameEn': 'New Zealand', 'dial': '+64'},
    {'code': 'GB', 'name': 'Royaume-Uni', 'nameEn': 'United Kingdom', 'dial': '+44'},
    {'code': 'IE', 'name': 'Irlande', 'nameEn': 'Ireland', 'dial': '+353'},
    {'code': 'DE', 'name': 'Allemagne', 'nameEn': 'Germany', 'dial': '+49'},
    {'code': 'IT', 'name': 'Italie', 'nameEn': 'Italy', 'dial': '+39'},
    {'code': 'ES', 'name': 'Espagne', 'nameEn': 'Spain', 'dial': '+34'},
    {'code': 'PT', 'name': 'Portugal', 'nameEn': 'Portugal', 'dial': '+351'},
    {'code': 'BR', 'name': 'Brésil', 'nameEn': 'Brazil', 'dial': '+55'},
    {'code': 'MX', 'name': 'Mexique', 'nameEn': 'Mexico', 'dial': '+52'},
    {'code': 'JP', 'name': 'Japon', 'nameEn': 'Japan', 'dial': '+81'},
    {'code': 'CN', 'name': 'Chine', 'nameEn': 'China', 'dial': '+86'},
    {'code': 'IN', 'name': 'Inde', 'nameEn': 'India', 'dial': '+91'},
    {'code': 'SG', 'name': 'Singapour', 'nameEn': 'Singapore', 'dial': '+65'},
  ];

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submitSignup() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_passwordController.text != _confirmPasswordController.text) {
      setState(() => _errorMessage = 'Les mots de passe ne correspondent pas');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final auth = FirebaseAuth.instance;
      final firestore = FirestoreService();
      
      // Créer le compte
      final userCredential = await auth.createUserWithEmailAndPassword(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      // Préparer les données du profil
      final selectedCountry = _countryOptions.firstWhere(
        (c) => c['code'] == _selectedCountryCode,
        orElse: () => _countryOptions.first,
      );
      final fullPhone = '${selectedCountry['dial']} ${_phoneController.text.trim()}';
      final guessedCurrency = CurrencyService.guessCurrencyFromCountry(_selectedCountryCode) ?? 'EUR';
      final displayName = _emailController.text.trim().split('@').first.isNotEmpty
          ? _emailController.text.trim().split('@').first
          : 'Utilisateur';

      // Créer le profil utilisateur
      await firestore.createUserProfile(
        userId: userCredential.user!.uid,
        email: _emailController.text.trim(),
        displayName: displayName,
        countryCode: _selectedCountryCode,
        phoneNumber: fullPhone,
        currency: guessedCurrency,
        languageCode: 'fr',
        needsOnboarding: true,
      );

      // Mettre à jour le displayName dans Firebase Auth
      await userCredential.user!.updateDisplayName(displayName);

      if (!mounted) return;
      
      // Fermer et retourner
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(AppLocalizations.of(context)!.account_created),
          backgroundColor: Colors.green,
        ),
      );
      
      await auth.signOut();
    } catch (e) {
      String errorMessage = 'Une erreur est survenue. Réessayez.';
      if (e is FirebaseAuthException) {
        switch (e.code) {
          case 'email-already-in-use':
            errorMessage = 'Cet email est déjà utilisé.';
            break;
          case 'weak-password':
            errorMessage = 'Mot de passe trop faible (minimum 8 caractères).';
            break;
          case 'invalid-email':
            errorMessage = AppLocalizations.of(context)!.invalid_email_format;
            break;
          default:
            errorMessage = e.message ?? errorMessage;
        }
      }
      
      if (mounted) {
        setState(() {
          _errorMessage = errorMessage;
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final localeProvider = context.read<LocaleProvider>();
    final langCode = localeProvider.locale.languageCode;

    return Scaffold(
      appBar: AppBar(
        title: Text(AppLocalizations.of(context)!.create_account),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              // Email
              TextFormField(
                controller: _emailController,
                decoration: InputDecoration(
                  labelText: AppLocalizations.of(context)!.email_label,
                  hintText: AppLocalizations.of(context)!.email_hint,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(Icons.email),
                ),
                keyboardType: TextInputType.emailAddress,
                validator: (value) {
                  if (value == null || value.isEmpty) return AppLocalizations.of(context)!.tr('email_required');
                  if (!value.contains('@')) return AppLocalizations.of(context)!.tr('email_invalid');
                  return null;
                },
              ),
              const SizedBox(height: 16),
              
              // Mot de passe
              TextFormField(
                controller: _passwordController,
                decoration: InputDecoration(
                  labelText: AppLocalizations.of(context)!.password_label,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(Icons.lock),
                ),
                obscureText: true,
                validator: (value) {
                  if (value == null || value.isEmpty) return AppLocalizations.of(context)!.tr('password_required');
                  if (value.length < 8) return AppLocalizations.of(context)!.min_8_chars;
                  return null;
                },
              ),
              const SizedBox(height: 16),
              
              // Confirmer mot de passe
              TextFormField(
                controller: _confirmPasswordController,
                decoration: InputDecoration(
                  labelText: AppLocalizations.of(context)!.confirm_password,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  prefixIcon: const Icon(Icons.lock),
                ),
                obscureText: true,
                validator: (value) {
                  if (value == null || value.isEmpty) return AppLocalizations.of(context)!.confirmation_required;
                  return null;
                },
              ),
              const SizedBox(height: 20),
              
              // Sélection de pays
              InkWell(
                onTap: () async {
                  final result = await showDialog<String>(
                    context: context,
                    builder: (context) => CountrySearchDialog(
                      countries: _countryOptions,
                      selectedCode: _selectedCountryCode,
                      languageCode: langCode,
                    ),
                  );
                  if (result != null) {
                    setState(() => _selectedCountryCode = result);
                  }
                },
                child: InputDecorator(
                  decoration: InputDecoration(
                    labelText: AppLocalizations.of(context)!.country,
                    prefixIcon: const Icon(Icons.public),
                    suffixIcon: const Icon(Icons.arrow_drop_down),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(
                    langCode == 'en'
                        ? '${_countryOptions.firstWhere((c) => c['code'] == _selectedCountryCode)['nameEn']} (${_countryOptions.firstWhere((c) => c['code'] == _selectedCountryCode)['dial']})'
                        : '${_countryOptions.firstWhere((c) => c['code'] == _selectedCountryCode)['name']} (${_countryOptions.firstWhere((c) => c['code'] == _selectedCountryCode)['dial']})',
                    style: const TextStyle(fontSize: 16),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              
              // Numéro WhatsApp
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  RichText(
                    text: TextSpan(
                      style: const TextStyle(color: Colors.black87, fontSize: 14),
                      children: [
                        const TextSpan(text: '📱 WhatsApp  '),
                        TextSpan(
                          text: AppLocalizations.of(context)!.whatsapp_optional,
                          style: TextStyle(color: Colors.grey[600], fontSize: 13),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          border: Border.all(color: Colors.grey[300]!),
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(12),
                            bottomLeft: Radius.circular(12),
                          ),
                        ),
                        child: Column(
                          children: [
                            Text(
                              _countryOptions.firstWhere((c) => c['code'] == _selectedCountryCode)['dial']!,
                              style: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.bold,
                                color: Colors.black87,
                              ),
                            ),
                            Text(
                              _selectedCountryCode,
                              style: TextStyle(fontSize: 10, color: Colors.grey[600]),
                            ),
                          ],
                        ),
                      ),
                      Expanded(
                        child: TextFormField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          inputFormatters: [
                            FilteringTextInputFormatter.allow(RegExp(r'[0-9]')),
                          ],
                          decoration: InputDecoration(
                            hintText: AppLocalizations.of(context)!.phone_hint,
                            border: OutlineInputBorder(
                              borderSide: BorderSide(color: Colors.grey[300]!),
                              borderRadius: const BorderRadius.only(
                                topRight: Radius.circular(12),
                                bottomRight: Radius.circular(12),
                              ),
                            ),
                            enabledBorder: OutlineInputBorder(
                              borderSide: BorderSide(color: Colors.grey[300]!),
                              borderRadius: const BorderRadius.only(
                                topRight: Radius.circular(12),
                                bottomRight: Radius.circular(12),
                              ),
                            ),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 16),
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (_phoneController.text.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(left: 12, top: 8),
                      child: Text(
                        '📞 Numéro complet: ${_countryOptions.firstWhere((c) => c['code'] == _selectedCountryCode)['dial']}${_phoneController.text}',
                        style: TextStyle(fontSize: 12, color: Colors.grey[700], fontStyle: FontStyle.italic),
                      ),
                    ),
                ],
              ),
              const SizedBox(height: 24),
              
              // Message d'erreur
              if (_errorMessage != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.red.withOpacity(0.3)),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(color: Colors.red, fontSize: 14),
                  ),
                ),
              if (_errorMessage != null) const SizedBox(height: 16),
              
              // Bouton créer
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submitSignup,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF6C5CF7),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
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
                          AppLocalizations.of(context)!.create_my_account,
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
