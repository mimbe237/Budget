'use server';

// import { getAuthenticatedUser, getFirebaseAdminApp } from '@/firebase/admin'; // Désactivé pour démo
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

    // 1. Authentication and Initialization - TEMPORAIREMENT DÉSACTIVÉ POUR DEMO
    // const user = await getAuthenticatedUser();
    // const db = getFirebaseAdminApp().firestore();

    // if (!user) {
    //     throw new Error("Authentication is required to view reports.");
    // }

    // Mock user pour la démo
    const user = { uid: 'demo-user' };
    
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

    // 3. Data Fetching (in parallel) - MOCK DATA POUR DEMO
    const [
        currentTransactions,
        previousTransactions,
        budgets,
        goals,
        userProfile
    ] = await Promise.all([
        // fetchTransactions(db, user.uid, currentPeriod.from, currentPeriod.to),
        // fetchTransactions(db, user.uid, previousPeriod.from, previousPeriod.to),
        // fetchBudgets(db, user.uid),
        // fetchGoals(db, user.uid),
        // fetchUserProfile(db, user.uid)
        Promise.resolve(getMockTransactions()),
        Promise.resolve(getMockPreviousTransactions()),
        Promise.resolve(getMockBudgets()),
        Promise.resolve(getMockGoals()),
        Promise.resolve(getMockUserProfile())
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
    const incomeByCategory = processIncomeByCategory(currentTransactions);
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
    incomeByCategory,
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

function processIncomeByCategory(transactions: Transaction[]): { name: string; value: number }[] {
    const incomeByCategory: Record<string, number> = {};
    transactions
        .filter(t => t.type === 'income')
        .forEach(t => {
            incomeByCategory[t.category] = (incomeByCategory[t.category] || 0) + t.amountInCents;
        });
    
    return Object.entries(incomeByCategory)
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

// --- Mock Data for Demo ---

function getMockTransactions(): Transaction[] {
    return [
        {
            id: '1',
            date: '2024-10-15',
            description: 'Salaire octobre',
            amountInCents: 250000,
            type: 'income',
            currency: 'EUR',
            category: 'Income',
            userId: 'demo-user'
        },
        {
            id: '2',
            date: '2024-10-10',
            description: 'Courses Carrefour',
            amountInCents: 8500,
            type: 'expense',
            currency: 'EUR',
            category: 'Food',
            userId: 'demo-user'
        },
        {
            id: '3',
            date: '2024-10-08',
            description: 'Loyer appartement',
            amountInCents: 120000,
            type: 'expense',
            currency: 'EUR',
            category: 'Housing',
            userId: 'demo-user'
        },
        {
            id: '4',
            date: '2024-10-05',
            description: 'Essence voiture',
            amountInCents: 6500,
            type: 'expense',
            currency: 'EUR',
            category: 'Transport',
            userId: 'demo-user'
        },
        {
            id: '5',
            date: '2024-10-03',
            description: 'Restaurant avec amis',
            amountInCents: 4500,
            type: 'expense',
            currency: 'EUR',
            category: 'Entertainment',
            userId: 'demo-user'
        },
        {
            id: '6',
            date: '2024-10-01',
            description: 'Facture électricité',
            amountInCents: 8900,
            type: 'expense',
            currency: 'EUR',
            category: 'Utilities',
            userId: 'demo-user'
        }
    ];
}

function getMockPreviousTransactions(): Transaction[] {
    return [
        {
            id: '7',
            date: '2024-09-15',
            description: 'Salaire septembre',
            amountInCents: 250000,
            type: 'income',
            currency: 'EUR',
            category: 'Income',
            userId: 'demo-user'
        },
        {
            id: '8',
            date: '2024-09-10',
            description: 'Courses septembre',
            amountInCents: 7500,
            type: 'expense',
            currency: 'EUR',
            category: 'Food',
            userId: 'demo-user'
        },
        {
            id: '9',
            date: '2024-09-08',
            description: 'Loyer septembre', 
            amountInCents: 120000,
            type: 'expense',
            currency: 'EUR',
            category: 'Housing',
            userId: 'demo-user'
        }
    ];
}

function getMockBudgets(): Budget[] {
    return [
        {
            id: 'b1',
            userId: 'demo-user',
            name: 'Food',
            budgetedAmount: 400
        },
        {
            id: 'b2',
            userId: 'demo-user',
            name: 'Housing',
            budgetedAmount: 1300
        },
        {
            id: 'b3',
            userId: 'demo-user',
            name: 'Transport',
            budgetedAmount: 200
        },
        {
            id: 'b4',
            userId: 'demo-user',
            name: 'Entertainment',
            budgetedAmount: 150
        }
    ];
}

function getMockGoals(): Goal[] {
    return [
        {
            id: 'g1',
            userId: 'demo-user',
            name: 'Vacances d\'été',
            targetAmountInCents: 200000,
            currentAmountInCents: 125000,
            currency: 'EUR',
            targetDate: '2025-06-01',
            createdAt: '2024-01-01T00:00:00.000Z'
        },
        {
            id: 'g2',
            userId: 'demo-user',
            name: 'Fonds d\'urgence',
            targetAmountInCents: 500000,
            currentAmountInCents: 320000,
            currency: 'EUR',
            targetDate: '2025-12-31',
            createdAt: '2024-01-01T00:00:00.000Z'
        },
        {
            id: 'g3',
            userId: 'demo-user',
            name: 'Nouveau laptop',
            targetAmountInCents: 150000,
            currentAmountInCents: 89000,
            currency: 'EUR',
            targetDate: '2025-03-15',
            createdAt: '2024-01-01T00:00:00.000Z'
        }
    ];
}

function getMockUserProfile(): UserProfile {
    return {
        id: 'demo-user',
        email: 'demo@example.com',
        firstName: 'Jean',
        lastName: 'Dupont',
        displayCurrency: 'XAF',
        locale: 'fr-CM'
    };
}
