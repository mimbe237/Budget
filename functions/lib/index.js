"use strict";
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
exports.markPayoutPaid = exports.approveOrVoidOnEvents = exports.attributeConversion = exports.trackClick = exports.createAffiliateLink = exports.blockAffiliate = exports.approveAffiliate = exports.createAffiliate = exports.getDebtSummary = exports.uploadContractUrl = exports.restructureDebt = exports.applyPrepayment = exports.simulatePrepayment = exports.recordPayment = exports.buildSchedule = exports.createDebt = void 0;
// Entry point that re-exports only HTTP functions (no scheduled functions)
// Temporary file to deploy without App Engine/Cloud Scheduler dependencies
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin once at the top level
admin.initializeApp();
// Import individual HTTP functions only
const debts_1 = require("./debts");
Object.defineProperty(exports, "createDebt", { enumerable: true, get: function () { return debts_1.createDebt; } });
Object.defineProperty(exports, "buildSchedule", { enumerable: true, get: function () { return debts_1.buildSchedule; } });
Object.defineProperty(exports, "recordPayment", { enumerable: true, get: function () { return debts_1.recordPayment; } });
Object.defineProperty(exports, "simulatePrepayment", { enumerable: true, get: function () { return debts_1.simulatePrepayment; } });
Object.defineProperty(exports, "applyPrepayment", { enumerable: true, get: function () { return debts_1.applyPrepayment; } });
Object.defineProperty(exports, "restructureDebt", { enumerable: true, get: function () { return debts_1.restructureDebt; } });
Object.defineProperty(exports, "uploadContractUrl", { enumerable: true, get: function () { return debts_1.uploadContractUrl; } });
Object.defineProperty(exports, "getDebtSummary", { enumerable: true, get: function () { return debts_1.getDebtSummary; } });
const affiliates_1 = require("./affiliates");
Object.defineProperty(exports, "createAffiliate", { enumerable: true, get: function () { return affiliates_1.createAffiliate; } });
Object.defineProperty(exports, "approveAffiliate", { enumerable: true, get: function () { return affiliates_1.approveAffiliate; } });
Object.defineProperty(exports, "blockAffiliate", { enumerable: true, get: function () { return affiliates_1.blockAffiliate; } });
Object.defineProperty(exports, "createAffiliateLink", { enumerable: true, get: function () { return affiliates_1.createAffiliateLink; } });
Object.defineProperty(exports, "trackClick", { enumerable: true, get: function () { return affiliates_1.trackClick; } });
Object.defineProperty(exports, "attributeConversion", { enumerable: true, get: function () { return affiliates_1.attributeConversion; } });
Object.defineProperty(exports, "approveOrVoidOnEvents", { enumerable: true, get: function () { return affiliates_1.approveOrVoidOnEvents; } });
Object.defineProperty(exports, "markPayoutPaid", { enumerable: true, get: function () { return affiliates_1.markPayoutPaid; } });
