"use strict";
/**
 * @fileoverview Utilities for the Affiliation System
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
exports.generateAffiliateCode = generateAffiliateCode;
exports.hashIP = hashIP;
exports.hashUA = hashUA;
exports.isBot = isBot;
exports.getMonthKey = getMonthKey;
exports.generateDeviceId = generateDeviceId;
exports.calculateCommission = calculateCommission;
exports.maskPayoutDetails = maskPayoutDetails;
exports.isCookieValid = isCookieValid;
const crypto = __importStar(require("crypto"));
/**
 * Generate a unique affiliate link code
 */
function generateAffiliateCode(baseName) {
    const sanitized = baseName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
    const random = crypto.randomBytes(4).toString('hex');
    return `${sanitized}-${random}`;
}
/**
 * Hash IP address for privacy
 */
function hashIP(ip) {
    return crypto.createHash('sha256').update(ip + process.env.HASH_SALT).digest('hex').substring(0, 16);
}
/**
 * Hash User Agent for device tracking
 */
function hashUA(ua) {
    return crypto.createHash('sha256').update(ua + process.env.HASH_SALT).digest('hex').substring(0, 16);
}
/**
 * Detect if User Agent is a bot
 */
function isBot(ua) {
    const botPatterns = [
        /bot/i,
        /crawl/i,
        /spider/i,
        /slurp/i,
        /monitor/i,
        /headless/i,
        /phantom/i,
        /scraper/i,
    ];
    return botPatterns.some(pattern => pattern.test(ua));
}
/**
 * Get month key for recurring commissions (YYYY-MM)
 */
function getMonthKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
}
/**
 * Generate a unique device ID from cookies/localStorage
 */
function generateDeviceId() {
    return crypto.randomBytes(16).toString('hex');
}
/**
 * Calculate commission amount based on schema
 */
function calculateCommission(basisAmount, schema, ratePct, fixedAmount) {
    switch (schema) {
        case 'FIXED':
            return fixedAmount || 0;
        case 'PERCENT':
        case 'RECURRING':
            return basisAmount * (ratePct || 0) / 100;
        case 'TIERED':
        case 'BONUS':
            // Implement tiered logic in attribution function based on volume
            return basisAmount * (ratePct || 0) / 100;
        default:
            return 0;
    }
}
/**
 * Mask sensitive payout details
 */
function maskPayoutDetails(method, details) {
    if (method === 'SEPA' && details.iban) {
        return `***${details.iban.slice(-4)}`;
    }
    if (method === 'PayPal' && details.paypal) {
        const [local, domain] = details.paypal.split('@');
        return `${local.charAt(0)}***@${domain}`;
    }
    if (method === 'MobileMoney' && details.momo) {
        return `***${details.momo.slice(-4)}`;
    }
    return '***';
}
/**
 * Validate cookie expiration (90 days default)
 */
function isCookieValid(clickedAt, cookieDays) {
    const now = new Date();
    const clickDate = clickedAt.toDate();
    const diffDays = (now.getTime() - clickDate.getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= cookieDays;
}
