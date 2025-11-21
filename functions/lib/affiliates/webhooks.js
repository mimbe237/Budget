"use strict";
/**
 * @fileoverview Payment Webhooks & Commission Status Management
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
exports.approveOrVoidOnEvents = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Approve or void commission based on payment events
 * Called by internal webhooks when payment succeeds/fails/refunds
 */
exports.approveOrVoidOnEvents = functions.https.onCall({ invoker: 'public' }, async (request) => {
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
    const { event, referralId, orderId, reason } = data;
    if (!event || !referralId) {
        throw new functions.https.HttpsError('invalid-argument', 'event and referralId are required');
    }
    try {
        // Get all commissions for this referral
        const commissionsQuery = await db.collection('commissions')
            .where('referralId', '==', referralId)
            .get();
        if (commissionsQuery.empty) {
            return { success: false, message: 'No commissions found for referral' };
        }
        const batch = db.batch();
        for (const commissionDoc of commissionsQuery.docs) {
            const commission = commissionDoc.data();
            const affiliateId = commission.affiliateId;
            if (event === 'payment.succeeded' || event === 'subscription.active') {
                // Approve commission
                batch.update(commissionDoc.ref, {
                    status: 'APPROVED',
                    approvedAt: admin.firestore.Timestamp.now(),
                });
                // Update affiliate totals
                const commissionAmount = commission.fixedAmount ||
                    (commission.basisAmount * (commission.ratePct || 0) / 100);
                batch.update(db.collection('affiliates').doc(affiliateId), {
                    'totals.pendingCommissions': admin.firestore.FieldValue.increment(-commissionAmount),
                    'totals.approvedCommissions': admin.firestore.FieldValue.increment(commissionAmount),
                    updatedAt: admin.firestore.Timestamp.now(),
                });
                // Update referral status
                batch.update(db.collection('referrals').doc(referralId), {
                    status: 'APPROVED',
                });
            }
            else if (event === 'payment.refunded' || event === 'payment.chargeback') {
                // Void commission or create negative commission
                batch.update(commissionDoc.ref, {
                    status: 'VOID',
                    reason: event === 'payment.chargeback' ? 'CHARGEBACK' : 'REFUND',
                });
                const commissionAmount = commission.fixedAmount ||
                    (commission.basisAmount * (commission.ratePct || 0) / 100);
                // Update affiliate totals
                if (commission.status === 'APPROVED') {
                    batch.update(db.collection('affiliates').doc(affiliateId), {
                        'totals.approvedCommissions': admin.firestore.FieldValue.increment(-commissionAmount),
                        updatedAt: admin.firestore.Timestamp.now(),
                    });
                }
                else if (commission.status === 'PENDING') {
                    batch.update(db.collection('affiliates').doc(affiliateId), {
                        'totals.pendingCommissions': admin.firestore.FieldValue.increment(-commissionAmount),
                        updatedAt: admin.firestore.Timestamp.now(),
                    });
                }
                // Update referral status
                batch.update(db.collection('referrals').doc(referralId), {
                    status: 'REJECTED',
                });
            }
            // Log action
            batch.set(db.collection('admin_logs').doc(), {
                action: 'commission_status_updated',
                adminId: auth.uid,
                commissionId: commissionDoc.id,
                referralId,
                event,
                reason: reason || event,
                timestamp: admin.firestore.Timestamp.now(),
            });
        }
        await batch.commit();
        return {
            success: true,
            commissionsUpdated: commissionsQuery.size,
            event,
        };
    }
    catch (error) {
        console.error('approveOrVoidOnEvents error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
