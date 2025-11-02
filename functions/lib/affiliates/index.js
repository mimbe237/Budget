"use strict";
/**
 * @fileoverview Affiliate System Cloud Functions Index
 * Exports all affiliate-related functions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.antiFraudScannerCron = exports.markPayoutPaid = exports.generatePayoutsCron = exports.recurringCommissionsCron = exports.approveOrVoidOnEvents = exports.attributeConversion = exports.trackClick = exports.createAffiliateLink = exports.blockAffiliate = exports.approveAffiliate = exports.createAffiliate = void 0;
// Management functions
var management_1 = require("./management");
Object.defineProperty(exports, "createAffiliate", { enumerable: true, get: function () { return management_1.createAffiliate; } });
Object.defineProperty(exports, "approveAffiliate", { enumerable: true, get: function () { return management_1.approveAffiliate; } });
Object.defineProperty(exports, "blockAffiliate", { enumerable: true, get: function () { return management_1.blockAffiliate; } });
Object.defineProperty(exports, "createAffiliateLink", { enumerable: true, get: function () { return management_1.createAffiliateLink; } });
// Tracking
var tracking_1 = require("./tracking");
Object.defineProperty(exports, "trackClick", { enumerable: true, get: function () { return tracking_1.trackClick; } });
// Attribution
var attribution_1 = require("./attribution");
Object.defineProperty(exports, "attributeConversion", { enumerable: true, get: function () { return attribution_1.attributeConversion; } });
// Webhooks
var webhooks_1 = require("./webhooks");
Object.defineProperty(exports, "approveOrVoidOnEvents", { enumerable: true, get: function () { return webhooks_1.approveOrVoidOnEvents; } });
// Payouts & CRON
var payouts_1 = require("./payouts");
Object.defineProperty(exports, "recurringCommissionsCron", { enumerable: true, get: function () { return payouts_1.recurringCommissionsCron; } });
Object.defineProperty(exports, "generatePayoutsCron", { enumerable: true, get: function () { return payouts_1.generatePayoutsCron; } });
Object.defineProperty(exports, "markPayoutPaid", { enumerable: true, get: function () { return payouts_1.markPayoutPaid; } });
// Anti-fraud
var antifraud_1 = require("./antifraud");
Object.defineProperty(exports, "antiFraudScannerCron", { enumerable: true, get: function () { return antifraud_1.antiFraudScannerCron; } });
