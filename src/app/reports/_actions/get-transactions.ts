'use server';

import { getFirebaseAdminApp } from '@/firebase/admin';
import { headers } from 'next/headers';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { z } from 'zod';
import { startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns';
import type { Transaction } from '@/lib/types';

async function getAuthenticatedUser(): Promise<DecodedIdToken | null> {
    const authHeader = headers().get('Authorization');
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        try {
            const adminApp = getFirebaseAdminApp();
            return await adminApp.auth().verifyIdToken(token);
        } catch (error) {
            console.error('Error verifying auth token:', error);
            return null;
        }
    }
    return null;
}

const DateRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
});

export async function getTransactionsForPeriod(dateRange: { from?: string; to?: string }): Promise<Transaction[]> {
    const validatedRange = DateRangeSchema.safeParse(dateRange);
    if (!validatedRange.success) {
        throw new Error('Invalid date range provided.');
    }

    const user = await getAuthenticatedUser();
    if (!user) {
        console.error("Action requires authentication.");
        return [];
    }

    const db = getFirebaseAdminApp().firestore();
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = db.collection(`users/${user.uid}/expenses`);
    
    const { from, to } = validatedRange.data;
    
    let startDate: Date;
    let endDate: Date;

    // Default to this month if no dates are provided
    const now = new Date();
    const defaultStart = startOfMonth(now);
    const defaultEnd = endOfMonth(now);

    if (from && isValid(parseISO(from))) {
        startDate = parseISO(from);
    } else {
        startDate = defaultStart;
    }

    if (to && isValid(parseISO(to))) {
        endDate = parseISO(to);
    } else {
        endDate = defaultEnd;
    }
    
    query = query.where('date', '>=', format(startDate, 'yyyy-MM-dd'));
    query = query.where('date', '<=', format(endDate, 'yyyy-MM-dd'));
    query = query.orderBy('date', 'desc');

    try {
        const snapshot = await query.get();
        if (snapshot.empty) {
            return [];
        }
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
    } catch (error) {
        console.error("Error fetching transactions for period:", error);
        return [];
    }
}
