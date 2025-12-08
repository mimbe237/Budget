import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../../services/firestore_service.dart';
import '../navigation/main_navigation_shell.dart';
import '../../widgets/revolutionary_logo.dart';
import 'package:budget/l10n/localization_helpers.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:budget/services/currency_service.dart';
import 'package:provider/provider.dart';
import '../../models/user_profile.dart';
import 'password_reset_screen.dart';
import '../legal/privacy_policy_screen.dart';
import '../legal/terms_of_service_screen.dart';
import '../support/support_screen.dart';
import '../../services/app_settings_service.dart';
import '../../widgets/country_search_dialog.dart';
import '../../providers/locale_provider.dart';

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

  final _settingsService = AppSettingsService();

  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _phoneController = TextEditingController();
  
  bool _isLogin = true;
  bool _isLoading = false;
  int _currentTabIndex = 0;
  String? _errorMessage;
  String _selectedCountryCode = 'CM';
  String _selectedLanguageCode = 'fr';

  @override
  void initState() {
    super.initState();
    // Charger les paramètres dès l'initialisation
    _settingsService.loadSettings();
  }

  static const List<Map<String, String>> _countryOptions = [
    // Afrique francophone
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
    // Afrique anglophone
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
    // Europe francophone
    {'code': 'BE', 'name': 'Belgique', 'nameEn': 'Belgium', 'dial': '+32'},
    {'code': 'FR', 'name': 'France', 'nameEn': 'France', 'dial': '+33'},
    {'code': 'LU', 'name': 'Luxembourg', 'nameEn': 'Luxembourg', 'dial': '+352'},
    {'code': 'MC', 'name': 'Monaco', 'nameEn': 'Monaco', 'dial': '+377'},
    {'code': 'CH', 'name': 'Suisse', 'nameEn': 'Switzerland', 'dial': '+41'},
    // Europe anglophone
    {'code': 'IE', 'name': 'Irlande', 'nameEn': 'Ireland', 'dial': '+353'},
    {'code': 'MT', 'name': 'Malte', 'nameEn': 'Malta', 'dial': '+356'},
    {'code': 'GB', 'name': 'Royaume-Uni', 'nameEn': 'United Kingdom', 'dial': '+44'},
    // Amériques francophone
    {'code': 'CA', 'name': 'Canada', 'nameEn': 'Canada', 'dial': '+1'},
    {'code': 'HT', 'name': 'Haïti', 'nameEn': 'Haiti', 'dial': '+509'},
    // Amériques anglophone
    {'code': 'AG', 'name': 'Antigua-et-Barbuda', 'nameEn': 'Antigua and Barbuda', 'dial': '+1268'},
    {'code': 'BS', 'name': 'Bahamas', 'nameEn': 'Bahamas', 'dial': '+1242'},
    {'code': 'BB', 'name': 'Barbade', 'nameEn': 'Barbados', 'dial': '+1246'},
    {'code': 'BZ', 'name': 'Belize', 'nameEn': 'Belize', 'dial': '+501'},
    {'code': 'DM', 'name': 'Dominique', 'nameEn': 'Dominica', 'dial': '+1767'},
    {'code': 'GD', 'name': 'Grenade', 'nameEn': 'Grenada', 'dial': '+1473'},
    {'code': 'GY', 'name': 'Guyana', 'nameEn': 'Guyana', 'dial': '+592'},
    {'code': 'JM', 'name': 'Jamaïque', 'nameEn': 'Jamaica', 'dial': '+1876'},
    {'code': 'KN', 'name': 'Saint-Kitts-et-Nevis', 'nameEn': 'Saint Kitts and Nevis', 'dial': '+1869'},
    {'code': 'LC', 'name': 'Sainte-Lucie', 'nameEn': 'Saint Lucia', 'dial': '+1758'},
    {'code': 'VC', 'name': 'Saint-Vincent-et-les-Grenadines', 'nameEn': 'Saint Vincent and the Grenadines', 'dial': '+1784'},
    {'code': 'TT', 'name': 'Trinité-et-Tobago', 'nameEn': 'Trinidad and Tobago', 'dial': '+1868'},
    {'code': 'US', 'name': 'États-Unis', 'nameEn': 'United States', 'dial': '+1'},
    // Asie anglophone
    {'code': 'IN', 'name': 'Inde', 'nameEn': 'India', 'dial': '+91'},
    {'code': 'PK', 'name': 'Pakistan', 'nameEn': 'Pakistan', 'dial': '+92'},
    {'code': 'PH', 'name': 'Philippines', 'nameEn': 'Philippines', 'dial': '+63'},
    {'code': 'SG', 'name': 'Singapour', 'nameEn': 'Singapore', 'dial': '+65'},
    {'code': 'LK', 'name': 'Sri Lanka', 'nameEn': 'Sri Lanka', 'dial': '+94'},
    {'code': 'BD', 'name': 'Bangladesh', 'nameEn': 'Bangladesh', 'dial': '+880'},
    // Océanie anglophone
    {'code': 'AU', 'name': 'Australie', 'nameEn': 'Australia', 'dial': '+61'},
    {'code': 'FJ', 'name': 'Fidji', 'nameEn': 'Fiji', 'dial': '+679'},
    {'code': 'NZ', 'name': 'Nouvelle-Zélande', 'nameEn': 'New Zealand', 'dial': '+64'},
    {'code': 'PG', 'name': 'Papouasie-Nouvelle-Guinée', 'nameEn': 'Papua New Guinea', 'dial': '+675'},
    {'code': 'SB', 'name': 'Îles Salomon', 'nameEn': 'Solomon Islands', 'dial': '+677'},
    {'code': 'WS', 'name': 'Samoa', 'nameEn': 'Samoa', 'dial': '+685'},
    {'code': 'TO', 'name': 'Tonga', 'nameEn': 'Tonga', 'dial': '+676'},
  ];

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final localeCode = context.read<LocaleProvider>().locale.languageCode;
    if (localeCode != _selectedLanguageCode) {
      setState(() {
        _selectedLanguageCode = localeCode;
      });
    }
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
      final localeProvider = context.read<LocaleProvider>();
      UserProfile? userProfile;

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
              languageCode: _selectedLanguageCode,
              needsOnboarding: false,
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

        final selectedCountry = _countryOptions.firstWhere(
          (c) => c['code'] == _selectedCountryCode,
          orElse: () => _countryOptions.first,
        );
        final fullPhone = '${selectedCountry['dial']} ${_phoneController.text.trim()}';
        final guessedCurrency =
            CurrencyService.guessCurrencyFromCountry(_selectedCountryCode) ?? 'EUR';
        final displayName = _emailController.text.trim().split('@').first.isNotEmpty
            ? _emailController.text.trim().split('@').first
            : 'Utilisateur';

        // Créer le profil utilisateur dans Firestore
        await firestore.createUserProfile(
          userId: userCredential.user!.uid,
          email: _emailController.text.trim(),
          displayName: displayName,
          countryCode: _selectedCountryCode,
          phoneNumber: fullPhone,
          currency: guessedCurrency,
          languageCode: _selectedLanguageCode,
          needsOnboarding: true,
        );

        // Mettre à jour le displayName dans Firebase Auth
        await userCredential.user!.updateDisplayName(displayName);
      }

      // Vérifier le statut du compte après authentification
      try {
        userProfile = await firestore.getUserProfile(auth.currentUser!.uid);
        final status = userProfile?.status ?? 'active';
        if (status == 'blocked' || status == 'disabled') {
          await auth.signOut();
          if (mounted) {
            setState(() {
              _errorMessage = status == 'blocked'
                  ? 'Compte bloqué. Contactez le support.'
                  : 'Compte désactivé. Contactez le support.';
              _isLoading = false;
            });
          }
          return;
        }
      } catch (_) {
        // En cas d'erreur lecture profil, on laisse continuer (comportement existant)
      }

      if (isDemoLogin || _emailController.text.trim().toLowerCase() == FirestoreService.demoEmail.toLowerCase()) {
        try {
          await firestore.ensureDemoDataset();
        } catch (_) {
          // Ignore dataset errors in demo fallback
        }
      }

      // Navigation vers l'écran principal
      if (mounted) {
        // Appliquer la langue du profil si disponible
        try {
          final profile = await firestore.getUserProfile(auth.currentUser!.uid);
          final lang = profile?.languageCode ?? _selectedLanguageCode;
          await localeProvider.setLocale(Locale(lang));
        } catch (_) {}

        Navigator.of(context).pushReplacement(
          MaterialPageRoute(
            builder: (context) => const MainNavigationShell(),
          ),
        );
      }
    } on FirebaseAuthException catch (e) {
      if (isDemoLogin) {
        // Fallback: demo hors-ligne si Firebase échoue
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const MainNavigationShell()),
          );
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: TrText('Mode Démo hors-ligne (Firebase indisponible)')),
          );
        }
        setState(() => _isLoading = false);
      } else {
        setState(() {
          _errorMessage = _getErrorMessage(e.code);
          _isLoading = false;
        });
      }
    } catch (e) {
      if (isDemoLogin) {
        // Fallback: demo hors-ligne si autre erreur
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const MainNavigationShell()),
          );
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: TrText('Mode Démo hors-ligne (connexion indisponible)')),
          );
        }
        setState(() => _isLoading = false);
      } else {
        setState(() {
          _errorMessage = 'Une erreur est survenue. Réessayez.';
          _isLoading = false;
        });
      }
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

  Widget _buildBenefitsRow() {
    final items = [
      {'icon': Icons.auto_graph_rounded, 'text': 'Budgets intelligents'},
      {'icon': Icons.shield_moon_outlined, 'text': 'Alertes IA'},
      {'icon': Icons.chat_bubble_outline, 'text': 'Support WhatsApp'},
    ];

    return Wrap(
      alignment: WrapAlignment.center,
      spacing: 12,
      runSpacing: 8,
      children: items
          .map(
            (i) => Chip(
              avatar: Icon(i['icon'] as IconData, size: 16, color: _brandPrimary),
              label: TrText(
                i['text'] as String,
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12),
              ),
              backgroundColor: _brandPrimary.withValues(alpha: 0.08),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          )
          .toList(),
    );
  }

  Widget _buildLoginForm() {
    return Column(
      children: [
        const SizedBox(height: 8),
        TextFormField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          autofillHints: const [AutofillHints.email],
          autofocus: true,
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
          autofillHints: _isLogin ? const [AutofillHints.password] : const [AutofillHints.newPassword],
          validator: (value) {
            if (value == null || value.length < 8) {
              return 'Minimum 8 caractères (ajoutez un chiffre si possible)';
            }
            return null;
          },
          onFieldSubmitted: (_) => _submitForm(),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const PasswordResetScreen(),
                ),
              );
            },
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
        if (!_isLogin) ...[
          const SizedBox(height: 4),
          InkWell(
            onTap: () async {
              final result = await showDialog<String>(
                context: context,
                builder: (context) => CountrySearchDialog(
                  countries: _countryOptions,
                  selectedCode: _selectedCountryCode,
                  languageCode: _selectedLanguageCode,
                ),
              );
              if (result != null) {
                setState(() {
                  _selectedCountryCode = result;
                });
              }
            },
            child: InputDecorator(
              decoration: InputDecoration(
                labelText: t('Pays'),
                prefixIcon: const Icon(Icons.public),
                suffixIcon: const Icon(Icons.arrow_drop_down),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              child: Text(
                _selectedLanguageCode == 'en'
                    ? '${_countryOptions.firstWhere((c) => c['code'] == _selectedCountryCode)['nameEn'] ?? _countryOptions.firstWhere((c) => c['code'] == _selectedCountryCode)['name']} (${_countryOptions.firstWhere((c) => c['code'] == _selectedCountryCode)['dial']})'
                    : '${_countryOptions.firstWhere((c) => c['code'] == _selectedCountryCode)['name']} (${_countryOptions.firstWhere((c) => c['code'] == _selectedCountryCode)['dial']})',
                style: const TextStyle(fontSize: 16),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              RichText(
                text: TextSpan(
                  style: const TextStyle(color: Colors.black87, fontSize: 14),
                  children: [
                    const TextSpan(text: '📱 WhatsApp  '),
                    TextSpan(
                      text: '(optionnel)',
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
                        hintText: '6 12 34 56 78',
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
                      validator: (value) {
                        if (_isLogin) return null;
                        if (value == null || value.trim().isEmpty) return null;
                        if (value.trim().length < 6) return 'Minimum 6 chiffres';
                        return null;
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              if (_phoneController.text.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(left: 12),
                  child: Text(
                    '📞 Numéro complet: ${_countryOptions.firstWhere((c) => c['code'] == _selectedCountryCode)['dial']}${_phoneController.text}',
                    style: TextStyle(fontSize: 12, color: Colors.grey[700], fontStyle: FontStyle.italic),
                  ),
                ),
            ],
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
                    _isLogin ? 'Se connecter' : 'Créer mon compte',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Icon(Icons.verified_user, size: 16, color: Colors.black54),
            SizedBox(width: 6),
            TrText(
              'Sécurisé par Firebase · Données chiffrées',
              style: TextStyle(color: Colors.black54, fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ],
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
                    color: _brandPrimary,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        _buildBenefitsRow(),
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
        return 'Email déjà utilisé. Connectez-vous ou réinitialisez le mot de passe.';
      case 'weak-password':
        return 'Choisissez un mot de passe plus fort (8 caractères dont un chiffre).';
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
      resizeToAvoidBottomInset: false, // évite de couper l'écran quand le clavier se ferme
      body: GestureDetector(
        onTap: () => FocusScope.of(context).unfocus(),
        child: SafeArea(
          bottom: false,
          child: LayoutBuilder(
            builder: (context, constraints) {
              final bottomInset = MediaQuery.of(context).viewInsets.bottom;
              return SingleChildScrollView(
                keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                padding: EdgeInsets.only(
                  left: isWide ? 48 : 20,
                  right: isWide ? 48 : 20,
                  top: 24,
                  bottom: 24 + bottomInset,
                ),
                child: ConstrainedBox(
                  constraints: BoxConstraints(
                    minHeight: constraints.maxHeight,
                    maxWidth: 1180,
                  ),
                  child: Align(
                    alignment: Alignment.topCenter,
                    child: DecoratedBox(
                      decoration: const BoxDecoration(color: Color(0xFFF7F8FB)),
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
                                const SizedBox(height: 24),
                                _buildFooterLinks(context),
                              ],
                            ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),
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
          _buildValueBullet('Suivi des dettes et créances avec paiements partiels', Icons.handshake_rounded),
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
    return const SizedBox.shrink();
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
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Row(
                        children: [
                          RevolutionaryLogo(size: 56, withText: false),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: <Widget>[
                              TrText(
                                _isLogin ? 'Connexion' : 'Inscription',
                                style: const TextStyle(
                                  color: Colors.black87,
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -0.3,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      _LanguageChip(
                        code: _selectedLanguageCode,
                        onSelect: (code) async {
                          setState(() => _selectedLanguageCode = code);
                          await context.read<LocaleProvider>().setLocale(Locale(code));
                        },
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

  Widget _buildFooterLinks(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    final isWide = width >= 960;

    return Container(
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE7EAF1)),
      ),
      child: Column(
        children: [
          // Section liens principaux
          Wrap(
            alignment: WrapAlignment.center,
            spacing: isWide ? 24 : 16,
            runSpacing: 12,
            children: [
              _footerLink(
                context: context,
                icon: Icons.privacy_tip_outlined,
                label: 'Confidentialité',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const PrivacyPolicyScreen()),
                  );
                },
              ),
              _footerDivider(),
              _footerLink(
                context: context,
                icon: Icons.description_outlined,
                label: 'Conditions',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const TermsOfServiceScreen()),
                  );
                },
              ),
              _footerDivider(),
              _footerLink(
                context: context,
                icon: Icons.support_agent,
                label: 'Support',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const SupportScreen()),
                  );
                },
              ),
              _footerDivider(),
              _footerLink(
                context: context,
                icon: Icons.language,
                label: 'Site Web',
                onTap: () {
                  launchUrl(
                    Uri.parse(_settingsService.websiteUrl),
                    mode: LaunchMode.externalApplication,
                  );
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(height: 1, color: Color(0xFFE7EAF1)),
          const SizedBox(height: 16),
          // Section contact
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 20,
            runSpacing: 12,
            children: [
              _contactChip(
                icon: Icons.email_outlined,
                label: _settingsService.supportEmail,
                onTap: () {
                  launchUrl(Uri.parse('mailto:${_settingsService.supportEmail}'));
                },
              ),
              _contactChip(
                icon: Icons.chat_bubble_outline,
                label: 'WhatsApp Support',
                onTap: () {
                  final whatsappUrl = _settingsService.whatsappUrl;
                  launchUrl(
                    Uri.parse('$whatsappUrl?text=Bonjour'),
                    mode: LaunchMode.externalApplication,
                  );
                },
                color: const Color(0xFF25D366),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // Branding
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const TrText(
                'Développé par',
                style: TextStyle(color: Colors.black54, fontSize: 13),
              ),
              TextButton(
                onPressed: () {
                  launchUrl(
                    Uri.parse(_settingsService.websiteUrl),
                    mode: LaunchMode.externalApplication,
                  );
                },
                style: TextButton.styleFrom(
                  foregroundColor: _brandPrimary,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  minimumSize: Size.zero,
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: const Text(
                  'BEONWEB',
                  style: TextStyle(
                    fontWeight: FontWeight.w900,
                    fontSize: 14,
                    color: _brandPrimary,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          TrText(
            '© 2025 Budget Pro. Tous droits réservés.',
            style: TextStyle(
              fontSize: 11,
              color: Colors.grey[500],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _footerLink({
    required BuildContext context,
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: _brandPrimary),
            const SizedBox(width: 6),
            TrText(
              label,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: _brandPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _footerDivider() {
    return Container(
      width: 1,
      height: 16,
      color: const Color(0xFFE7EAF1),
    );
  }

  Widget _contactChip({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
    Color? color,
  }) {
    final chipColor = color ?? _brandPrimary;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: chipColor.withOpacity(0.1),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: chipColor.withOpacity(0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: chipColor),
            const SizedBox(width: 6),
            TrText(
              label,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: chipColor,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _LanguageChip extends StatelessWidget {
  const _LanguageChip({required this.code, required this.onSelect});

  final String code;
  final ValueChanged<String> onSelect;

  @override
  Widget build(BuildContext context) {
    const flagByCode = {'fr': '🇫🇷', 'en': '🇬🇧'};
    const labelByCode = {'fr': 'Français', 'en': 'English'};
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE4E7F1)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: code,
              items: flagByCode.keys
                  .map(
                    (lang) => DropdownMenuItem(
                      value: lang,
                      child: Row(
                        children: [
                          Text(flagByCode[lang]!, style: const TextStyle(fontSize: 18)),
                          const SizedBox(width: 6),
                          Text(labelByCode[lang]!),
                        ],
                      ),
                    ),
                  )
                  .toList(),
              selectedItemBuilder: (context) => flagByCode.keys
                  .map(
                    (lang) => Center(
                      child: Text(
                        flagByCode[lang]!,
                        style: const TextStyle(fontSize: 18),
                      ),
                    ),
                  )
                  .toList(),
              onChanged: (value) {
                if (value != null) onSelect(value);
              },
              style: const TextStyle(fontWeight: FontWeight.w700, color: Colors.black87),
              icon: const Icon(Icons.keyboard_arrow_down, size: 18),
            ),
          ),
        ],
      ),
    );
  }
}
