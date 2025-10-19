'use server';

import { getAuthenticatedUser, getFirebaseAdminApp } from '@/firebase/admin';
import type { FinancialReportData, Transaction, Budget, Goal, UserProfile } from '@/lib/types';
import { 
    startOfMonth, 
    endOfMonth, 
    parseISO, 
    isValid, 
    sub, 
    format, 
    eachDayOfInterval, 
    differenceInDays 
} from 'date-fns';

/**
 * Fetches and processes all data required for the financial report
 * for a given user and date range.
 */
export async function getFinancialReportData(
    { from, to }: { from?: string; to?: string }
): Promise<FinancialReportData> {

    // 1. Authentication and Initialization
    const user = await getAuthenticatedUser();
    const db = getFirebaseAdminApp().firestore();

    if (!user) {
        throw new Error("Authentication is required to view reports.");
    }
    
    // 2. Date Range Calculation
    const now = new Date();
    const currentPeriod = {
        from: from && isValid(parseISO(from)) ? parseISO(from) : startOfMonth(now),
        to: to && isValid(parseISO(to)) ? parseISO(to) : endOfMonth(now),
    };
    const isCustom = !!(from || to);

    const periodDuration = differenceInDays(currentPeriod.to, currentPeriod.from);

    const previousPeriod = {
        from: sub(currentPeriod.from, { days: periodDuration + 1 }),
        to: sub(currentPeriod.to, { days: periodDuration + 1 }),
    };

    // 3. Data Fetching (in parallel)
    const [
        currentTransactions,
        previousTransactions,
        budgets,
        goals,
        userProfile
    ] = await Promise.all([
        fetchTransactions(db, user.uid, currentPeriod.from, currentPeriod.to),
        fetchTransactions(db, user.uid, previousPeriod.from, previousPeriod.to),
        fetchBudgets(db, user.uid),
        fetchGoals(db, user.uid),
        fetchUserProfile(db, user.uid)
    ]);

    // 4. Data Processing and KPI Calculation
    const totalIncome = currentTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amountInCents, 0);

    const totalExpenses = currentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amountInCents, 0);

    const prevTotalExpenses = previousTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amountInCents, 0);
    
    const expenseDelta = prevTotalExpenses > 0 
        ? ((totalExpenses - prevTotalExpenses) / prevTotalExpenses) * 100 
        : totalExpenses > 0 ? 100 : 0;

    // 5. Chart Data Generation
    const spendingByCategory = processSpendingByCategory(currentTransactions);
    const cashflow = processCashflow(currentTransactions, currentPeriod.from, currentPeriod.to);

    // 6. Table Data Generation
    const budgetVsActual = processBudgetVsActual(currentTransactions, budgets);
    
    // 7. Assemble and return final data structure
    return {
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        expenseDelta: expenseDelta,
        cashflow,
        spendingByCategory,
        budgetVsActual,
        goals,
        recentTransactions: currentTransactions.slice(0, 10),
        period: { ...currentPeriod, isCustom },
        userProfile
    };
}


// --- Helper Functions ---

async function fetchTransactions(db: FirebaseFirestore.Firestore, uid: string, from: Date, to: Date): Promise<Transaction[]> {
    const expensesRef = db.collection(`users/${uid}/expenses`);
    const snapshot = await expensesRef
        .where('date', '>=', format(from, 'yyyy-MM-dd'))
        .where('date', '<=', format(to, 'yyyy-MM-dd'))
        .orderBy('date', 'desc')
        .get();
        
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
}

async function fetchBudgets(db: FirebaseFirestore.Firestore, uid: string): Promise<Budget[]> {
    const snapshot = await db.collection(`users/${uid}/categories`).get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Budget));
}

async function fetchGoals(db: FirebaseFirestore.Firestore, uid: string): Promise<Goal[]> {
    const snapshot = await db.collection(`users/${uid}/budgetGoals`).orderBy('targetDate', 'asc').get();
    if (snapshot.empty) return [];
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Goal));
}

async function fetchUserProfile(db: FirebaseFirestore.Firestore, uid: string): Promise<UserProfile | null> {
    const docRef = db.doc(`users/${uid}`);
    const docSnap = await docRef.get();
    return docSnap.exists ? docSnap.data() as UserProfile : null;
}

function processSpendingByCategory(transactions: Transaction[]): { name: string; value: number }[] {
    const expenseByCategory: Record<string, number> = {};
    transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            expenseByCategory[t.category] = (expenseByCategory[t.category] || 0) + t.amountInCents;
        });
    
    return Object.entries(expenseByCategory)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
}

function processCashflow(transactions: Transaction[], from: Date, to: Date): { date: string; income: number; expenses: number }[] {
    const dailyTotals: Record<string, { income: number; expenses: number }> = {};
    const interval = eachDayOfInterval({ start: from, end: to });

    interval.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        dailyTotals[dateKey] = { income: 0, expenses: 0 };
    });

    transactions.forEach(t => {
        const dateKey = format(parseISO(t.date), 'yyyy-MM-dd');
        if (dailyTotals[dateKey]) {
            if (t.type === 'income') {
                dailyTotals[dateKey].income += t.amountInCents;
            } else {
                dailyTotals[dateKey].expenses += t.amountInCents;
            }
        }
    });

    return Object.entries(dailyTotals).map(([date, { income, expenses }]) => ({
        date,
        income: income / 100,
        expenses: expenses / 100,
    })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function processBudgetVsActual(transactions: Transaction[], budgets: Budget[]): { category: string; budgeted: number; actual: number; variance: number; }[] {
    const expenseTotals: Record<string, number> = {};
     transactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            expenseTotals[t.category] = (expenseTotals[t.category] || 0) + t.amountInCents;
        });

    return budgets.map(budget => {
        const actual = expenseTotals[budget.name] || 0;
        const budgetedInCents = (budget.budgetedAmount || 0) * 100;
        return {
            category: budget.name,
            budgeted: budgetedInCents,
            actual: actual,
            variance: budgetedInCents - actual,
        };
    }).sort((a, b) => (a.actual / a.budgeted) - (b.actual / b.budgeted));
}
