
'use server';

import { getFirebaseAdminApp } from '@/firebase/admin';
import { headers } from 'next/headers';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { z } from 'zod';
import { startOfMonth, endOfMonth, parseISO, isValid } from 'date-fns';

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

export async function getTransactionsForPeriod(dateRange: { from?: string; to?: string }) {
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
    const transactionsCollection = db.collection(`users/${user.uid}/expenses`);
    
    let query = transactionsCollection.orderBy('date', 'desc');

    const { from, to } = validatedRange.data;
    
    let startDate: Date;
    let endDate: Date;

    if (from && isValid(parseISO(from))) {
        startDate = parseISO(from);
    } else {
        startDate = startOfMonth(new Date()); // Default to start of current month
    }

    if (to && isValid(parseISO(to))) {
        endDate = parseISO(to);
    } else {
        endDate = endOfMonth(startDate); // Default to end of the month derived from start date
    }

    query = query.where('date', '>=', startDate.toISOString().split('T')[0]);
    query = query.where('date', '<=', endDate.toISOString().split('T')[0]);

    try {
        const snapshot = await query.get();
        if (snapshot.empty) {
            return [];
        }
        // Assuming documents have a 'data' method that returns the transaction object.
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error("Error fetching transactions for period:", error);
        return [];
    }
}
