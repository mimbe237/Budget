'use server';

import { subDays, format } from 'date-fns';
import type { AffiliateLinksOverview, AffiliateLink } from '@/types/affiliate';

export type GetAffiliateLinksInput = {
  affiliateId?: string | null;
};

export type CreateAffiliateLinkInput = {
  name: string;
  url: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign?: string;
  utmContent?: string;
  affiliateCode: string;
};

const MOCK_AFFILIATE_CODE = 'BGP-ALPHA-92';

export async function getAffiliateLinks(
  _input: GetAffiliateLinksInput = {},
): Promise<AffiliateLinksOverview> {
  const today = new Date();
  const baseLinks: AffiliateLink[] = [
    {
      id: 'link_li_1',
      name: 'Campagne LinkedIn Q4',
      slug: 'linkedin-q4',
      url: 'https://budget-pro.com/offres/pme',
      createdAt: subDays(today, 18).toISOString(),
      active: true,
      affiliateCode: MOCK_AFFILIATE_CODE,
      utm: {
        source: 'linkedin',
        medium: 'cpc',
        campaign: 'linkedin-q4',
        content: 'post-carousel',
      },
      stats: {
        clicks: 426,
        conversions: 38,
        revenue: 384000,
        conversionRate: 8.9,
        lastClickAt: subDays(today, 1).toISOString(),
      },
    },
    {
      id: 'link_em_1',
      name: 'Email nurturing TPE',
      slug: 'email-nurturing-tpe',
      url: 'https://budget-pro.com/demo',
      createdAt: subDays(today, 32).toISOString(),
      active: true,
      affiliateCode: MOCK_AFFILIATE_CODE,
      utm: {
        source: 'email',
        medium: 'newsletter',
        campaign: 'automation-tpe',
      },
      stats: {
        clicks: 298,
        conversions: 42,
        revenue: 315000,
        conversionRate: 14.1,
        lastClickAt: subDays(today, 3).toISOString(),
      },
    },
    {
      id: 'link_bl_1',
      name: 'Article blog IA & budget',
      slug: 'blog-ia-budget',
      url: 'https://budget-pro.com/blog/ia-budget',
      createdAt: subDays(today, 56).toISOString(),
      active: false,
      affiliateCode: MOCK_AFFILIATE_CODE,
      utm: {
        source: 'content',
        medium: 'blog',
        campaign: 'blog-ia-finance',
      },
      stats: {
        clicks: 152,
        conversions: 9,
        revenue: 81000,
        conversionRate: 5.9,
        lastClickAt: subDays(today, 12).toISOString(),
      },
    },
  ];

  const totals = baseLinks.reduce(
    (acc, link) => {
      acc.clicks += link.stats.clicks;
      acc.conversions += link.stats.conversions;
      acc.revenue += link.stats.revenue;
      if (link.active) acc.active += 1;
      return acc;
    },
    { active: 0, clicks: 0, conversions: 0, revenue: 0 },
  );

  return {
    affiliateCode: MOCK_AFFILIATE_CODE,
    cookieDays: 90,
    defaultLanding: 'https://budget-pro.com',
    totals,
    links: baseLinks,
  };
}

export async function createAffiliateLink(
  input: CreateAffiliateLinkInput,
): Promise<AffiliateLink> {
  const now = new Date();
  const safeName = input.name.trim() || 'Campagne personnalisée';
  const slug = createSlug(safeName);
  return {
    id: `link_${Math.random().toString(36).slice(2, 10)}`,
    name: safeName,
    slug,
    url: input.url,
    createdAt: now.toISOString(),
    active: true,
    affiliateCode: input.affiliateCode,
    utm: {
      source: input.utmSource,
      medium: input.utmMedium,
      campaign: input.utmCampaign || undefined,
      content: input.utmContent || undefined,
    },
    stats: {
      clicks: 0,
      conversions: 0,
      revenue: 0,
      conversionRate: 0,
      lastClickAt: null,
    },
  };
}

function createSlug(value: string): string {
  const base = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  const suffix = format(new Date(), 'MMdd');
  return base ? `${base}-${suffix}` : `campagne-${suffix}`;
}
