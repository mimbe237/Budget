/**
 * Utilitaires de normalisation pour les numéros de téléphone.
 *
 * On construit une clé composite [ISO country code]:[digits-only phone].
 * Cette clé permet de garantir l'unicité d'un contact à l'échelle du projet
 * sans dépendre d'un format spécifique (E.164, espaces, parenthèses, etc.).
 */

export function buildPhoneCompositeKey(
  countryCode?: string | null,
  phoneNumber?: string | null
): string | null {
  if (!phoneNumber) {
    return null;
  }

  const digits = phoneNumber.replace(/\D/g, '');
  if (!digits) {
    return null;
  }

  const normalizedCountry = (countryCode || 'XX').toUpperCase();
  return `${normalizedCountry}:${digits}`;
}

export function isSamePhone(
  aCountry?: string | null,
  aPhone?: string | null,
  bCountry?: string | null,
  bPhone?: string | null
): boolean {
  return (
    buildPhoneCompositeKey(aCountry, aPhone) ===
    buildPhoneCompositeKey(bCountry, bPhone)
  );
}
