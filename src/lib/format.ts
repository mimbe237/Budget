import { AdminUserData } from './analyticsAdmin';

export interface ExcelUserData {
  'Nom complet': string;
  'Email': string;
  'Pays': string;
  'Sexe': string;
  'Langue': string;
  'Téléphone': string;
  'Nombre de transactions': number;
  'Solde (EUR)': string;
  'Date d\'inscription': string;
  'Statut': string;
}

/**
 * Convertit les données utilisateur pour l'export Excel
 */
export function formatUsersForExcel(users: AdminUserData[]): ExcelUserData[] {
  return users.map(user => ({
    'Nom complet': `${user.firstName} ${user.lastName}`,
    'Email': user.email,
    'Pays': user.country,
    'Sexe': user.gender === 'male' ? 'Homme' : 'Femme',
    'Langue': user.language,
    'Téléphone': user.phoneCountryCode && user.phoneNumber 
      ? `${user.phoneCountryCode} ${user.phoneNumber}` 
      : '',
    'Nombre de transactions': user.transactionCount,
    'Solde (EUR)': formatMoneyFromCents(user.balanceInCents, 'EUR'),
    'Date d\'inscription': user.createdAt 
      ? new Date(user.createdAt.toDate()).toLocaleDateString('fr-FR')
      : '',
    'Statut': user.status === 'active' ? 'Actif' : 'Suspendu'
  }));
}

/**
 * Génère un fichier Excel (lazy-loaded)
 */
export async function generateExcelFile(data: ExcelUserData[], filename: string = 'utilisateurs.xlsx'): Promise<Buffer> {
  const { utils, write } = await import('xlsx');
  
  const worksheet = utils.json_to_sheet(data);
  
  // Ajuster la largeur des colonnes
  const columnWidths = [
    { wch: 25 }, // Nom complet
    { wch: 30 }, // Email
    { wch: 15 }, // Pays
    { wch: 10 }, // Sexe
    { wch: 10 }, // Langue
    { wch: 20 }, // Téléphone
    { wch: 15 }, // Transactions
    { wch: 15 }, // Solde
    { wch: 15 }, // Date
    { wch: 10 }  // Statut
  ];
  
  worksheet['!cols'] = columnWidths;
  
  const workbook = utils.book_new();
  utils.book_append_sheet(workbook, worksheet, 'Utilisateurs');
  
  return write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

/**
 * Génère un fichier CSV
 */
export function generateCSV(data: ExcelUserData[]): string {
  if (data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => 
    headers.map(header => {
      const value = row[header as keyof ExcelUserData];
      // Échapper les guillemets et entourer de guillemets si nécessaire
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Formate un montant en centimes vers une devise lisible
 */
export function formatMoneyFromCents(
  amountInCents: number, 
  currency: string = 'EUR', 
  locale: string = 'fr-FR'
): string {
  const amount = amountInCents / 100;
  
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    // Fallback si la devise n'est pas supportée
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/**
 * Formate une date de manière lisible
 */
export function formatDate(date: Date | any, locale: string = 'fr-FR'): string {
  try {
    const dateObj = date?.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return '';
  }
}

/**
 * Formate un numéro de téléphone
 */
export function formatPhoneNumber(countryCode: string, phoneNumber: string): string {
  if (!countryCode || !phoneNumber) return '';
  
  // Logique de formatage selon le pays
  if (countryCode === 'FR') {
    // Format français: +33 X XX XX XX XX
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length >= 9) {
      return `+33 ${cleaned.slice(1, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
    }
  } else if (countryCode === 'CM') {
    // Format camerounais: +237 XXX XXX XXX
    const cleaned = phoneNumber.replace(/\D/g, '');
    if (cleaned.length >= 9) {
      return `+237 ${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
    }
  }
  
  // Format générique
  return `${countryCode} ${phoneNumber}`;
}

/**
 * Convertit les devises (approximatif)
 */
export function convertCurrency(
  amountInCents: number, 
  fromCurrency: string, 
  toCurrency: string = 'EUR'
): number {
  if (fromCurrency === toCurrency) {
    return amountInCents;
  }
  
  // Taux de change approximatifs (en production, utiliser une API)
  const exchangeRates: Record<string, number> = {
    'XOF_EUR': 0.00152, // 1 XOF = 0.00152 EUR
    'XAF_EUR': 0.00152, // 1 XAF = 0.00152 EUR  
    'USD_EUR': 0.85,    // 1 USD = 0.85 EUR
    'EUR_EUR': 1,
    'EUR_USD': 1.18,
    'EUR_XOF': 655.96,
    'EUR_XAF': 655.96
  };
  
  const rateKey = `${fromCurrency}_${toCurrency}`;
  const rate = exchangeRates[rateKey] || 1;
  
  return Math.round(amountInCents * rate);
}