"use strict";
/**
 * @fileoverview CRON Jobs for Affiliate System
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.markPayoutPaid = exports.generatePayoutsCron = exports.recurringCommissionsCron = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const utils_1 = require("./utils");
const db = admin.firestore();
/**
 * Generate recurring commissions for active subscriptions
 * Runs daily via Pub/Sub scheduler
 */
exports.recurringCommissionsCron = functions.scheduler.onSchedule('every day 02:00', async (event) => {
    console.log('Starting recurring commissions CRON...');
    try {
        // Get all approved referrals with active subscriptions
        const referralsQuery = await db.collection('referrals')
            .where('status', '==', 'APPROVED')
            .where('eventType', '==', 'SUBSCRIPTION_START')
            .get();
        if (referralsQuery.empty) {
            console.log('No active subscription referrals found');
            return;
        }
        const batch = db.batch();
        const currentMonthKey = (0, utils_1.getMonthKey)();
        let commissionsCreated = 0;
        for (const referralDoc of referralsQuery.docs) {
            const referral = referralDoc.data();
            const affiliateId = referral.affiliateId;
            const subscriptionId = referral.subscriptionId;
            if (!subscriptionId)
                continue;
            // Check if subscription is still active (you'd integrate with your subscription system here)
            // For now, we'll assume it's active if not explicitly cancelled
            // Check if commission already exists for this month
            const existingCommission = await db.collection('commissions')
                .where('referralId', '==', referralDoc.id)
                .where('monthKey', '==', currentMonthKey)
                .where('period', '==', 'MONTHLY')
                .get();
            if (!existingCommission.empty) {
                console.log(`Commission already exists for ${subscriptionId} in ${currentMonthKey}`);
                continue;
            }
            // Get affiliate and program rules
            const affiliateDoc = await db.collection('affiliates').doc(affiliateId).get();
            const affiliate = affiliateDoc.data();
            const rulesDoc = await db.collection('programRules').doc(affiliate.programTier).get();
            const rules = rulesDoc.data();
            // Check if we've reached recurring limit
            const existingRecurringCommissions = await db.collection('commissions')
                .where('referralId', '==', referralDoc.id)
                .where('period', '==', 'MONTHLY')
                .get();
            if (existingRecurringCommissions.size >= rules.recurringMonths) {
                console.log(`Recurring limit reached for ${subscriptionId}`);
                continue;
            }
            // Create monthly recurring commission
            const commissionAmount = (0, utils_1.calculateCommission)(referral.amountGross, 'RECURRING', rules.defaultRatePct);
            const commissionData = {
                affiliateId,
                referralId: referralDoc.id,
                schema: 'RECURRING',
                basisAmount: referral.amountGross,
                ratePct: rules.defaultRatePct,
                period: 'MONTHLY',
                monthKey: currentMonthKey,
                status: 'APPROVED', // Auto-approve recurring commissions
                reason: 'NORMAL',
                createdAt: admin.firestore.Timestamp.now(),
                approvedAt: admin.firestore.Timestamp.now(),
            };
            const commissionRef = db.collection('commissions').doc();
            batch.set(commissionRef, commissionData);
            // Update affiliate totals
            batch.update(db.collection('affiliates').doc(affiliateId), {
                'totals.approvedCommissions': admin.firestore.FieldValue.increment(commissionAmount),
                updatedAt: admin.firestore.Timestamp.now(),
            });
            commissionsCreated++;
        }
        if (commissionsCreated > 0) {
            await batch.commit();
            console.log(`Created ${commissionsCreated} recurring commissions`);
        }
        else {
            console.log('No recurring commissions to create');
        }
    }
    catch (error) {
        console.error('recurringCommissionsCron error:', error);
        throw error;
    }
});
/**
 * Generate payouts for affiliates with approved commissions above threshold
 * Runs monthly on the 1st at 03:00
 */
