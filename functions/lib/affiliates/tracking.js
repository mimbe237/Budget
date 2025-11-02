"use strict";
/**
 * @fileoverview Click Tracking for Affiliate System
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
exports.trackClick = void 0;
const functions = __importStar(require("firebase-functions/v2"));
const admin = __importStar(require("firebase-admin"));
const utils_1 = require("./utils");
const db = admin.firestore();
/**
 * Track affiliate click (HTTPS GET endpoint)
 * Usage: GET /trackClick?aff=CODE&utm_source=...&landing=/page&referer=...
 */
exports.trackClick = functions.https.onRequest({ invoker: 'public' }, async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }
    if (req.method !== 'GET') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }
    try {
        const affCode = req.query.aff;
        const utmSource = req.query.utm_source || '';
        const utmMedium = req.query.utm_medium || '';
        const utmCampaign = req.query.utm_campaign || '';
        const utmContent = req.query.utm_content || '';
        const utmTerm = req.query.utm_term || '';
        const landingPath = req.query.landing || '/';
        const referer = req.headers.referer || req.headers.referrer || '';
        const userAgent = req.headers['user-agent'] || '';
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
        let deviceId = req.query.deviceId || '';
        if (!affCode) {
            res.status(400).json({ error: 'aff parameter is required' });
            return;
        }
        // Find affiliate link by code
        const linksQuery = await db.collection('affiliateLinks')
            .where('code', '==', affCode)
            .where('active', '==', true)
            .limit(1)
            .get();
        if (linksQuery.empty) {
            res.status(404).json({ error: 'Affiliate link not found' });
            return;
        }
        const linkDoc = linksQuery.docs[0];
        const linkData = linkDoc.data();
        const affiliateId = linkData.affiliateId;
        // Bot detection
        const botDetected = (0, utils_1.isBot)(userAgent);
        // Generate device ID if not provided
        if (!deviceId) {
            deviceId = (0, utils_1.generateDeviceId)();
        }
        // Hash IP and UA for privacy
        const ipHash = (0, utils_1.hashIP)(String(ip));
        const uaHash = (0, utils_1.hashUA)(userAgent);
        // Create click record
        const clickData = {
            linkId: linkDoc.id,
            affiliateId,
            ipHash,
            uaHash,
            deviceId,
            utm: {
                source: utmSource,
                medium: utmMedium,
                campaign: utmCampaign,
                content: utmContent,
                term: utmTerm,
            },
            landingPath,
            referer: String(referer),
            isBot: botDetected,
            createdAt: admin.firestore.Timestamp.now(),
        };
        const clickRef = await db.collection('clicks').add(clickData);
        // Update affiliate totals
        await db.collection('affiliates').doc(affiliateId).update({
            'totals.clicks': admin.firestore.FieldValue.increment(1),
            updatedAt: admin.firestore.Timestamp.now(),
        });
        // Return response with click ID and device ID for client-side storage
        res.status(200).json({
            success: true,
            clickId: clickRef.id,
            deviceId,
            affCode,
            cookieDays: 90, // Client should store cookie for 90 days
        });
    }
    catch (error) {
        console.error('trackClick error:', error);
        res.status(500).json({ error: 'Internal server error', message: error.message });
    }
});
