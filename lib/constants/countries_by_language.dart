/// Liste des pays autorisés dans l'application
/// Utilisée lors de la sélection du pays lors de l'inscription

class AllowedCountries {
  /// Codes ISO de tous les pays autorisés
  static const List<String> codes = [
    'BJ', // Bénin
    'BF', // Burkina Faso
    'BI', // Burundi
    'CM', // Cameroun
    'CG', // Congo-Brazzaville
    'CD', // RDC (Congo)
    'CI', // Côte d'Ivoire
    'GA', // Gabon
    'GN', // Guinée
    'MG', // Madagascar
    'ML', // Mali
    'NE', // Niger
    'RW', // Rwanda
    'SN', // Sénégal
    'SC', // Seychelles
    'TD', // Tchad
    'TG', // Togo
    'FR', // France
    'BE', // Belgique
    'LU', // Luxembourg
    'CH', // Suisse
    'MC', // Monaco
    'CA', // Canada
    'HT', // Haïti
    'VU', // Vanuatu
    'ZA', // Afrique du Sud
    'BW', // Botswana
    'SZ', // Eswatini
    'ET', // Éthiopie
    'GM', // Gambie
    'GH', // Ghana
    'KE', // Kenya
    'LS', // Lesotho
    'LR', // Liberia
    'MW', // Malawi
    'MU', // Maurice
    'NA', // Namibie
    'NG', // Nigéria
    'UG', // Ouganda
    'SL', // Sierra Leone
    'SO', // Somalie
    'SS', // Soudan du Sud
    'TZ', // Tanzanie
    'ZM', // Zambie
    'ZW', // Zimbabwe
    'IE', // Irlande
    'MT', // Malte
    'GB', // Royaume-Uni
    'US', // États-Unis
    'JM', // Jamaïque
    'TT', // Trinité-et-Tobago
    'BB', // Barbade
    'BS', // Bahamas
    'BZ', // Belize
    'GY', // Guyana
    'IN', // Inde
    'PK', // Pakistan
    'PH', // Philippines
    'SG', // Singapour
    'AU', // Australie
    'NZ', // Nouvelle-Zélande
  ];

  /// Vérifie si un code pays est autorisé
  static bool isAllowed(String countryCode) {
    return codes.contains(countryCode);
  }

  /// Retourne le drapeau d'un pays à partir de son code ISO
  static String getFlag(String countryCode) {
    return countryCode
        .toUpperCase()
        .split('')
        .map((char) => String.fromCharCode(0x1F1E6 + (char.codeUnitAt(0) - 'A'.codeUnitAt(0))))
        .join();
  }
}
