'use server';

import { addDays, subDays } from 'date-fns';
import type { AffiliateProfileSummary } from '@/types/affiliate';

export type GetAffiliateProfileInput = {
  affiliateId?: string | null;
};

export type UpdateAffiliateProfileInput = {
  payoutMethod: AffiliateProfileSummary['payoutMethod'];
  payoutDetails: AffiliateProfileSummary['payoutDetails'];
  promotionChannels: string[];
  notificationEmail: string;
  newsletter: boolean;
};

const MOCK_PROFILE: AffiliateProfileSummary = {
  affiliateCode: 'BGP-ALPHA-92',
  status: 'APPROVED',
  tier: 'PRO',
  email: 'contact@beonweb.cm',
  country: 'CM',
  currency: 'XAF',
  joinedAt: subDays(new Date(), 142).toISOString(),
  payoutMethod: 'SEPA',
  payoutDetails: {
    bankName: 'Société Générale Cameroun',
    iban: 'CM21 3000 0200 0000 0000 0123 456',
    swift: 'SGCMCMCX',
    paypalEmail: null,
    mobileOperator: null,
    mobileNumber: null,
  },
  preferences: {
    notificationEmail: 'affiliates@beonweb.cm',
    newsletter: true,
    promotionChannels: ['LinkedIn', 'Email marketing', 'Blog IA finance'],
  },
  documents: [
    {
      type: 'contract',
      title: 'Contrat Budget Pro Affilié',
      url: '/documents/affiliates/contrat-affiliation.pdf',
      uploadedAt: subDays(new Date(), 140).toISOString(),
    },
    {
      type: 'guidelines',
      title: 'Guide stratégie & contenus 2025',
      url: '/documents/affiliates/guide-campagnes.pdf',
      uploadedAt: subDays(new Date(), 35).toISOString(),
    },
    {
      type: 'invoice',
      title: 'Facture commission Octobre',
      url: '/documents/affiliates/facture-octobre.pdf',
      uploadedAt: addDays(new Date(), -25).toISOString(),
    },
  ],
};

export async function getAffiliateProfile(
  _input: GetAffiliateProfileInput = {},
): Promise<AffiliateProfileSummary> {
  return cloneProfile();
}

export async function updateAffiliateProfile(
  input: UpdateAffiliateProfileInput,
): Promise<AffiliateProfileSummary> {
  Object.assign(MOCK_PROFILE, {
    payoutMethod: input.payoutMethod,
    payoutDetails: {
      ...input.payoutDetails,
    },
    preferences: {
      notificationEmail: input.notificationEmail,
      newsletter: input.newsletter,
      promotionChannels: input.promotionChannels,
    },
  });

  const refreshedGuidelines: AffiliateProfileSummary['documents'][number] = {
    type: 'guidelines',
    title: 'Guide stratégie & contenus 2025',
    url: '/documents/affiliates/guide-campagnes.pdf',
    uploadedAt: subDays(new Date(), 35).toISOString(),
  };

  MOCK_PROFILE.documents = [
    refreshedGuidelines,
    ...MOCK_PROFILE.documents.filter((doc) => doc.type !== 'guidelines'),
  ].slice(0, 3) as AffiliateProfileSummary['documents'];

  return cloneProfile();
}

function cloneProfile(): AffiliateProfileSummary {
  return JSON.parse(JSON.stringify(MOCK_PROFILE));
}
