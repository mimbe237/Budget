export interface AdminUserData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  country: string;
  gender: 'male' | 'female';
  language: string;
  phoneCountryCode: string;
  phoneNumber: string;
  displayCurrency?: string;
  locale?: string;
  createdAt: any;
  transactionCount: number;
  balanceInCents: number;
  lastLoginAt?: any;
  status: 'active' | 'suspended';
}

export interface AdminKPIs {
  totalUsers: number;
  usersByCountry: Record<string, number>;
  usersByGender: Record<string, number>;
  usersByLanguage: Record<string, number>;
  totalTransactions: number;
  totalPlatformBalanceInCents: number;
  newUsersThisMonth: number;
  activeUsersThisMonth: number;
}

export interface AdminUserFilters {
  search?: string;
  country?: string;
  gender?: string;
  language?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: 'active' | 'suspended';
}

export interface AdminUserSort {
  field: 'createdAt' | 'balanceInCents' | 'transactionCount' | 'firstName' | 'country';
  direction: 'asc' | 'desc';
}
