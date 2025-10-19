import 'server-only';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { getAdminFirestore } from '@/firebase/admin';
import { UserProfile, Transaction, Goal } from '@/lib/types';
import { Query, CollectionReference, DocumentData } from 'firebase-admin/firestore';

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

/**
 * Récupère tous les utilisateurs avec leurs statistiques pour l'admin
 */
export async function getAllUsersWithStats(
  filters: AdminUserFilters = {},
  sort: AdminUserSort = { field: 'createdAt', direction: 'desc' },
  limit: number = 50,
  offset: number = 0
): Promise<{ users: AdminUserData[]; totalCount: number }> {
  try {
    const db = getAdminFirestore();
    
    // Query de base pour les utilisateurs
    let usersQuery: Query<DocumentData, DocumentData> | CollectionReference<DocumentData, DocumentData> = db.collection('users');
    
    // Appliquer les filtres
    if (filters.country) {
      usersQuery = usersQuery.where('country', '==', filters.country);
    }
    if (filters.gender) {
      usersQuery = usersQuery.where('gender', '==', filters.gender);
    }
    if (filters.language) {
      usersQuery = usersQuery.where('language', '==', filters.language);
    }
    if (filters.dateFrom) {
      usersQuery = usersQuery.where('createdAt', '>=', new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      usersQuery = usersQuery.where('createdAt', '<=', new Date(filters.dateTo));
    }

    // Appliquer le tri
    usersQuery = usersQuery.orderBy(sort.field, sort.direction);
    
    // Pagination
    const usersSnapshot = await usersQuery.limit(limit).offset(offset).get();
    const totalCountSnapshot = await usersQuery.get();
    
    const users: AdminUserData[] = [];
    
    // Pour chaque utilisateur, calculer ses stats
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      
      // Récupérer les transactions de cet utilisateur
      const transactionsSnapshot = await db
        .collection(`users/${doc.id}/expenses`)
        .get();
      
      const transactions = transactionsSnapshot.docs.map(tDoc => tDoc.data() as Transaction);
      
      // Calculer le solde
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (t.amountInCents || 0), 0);
      
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (t.amountInCents || 0), 0);
      
      const balanceInCents = totalIncome - totalExpenses;
      
      // Appliquer le filtre de recherche sur les données calculées
      const fullName = `${userData.firstName} ${userData.lastName}`.toLowerCase();
      const email = userData.email?.toLowerCase() || '';
      const country = userData.country?.toLowerCase() || '';
      
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        if (!fullName.includes(searchTerm) && 
            !email.includes(searchTerm) && 
            !country.includes(searchTerm)) {
          continue;
        }
      }
      
      users.push({
        id: doc.id,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        country: userData.country || '',
        gender: userData.gender || 'male',
        language: userData.language || 'fr',
        phoneCountryCode: userData.phoneCountryCode || '',
        phoneNumber: userData.phoneNumber || '',
        displayCurrency: userData.displayCurrency,
        locale: userData.locale,
        createdAt: userData.createdAt,
        transactionCount: transactions.length,
        balanceInCents,
        lastLoginAt: userData.lastLoginAt,
        status: userData.status || 'active'
      });
    }
    
    return {
      users,
      totalCount: totalCountSnapshot.size
    };
    
  } catch (error) {
    console.error('Erreur récupération utilisateurs admin:', error);
    throw new Error('Impossible de récupérer les utilisateurs');
  }
}

/**
 * Calcule les KPIs globaux de la plateforme
 */
