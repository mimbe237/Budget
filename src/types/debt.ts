import type { Timestamp } from "firebase/firestore";

export type DebtType = "EMPRUNT" | "PRET";
export type DebtStatus = "EN_COURS" | "EN_RETARD" | "RESTRUCTUREE" | "SOLDEE";
export type RateType = "FIXE" | "VARIABLE";
export type AmortizationMode = "ANNUITE" | "PRINCIPAL_CONSTANT" | "INTEREST_ONLY" | "BALLOON";
export type DebtFrequency = "MENSUEL" | "HEBDOMADAIRE" | "ANNUEL";

export type Debt = {
  id: string;
  userId: string;
  type: DebtType;
  title: string;
  counterparty: string | null;
  currency: string;
  principalInitial: number;
  annualRate: number;
  rateType: RateType;
  amortizationMode: AmortizationMode;
  totalPeriods: number;
  frequency: DebtFrequency;
  startDate: Timestamp | Date | string;
  gracePeriods: number;
  balloonPct: number;
  upfrontFees: number;
  monthlyInsurance: number;
  prepaymentPenaltyPct: number;
  variableIndexCode: string | null;
  variableMarginBps: number | null;
  recalcEachPeriod: boolean;
  status: DebtStatus;
  remainingPrincipal: number;
  contractFilePath: string | null;
  nextDueDate?: Timestamp | Date | string | null;
  nextDueAmount?: number | null;
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
};

export type DebtScheduleStatus = "A_ECHoir" | "PAYEE" | "PARTIEL" | "EN_RETARD";

export type DebtSchedule = {
  id: string;
  debtId: string;
  periodIndex: number;
  dueDate: Timestamp | Date | string;
  principalDue: number;
  interestDue: number;
  insuranceDue: number;
  feesDue: number;
  totalDue: number;
  totalPaid: number;
  principalPaid: number;
  interestPaid: number;
  feesPaid: number;
  insurancePaid: number;
  remainingPrincipalAfter: number;
  lastPaidAt: Timestamp | Date | string | null;
  status: DebtScheduleStatus;
  createdAt: Timestamp | Date | string;
  updatedAt: Timestamp | Date | string;
};

export type DebtPaymentMethod = "virement" | "especes" | "carte" | "autre";

export type DebtPayment = {
  id: string;
  debtId: string;
  scheduleId: string | null;
  paidAt: Timestamp | Date | string;
  amount: number;
  currency: string;
  fxRate: number | null;
  allocation: {
    principal: number;
    interests: number;
    fees: number;
    insurance: number;
  };
  sourceAccountId: string | null;
  method: DebtPaymentMethod;
  createdAt: Timestamp | Date | string;
};

export type DebtRateHistory = {
  id: string;
  debtId: string;
  effectiveDate: Timestamp | Date | string;
  indexValue: number;
  effectiveAnnualRate: number;
  createdAt: Timestamp | Date | string;
};

export type DebtKpis = {
  remainingPrincipal: number;
  totalInterestsPlanned: number;
  totalInterestsPaid: number;
  nextInstallments: DebtSchedule[];
  hasLateInstallments: boolean;
  debtToIncomeRatio: number | null;
};

export type DebtReportSummary = {
  serviceDebtTotal: number;
  principalPaidTotal: number;
  interestPaidTotal: number;
  remainingPrincipalEnd: number;
  lateCount: number;
  next3Installments: {
    dueDate: string;
    amount: number;
    status: string;
  }[];
  timeSeriesDebtService: {
    date: string;
    principalPaid: number;
    interestPaid: number;
    totalPaid: number;
  }[];
  dti: number | null;
};