exports.generatePayoutsCron = functions.scheduler.onSchedule('0 3 1 * *', async (event) => {
    console.log('Starting payouts generation CRON...');
    try {
        // Get all approved affiliates
        const affiliatesQuery = await db.collection('affiliates')
            .where('status', '==', 'APPROVED')
            .get();
        if (affiliatesQuery.empty) {
            console.log('No approved affiliates found');
            return;
        }
        const batch = db.batch();
        const now = admin.firestore.Timestamp.now();
        const periodTo = now;
        const periodFrom = admin.firestore.Timestamp.fromDate(new Date(new Date().setMonth(new Date().getMonth() - 1)));
        let payoutsCreated = 0;
        for (const affiliateDoc of affiliatesQuery.docs) {
            const affiliate = affiliateDoc.data();
            const affiliateId = affiliateDoc.id;
            // Get program rules
            const rulesDoc = await db.collection('programRules').doc(affiliate.programTier).get();
            const rules = rulesDoc.data();
            if (!rules)
                continue;
            // Get approved commissions not yet paid
            const commissionsQuery = await db.collection('commissions')
                .where('affiliateId', '==', affiliateId)
                .where('status', '==', 'APPROVED')
                .get();
            if (commissionsQuery.empty) {
                console.log(`No approved commissions for affiliate ${affiliateId}`);
                continue;
            }
            // Calculate total amount
            let totalAmount = 0;
            const commissionIds = [];
            for (const commissionDoc of commissionsQuery.docs) {
                const commission = commissionDoc.data();
                if (commission.status !== 'PAID') {
                    const amount = commission.fixedAmount ||
                        (commission.basisAmount * (commission.ratePct || 0) / 100);
                    totalAmount += amount;
                    commissionIds.push(commissionDoc.id);
                }
            }
            // Check if total meets minimum payout threshold
            if (totalAmount < rules.minPayout) {
                console.log(`Amount ${totalAmount} below threshold ${rules.minPayout} for ${affiliateId}`);
                continue;
            }
            // Create payout
            const payoutData = {
                affiliateId,
                periodFrom,
                periodTo,
                amount: totalAmount,
                currency: 'XAF',
                status: 'DUE',
                method: affiliate.payoutMethod || 'SEPA',
                destinationMasked: (0, utils_1.maskPayoutDetails)(affiliate.payoutMethod || 'SEPA', affiliate.payoutDetails || {}),
                createdAt: now,
            };
            const payoutRef = db.collection('payouts').doc();
            batch.set(payoutRef, payoutData);
            // Mark commissions as paid
            for (const commissionId of commissionIds) {
                batch.update(db.collection('commissions').doc(commissionId), {
                    status: 'PAID',
                    paidAt: now,
                });
            }
            // Update affiliate totals
            batch.update(db.collection('affiliates').doc(affiliateId), {
                'totals.approvedCommissions': admin.firestore.FieldValue.increment(-totalAmount),
                updatedAt: now,
            });
            // Log action
            batch.set(db.collection('admin_logs').doc(), {
                action: 'payout_generated',
                affiliateId,
                payoutId: payoutRef.id,
                amount: totalAmount,
                commissionsCount: commissionIds.length,
                timestamp: now,
            });
            payoutsCreated++;
        }
        if (payoutsCreated > 0) {
            await batch.commit();
            console.log(`Generated ${payoutsCreated} payouts`);
        }
        else {
            console.log('No payouts to generate');
        }
    }
    catch (error) {
        console.error('generatePayoutsCron error:', error);
        throw error;
    }
});
/**
 * Mark a payout as paid
 */
exports.markPayoutPaid = functions.https.onCall(async (request) => {
    const { auth, data } = request;
    if (!auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Check admin access
    const userDoc = await db.collection('users').doc(auth.uid).get();
    const userData = userDoc.data();
    const isAdmin = userData?.role === 'admin' || userData?.admin === true;
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }
    const { payoutId, txRef, invoiceUrl } = data;
    if (!payoutId) {
        throw new functions.https.HttpsError('invalid-argument', 'payoutId is required');
    }
    try {
        const payoutDoc = await db.collection('payouts').doc(payoutId).get();
        if (!payoutDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Payout not found');
        }
        const payout = payoutDoc.data();
        await db.collection('payouts').doc(payoutId).update({
            status: 'PAID',
            paidAt: admin.firestore.Timestamp.now(),
            invoiceUrl: invoiceUrl || null,
        });
        // Update affiliate totals
        await db.collection('affiliates').doc(payout.affiliateId).update({
            'totals.paidOut': admin.firestore.FieldValue.increment(payout.amount),
            updatedAt: admin.firestore.Timestamp.now(),
        });
        // Log action
        await db.collection('admin_logs').add({
            action: 'payout_marked_paid',
            adminId: auth.uid,
            payoutId,
            affiliateId: payout.affiliateId,
            amount: payout.amount,
            txRef: txRef || 'N/A',
            timestamp: admin.firestore.Timestamp.now(),
        });
        // TODO: Send email notification to affiliate
        return {
            success: true,
            payoutId,
            status: 'PAID',
        };
    }
    catch (error) {
        console.error('markPayoutPaid error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
