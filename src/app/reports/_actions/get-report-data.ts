'use server';

// import { getAuthenticatedUser, getFirebaseAdminApp } from '@/firebase/admin'; // Désactivé pour démo
import type { FinancialReportData, Transaction, Budget, Goal, UserProfile } from '@/lib/types';
import type { DebtReportSummary } from '@/types/debt';
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
    { from, to, includeDebt = true }: { from?: string; to?: string; includeDebt?: boolean }
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
    const debtSummary = includeDebt
        ? await fetchDebtsSummary({
            userId: user.uid,
            from: currentPeriod.from,
            to: currentPeriod.to,
            userProfile
        })
        : null;

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
    const financialSeries = buildFinancialSeries(
        cashflow,
        debtSummary?.timeSeriesDebtService ?? []
    );

    // 6. Table Data Generation
    const budgetVsActual = processBudgetVsActual(currentTransactions, budgets);
    
    // 7. Assemble and return final data structure
    return {
        totalIncome,
        totalExpenses,
        netBalance: totalIncome - totalExpenses,
        expenseDelta: expenseDelta,
        debtSummary,
        cashflow,
        financialSeries,
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

function processCashflow(transactions: Transaction[], from: Date, to: Date): {
    date: string;
    income: number;
    expenses: number;
    incomeInCents: number;
    expensesInCents: number;
    netInCents: number;
}[] {
    const dailyTotals: Record<string, { incomeInCents: number; expensesInCents: number }> = {};
    const interval = eachDayOfInterval({ start: from, end: to });

    interval.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        dailyTotals[dateKey] = { incomeInCents: 0, expensesInCents: 0 };
    });

    transactions.forEach(t => {
        const dateKey = format(parseISO(t.date), 'yyyy-MM-dd');
        if (dailyTotals[dateKey]) {
            if (t.type === 'income') {
                dailyTotals[dateKey].incomeInCents += t.amountInCents;
            } else {
                dailyTotals[dateKey].expensesInCents += t.amountInCents;
            }
        }
    });

    return Object.entries(dailyTotals).map(([date, { incomeInCents, expensesInCents }]) => ({
        date,
        income: incomeInCents / 100,
        expenses: expensesInCents / 100,
        incomeInCents,
        expensesInCents,
        netInCents: incomeInCents - expensesInCents,
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

type RawDebtSummary = {
    serviceDebtTotal: number;
    principalPaidTotal: number;
    interestPaidTotal: number;
    remainingPrincipalEnd: number;
    lateCount: number;
    next3Installments: { dueDate: string; amount: number; status: string }[];
    timeSeriesDebtService: { date: string; principalPaid: number; interestPaid: number; totalPaid: number }[];
};

async function fetchDebtsSummary({
    userId,
    from,
    to,
    userProfile,
}: {
    userId: string;
    from: Date;
    to: Date;
    userProfile: UserProfile | null;
}): Promise<DebtReportSummary | null> {
    try {
        if (process.env.NEXT_PUBLIC_ENABLE_DEBT_REPORT === 'true') {
            console.warn('[reports] Debt report Cloud Function integration is not yet wired for server environments.');
        }
    } catch (error) {
        console.warn('[reports] Debt report function unavailable, falling back to mock.', error);
    }

    const mock = getMockDebtSummary();
    return normalizeDebtSummary(mock, userProfile, from, to);
}

function normalizeDebtSummary(raw: RawDebtSummary, userProfile: UserProfile | null, from: Date, to: Date): DebtReportSummary {
    const toCents = (value: number) => Math.round((value || 0) * 100);
    const normalizedTimeSeries = raw.timeSeriesDebtService.map(item => ({
        date: item.date,
        principalPaid: toCents(item.principalPaid),
        interestPaid: toCents(item.interestPaid),
        totalPaid: toCents(item.totalPaid),
    }));

    const monthlyCommitment = computeMonthlyDebtCommitment(raw.timeSeriesDebtService, from, to);
    const dti = computeDTI(monthlyCommitment, userProfile?.monthlyNetIncome ?? null);

    return {
        serviceDebtTotal: toCents(raw.serviceDebtTotal),
        principalPaidTotal: toCents(raw.principalPaidTotal),
        interestPaidTotal: toCents(raw.interestPaidTotal),
        remainingPrincipalEnd: toCents(raw.remainingPrincipalEnd),
        lateCount: raw.lateCount,
        next3Installments: raw.next3Installments.map(item => ({
            dueDate: item.dueDate,
            amount: toCents(item.amount),
            status: item.status,
        })),
        timeSeriesDebtService: normalizedTimeSeries,
        dti,
    };
}

function computeMonthlyDebtCommitment(series: RawDebtSummary['timeSeriesDebtService'], from: Date, to: Date): number {
    if (!series?.length) {
        return 0;
    }
    const totalPaid = series.reduce((sum, item) => sum + (item.totalPaid || 0), 0);
    const days = Math.max(1, differenceInDays(to, from) + 1);
    const approximatedMonths = Math.max(1, days / 30);
    return totalPaid / approximatedMonths;
}

function computeDTI(monthlyDebtCommitment: number, userMonthlyNetIncome?: number | null): number | null {
    if (!userMonthlyNetIncome || userMonthlyNetIncome <= 0) {
        return null;
    }
    if (monthlyDebtCommitment <= 0) {
        return 0;
    }
    const ratio = monthlyDebtCommitment / userMonthlyNetIncome;
    return Math.round(ratio * 1000) / 1000;
}

function buildFinancialSeries(
    cashflow: ReturnType<typeof processCashflow>,
    debtSeries: DebtReportSummary['timeSeriesDebtService']
): FinancialReportData['financialSeries'] {
    const accumulator = new Map<string, {
        income: number;
        expenses: number;
        debtService: number;
        principalPaid: number;
        interestPaid: number;
    }>();

    cashflow.forEach(item => {
        accumulator.set(item.date, {
            income: item.incomeInCents,
            expenses: item.expensesInCents,
            debtService: 0,
            principalPaid: 0,
            interestPaid: 0,
        });
    });

    debtSeries.forEach(entry => {
        const existing = accumulator.get(entry.date) ?? {
            income: 0,
            expenses: 0,
            debtService: 0,
            principalPaid: 0,
            interestPaid: 0,
        };
        existing.debtService += entry.totalPaid;
        existing.principalPaid += entry.principalPaid;
        existing.interestPaid += entry.interestPaid;
        accumulator.set(entry.date, existing);
    });

    const sortedDates = Array.from(accumulator.keys()).sort(
        (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    let cumulative = 0;
    return sortedDates.map(date => {
        const entry = accumulator.get(date)!;
        cumulative += entry.income - entry.expenses - entry.debtService;
        return {
            date,
            income: entry.income,
            expenses: entry.expenses,
            debtService: entry.debtService,
            cumulativeBalance: cumulative,
            principalPaid: entry.principalPaid,
            interestPaid: entry.interestPaid,
        };
    });
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
        locale: 'fr-CM',
        monthlyNetIncome: 4500, // ~4 500 en devise locale
    };
}

function getMockDebtSummary(): RawDebtSummary {
    return {
        serviceDebtTotal: 320.45,
        principalPaidTotal: 250.0,
        interestPaidTotal: 70.45,
        remainingPrincipalEnd: 8450.9,
        lateCount: 1,
        next3Installments: [
            { dueDate: '2025-11-10', amount: 210.22, status: 'A_ECHoir' },
            { dueDate: '2025-12-10', amount: 210.22, status: 'A_ECHoir' },
            { dueDate: '2026-01-10', amount: 210.22, status: 'A_ECHoir' },
        ],
        timeSeriesDebtService: [
            { date: '2025-10-01', principalPaid: 200, interestPaid: 50, totalPaid: 250 },
            { date: '2025-10-15', principalPaid: 50, interestPaid: 20, totalPaid: 70 },
        ],
    };
}
