"use strict";
/**
 * @fileoverview Cloud Functions for Affiliate Management
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
exports.createAffiliateLink = exports.blockAffiliate = exports.approveAffiliate = exports.createAffiliate = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const utils_1 = require("./utils");
const db = admin.firestore();
/**
 * Create a new affiliate
 */
exports.createAffiliate = functions.https.onCall({ invoker: 'public' }, async (request) => {
    const { auth, data } = request;
    if (!auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = auth.uid;
    const { programTier = 'BASIC' } = data;
    // Check if affiliate already exists
    const existingAffiliate = await db.collection('affiliates').where('userId', '==', userId).get();
    if (!existingAffiliate.empty) {
        throw new functions.https.HttpsError('already-exists', 'User is already an affiliate');
    }
    // Get program rules for the tier
    const rulesDoc = await db.collection('programRules').doc(programTier).get();
    const rules = rulesDoc.data();
    if (!rules) {
        throw new functions.https.HttpsError('not-found', 'Program tier not found');
    }
    const affiliateData = {
        userId,
        status: 'PENDING',
        programTier,
        defaultAttribution: rules.attribution || 'LAST_CLICK',
        cookieDays: rules.cookieDays || 90,
        totals: {
            clicks: 0,
            referrals: 0,
            approvedCommissions: 0,
            pendingCommissions: 0,
            paidOut: 0,
        },
        createdAt: admin.firestore.Timestamp.now(),
        updatedAt: admin.firestore.Timestamp.now(),
    };
    const affiliateRef = await db.collection('affiliates').add(affiliateData);
    // Log action
    await db.collection('admin_logs').add({
        action: 'affiliate_created',
        userId,
        affiliateId: affiliateRef.id,
        timestamp: admin.firestore.Timestamp.now(),
    });
    return { affiliateId: affiliateRef.id, status: 'PENDING' };
});
/**
 * Approve an affiliate (admin only)
 */
exports.approveAffiliate = functions.https.onCall({ invoker: 'public' }, async (request) => {
    const { auth, data } = request;
    if (!auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Check if user is admin
    const userDoc = await db.collection('users').doc(auth.uid).get();
    const userData = userDoc.data();
    const isAdmin = userData?.role === 'admin' || userData?.admin === true;
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }
    const { affiliateId } = data;
    if (!affiliateId) {
        throw new functions.https.HttpsError('invalid-argument', 'affiliateId is required');
    }
    await db.collection('affiliates').doc(affiliateId).update({
        status: 'APPROVED',
        updatedAt: admin.firestore.Timestamp.now(),
    });
    // Log action
    await db.collection('admin_logs').add({
        action: 'affiliate_approved',
        adminId: auth.uid,
        affiliateId,
        timestamp: admin.firestore.Timestamp.now(),
    });
    return { success: true, affiliateId, status: 'APPROVED' };
});
/**
 * Block an affiliate (admin only)
 */
exports.blockAffiliate = functions.https.onCall({ invoker: 'public' }, async (request) => {
    const { auth, data } = request;
    if (!auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Check if user is admin
    const userDoc = await db.collection('users').doc(auth.uid).get();
    const userData = userDoc.data();
    const isAdmin = userData?.role === 'admin' || userData?.admin === true;
    if (!isAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }
    const { affiliateId, reason } = data;
    if (!affiliateId) {
        throw new functions.https.HttpsError('invalid-argument', 'affiliateId is required');
    }
    await db.collection('affiliates').doc(affiliateId).update({
        status: 'BLOCKED',
        updatedAt: admin.firestore.Timestamp.now(),
    });
    // Log action
    await db.collection('admin_logs').add({
        action: 'affiliate_blocked',
        adminId: auth.uid,
        affiliateId,
        reason: reason || 'No reason provided',
        timestamp: admin.firestore.Timestamp.now(),
    });
    return { success: true, affiliateId, status: 'BLOCKED' };
});
/**
 * Create an affiliate link
 */
exports.createAffiliateLink = functions.https.onCall({ invoker: 'public' }, async (request) => {
    const { auth, data } = request;
    if (!auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const userId = auth.uid;
    const { destinationUrl, campaignName } = data;
    if (!destinationUrl) {
        throw new functions.https.HttpsError('invalid-argument', 'destinationUrl is required');
    }
    // Get affiliate record
    const affiliatesQuery = await db.collection('affiliates').where('userId', '==', userId).get();
    if (affiliatesQuery.empty) {
        throw new functions.https.HttpsError('not-found', 'User is not an affiliate');
    }
    const affiliateDoc = affiliatesQuery.docs[0];
    const affiliate = affiliateDoc.data();
    if (affiliate.status !== 'APPROVED') {
        throw new functions.https.HttpsError('permission-denied', 'Affiliate must be approved');
    }
    // Generate unique code
    let code = '';
    let codeExists = true;
    let attempts = 0;
    while (codeExists && attempts < 10) {
        code = (0, utils_1.generateAffiliateCode)(campaignName || 'link');
        const existing = await db.collection('affiliateLinks').where('code', '==', code).get();
        codeExists = !existing.empty;
        attempts++;
    }
    if (codeExists || !code) {
        throw new functions.https.HttpsError('internal', 'Failed to generate unique code');
    }
    const linkData = {
        affiliateId: affiliateDoc.id,
        code: code,
        destinationUrl,
        utmDefaults: {
            source: 'aff',
            medium: 'cpa',
            campaign: campaignName || 'default',
        },
        active: true,
        createdAt: admin.firestore.Timestamp.now(),
    };
    const linkRef = await db.collection('affiliateLinks').add(linkData);
    return {
        linkId: linkRef.id,
        code: code,
        url: `${destinationUrl}?aff=${code}`,
    };
});
