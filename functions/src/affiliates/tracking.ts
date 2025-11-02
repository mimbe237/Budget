/**
 * @fileoverview Click Tracking for Affiliate System
 */

import * as functions from 'firebase-functions/v2';
import * as admin from 'firebase-admin';
import { Click } from './types';
import { hashIP, hashUA, isBot, generateDeviceId } from './utils';

const db = admin.firestore();

/**
 * Track affiliate click (HTTPS GET endpoint)
 * Usage: GET /trackClick?aff=CODE&utm_source=...&landing=/page&referer=...
 */
export const trackClick = functions.https.onRequest(async (req, res) => {
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
    const affCode = req.query.aff as string;
    const utmSource = (req.query.utm_source as string) || '';
    const utmMedium = (req.query.utm_medium as string) || '';
    const utmCampaign = (req.query.utm_campaign as string) || '';
    const utmContent = (req.query.utm_content as string) || '';
    const utmTerm = (req.query.utm_term as string) || '';
    const landingPath = (req.query.landing as string) || '/';
    const referer = req.headers.referer || req.headers.referrer || '';
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    let deviceId = (req.query.deviceId as string) || '';

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
    const botDetected = isBot(userAgent);

    // Generate device ID if not provided
    if (!deviceId) {
      deviceId = generateDeviceId();
    }

    // Hash IP and UA for privacy
    const ipHash = hashIP(String(ip));
    const uaHash = hashUA(userAgent);

    // Create click record
    const clickData: Click = {
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
  } catch (error: any) {
    console.error('trackClick error:', error);
    res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});
