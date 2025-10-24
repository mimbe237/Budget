'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface PhoneCode {
  country: string;
  code: string;
  dialCode: string;
  flag: string;
}

const PHONE_CODES: PhoneCode[] = [
  // Popular countries first
  { country: 'Belgique', code: 'BE', dialCode: '+32', flag: '🇧🇪' },
  { country: 'Cameroun', code: 'CM', dialCode: '+237', flag: '🇨🇲' },
  { country: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷' },
  { country: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦' },
  { country: 'Suisse', code: 'CH', dialCode: '+41', flag: '🇨🇭' },
  { country: 'Allemagne', code: 'DE', dialCode: '+49', flag: '🇩🇪' },
  
  // All other countries alphabetically
  { country: 'Afghanistan', code: 'AF', dialCode: '+93', flag: '🇦🇫' },
  { country: 'Afrique du Sud', code: 'ZA', dialCode: '+27', flag: '🇿🇦' },
  { country: 'Albanie', code: 'AL', dialCode: '+355', flag: '🇦🇱' },
  { country: 'Algérie', code: 'DZ', dialCode: '+213', flag: '🇩🇿' },
  { country: 'Andorre', code: 'AD', dialCode: '+376', flag: '🇦🇩' },
  { country: 'Angola', code: 'AO', dialCode: '+244', flag: '🇦🇴' },
  { country: 'Antigua-et-Barbuda', code: 'AG', dialCode: '+1268', flag: '🇦🇬' },
  { country: 'Arabie saoudite', code: 'SA', dialCode: '+966', flag: '🇸🇦' },
  { country: 'Argentine', code: 'AR', dialCode: '+54', flag: '🇦🇷' },
  { country: 'Arménie', code: 'AM', dialCode: '+374', flag: '🇦🇲' },
  { country: 'Australie', code: 'AU', dialCode: '+61', flag: '🇦🇺' },
  { country: 'Autriche', code: 'AT', dialCode: '+43', flag: '🇦🇹' },
  { country: 'Azerbaïdjan', code: 'AZ', dialCode: '+994', flag: '🇦🇿' },
  { country: 'Bahamas', code: 'BS', dialCode: '+1242', flag: '🇧🇸' },
  { country: 'Bahreïn', code: 'BH', dialCode: '+973', flag: '🇧🇭' },
  { country: 'Bangladesh', code: 'BD', dialCode: '+880', flag: '🇧🇩' },
  { country: 'Barbade', code: 'BB', dialCode: '+1246', flag: '🇧🇧' },
  { country: 'Belize', code: 'BZ', dialCode: '+501', flag: '🇧🇿' },
  { country: 'Bénin', code: 'BJ', dialCode: '+229', flag: '🇧🇯' },
  { country: 'Bhoutan', code: 'BT', dialCode: '+975', flag: '🇧🇹' },
  { country: 'Biélorussie', code: 'BY', dialCode: '+375', flag: '🇧🇾' },
  { country: 'Bolivie', code: 'BO', dialCode: '+591', flag: '🇧🇴' },
  { country: 'Bosnie-Herzégovine', code: 'BA', dialCode: '+387', flag: '🇧🇦' },
  { country: 'Botswana', code: 'BW', dialCode: '+267', flag: '🇧🇼' },
  { country: 'Brésil', code: 'BR', dialCode: '+55', flag: '🇧🇷' },
  { country: 'Brunei', code: 'BN', dialCode: '+673', flag: '🇧🇳' },
  { country: 'Bulgarie', code: 'BG', dialCode: '+359', flag: '🇧🇬' },
  { country: 'Burkina Faso', code: 'BF', dialCode: '+226', flag: '🇧🇫' },
  { country: 'Burundi', code: 'BI', dialCode: '+257', flag: '🇧🇮' },
  { country: 'Cambodge', code: 'KH', dialCode: '+855', flag: '🇰🇭' },
  { country: 'Cap-Vert', code: 'CV', dialCode: '+238', flag: '🇨🇻' },
  { country: 'Chili', code: 'CL', dialCode: '+56', flag: '🇨🇱' },
  { country: 'Chine', code: 'CN', dialCode: '+86', flag: '🇨🇳' },
  { country: 'Chypre', code: 'CY', dialCode: '+357', flag: '🇨🇾' },
  { country: 'Colombie', code: 'CO', dialCode: '+57', flag: '🇨🇴' },
  { country: 'Comores', code: 'KM', dialCode: '+269', flag: '🇰🇲' },
  { country: 'Corée du Nord', code: 'KP', dialCode: '+850', flag: '🇰🇵' },
  { country: 'Corée du Sud', code: 'KR', dialCode: '+82', flag: '🇰🇷' },
  { country: 'Costa Rica', code: 'CR', dialCode: '+506', flag: '🇨🇷' },
  { country: 'Côte d\'Ivoire', code: 'CI', dialCode: '+225', flag: '🇨🇮' },
  { country: 'Croatie', code: 'HR', dialCode: '+385', flag: '🇭🇷' },
  { country: 'Cuba', code: 'CU', dialCode: '+53', flag: '🇨🇺' },
  { country: 'Danemark', code: 'DK', dialCode: '+45', flag: '🇩🇰' },
  { country: 'Djibouti', code: 'DJ', dialCode: '+253', flag: '🇩🇯' },
  { country: 'Dominique', code: 'DM', dialCode: '+1767', flag: '🇩🇲' },
  { country: 'Égypte', code: 'EG', dialCode: '+20', flag: '🇪🇬' },
  { country: 'Émirats arabes unis', code: 'AE', dialCode: '+971', flag: '🇦🇪' },
  { country: 'Équateur', code: 'EC', dialCode: '+593', flag: '🇪🇨' },
  { country: 'Érythrée', code: 'ER', dialCode: '+291', flag: '🇪🇷' },
  { country: 'Espagne', code: 'ES', dialCode: '+34', flag: '🇪🇸' },
  { country: 'Estonie', code: 'EE', dialCode: '+372', flag: '🇪🇪' },
  { country: 'États-Unis', code: 'US', dialCode: '+1', flag: '🇺🇸' },
  { country: 'Éthiopie', code: 'ET', dialCode: '+251', flag: '🇪🇹' },
  { country: 'Fidji', code: 'FJ', dialCode: '+679', flag: '🇫🇯' },
  { country: 'Finlande', code: 'FI', dialCode: '+358', flag: '🇫🇮' },
  { country: 'Gabon', code: 'GA', dialCode: '+241', flag: '🇬🇦' },
  { country: 'Gambie', code: 'GM', dialCode: '+220', flag: '🇬🇲' },
  { country: 'Géorgie', code: 'GE', dialCode: '+995', flag: '🇬🇪' },
  { country: 'Ghana', code: 'GH', dialCode: '+233', flag: '🇬🇭' },
  { country: 'Grèce', code: 'GR', dialCode: '+30', flag: '🇬🇷' },
  { country: 'Grenade', code: 'GD', dialCode: '+1473', flag: '🇬🇩' },
  { country: 'Guatemala', code: 'GT', dialCode: '+502', flag: '🇬🇹' },
  { country: 'Guinée', code: 'GN', dialCode: '+224', flag: '🇬🇳' },
  { country: 'Guinée équatoriale', code: 'GQ', dialCode: '+240', flag: '🇬🇶' },
  { country: 'Guinée-Bissau', code: 'GW', dialCode: '+245', flag: '🇬🇼' },
  { country: 'Guyana', code: 'GY', dialCode: '+592', flag: '🇬🇾' },
  { country: 'Haïti', code: 'HT', dialCode: '+509', flag: '🇭🇹' },
  { country: 'Honduras', code: 'HN', dialCode: '+504', flag: '🇭🇳' },
  { country: 'Hongrie', code: 'HU', dialCode: '+36', flag: '🇭🇺' },
  { country: 'Îles Marshall', code: 'MH', dialCode: '+692', flag: '🇲🇭' },
  { country: 'Îles Salomon', code: 'SB', dialCode: '+677', flag: '🇸🇧' },
  { country: 'Inde', code: 'IN', dialCode: '+91', flag: '🇮🇳' },
  { country: 'Indonésie', code: 'ID', dialCode: '+62', flag: '🇮🇩' },
  { country: 'Irak', code: 'IQ', dialCode: '+964', flag: '🇮🇶' },
  { country: 'Iran', code: 'IR', dialCode: '+98', flag: '🇮🇷' },
  { country: 'Irlande', code: 'IE', dialCode: '+353', flag: '🇮🇪' },
  { country: 'Islande', code: 'IS', dialCode: '+354', flag: '🇮🇸' },
  { country: 'Israël', code: 'IL', dialCode: '+972', flag: '🇮🇱' },
  { country: 'Italie', code: 'IT', dialCode: '+39', flag: '🇮🇹' },
  { country: 'Jamaïque', code: 'JM', dialCode: '+1876', flag: '🇯🇲' },
  { country: 'Japon', code: 'JP', dialCode: '+81', flag: '🇯🇵' },
  { country: 'Jordanie', code: 'JO', dialCode: '+962', flag: '🇯🇴' },
  { country: 'Kazakhstan', code: 'KZ', dialCode: '+7', flag: '🇰🇿' },
  { country: 'Kenya', code: 'KE', dialCode: '+254', flag: '🇰🇪' },
  { country: 'Kirghizistan', code: 'KG', dialCode: '+996', flag: '🇰🇬' },
  { country: 'Kiribati', code: 'KI', dialCode: '+686', flag: '🇰🇮' },
  { country: 'Koweït', code: 'KW', dialCode: '+965', flag: '🇰🇼' },
  { country: 'Laos', code: 'LA', dialCode: '+856', flag: '🇱🇦' },
  { country: 'Lesotho', code: 'LS', dialCode: '+266', flag: '🇱🇸' },
  { country: 'Lettonie', code: 'LV', dialCode: '+371', flag: '🇱🇻' },
  { country: 'Liban', code: 'LB', dialCode: '+961', flag: '🇱🇧' },
  { country: 'Liberia', code: 'LR', dialCode: '+231', flag: '🇱🇷' },
  { country: 'Libye', code: 'LY', dialCode: '+218', flag: '🇱🇾' },
  { country: 'Liechtenstein', code: 'LI', dialCode: '+423', flag: '🇱🇮' },
  { country: 'Lituanie', code: 'LT', dialCode: '+370', flag: '🇱🇹' },
  { country: 'Luxembourg', code: 'LU', dialCode: '+352', flag: '🇱🇺' },
  { country: 'Macédoine du Nord', code: 'MK', dialCode: '+389', flag: '🇲🇰' },
  { country: 'Madagascar', code: 'MG', dialCode: '+261', flag: '🇲🇬' },
  { country: 'Malaisie', code: 'MY', dialCode: '+60', flag: '🇲🇾' },
  { country: 'Malawi', code: 'MW', dialCode: '+265', flag: '🇲🇼' },
  { country: 'Maldives', code: 'MV', dialCode: '+960', flag: '🇲🇻' },
  { country: 'Mali', code: 'ML', dialCode: '+223', flag: '🇲🇱' },
  { country: 'Malte', code: 'MT', dialCode: '+356', flag: '🇲🇹' },
  { country: 'Maroc', code: 'MA', dialCode: '+212', flag: '🇲🇦' },
  { country: 'Maurice', code: 'MU', dialCode: '+230', flag: '🇲🇺' },
  { country: 'Mauritanie', code: 'MR', dialCode: '+222', flag: '🇲🇷' },
  { country: 'Mexique', code: 'MX', dialCode: '+52', flag: '🇲🇽' },
  { country: 'Moldavie', code: 'MD', dialCode: '+373', flag: '🇲🇩' },
  { country: 'Monaco', code: 'MC', dialCode: '+377', flag: '🇲🇨' },
  { country: 'Mongolie', code: 'MN', dialCode: '+976', flag: '🇲🇳' },
  { country: 'Monténégro', code: 'ME', dialCode: '+382', flag: '🇲🇪' },
  { country: 'Mozambique', code: 'MZ', dialCode: '+258', flag: '🇲🇿' },
  { country: 'Myanmar', code: 'MM', dialCode: '+95', flag: '🇲🇲' },
  { country: 'Namibie', code: 'NA', dialCode: '+264', flag: '🇳🇦' },
  { country: 'Nauru', code: 'NR', dialCode: '+674', flag: '🇳🇷' },
  { country: 'Népal', code: 'NP', dialCode: '+977', flag: '🇳🇵' },
  { country: 'Nicaragua', code: 'NI', dialCode: '+505', flag: '🇳🇮' },
  { country: 'Niger', code: 'NE', dialCode: '+227', flag: '🇳🇪' },
  { country: 'Nigeria', code: 'NG', dialCode: '+234', flag: '🇳🇬' },
  { country: 'Norvège', code: 'NO', dialCode: '+47', flag: '🇳🇴' },
  { country: 'Nouvelle-Zélande', code: 'NZ', dialCode: '+64', flag: '🇳🇿' },
  { country: 'Oman', code: 'OM', dialCode: '+968', flag: '🇴🇲' },
  { country: 'Ouganda', code: 'UG', dialCode: '+256', flag: '🇺🇬' },
  { country: 'Ouzbékistan', code: 'UZ', dialCode: '+998', flag: '🇺🇿' },
  { country: 'Pakistan', code: 'PK', dialCode: '+92', flag: '🇵🇰' },
  { country: 'Palaos', code: 'PW', dialCode: '+680', flag: '🇵🇼' },
  { country: 'Panama', code: 'PA', dialCode: '+507', flag: '🇵🇦' },
  { country: 'Papouasie-Nouvelle-Guinée', code: 'PG', dialCode: '+675', flag: '🇵🇬' },
  { country: 'Paraguay', code: 'PY', dialCode: '+595', flag: '🇵🇾' },
  { country: 'Pays-Bas', code: 'NL', dialCode: '+31', flag: '🇳🇱' },
  { country: 'Pérou', code: 'PE', dialCode: '+51', flag: '🇵🇪' },
  { country: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭' },
  { country: 'Pologne', code: 'PL', dialCode: '+48', flag: '🇵🇱' },
  { country: 'Portugal', code: 'PT', dialCode: '+351', flag: '🇵🇹' },
  { country: 'Qatar', code: 'QA', dialCode: '+974', flag: '🇶🇦' },
  { country: 'République centrafricaine', code: 'CF', dialCode: '+236', flag: '🇨🇫' },
  { country: 'République démocratique du Congo', code: 'CD', dialCode: '+243', flag: '🇨🇩' },
  { country: 'République dominicaine', code: 'DO', dialCode: '+1809', flag: '🇩🇴' },
  { country: 'République du Congo', code: 'CG', dialCode: '+242', flag: '🇨🇬' },
  { country: 'République tchèque', code: 'CZ', dialCode: '+420', flag: '🇨🇿' },
  { country: 'Roumanie', code: 'RO', dialCode: '+40', flag: '🇷🇴' },
  { country: 'Royaume-Uni', code: 'GB', dialCode: '+44', flag: '🇬🇧' },
  { country: 'Russie', code: 'RU', dialCode: '+7', flag: '🇷🇺' },
  { country: 'Rwanda', code: 'RW', dialCode: '+250', flag: '🇷🇼' },
  { country: 'Saint-Christophe-et-Niévès', code: 'KN', dialCode: '+1869', flag: '🇰🇳' },
  { country: 'Sainte-Lucie', code: 'LC', dialCode: '+1758', flag: '🇱🇨' },
  { country: 'Saint-Marin', code: 'SM', dialCode: '+378', flag: '🇸🇲' },
  { country: 'Saint-Vincent-et-les-Grenadines', code: 'VC', dialCode: '+1784', flag: '🇻🇨' },
  { country: 'Salvador', code: 'SV', dialCode: '+503', flag: '🇸🇻' },
  { country: 'Samoa', code: 'WS', dialCode: '+685', flag: '🇼🇸' },
  { country: 'Sao Tomé-et-Principe', code: 'ST', dialCode: '+239', flag: '🇸🇹' },
  { country: 'Sénégal', code: 'SN', dialCode: '+221', flag: '🇸🇳' },
  { country: 'Serbie', code: 'RS', dialCode: '+381', flag: '🇷🇸' },
  { country: 'Seychelles', code: 'SC', dialCode: '+248', flag: '🇸🇨' },
  { country: 'Sierra Leone', code: 'SL', dialCode: '+232', flag: '🇸🇱' },
  { country: 'Singapour', code: 'SG', dialCode: '+65', flag: '🇸🇬' },
  { country: 'Slovaquie', code: 'SK', dialCode: '+421', flag: '🇸🇰' },
  { country: 'Slovénie', code: 'SI', dialCode: '+386', flag: '🇸🇮' },
  { country: 'Somalie', code: 'SO', dialCode: '+252', flag: '🇸🇴' },
  { country: 'Soudan', code: 'SD', dialCode: '+249', flag: '🇸🇩' },
  { country: 'Soudan du Sud', code: 'SS', dialCode: '+211', flag: '🇸🇸' },
  { country: 'Sri Lanka', code: 'LK', dialCode: '+94', flag: '🇱🇰' },
  { country: 'Suède', code: 'SE', dialCode: '+46', flag: '🇸🇪' },
  { country: 'Suriname', code: 'SR', dialCode: '+597', flag: '🇸🇷' },
  { country: 'Syrie', code: 'SY', dialCode: '+963', flag: '🇸🇾' },
  { country: 'Tadjikistan', code: 'TJ', dialCode: '+992', flag: '🇹🇯' },
  { country: 'Taïwan', code: 'TW', dialCode: '+886', flag: '🇹🇼' },
  { country: 'Tanzanie', code: 'TZ', dialCode: '+255', flag: '🇹🇿' },
  { country: 'Tchad', code: 'TD', dialCode: '+235', flag: '🇹🇩' },
  { country: 'Thaïlande', code: 'TH', dialCode: '+66', flag: '🇹🇭' },
  { country: 'Timor oriental', code: 'TL', dialCode: '+670', flag: '🇹🇱' },
  { country: 'Togo', code: 'TG', dialCode: '+228', flag: '🇹🇬' },
  { country: 'Tonga', code: 'TO', dialCode: '+676', flag: '🇹🇴' },
  { country: 'Trinité-et-Tobago', code: 'TT', dialCode: '+1868', flag: '🇹🇹' },
  { country: 'Tunisie', code: 'TN', dialCode: '+216', flag: '🇹🇳' },
  { country: 'Turkménistan', code: 'TM', dialCode: '+993', flag: '🇹🇲' },
  { country: 'Turquie', code: 'TR', dialCode: '+90', flag: '🇹🇷' },
  { country: 'Tuvalu', code: 'TV', dialCode: '+688', flag: '🇹🇻' },
  { country: 'Ukraine', code: 'UA', dialCode: '+380', flag: '🇺🇦' },
  { country: 'Uruguay', code: 'UY', dialCode: '+598', flag: '🇺🇾' },
  { country: 'Vanuatu', code: 'VU', dialCode: '+678', flag: '🇻🇺' },
  { country: 'Vatican', code: 'VA', dialCode: '+39', flag: '🇻🇦' },
  { country: 'Venezuela', code: 'VE', dialCode: '+58', flag: '🇻🇪' },
  { country: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳' },
  { country: 'Yémen', code: 'YE', dialCode: '+967', flag: '🇾🇪' },
  { country: 'Zambie', code: 'ZM', dialCode: '+260', flag: '🇿🇲' },
  { country: 'Zimbabwe', code: 'ZW', dialCode: '+263', flag: '🇿🇼' },
];

const POPULAR_CODES = ['BE', 'CM', 'FR', 'CA', 'CH', 'DE'];

interface PhoneInputProps {
  countryCode: string;
  phoneNumber: string;
  onCountryChange: (countryCode: string) => void;
  onPhoneChange: (phoneNumber: string) => void;
  error?: string;
  className?: string;
}

export function PhoneInput({ 
  countryCode, 
  phoneNumber, 
  onCountryChange, 
  onPhoneChange, 
  error, 
  className = "" 
}: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCountry = PHONE_CODES.find(item => item.code === countryCode) || PHONE_CODES[2]; // Default to France

  const filteredCodes = PHONE_CODES.filter(item =>
    item.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.dialCode.includes(searchQuery)
  );

  const popularFiltered = filteredCodes.filter(item =>
    POPULAR_CODES.includes(item.code)
  );

  const regularFiltered = filteredCodes.filter(item =>
    !POPULAR_CODES.includes(item.code)
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: PhoneCode) => {
    onCountryChange(item.code);
    setIsOpen(false);
    setSearchQuery('');
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format based on country
    if (countryCode === 'FR') {
      // French format: XX XX XX XX XX
      return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
    } else if (countryCode === 'BE') {
      // Belgian format: XXX XX XX XX
      return digits.replace(/(\d{3})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4').trim();
    } else if (countryCode === 'US' || countryCode === 'CA') {
      // North American format: (XXX) XXX-XXXX
      if (digits.length >= 6) {
        return digits.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
      } else if (digits.length >= 3) {
        return digits.replace(/(\d{3})(\d{1,3})/, '($1) $2');
      }
    }
    
    // Default format: add spaces every 2 digits
    return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formatted = formatPhoneNumber(value);
    onPhoneChange(formatted);
  };

  return (
  <div className={`flex flex-col sm:flex-row gap-2 sm:gap-0 ${className}`}>
      {/* Country Code Selector */}
  <div className="relative sm:static" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-2 border sm:border-r-0 sm:rounded-l-md rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          }`}
        >
          <span className="text-lg">{selectedCountry.flag}</span>
          <span className="text-sm font-medium text-gray-700">
            {selectedCountry.dialCode}
          </span>
          <ChevronDown 
            className={`h-4 w-4 text-gray-400 transition-transform ${
              isOpen ? 'transform rotate-180' : ''
            }`} 
          />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-[85vw] sm:w-72 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden">
            {/* Search */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Rechercher un pays..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>
            </div>

            <div className="max-h-48 overflow-y-auto overscroll-contain">
              {/* Popular countries */}
              {popularFiltered.length > 0 && (
                <div>
                  {searchQuery === '' && (
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 uppercase">
                      Pays populaires
                    </div>
                  )}
                  {popularFiltered.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                    >
                      <span className="text-lg">{item.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {item.country}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 font-mono">
                        {item.dialCode}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Separator */}
              {popularFiltered.length > 0 && regularFiltered.length > 0 && searchQuery === '' && (
                <div className="border-t border-gray-100"></div>
              )}

              {/* All other countries */}
              {regularFiltered.length > 0 && (
                <div>
                  {searchQuery === '' && (
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 bg-gray-50 uppercase">
                      Tous les pays
                    </div>
                  )}
                  {regularFiltered.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                    >
                      <span className="text-lg">{item.flag}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {item.country}
                        </div>
                      </div>
                      <span className="text-sm text-gray-500 font-mono">
                        {item.dialCode}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Phone Number Input */}
      <div className="flex-1">
        <Input
          type="tel"
          placeholder="Numéro de téléphone"
          value={phoneNumber}
          onChange={handlePhoneChange}
          inputMode="tel"
          autoComplete="tel"
          className={`sm:rounded-l-none ${error ? 'border-red-500' : ''}`}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="absolute top-full left-0 mt-1">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}