'use client';

import { initializeFirebase } from '@/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type {
  Debt,
  DebtPayment,
  DebtReportSummary,
  DebtSchedule,
} from '@/types/debt';

const { firebaseApp } = initializeFirebase();
const functionsInstance = getFunctions(firebaseApp);

const callable = <TInput = unknown, TOutput = unknown>(name: string) =>
  httpsCallable<TInput, TOutput>(functionsInstance, name);

export type CreateDebtInput = Omit<
  Debt,
  | 'id'
  | 'userId'
  | 'status'
  | 'remainingPrincipal'
  | 'contractFilePath'
  | 'createdAt'
  | 'updatedAt'
  | 'nextDueDate'
  | 'nextDueAmount'
>;

export type RecordPaymentInput = {
  debtId: string;
  scheduleId?: string | null;
  paidAt: string | Date;
  amount: number;
  currency: string;
  fxRate?: number | null;
  method: DebtPayment['method'];
  sourceAccountId?: string | null;
};

export type PrepaymentInput = {
  debtId: string;
  amount: number;
  date: string | Date;
  mode: 'RE-AMORTIR' | 'RACCOURCIR_DUREE';
};

export type RestructureInput = {
  debtId: string;
  newTerms: CreateDebtInput;
};

export const createDebt = async (payload: CreateDebtInput) => {
  const fn = callable<CreateDebtInput, Debt>('createDebt');
  const { data } = await fn(payload);
  return data;
};

export const buildDebtSchedule = async (debtId: string) => {
  const fn = callable<{ debtId: string }, { totalPeriods: number; nextDueDate: Date | null; nextDueAmount: number | null }>('buildSchedule');
  const { data } = await fn({ debtId });
  return data;
};

export const recordDebtPayment = async (payload: RecordPaymentInput) => {
  const fn = callable<RecordPaymentInput, {
    allocation: { principal: number; interests: number; fees: number; insurance: number };
    remainder: number;
    remainingPrincipal: number;
    status: string;
  }>('recordPayment');
  const transformed = {
    ...payload,
    scheduleId: payload.scheduleId ?? null,
    paidAt: typeof payload.paidAt === 'string' ? payload.paidAt : payload.paidAt.toISOString(),
    fxRate: payload.fxRate ?? null,
    sourceAccountId: payload.sourceAccountId ?? null,
  };
  const { data } = await fn(transformed);
  return data;
};

export const simulateDebtPrepayment = async (payload: PrepaymentInput) => {
  const fn = callable<PrepaymentInput, {
    prepaymentApplied: number;
    penalty: number;
    newDuration: number;
    newInstallment: number;
    interestsSaved: number;
    newPrincipal: number;
  }>('simulatePrepayment');
  const transformed = {
    ...payload,
    date: typeof payload.date === 'string' ? payload.date : payload.date.toISOString(),
  };
  const { data } = await fn(transformed);
  return data;
};

export const applyDebtPrepayment = async (payload: PrepaymentInput) => {
  const fn = callable<PrepaymentInput, {
    prepaymentApplied: number;
    penalty: number;
    newDuration: number;
    newInstallment: number;
    interestsSaved: number;
    remainingPrincipal: number;
    status: string;
  }>('applyPrepayment');
  const transformed = {
    ...payload,
    date: typeof payload.date === 'string' ? payload.date : payload.date.toISOString(),
  };
  const { data } = await fn(transformed);
  return data;
};

export const restructureDebt = async (payload: RestructureInput) => {
  const fn = callable<RestructureInput, { newDebtId: string }>('restructureDebt');
  const { data } = await fn(payload);
  return data;
};

export const uploadDebtContract = async (debtId: string, file: File) => {
  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are allowed');
  }
  const fn = callable<{ debtId: string }, { uploadUrl: string; path: string }>('uploadContractUrl');
  const { data } = await fn({ debtId });

  await fetch(data.uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/pdf' },
    body: file,
  });

  return data.path;
};

export const getDebtSummary = async (debtId: string) => {
  const fn = callable<{ debtId: string }, {
    remainingPrincipal: number;
    totalInterestsPlanned: number;
    totalInterestsPaid: number;
    nextInstallments: Array<Pick<DebtSchedule, 'periodIndex' | 'totalDue' | 'status'> & { dueDate: any }>;
    hasLateInstallments: boolean;
    debtToIncomeRatio: number | null;
    payments: DebtPayment[];
  }>('getDebtSummary');
  const { data } = await fn({ debtId });
  return data;
};

export const getDebtReport = async ({ from, to }: { from: string; to: string }) => {
  const fn = callable<{ from: string; to: string }, DebtReportSummary>('getDebtReport');
  const { data } = await fn({ from, to });
  return data;
};
