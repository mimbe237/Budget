'use client';

import { initializeFirebase } from '@/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';

const { firebaseApp } = initializeFirebase();
const functionsInstance = getFunctions(firebaseApp);

const callable = <TInput = unknown, TOutput = unknown>(name: string) =>
  httpsCallable<TInput, TOutput>(functionsInstance, name);

export const createAffiliate = async (payload: any) => {
  const fn = callable<any, { affiliateId: string }>('createAffiliate');
  const { data } = await fn(payload);
  return data;
};

export const approveAffiliate = async (payload: { affiliateId: string }) => {
  const fn = callable<typeof payload, { status: string }>('approveAffiliate');
  const { data } = await fn(payload);
  return data;
};

export const blockAffiliate = async (payload: { affiliateId: string; reason?: string }) => {
  const fn = callable<typeof payload, { status: string }>('blockAffiliate');
  const { data } = await fn(payload);
  return data;
};

export const createAffiliateLink = async (payload: any) => {
  const fn = callable<any, { linkId: string }>('createAffiliateLink');
  const { data } = await fn(payload);
  return data;
};

export const markPayoutPaid = async (payload: { payoutId: string; txRef?: string; invoiceUrl?: string }) => {
  const fn = callable<typeof payload, { status: string }>('markPayoutPaid');
  const { data } = await fn(payload);
  return data;
};
