"use strict";
/**
 * @fileoverview Anti-Fraud Scanner for Affiliate System
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
exports.antiFraudScannerCron = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const db = admin.firestore();
/**
 * Anti-fraud scanner CRON
 * Runs daily to detect suspicious patterns
 */
exports.antiFraudScannerCron = functions.scheduler.onSchedule('every day 04:00', async (event) => {
    console.log('Starting anti-fraud scanner CRON...');
    try {
        const suspiciousAffiliates = [];
        // Rule 1: Self-referral detection
        const referralsQuery = await db.collection('referrals')
            .where('status', '==', 'PENDING')
            .get();
        for (const referralDoc of referralsQuery.docs) {
            const referral = referralDoc.data();
            const affiliateDoc = await db.collection('affiliates').doc(referral.affiliateId).get();
            const affiliate = affiliateDoc.data();
            if (affiliate && affiliate.userId === referral.userId) {
                console.log(`Self-referral detected: ${referral.affiliateId}`);
                suspiciousAffiliates.push(referral.affiliateId);
                // Mark referral as rejected
                await db.collection('referrals').doc(referralDoc.id).update({
                    status: 'REJECTED',
                });
                // Mark related commissions as FRAUD
                const commissionsQuery = await db.collection('commissions')
                    .where('referralId', '==', referralDoc.id)
                    .get();
                for (const commissionDoc of commissionsQuery.docs) {
                    await db.collection('commissions').doc(commissionDoc.id).update({
                        status: 'VOID',
                        reason: 'FRAUD',
                    });
                }
            }
        }
        // Rule 2: Abnormal click-to-conversion ratio
        const affiliatesQuery = await db.collection('affiliates')
            .where('status', '==', 'APPROVED')
            .get();
        for (const affiliateDoc of affiliatesQuery.docs) {
            const affiliate = affiliateDoc.data();
            const affiliateId = affiliateDoc.id;
            if (affiliate.totals.clicks > 10) {
                const conversionRate = affiliate.totals.referrals / affiliate.totals.clicks;
                // Suspicious if conversion rate > 50% (normal is ~2-5%)
                if (conversionRate > 0.5) {
                    console.log(`Abnormal conversion rate (${conversionRate * 100}%) for ${affiliateId}`);
                    suspiciousAffiliates.push(affiliateId);
                }
            }
        }
        // Rule 3: Multiple conversions from same IP in short time
        const clicksQuery = await db.collection('clicks')
            .orderBy('createdAt', 'desc')
            .limit(1000)
            .get();
        const ipMap = new Map();
        for (const clickDoc of clicksQuery.docs) {
            const click = clickDoc.data();
            const key = `${click.ipHash}-${click.affiliateId}`;
            if (!ipMap.has(key)) {
                ipMap.set(key, {
                    affiliateId: click.affiliateId,
                    count: 1,
                    timestamps: [click.createdAt.toDate()],
                });
            }
            else {
                const entry = ipMap.get(key);
                entry.count++;
                entry.timestamps.push(click.createdAt.toDate());
            }
        }
        // Flag if more than 5 clicks from same IP in 1 hour
        for (const [key, value] of ipMap.entries()) {
            if (value.count > 5) {
                const timestamps = value.timestamps.sort((a, b) => a.getTime() - b.getTime());
                const firstClick = timestamps[0];
                const lastClick = timestamps[timestamps.length - 1];
                const timeDiff = (lastClick.getTime() - firstClick.getTime()) / (1000 * 60); // minutes
                if (timeDiff < 60) {
                    console.log(`Multiple clicks from same IP in ${timeDiff} min for ${value.affiliateId}`);
                    suspiciousAffiliates.push(value.affiliateId);
                }
            }
        }
        // Rule 4: Bot traffic detection
        const botClicksQuery = await db.collection('clicks')
            .where('isBot', '==', true)
            .get();
        const botAffiliates = new Map();
        for (const clickDoc of botClicksQuery.docs) {
            const click = clickDoc.data();
            const count = botAffiliates.get(click.affiliateId) || 0;
            botAffiliates.set(click.affiliateId, count + 1);
        }
        // Flag if more than 80% of clicks are bots
        for (const [affiliateId, botCount] of botAffiliates.entries()) {
            const affiliateDoc = await db.collection('affiliates').doc(affiliateId).get();
            const affiliate = affiliateDoc.data();
            if (affiliate && affiliate.totals.clicks > 0) {
                const botRatio = botCount / affiliate.totals.clicks;
                if (botRatio > 0.8) {
                    console.log(`High bot ratio (${botRatio * 100}%) for ${affiliateId}`);
                    suspiciousAffiliates.push(affiliateId);
                }
            }
        }
        // Log suspicious affiliates
        const uniqueSuspicious = [...new Set(suspiciousAffiliates)];
        if (uniqueSuspicious.length > 0) {
            await db.collection('admin_logs').add({
                action: 'fraud_scan_completed',
                suspiciousAffiliates: uniqueSuspicious,
                count: uniqueSuspicious.length,
                timestamp: admin.firestore.Timestamp.now(),
            });
            console.log(`Found ${uniqueSuspicious.length} suspicious affiliates`);
        }
        else {
            console.log('No suspicious activity detected');
        }
    }
    catch (error) {
        console.error('antiFraudScannerCron error:', error);
        throw error;
    }
});