export async function getAdminKPIs(): Promise<AdminKPIs> {
  try {
    const db = getAdminFirestore();
    
    // Récupérer tous les utilisateurs
    const usersSnapshot = await db.collection('users').get();
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
    
    const now = new Date();
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Calculer les statistiques utilisateurs
    const usersByCountry: Record<string, number> = {};
    const usersByGender: Record<string, number> = {};
    const usersByLanguage: Record<string, number> = {};
    let newUsersThisMonth = 0;
    let activeUsersThisMonth = 0;
    
    for (const user of users) {
      // Par pays
      const country = user.country || 'Non spécifié';
      usersByCountry[country] = (usersByCountry[country] || 0) + 1;
      
      // Par genre
      const gender = user.gender || 'Non spécifié';
      usersByGender[gender] = (usersByGender[gender] || 0) + 1;
      
      // Par langue
      const language = user.language || 'Non spécifié';
      usersByLanguage[language] = (usersByLanguage[language] || 0) + 1;
      
      // Nouveaux utilisateurs ce mois
      if (user.createdAt && user.createdAt.toDate() >= thisMonth) {
        newUsersThisMonth++;
      }
      
      // Utilisateurs actifs ce mois (dernière connexion)
      if (user.lastLoginAt && user.lastLoginAt.toDate() >= thisMonth) {
        activeUsersThisMonth++;
      }
    }
    
    // Calculer le total des transactions et solde plateforme
    let totalTransactions = 0;
    let totalPlatformBalanceInCents = 0;
    
    for (const user of users) {
      try {
        const transactionsSnapshot = await db
          .collection(`users/${user.id}/expenses`)
          .get();
        
        const transactions = transactionsSnapshot.docs.map(doc => doc.data() as Transaction);
        totalTransactions += transactions.length;
        
        const userIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + (t.amountInCents || 0), 0);
        
        const userExpenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + (t.amountInCents || 0), 0);
        
        totalPlatformBalanceInCents += (userIncome - userExpenses);
        
      } catch (error) {
        console.warn(`Erreur calcul stats utilisateur ${user.id}:`, error);
      }
    }
    
    return {
      totalUsers: users.length,
      usersByCountry,
      usersByGender,
      usersByLanguage,
      totalTransactions,
      totalPlatformBalanceInCents,
      newUsersThisMonth,
      activeUsersThisMonth
    };
    
  } catch (error) {
    console.error('Erreur calcul KPIs admin:', error);
    throw new Error('Impossible de calculer les KPIs');
  }
}

/**
 * Récupère les détails d'un utilisateur avec ses transactions récentes
 */
export async function getUserDetails(userId: string): Promise<{
  user: AdminUserData;
  recentTransactions: Transaction[];
  goals: Goal[];
  totalIncomeInCents: number;
  totalExpensesInCents: number;
}> {
  try {
    const db = getAdminFirestore();
    
    // Utilisateur
    const userDoc = await db.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      throw new Error('Utilisateur non trouvé');
    }
    
    const userData = userDoc.data()!;
    
    // Transactions
    const transactionsSnapshot = await db
      .collection(`users/${userId}/expenses`)
      .orderBy('date', 'desc')
      .limit(100)
      .get();
    
    const allTransactions = transactionsSnapshot.docs.map(doc => doc.data() as Transaction);
    const recentTransactions = allTransactions.slice(0, 5);
    
    // Objectifs
    const goalsSnapshot = await db
      .collection(`users/${userId}/budgetGoals`)
      .orderBy('targetDate', 'desc')
      .get();
    
    const goals = goalsSnapshot.docs.map(doc => doc.data() as Goal);
    
    // Calculs financiers
    const totalIncomeInCents = allTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amountInCents || 0), 0);
    
    const totalExpensesInCents = allTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amountInCents || 0), 0);
    
    const user: AdminUserData = {
      id: userId,
      firstName: userData.firstName || '',
      lastName: userData.lastName || '',
      email: userData.email || '',
      country: userData.country || '',
      gender: userData.gender || 'male',
      language: userData.language || 'fr',
      phoneCountryCode: userData.phoneCountryCode || '',
      phoneNumber: userData.phoneNumber || '',
      displayCurrency: userData.displayCurrency,
      locale: userData.locale,
      createdAt: userData.createdAt,
      transactionCount: allTransactions.length,
      balanceInCents: totalIncomeInCents - totalExpensesInCents,
      lastLoginAt: userData.lastLoginAt,
      status: userData.status || 'active'
    };
    
    return {
      user,
      recentTransactions,
      goals,
      totalIncomeInCents,
      totalExpensesInCents
    };
    
  } catch (error) {
    console.error('Erreur récupération détails utilisateur:', error);
    throw new Error('Impossible de récupérer les détails utilisateur');
  }
}