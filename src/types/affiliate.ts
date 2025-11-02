export type AffiliateTier = 'BASIC' | 'PRO' | 'VIP';
export type AffiliateStatus = 'PENDING' | 'APPROVED' | 'BLOCKED' | 'SUSPENDED';
export type AffiliateAttributionModel = 'FIRST_CLICK' | 'LAST_CLICK';

export type AffiliateKpi = {
  label: string;
  value: number;
  currency?: string;
  trend?: number;
};

export type AffiliateSeriesPoint = {
  date: string;
  clicks: number;
  conversions: number;
  revenue: number;
  conversionRate: number;
};

export type AffiliateSourceBreakdown = {
  source: string;
  clicks: number;
  conversions: number;
  revenue: number;
};

export type AffiliateLink = {
  id: string;
  name: string;
  slug: string;
  url: string;
  createdAt: string;
  active: boolean;
  utm: {
    source: string;
    medium: string;
    campaign?: string;
    content?: string;
  };
  stats: {
    clicks: number;
    conversions: number;
    revenue: number;
    conversionRate: number;
    lastClickAt?: string | null;
  };
};

export type AffiliateReferral = {
  id: string;
  customer: string;
  eventType: 'SIGNUP' | 'PURCHASE' | 'SUBSCRIPTION_START';
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  amount: number;
  currency: string;
  commissionAmount: number;
  createdAt: string;
  linkLabel?: string;
};

export type AffiliatePayout = {
  id: string;
  periodFrom: string;
  periodTo: string;
  amount: number;
  currency: string;
  status: 'DUE' | 'PROCESSING' | 'PAID' | 'FAILED';
  method: 'SEPA' | 'PayPal' | 'MobileMoney';
  reference?: string;
  paidAt?: string | null;
};

export type AffiliateAlert = {
  type: 'info' | 'warning' | 'success';
  message: string;
  action?:
    | {
        label: string;
        href: string;
      }
    | undefined;
};

export type AffiliateAnalytics = {
  affiliate: {
    code: string;
    tier: AffiliateTier;
    status: AffiliateStatus;
    joinedAt: string;
    cookieDays: number;
    attributionModel: AffiliateAttributionModel;
    currency: string;
    totals: {
      clicks: number;
      referrals: number;
      approvedCommissions: number;
      pendingCommissions: number;
      paidOut: number;
    };
  };
  period: {
    from: string;
    to: string;
    label: string;
  };
  kpis: {
    totalClicks: number;
    totalConversions: number;
    conversionRate: number;
    approvedAmount: number;
    pendingAmount: number;
    recurringSubscriptions: number;
    upcomingPayout?: {
      amount: number;
      currency: string;
      expectedOn: string;
      status: 'DUE' | 'PROCESSING' | 'PAID' | 'FAILED';
    };
  };
  series: AffiliateSeriesPoint[];
  sources: AffiliateSourceBreakdown[];
  referrals: AffiliateReferral[];
  payouts: AffiliatePayout[];
  alerts: AffiliateAlert[];
};
