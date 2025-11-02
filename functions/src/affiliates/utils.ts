/**
 * @fileoverview Utilities for the Affiliation System
 */

import * as crypto from 'crypto';
import { Timestamp } from 'firebase-admin/firestore';

/**
 * Generate a unique affiliate link code
 */
export function generateAffiliateCode(baseName: string): string {
  const sanitized = baseName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
  const random = crypto.randomBytes(4).toString('hex');
  return `${sanitized}-${random}`;
}

/**
 * Hash IP address for privacy
 */
export function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip + process.env.HASH_SALT).digest('hex').substring(0, 16);
}

/**
 * Hash User Agent for device tracking
 */
export function hashUA(ua: string): string {
  return crypto.createHash('sha256').update(ua + process.env.HASH_SALT).digest('hex').substring(0, 16);
}

/**
 * Detect if User Agent is a bot
 */
export function isBot(ua: string): boolean {
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
export function getMonthKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Generate a unique device ID from cookies/localStorage
 */
export function generateDeviceId(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Calculate commission amount based on schema
 */
export function calculateCommission(
  basisAmount: number,
  schema: 'FIXED' | 'PERCENT' | 'RECURRING' | 'TIERED' | 'BONUS',
  ratePct?: number,
  fixedAmount?: number
): number {
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
export function maskPayoutDetails(method: string, details: any): string {
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
export function isCookieValid(clickedAt: Timestamp, cookieDays: number): boolean {
  const now = new Date();
  const clickDate = clickedAt.toDate();
  const diffDays = (now.getTime() - clickDate.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays <= cookieDays;
}
