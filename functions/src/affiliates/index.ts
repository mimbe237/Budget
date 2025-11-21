/**
 * @fileoverview Affiliate System Cloud Functions Index
 * Exports all affiliate-related functions
 */

// Management functions
export {
  createAffiliate,
  approveAffiliate,
  blockAffiliate,
  createAffiliateLink,
} from './management';

// Tracking
export { trackClick } from './tracking';

// Attribution
export { attributeConversion } from './attribution';

// Webhooks
export { approveOrVoidOnEvents } from './webhooks';

// Payouts & CRON
export {
  recurringCommissionsCron,
  generatePayoutsCron,
  markPayoutPaid,
} from './payouts';

// Anti-fraud
export { antiFraudScannerCron } from './antifraud';
