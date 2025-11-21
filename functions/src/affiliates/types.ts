/**
 * @fileoverview TypeScript types for the Affiliation System
 */

import { Timestamp } from 'firebase-admin/firestore';

export type AffiliateStatus = 'PENDING' | 'APPROVED' | 'BLOCKED';
export type ProgramTier = 'BASIC' | 'PRO' | 'VIP';
export type AttributionModel = 'LAST_CLICK' | 'FIRST_CLICK';
export type PayoutMethod = 'SEPA' | 'PayPal' | 'MobileMoney';
export type ReferralStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type EventType = 'SIGNUP' | 'PURCHASE' | 'SUBSCRIPTION_START';
export type CommissionSchema = 'FIXED' | 'PERCENT' | 'RECURRING' | 'TIERED' | 'BONUS';
export type CommissionPeriod = 'ONE_TIME' | 'MONTHLY';
export type CommissionStatus = 'PENDING' | 'APPROVED' | 'VOID' | 'PAID';
export type CommissionReason = 'NORMAL' | 'REFUND' | 'CHARGEBACK' | 'FRAUD';
export type PayoutStatus = 'DUE' | 'PROCESSING' | 'PAID' | 'FAILED';

export interface Affiliate {
  userId: string;
  status: AffiliateStatus;
  programTier: ProgramTier;
  defaultAttribution: AttributionModel;
  cookieDays: number;
  payoutMethod?: PayoutMethod;
  payoutDetails?: {
    iban?: string;
    paypal?: string;
    momo?: string;
  };
  totals: {
    clicks: number;
    referrals: number;
    approvedCommissions: number;
    pendingCommissions: number;
    paidOut: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AffiliateLink {
  affiliateId: string;
  code: string;
  destinationUrl: string;
  utmDefaults: {
    source: string;
    medium: string;
    campaign?: string;
  };
  active: boolean;
  createdAt: Timestamp;
}

export interface Click {
  linkId: string;
  affiliateId: string;
  ipHash: string;
  uaHash: string;
  deviceId: string;
  utm: {
    source?: string;
    medium?: string;
    campaign?: string;
    content?: string;
    term?: string;
  };
  landingPath: string;
  referer: string;
  isBot: boolean;
  createdAt: Timestamp;
}

export interface Referral {
  affiliateId: string;
  linkId: string;
  clickId?: string;
  userId: string;
  sessionId?: string;
  eventType: EventType;
  orderId?: string;
  subscriptionId?: string;
  amountGross: number;
  currency: string;
  attributedAt: Timestamp;
  attributionModel: AttributionModel;
  status: ReferralStatus;
  createdAt: Timestamp;
}

export interface Commission {
  affiliateId: string;
  referralId: string;
  schema: CommissionSchema;
  basisAmount: number;
  ratePct?: number;
  fixedAmount?: number;
  period: CommissionPeriod;
  monthKey: string; // YYYY-MM
  status: CommissionStatus;
  reason: CommissionReason;
  createdAt: Timestamp;
  approvedAt?: Timestamp;
  paidAt?: Timestamp;
}

export interface Payout {
  affiliateId: string;
  periodFrom: Timestamp;
  periodTo: Timestamp;
  amount: number;
  currency: string;
  status: PayoutStatus;
  method: PayoutMethod;
  destinationMasked: string;
  invoiceUrl?: string;
  createdAt: Timestamp;
  paidAt?: Timestamp;
}

export interface ProgramRules {
  tier: ProgramTier;
  defaultRatePct: number;
  fixedBounty: number;
  recurringMonths: number;
  minPayout: number;
  cookieDays: number;
  attribution: AttributionModel;
}
