// Entry point that re-exports only HTTP functions (no scheduled functions)
// Temporary file to deploy without App Engine/Cloud Scheduler dependencies
import * as admin from 'firebase-admin';

// Initialize Firebase Admin once at the top level
admin.initializeApp();

// Import individual HTTP functions only
import {
  createDebt,
  buildSchedule,
  recordPayment,
  simulatePrepayment,
  applyPrepayment,
  restructureDebt,
  uploadContractUrl,
  getDebtSummary,
  // markLateAndPenalize, // EXCLUDED: scheduled function
} from './debts';

import {
  // onBudgetExceeded,   // EXCLUDED: Firestore trigger
  // onGoalAchieved,     // EXCLUDED: Firestore trigger
  // onLargeTransaction, // EXCLUDED: Firestore trigger
  // sendWeeklyReport,   // EXCLUDED: scheduled function
} from './notifications';

import {
  createAffiliate,
  approveAffiliate,
  blockAffiliate,
  createAffiliateLink,
  trackClick,
  attributeConversion,
  approveOrVoidOnEvents,
  markPayoutPaid,
  // recurringCommissionsCron, // EXCLUDED: scheduled function
  // generatePayoutsCron,      // EXCLUDED: scheduled function
  // antiFraudScannerCron,     // EXCLUDED: scheduled function
} from './affiliates';

// Re-export only HTTP callable functions
export {
  // Debts
  createDebt,
  buildSchedule,
  recordPayment,
  simulatePrepayment,
  applyPrepayment,
  restructureDebt,
  uploadContractUrl,
  getDebtSummary,
  
  // Affiliates
  createAffiliate,
  approveAffiliate,
  blockAffiliate,
  createAffiliateLink,
  trackClick,
  attributeConversion,
  approveOrVoidOnEvents,
  markPayoutPaid,
};
