"use strict";
/**
 * @fileoverview Attribution & Commission Logic for Affiliate System
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
exports.attributeConversion = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const utils_1 = require("./utils");
const db = admin.firestore();
/**
 * Attribute conversion to affiliate
 */
exports.attributeConversion = functions.https.onCall(async (request) => {
    const { auth, data } = request;
    if (!auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const conversionData = data;
    const { userId, orderId, subscriptionId, amount, currency = 'XAF', eventType, clickId, deviceId, } = conversionData;
    if (!userId || !amount || !eventType) {
        throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }
    try {
        // Find the last valid click for this user
        let clickDoc = null;
        let attributionModel = 'LAST_CLICK';
        // Try to find click by clickId or deviceId
        if (clickId) {
            const clickSnap = await db.collection('clicks').doc(clickId).get();
            if (clickSnap.exists) {
                clickDoc = clickSnap;
            }
        }
        if (!clickDoc && deviceId) {
            const clicksQuery = await db.collection('clicks')
                .where('deviceId', '==', deviceId)
                .orderBy('createdAt', 'desc')
                .limit(1)
                .get();
            if (!clicksQuery.empty) {
                clickDoc = clicksQuery.docs[0];
            }
        }
        // Fallback: try to find by userId if user was previously tracked
        if (!clickDoc) {
            const clicksQuery = await db.collection('clicks')
                .orderBy('createdAt', 'desc')
                .limit(100) // Check last 100 clicks
                .get();
            // This is a simplified approach; in production, you'd want to store userId on click
            // For now, we'll skip if no click is found
        }
        if (!clickDoc) {
            console.log('No valid click found for conversion');
            return { success: false, message: 'No affiliate click found' };
        }
        const clickData = clickDoc.data();
        const affiliateId = clickData.affiliateId;
        // Get affiliate data
        const affiliateDoc = await db.collection('affiliates').doc(affiliateId).get();
        if (!affiliateDoc.exists) {
            throw new functions.https.HttpsError('not-found', 'Affiliate not found');
        }
        const affiliate = affiliateDoc.data();
        // Check if affiliate is approved
        if (affiliate.status !== 'APPROVED') {
            console.log('Affiliate not approved:', affiliateId);
            return { success: false, message: 'Affiliate not approved' };
        }
        // Prevent self-referral
        if (affiliate.userId === userId) {
            console.log('Self-referral blocked:', userId);
            return { success: false, message: 'Self-referral not allowed' };
        }
        // Validate cookie expiration
        if (!(0, utils_1.isCookieValid)(clickData.createdAt, affiliate.cookieDays)) {
            console.log('Cookie expired for click:', clickDoc.id);
            return { success: false, message: 'Attribution window expired' };
        }
        // Check for duplicate conversion
        const existingReferral = await db.collection('referrals')
            .where('userId', '==', userId)
            .where('eventType', '==', eventType)
            .where('orderId', '==', orderId || null)
            .get();
        if (!existingReferral.empty) {
            console.log('Duplicate referral detected');
            return { success: false, message: 'Conversion already attributed' };
        }
        // Get program rules
        const rulesDoc = await db.collection('programRules').doc(affiliate.programTier).get();
        const rules = rulesDoc.data();
        attributionModel = affiliate.defaultAttribution;
        // Create referral
        const referralData = {
            affiliateId,
            linkId: clickData.linkId,
            clickId: clickDoc.id,
            userId,
            eventType,
            orderId,
            subscriptionId,
            amountGross: amount,
            currency,
            attributedAt: admin.firestore.Timestamp.now(),
            attributionModel,
            status: 'PENDING',
            createdAt: admin.firestore.Timestamp.now(),
        };
        const referralRef = await db.collection('referrals').add(referralData);
        // Calculate commission
        const commissionAmount = (0, utils_1.calculateCommission)(amount, eventType === 'SUBSCRIPTION_START' ? 'RECURRING' : 'PERCENT', rules.defaultRatePct, rules.fixedBounty);
        // Create commission
        const commissionData = {
            affiliateId,
            referralId: referralRef.id,
            schema: eventType === 'SUBSCRIPTION_START' ? 'RECURRING' : 'PERCENT',
            basisAmount: amount,
            ratePct: rules.defaultRatePct,
            fixedAmount: eventType === 'SIGNUP' ? rules.fixedBounty : undefined,
            period: eventType === 'SUBSCRIPTION_START' ? 'MONTHLY' : 'ONE_TIME',
            monthKey: (0, utils_1.getMonthKey)(),
            status: 'PENDING',
            reason: 'NORMAL',
            createdAt: admin.firestore.Timestamp.now(),
        };
        const commissionRef = await db.collection('commissions').add(commissionData);
        // Update affiliate totals
        await db.collection('affiliates').doc(affiliateId).update({
            'totals.referrals': admin.firestore.FieldValue.increment(1),
            'totals.pendingCommissions': admin.firestore.FieldValue.increment(commissionAmount),
            updatedAt: admin.firestore.Timestamp.now(),
        });
        // Log action
        await db.collection('admin_logs').add({
            action: 'conversion_attributed',
            affiliateId,
            referralId: referralRef.id,
            commissionId: commissionRef.id,
            userId,
            eventType,
            amount,
            timestamp: admin.firestore.Timestamp.now(),
        });
        return {
            success: true,
            referralId: referralRef.id,
            commissionId: commissionRef.id,
            commissionAmount,
            status: 'PENDING',
        };
    }
    catch (error) {
        console.error('attributeConversion error:', error);
        throw new functions.https.HttpsError('internal', error.message);
    }
});
