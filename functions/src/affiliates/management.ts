/**
 * @fileoverview Cloud Functions for Affiliate Management
 */

import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { Affiliate, AffiliateLink, ProgramRules } from './types';
import { generateAffiliateCode } from './utils';

const db = admin.firestore();

/**
 * Create a new affiliate
 */
export const createAffiliate = functions.https.onCall(
  { invoker: 'public' },
  async (request) => {
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
  const rules = rulesDoc.data() as ProgramRules | undefined;

  if (!rules) {
    throw new functions.https.HttpsError('not-found', 'Program tier not found');
  }

  const affiliateData: Affiliate = {
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
export const approveAffiliate = functions.https.onCall(
  { invoker: 'public' },
  async (request) => {
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
export const blockAffiliate = functions.https.onCall({ invoker: 'public' }, async (request) => {
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
export const createAffiliateLink = functions.https.onCall({ invoker: 'public' }, async (request) => {
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
  const affiliate = affiliateDoc.data() as Affiliate;

  if (affiliate.status !== 'APPROVED') {
    throw new functions.https.HttpsError('permission-denied', 'Affiliate must be approved');
  }

  // Generate unique code
  let code: string = '';
  let codeExists = true;
  let attempts = 0;

  while (codeExists && attempts < 10) {
    code = generateAffiliateCode(campaignName || 'link');
    const existing = await db.collection('affiliateLinks').where('code', '==', code).get();
    codeExists = !existing.empty;
    attempts++;
  }

  if (codeExists || !code) {
    throw new functions.https.HttpsError('internal', 'Failed to generate unique code');
  }

  const linkData: AffiliateLink = {
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
    code: code!,
    url: `${destinationUrl}?aff=${code}`,
  };
});
