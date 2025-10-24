'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Country {
  code: string;
  name: string;
  flag: string;
}

const POPULAR_COUNTRIES: Country[] = [
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
];

const ALL_COUNTRIES: Country[] = [
  ...POPULAR_COUNTRIES,
  { code: 'AD', name: 'Andorre', flag: '🇦🇩' },
  { code: 'AE', name: 'Émirats arabes unis', flag: '🇦🇪' },
  { code: 'AF', name: 'Afghanistan', flag: '🇦🇫' },
  { code: 'AG', name: 'Antigua-et-Barbuda', flag: '🇦🇬' },
  { code: 'AI', name: 'Anguilla', flag: '🇦🇮' },
  { code: 'AL', name: 'Albanie', flag: '🇦🇱' },
  { code: 'AM', name: 'Arménie', flag: '🇦🇲' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴' },
  { code: 'AR', name: 'Argentine', flag: '🇦🇷' },
  { code: 'AS', name: 'Samoa américaines', flag: '🇦🇸' },
  { code: 'AT', name: 'Autriche', flag: '🇦🇹' },
  { code: 'AU', name: 'Australie', flag: '🇦🇺' },
  { code: 'AW', name: 'Aruba', flag: '🇦🇼' },
  { code: 'AZ', name: 'Azerbaïdjan', flag: '🇦🇿' },
  { code: 'BA', name: 'Bosnie-Herzégovine', flag: '🇧🇦' },
  { code: 'BB', name: 'Barbade', flag: '🇧🇧' },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'BG', name: 'Bulgarie', flag: '🇧🇬' },
  { code: 'BH', name: 'Bahreïn', flag: '🇧🇭' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  { code: 'BM', name: 'Bermudes', flag: '🇧🇲' },
  { code: 'BN', name: 'Brunei', flag: '🇧🇳' },
  { code: 'BO', name: 'Bolivie', flag: '🇧🇴' },
  { code: 'BR', name: 'Brésil', flag: '🇧🇷' },
  { code: 'BS', name: 'Bahamas', flag: '🇧🇸' },
  { code: 'BT', name: 'Bhoutan', flag: '🇧🇹' },
  { code: 'BW', name: 'Botswana', flag: '🇧🇼' },
  { code: 'BY', name: 'Biélorussie', flag: '🇧🇾' },
  { code: 'BZ', name: 'Belize', flag: '🇧🇿' },
  { code: 'CD', name: 'République démocratique du Congo', flag: '🇨🇩' },
  { code: 'CF', name: 'République centrafricaine', flag: '🇨🇫' },
  { code: 'CG', name: 'République du Congo', flag: '🇨🇬' },
  { code: 'CI', name: 'Côte d\'Ivoire', flag: '🇨🇮' },
  { code: 'CL', name: 'Chili', flag: '🇨🇱' },
  { code: 'CN', name: 'Chine', flag: '🇨🇳' },
  { code: 'CO', name: 'Colombie', flag: '🇨🇴' },
  { code: 'CR', name: 'Costa Rica', flag: '🇨🇷' },
  { code: 'CU', name: 'Cuba', flag: '🇨🇺' },
  { code: 'CV', name: 'Cap-Vert', flag: '🇨🇻' },
  { code: 'CY', name: 'Chypre', flag: '🇨🇾' },
  { code: 'CZ', name: 'République tchèque', flag: '🇨🇿' },
  { code: 'DJ', name: 'Djibouti', flag: '🇩🇯' },
  { code: 'DK', name: 'Danemark', flag: '🇩🇰' },
  { code: 'DM', name: 'Dominique', flag: '🇩🇲' },
  { code: 'DO', name: 'République dominicaine', flag: '🇩🇴' },
  { code: 'DZ', name: 'Algérie', flag: '🇩🇿' },
  { code: 'EC', name: 'Équateur', flag: '🇪🇨' },
  { code: 'EE', name: 'Estonie', flag: '🇪🇪' },
  { code: 'EG', name: 'Égypte', flag: '🇪🇬' },
  { code: 'ER', name: 'Érythrée', flag: '🇪🇷' },
  { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
  { code: 'ET', name: 'Éthiopie', flag: '🇪🇹' },
  { code: 'FI', name: 'Finlande', flag: '🇫🇮' },
  { code: 'FJ', name: 'Fidji', flag: '🇫🇯' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
  { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧' },
  { code: 'GD', name: 'Grenade', flag: '🇬🇩' },
  { code: 'GE', name: 'Géorgie', flag: '🇬🇪' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'GM', name: 'Gambie', flag: '🇬🇲' },
  { code: 'GN', name: 'Guinée', flag: '🇬🇳' },
  { code: 'GQ', name: 'Guinée équatoriale', flag: '🇬🇶' },
  { code: 'GR', name: 'Grèce', flag: '🇬🇷' },
  { code: 'GT', name: 'Guatemala', flag: '🇬🇹' },
  { code: 'GW', name: 'Guinée-Bissau', flag: '🇬🇼' },
  { code: 'GY', name: 'Guyana', flag: '🇬🇾' },
  { code: 'HN', name: 'Honduras', flag: '🇭🇳' },
  { code: 'HR', name: 'Croatie', flag: '🇭🇷' },
  { code: 'HT', name: 'Haïti', flag: '🇭🇹' },
  { code: 'HU', name: 'Hongrie', flag: '🇭🇺' },
  { code: 'ID', name: 'Indonésie', flag: '🇮🇩' },
  { code: 'IE', name: 'Irlande', flag: '🇮🇪' },
  { code: 'IL', name: 'Israël', flag: '🇮🇱' },
  { code: 'IN', name: 'Inde', flag: '🇮🇳' },
  { code: 'IQ', name: 'Irak', flag: '🇮🇶' },
  { code: 'IR', name: 'Iran', flag: '🇮🇷' },
  { code: 'IS', name: 'Islande', flag: '🇮🇸' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹' },
  { code: 'JM', name: 'Jamaïque', flag: '🇯🇲' },
  { code: 'JO', name: 'Jordanie', flag: '🇯🇴' },
  { code: 'JP', name: 'Japon', flag: '🇯🇵' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'KG', name: 'Kirghizistan', flag: '🇰🇬' },
  { code: 'KH', name: 'Cambodge', flag: '🇰🇭' },
  { code: 'KI', name: 'Kiribati', flag: '🇰🇮' },
  { code: 'KM', name: 'Comores', flag: '🇰🇲' },
  { code: 'KN', name: 'Saint-Christophe-et-Niévès', flag: '🇰🇳' },
  { code: 'KP', name: 'Corée du Nord', flag: '🇰🇵' },
  { code: 'KR', name: 'Corée du Sud', flag: '🇰🇷' },
  { code: 'KW', name: 'Koweït', flag: '🇰🇼' },
  { code: 'KZ', name: 'Kazakhstan', flag: '🇰🇿' },
  { code: 'LA', name: 'Laos', flag: '🇱🇦' },
  { code: 'LB', name: 'Liban', flag: '🇱🇧' },
  { code: 'LC', name: 'Sainte-Lucie', flag: '🇱🇨' },
  { code: 'LI', name: 'Liechtenstein', flag: '🇱🇮' },
  { code: 'LK', name: 'Sri Lanka', flag: '🇱🇰' },
  { code: 'LR', name: 'Liberia', flag: '🇱🇷' },
  { code: 'LS', name: 'Lesotho', flag: '🇱🇸' },
  { code: 'LT', name: 'Lituanie', flag: '🇱🇹' },
  { code: 'LU', name: 'Luxembourg', flag: '🇱🇺' },
  { code: 'LV', name: 'Lettonie', flag: '🇱🇻' },
  { code: 'LY', name: 'Libye', flag: '🇱🇾' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦' },
  { code: 'MC', name: 'Monaco', flag: '🇲🇨' },
  { code: 'MD', name: 'Moldavie', flag: '🇲🇩' },
  { code: 'ME', name: 'Monténégro', flag: '🇲🇪' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'MH', name: 'Îles Marshall', flag: '🇲🇭' },
  { code: 'MK', name: 'Macédoine du Nord', flag: '🇲🇰' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'MM', name: 'Myanmar', flag: '🇲🇲' },
  { code: 'MN', name: 'Mongolie', flag: '🇲🇳' },
  { code: 'MR', name: 'Mauritanie', flag: '🇲🇷' },
  { code: 'MT', name: 'Malte', flag: '🇲🇹' },
  { code: 'MU', name: 'Maurice', flag: '🇲🇺' },
  { code: 'MV', name: 'Maldives', flag: '🇲🇻' },
  { code: 'MW', name: 'Malawi', flag: '🇲🇼' },
  { code: 'MX', name: 'Mexique', flag: '🇲🇽' },
  { code: 'MY', name: 'Malaisie', flag: '🇲🇾' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
  { code: 'NA', name: 'Namibie', flag: '🇳🇦' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'NI', name: 'Nicaragua', flag: '🇳🇮' },
  { code: 'NL', name: 'Pays-Bas', flag: '🇳🇱' },
  { code: 'NO', name: 'Norvège', flag: '🇳🇴' },
  { code: 'NP', name: 'Népal', flag: '🇳🇵' },
  { code: 'NR', name: 'Nauru', flag: '🇳🇷' },
  { code: 'NU', name: 'Niue', flag: '🇳🇺' },
  { code: 'NZ', name: 'Nouvelle-Zélande', flag: '🇳🇿' },
  { code: 'OM', name: 'Oman', flag: '🇴🇲' },
  { code: 'PA', name: 'Panama', flag: '🇵🇦' },
  { code: 'PE', name: 'Pérou', flag: '🇵🇪' },
  { code: 'PG', name: 'Papouasie-Nouvelle-Guinée', flag: '🇵🇬' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭' },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰' },
  { code: 'PL', name: 'Pologne', flag: '🇵🇱' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'PW', name: 'Palaos', flag: '🇵🇼' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'QA', name: 'Qatar', flag: '🇶🇦' },
  { code: 'RO', name: 'Roumanie', flag: '🇷🇴' },
  { code: 'RS', name: 'Serbie', flag: '🇷🇸' },
  { code: 'RU', name: 'Russie', flag: '🇷🇺' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'SA', name: 'Arabie saoudite', flag: '🇸🇦' },
  { code: 'SB', name: 'Îles Salomon', flag: '🇸🇧' },
  { code: 'SC', name: 'Seychelles', flag: '🇸🇨' },
  { code: 'SD', name: 'Soudan', flag: '🇸🇩' },
  { code: 'SE', name: 'Suède', flag: '🇸🇪' },
  { code: 'SG', name: 'Singapour', flag: '🇸🇬' },
  { code: 'SI', name: 'Slovénie', flag: '🇸🇮' },
  { code: 'SK', name: 'Slovaquie', flag: '🇸🇰' },
  { code: 'SL', name: 'Sierra Leone', flag: '🇸🇱' },
  { code: 'SM', name: 'Saint-Marin', flag: '🇸🇲' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
  { code: 'SO', name: 'Somalie', flag: '🇸🇴' },
  { code: 'SR', name: 'Suriname', flag: '🇸🇷' },
  { code: 'SS', name: 'Soudan du Sud', flag: '🇸🇸' },
  { code: 'ST', name: 'Sao Tomé-et-Principe', flag: '🇸🇹' },
  { code: 'SV', name: 'Salvador', flag: '🇸🇻' },
  { code: 'SY', name: 'Syrie', flag: '🇸🇾' },
  { code: 'SZ', name: 'Eswatini', flag: '🇸🇿' },
  { code: 'TD', name: 'Tchad', flag: '🇹🇩' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'TH', name: 'Thaïlande', flag: '🇹🇭' },
  { code: 'TJ', name: 'Tadjikistan', flag: '🇹🇯' },
  { code: 'TL', name: 'Timor oriental', flag: '🇹🇱' },
  { code: 'TM', name: 'Turkménistan', flag: '🇹🇲' },
  { code: 'TN', name: 'Tunisie', flag: '🇹🇳' },
  { code: 'TO', name: 'Tonga', flag: '🇹🇴' },
  { code: 'TR', name: 'Turquie', flag: '🇹🇷' },
  { code: 'TT', name: 'Trinité-et-Tobago', flag: '🇹🇹' },
  { code: 'TV', name: 'Tuvalu', flag: '🇹🇻' },
  { code: 'TW', name: 'Taïwan', flag: '🇹🇼' },
  { code: 'TZ', name: 'Tanzanie', flag: '🇹🇿' },
  { code: 'UA', name: 'Ukraine', flag: '🇺🇦' },
  { code: 'UG', name: 'Ouganda', flag: '🇺🇬' },
  { code: 'US', name: 'États-Unis', flag: '🇺🇸' },
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'UZ', name: 'Ouzbékistan', flag: '🇺🇿' },
  { code: 'VA', name: 'Vatican', flag: '🇻🇦' },
  { code: 'VC', name: 'Saint-Vincent-et-les-Grenadines', flag: '🇻🇨' },
  { code: 'VE', name: 'Venezuela', flag: '🇻🇪' },
  { code: 'VG', name: 'Îles Vierges britanniques', flag: '🇻🇬' },
  { code: 'VI', name: 'Îles Vierges américaines', flag: '🇻🇮' },
  { code: 'VN', name: 'Vietnam', flag: '🇻🇳' },
  { code: 'VU', name: 'Vanuatu', flag: '🇻🇺' },
  { code: 'WS', name: 'Samoa', flag: '🇼🇸' },
  { code: 'YE', name: 'Yémen', flag: '🇾🇪' },
  { code: 'ZA', name: 'Afrique du Sud', flag: '🇿🇦' },
  { code: 'ZM', name: 'Zambie', flag: '🇿🇲' },
  { code: 'ZW', name: 'Zimbabwe', flag: '🇿🇼' },
];

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export function CountrySelect({ value, onChange, error, className = "" }: CountrySelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [customCountry, setCustomCountry] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCountry = ALL_COUNTRIES.find(country => country.code === value) || 
    (customCountry ? { code: 'CUSTOM', name: customCountry, flag: '🌍' } : null);

  const filteredCountries = ALL_COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const popularFiltered = POPULAR_COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const regularFiltered = filteredCountries.filter(country =>
    !POPULAR_COUNTRIES.some(popular => popular.code === country.code)
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

  const handleSelect = (country: Country) => {
    onChange(country.code);
    setIsOpen(false);
    setSearchQuery('');
    if (country.code !== 'CUSTOM') {
      setCustomCountry('');
    }
  };

  const handleCustomSubmit = () => {
    if (customCountry.trim()) {
      onChange('CUSTOM');
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 border rounded-md text-left bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
      >
        <div className="flex items-center gap-3">
          {selectedCountry ? (
            <>
              <span className="text-lg">{selectedCountry.flag}</span>
              <span className="text-sm font-medium text-gray-900">
                {selectedCountry.name}
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-500">Sélectionner un pays</span>
          )}
        </div>
        <ChevronDown 
          className={`h-4 w-4 text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-hidden sm:max-w-none max-w-[90vw]">
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
                {popularFiltered.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {country.name}
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
                {regularFiltered.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleSelect(country)}
                    className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {country.name}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Custom country option */}
            {filteredCountries.length === 0 && searchQuery && (
              <div className="p-3 border-t border-gray-100">
                <div className="text-xs font-semibold text-gray-500 mb-2">
                  Pays non trouvé ?
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Saisir le nom du pays"
                    value={customCountry}
                    onChange={(e) => setCustomCountry(e.target.value)}
                    className="flex-1 text-sm"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCustomSubmit();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCustomSubmit}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    OK
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}