# Firestore – Modèle d’affiliation

## Collections principales

### affiliates
- userId: string
- status: PENDING | APPROVED | BLOCKED
- programTier: BASIC | PRO | VIP
- defaultAttribution: LAST_CLICK | FIRST_CLICK
- cookieDays: number
- payoutMethod: SEPA | PayPal | MobileMoney
- payoutDetails: { iban?, paypal?, momo? }
- totals: { clicks, referrals, approvedCommissions, pendingCommissions, paidOut }
- createdAt: timestamp
- updatedAt: timestamp

### affiliateLinks
- affiliateId: string
- code: string (unique)
- destinationUrl: string
- utmDefaults: { source, medium, campaign? }
- active: boolean
- createdAt: timestamp

### clicks
- linkId: string
- affiliateId: string
- ipHash: string
- uaHash: string
- deviceId: string
- utm: { source, medium, campaign, content, term }
- landingPath: string
- referer: string
- isBot: boolean
- createdAt: timestamp

### referrals
- affiliateId: string
- linkId: string
- clickId?: string
- userId: string
- sessionId?: string
- eventType: SIGNUP | PURCHASE | SUBSCRIPTION_START
- orderId?: string
- subscriptionId?: string
- amountGross: number
- currency: string
- attributedAt: timestamp
- attributionModel: string
- status: PENDING | APPROVED | REJECTED
- createdAt: timestamp

### commissions
- affiliateId: string
- referralId: string
- schema: FIXED | PERCENT | RECURRING | TIERED | BONUS
- basisAmount: number
- ratePct?: number
- fixedAmount?: number
- period: ONE_TIME | MONTHLY
- monthKey: string (YYYY-MM)
- status: PENDING | APPROVED | VOID | PAID
- reason: NORMAL | REFUND | CHARGEBACK | FRAUD
- createdAt: timestamp
- approvedAt?: timestamp
- paidAt?: timestamp

### payouts
- affiliateId: string
- periodFrom: timestamp
- periodTo: timestamp
- amount: number
- currency: string
- status: DUE | PROCESSING | PAID | FAILED
- method: string
- destinationMasked: string
- invoiceUrl?: string
- createdAt: timestamp
- paidAt?: timestamp

### programRules
- tier: BASIC | PRO | VIP
- defaultRatePct: number
- fixedBounty: number
- recurringMonths: number
- minPayout: number
- cookieDays: number
- attribution: FIRST_TOUCH | LAST_TOUCH

## Index Firestore
- clicks: (affiliateId, createdAt desc), (linkId, createdAt desc)
- referrals: (affiliateId, createdAt desc), (userId, createdAt desc), (status)
- commissions: (affiliateId, status, monthKey), (referralId)
- payouts: (affiliateId, status, periodTo desc)
- affiliateLinks: (affiliateId, active)
- affiliates: (status, createdAt desc)

---
Ce fichier sert de référence pour la structure Firestore et les index à créer dans firestore.indexes.json.