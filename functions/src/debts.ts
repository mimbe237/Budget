import * as functions from "firebase-functions";
import { HttpsError } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import { z } from "zod";
import {
  buildSchedule as computeSchedule,
  allocatePayment,
  FREQUENCY_CONFIG,
  BuildScheduleInput,
} from "./lib/amortization";
import { addDays } from "date-fns";

const db = admin.firestore();
const storage = admin.storage();
const logger = functions.logger;

const GRACE_DAYS = 5;
const LATE_FEE_FLAT = 0;
const MAX_CONTRACT_BYTES = 10 * 1024 * 1024;
const CONTRACT_CONTENT_TYPE = "application/pdf";
const EPSILON = 0.01;

export type DebtStatus =
  | "EN_COURS"
  | "EN_RETARD"
  | "RESTRUCTUREE"
  | "SOLDEE";
export type DebtScheduleStatus =
  | "A_ECHoir"
  | "PAYEE"
  | "PARTIEL"
  | "EN_RETARD";
export type DebtType = "EMPRUNT" | "PRET";
export type RateType = "FIXE" | "VARIABLE";
export type AmortizationMode =
  | "ANNUITE"
  | "PRINCIPAL_CONSTANT"
  | "INTEREST_ONLY"
  | "BALLOON";
export type DebtFrequency = "MENSUEL" | "HEBDOMADAIRE" | "ANNUEL";
export type DebtPaymentMethod =
  | "virement"
  | "especes"
  | "carte"
  | "autre";

interface DebtDoc {
  userId: string;
  type: DebtType;
  title: string;
  counterparty?: string | null;
  currency: string;
  principalInitial: number;
  annualRate: number;
  rateType: RateType;
  amortizationMode: AmortizationMode;
  totalPeriods: number;
  frequency: DebtFrequency;
  startDate: admin.firestore.Timestamp | Date | string;
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
  nextDueDate?: admin.firestore.Timestamp | null;
  nextDueAmount?: number | null;
  contractFilePath: string | null;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

interface DebtScheduleDoc {
  debtId: string;
  periodIndex: number;
  dueDate: admin.firestore.Timestamp;
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
  lastPaidAt: admin.firestore.Timestamp | null;
  status: DebtScheduleStatus;
  createdAt: admin.firestore.Timestamp;
  updatedAt: admin.firestore.Timestamp;
}

interface DebtPaymentDoc {
  debtId: string;
  scheduleId: string | null;
  paidAt: admin.firestore.Timestamp;
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
  createdAt: admin.firestore.Timestamp;
}

interface DebtRateHistoryDoc {
  debtId: string;
  effectiveDate: admin.firestore.Timestamp;
  indexValue: number;
  effectiveAnnualRate: number;
  createdAt: admin.firestore.Timestamp;
}

const roundMoney = (value: number, precision = 2) => {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
};

const toDate = (
  value: admin.firestore.Timestamp | Date | string | null | undefined
): Date => {
  if (!value) {
    return new Date();
  }
  if (value instanceof admin.firestore.Timestamp) {
    return value.toDate();
  }
  if (value instanceof Date) {
    return value;
  }
  return new Date(value);
};

const toTimestamp = (value: Date): admin.firestore.Timestamp =>
  admin.firestore.Timestamp.fromDate(value);

const ensureAuth = (context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new HttpsError("unauthenticated", "Authentication required.");
  }
  return context.auth.uid;
};

const assertDebtOwner = async (uid: string, debtId: string) => {
  const ref = db.collection("debts").doc(debtId);
  const snapshot = await ref.get();
  if (!snapshot.exists) {
    throw new HttpsError("not-found", "Dette introuvable.");
  }
  const data = snapshot.data() as DebtDoc;
  if (data.userId !== uid) {
    throw new HttpsError("permission-denied", "Accès refusé à cette dette.");
  }
  return { ref, data, snapshot };
};

const fetchRateHistory = async (debtId: string) => {
  const snapshot = await db
    .collection("debtRateHistory")
    .where("debtId", "==", debtId)
    .orderBy("effectiveDate", "asc")
    .get();
  return snapshot.docs.map((doc) => {
    const data = doc.data() as DebtRateHistoryDoc;
    return {
      effectiveDate: toDate(data.effectiveDate),
      effectiveAnnualRate: data.effectiveAnnualRate,
    };
  });
};

const loadSchedules = (debtId: string) =>
  db
    .collection("debtSchedules")
    .where("debtId", "==", debtId)
    .orderBy("periodIndex", "asc")
    .get();

const determineDebtStatus = (
  remainingPrincipal: number,
  schedules: Array<DebtScheduleDoc>
): DebtStatus => {
  if (remainingPrincipal <= EPSILON) {
    const hasOpen = schedules.some((line) => line.status !== "PAYEE");
    return hasOpen ? "EN_COURS" : "SOLDEE";
  }
  const hasLate = schedules.some((line) => line.status === "EN_RETARD");
  return hasLate ? "EN_RETARD" : "EN_COURS";
};

const computeNextInstallment = (schedules: Array<DebtScheduleDoc>) => {
  const upcoming = schedules
    .filter((line) => line.status !== "PAYEE")
    .sort(
      (a, b) => toDate(a.dueDate).getTime() - toDate(b.dueDate).getTime()
    );
  if (!upcoming.length) {
    return { nextDueDate: null, nextDueAmount: null };
  }
  const target = upcoming[0];
  return {
    nextDueDate: target.dueDate,
    nextDueAmount: roundMoney(target.totalDue - target.totalPaid),
  };
};

const debtSchema = z.object({
  type: z.enum(["EMPRUNT", "PRET"]),
  title: z.string().min(1),
  counterparty: z.string().min(1).nullable().optional(),
  currency: z.string().length(3),
  principalInitial: z.number().positive(),
  annualRate: z.number().min(0),
  rateType: z.enum(["FIXE", "VARIABLE"]),
  amortizationMode: z.enum([
    "ANNUITE",
    "PRINCIPAL_CONSTANT",
    "INTEREST_ONLY",
    "BALLOON",
  ]),
  totalPeriods: z.number().int().positive(),
  frequency: z.enum(["MENSUEL", "HEBDOMADAIRE", "ANNUEL"]),
  startDate: z.coerce.date(),
  gracePeriods: z.number().int().nonnegative(),
  balloonPct: z.number().min(0).max(1).default(0),
  upfrontFees: z.number().min(0).default(0),
  monthlyInsurance: z.number().min(0).default(0),
  prepaymentPenaltyPct: z.number().min(0).max(1).default(0),
  variableIndexCode: z.string().nullable().optional(),
  variableMarginBps: z.number().nullable().optional(),
  recalcEachPeriod: z.boolean().default(false),
});

const paymentSchema = z.object({
  debtId: z.string().min(1),
  scheduleId: z.string().min(1).nullable().optional(),
  paidAt: z.coerce.date(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  fxRate: z.number().nullable().optional(),
  method: z.enum(["virement", "especes", "carte", "autre"]),
  sourceAccountId: z.string().nullable().optional(),
});

const prepaymentSchema = z.object({
  debtId: z.string().min(1),
  amount: z.number().positive(),
  date: z.coerce.date(),
  mode: z.enum(["RE-AMORTIR", "RACCOURCIR_DUREE"]),
});

const restructureSchema = z.object({
  debtId: z.string().min(1),
  newTerms: debtSchema.extend({
    startDate: z.coerce.date(),
  }),
});

const debtSummarySchema = z.object({
  debtId: z.string().min(1),
});

type PrepaymentInput = z.infer<typeof prepaymentSchema>;

const simulatePrepaymentInternal = async (
  uid: string,
  payload: PrepaymentInput
) => {
  const { data: debt } = await assertDebtOwner(uid, payload.debtId);
  if (debt.remainingPrincipal <= EPSILON) {
    throw new HttpsError("failed-precondition", "Dette déjà soldée.");
  }

  const schedulesSnapshot = await loadSchedules(payload.debtId);
  const schedules = schedulesSnapshot.docs
    .map((doc) => doc.data() as DebtScheduleDoc)
    .filter((line) => line.status !== "PAYEE");

  const amountApplicable = Math.min(
    payload.amount,
    roundMoney(debt.remainingPrincipal)
  );

  const newPrincipal = Math.max(
    0,
    roundMoney(debt.remainingPrincipal - amountApplicable)
  );

  const penalty = roundMoney(
    debt.remainingPrincipal * (debt.prepaymentPenaltyPct ?? 0)
  );

  if (schedules.length === 0) {
    return {
      prepaymentApplied: amountApplicable,
      penalty,
      newDuration: 0,
      newInstallment: 0,
      interestsSaved: 0,
      newPrincipal,
    };
  }

  const buildInput = await buildInputForDebt(payload.debtId, debt, {
    principal: newPrincipal,
    totalPeriods: schedules.length,
    gracePeriods: 0,
    upfrontFees: 0,
    startDate: toDate(schedules[0].dueDate),
  });

  const newSchedule = computeSchedule(buildInput);
  const interestsRemaining = schedules.reduce(
    (acc, line) => acc + Math.max(0, line.interestDue - line.interestPaid),
    0
  );
  const newInterests = newSchedule.reduce(
    (acc, line) => acc + line.interestDue,
    0
  );

  const trimmedSchedule =
    payload.mode === "RACCOURCIR_DUREE"
      ? newSchedule.filter((line, idx, arr) => {
          const isLast = idx === arr.length - 1;
          return (
            line.principalDue > EPSILON ||
            line.interestDue > EPSILON ||
            line.insuranceDue > EPSILON ||
            isLast
          );
        })
      : newSchedule;

  const newDuration = trimmedSchedule.length;
  const newInstallment =
    payload.mode === "RE-AMORTIR"
      ? roundMoney(trimmedSchedule[0]?.totalDue ?? 0)
      : roundMoney(schedules[0].totalDue);

  return {
    prepaymentApplied: amountApplicable,
    penalty,
    newDuration,
    newInstallment,
    interestsSaved: roundMoney(interestsRemaining - newInterests),
    newPrincipal,
  };
};

const buildInputForDebt = async (
  debtId: string,
  debt: DebtDoc,
  overrides?: Partial<BuildScheduleInput>
): Promise<BuildScheduleInput> => {
  const variableRates =
    debt.rateType === "VARIABLE" ? await fetchRateHistory(debtId) : undefined;
  return {
    principal:
      overrides?.principal ?? debt.remainingPrincipal ?? debt.principalInitial,
    annualRate: overrides?.annualRate ?? debt.annualRate,
    rateType: overrides?.rateType ?? debt.rateType,
    amortizationMode: overrides?.amortizationMode ?? debt.amortizationMode,
    totalPeriods: overrides?.totalPeriods ?? debt.totalPeriods,
    gracePeriods: overrides?.gracePeriods ?? debt.gracePeriods,
    balloonPct:
      overrides?.balloonPct ??
      (debt.amortizationMode === "BALLOON" ? debt.balloonPct : 0),
    monthlyInsurance:
      overrides?.monthlyInsurance ?? debt.monthlyInsurance ?? 0,
    upfrontFees: overrides?.upfrontFees ?? debt.upfrontFees ?? 0,
    frequency: overrides?.frequency ?? debt.frequency,
    startDate: overrides?.startDate ?? toDate(debt.startDate),
    variableRates: overrides?.variableRates ?? variableRates,
    recalcEachPeriod:
      overrides?.recalcEachPeriod ?? (debt.recalcEachPeriod ?? false),
  };
};

const writeSchedule = async (
  debtId: string,
  scheduleLines: ReturnType<typeof computeSchedule>,
  startPeriodIndex = 1
) => {
  const collection = db.collection("debtSchedules");
  const batch = db.batch();

  scheduleLines.forEach((line, idx) => {
    const docRef = collection.doc();
    batch.set(docRef, {
      debtId,
      periodIndex: startPeriodIndex + idx,
      dueDate: toTimestamp(line.dueDate),
      principalDue: roundMoney(line.principalDue),
      interestDue: roundMoney(line.interestDue),
      insuranceDue: roundMoney(line.insuranceDue),
      feesDue: roundMoney(line.feesDue),
      totalDue: roundMoney(line.totalDue),
      totalPaid: 0,
      principalPaid: 0,
      interestPaid: 0,
      feesPaid: 0,
      insurancePaid: 0,
      remainingPrincipalAfter: roundMoney(line.remainingPrincipalAfter),
      lastPaidAt: null,
      status: "A_ECHoir",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
};

const clearSchedules = async (debtId: string) => {
  const snapshot = await loadSchedules(debtId);
  if (snapshot.empty) return;
  const batchSize = 400;
  let batch = db.batch();
  let count = 0;
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
    count += 1;
    if (count === batchSize) {
      batch.commit();
      batch = db.batch();
      count = 0;
    }
  });
  if (count > 0) {
    await batch.commit();
  }
};

const rebuildRemainingSchedule = async (
  debtId: string,
  debt: DebtDoc,
  schedulesSnapshot: FirebaseFirestore.QuerySnapshot,
  touchedDocIds: Set<string>,
  newPrincipal: number,
  mode: "RE-AMORTIR" | "RACCOURCIR_DUREE"
) => {
  const untouched = schedulesSnapshot.docs.filter((doc) => {
    if (touchedDocIds.has(doc.id)) return false;
    const data = doc.data() as DebtScheduleDoc;
    return data.status !== "PAYEE";
  });

  if (untouched.length === 0 || newPrincipal <= EPSILON) {
    if (untouched.length) {
      const batch = db.batch();
      untouched.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
    return;
  }

  const first = untouched[0].data() as DebtScheduleDoc;
  const startPeriodIndex = first.periodIndex;
  const startDate = toDate(first.dueDate);

  const buildInput = await buildInputForDebt(debtId, debt, {
    principal: roundMoney(newPrincipal),
    totalPeriods: untouched.length,
    gracePeriods: 0,
    upfrontFees: 0,
    startDate,
  });

  let newLines = computeSchedule(buildInput);

  if (mode === "RACCOURCIR_DUREE") {
    newLines = newLines.filter((line, idx, arr) => {
      const isLast = idx === arr.length - 1;
      return (
        line.principalDue > EPSILON ||
        line.interestDue > EPSILON ||
        line.insuranceDue > EPSILON ||
        isLast
      );
    });
  }

  const batch = db.batch();
  untouched.forEach((doc) => batch.delete(doc.ref));
  newLines.forEach((line, idx) => {
    const docRef = db.collection("debtSchedules").doc();
    batch.set(docRef, {
      debtId,
      periodIndex: startPeriodIndex + idx,
      dueDate: toTimestamp(line.dueDate),
      principalDue: roundMoney(line.principalDue),
      interestDue: roundMoney(line.interestDue),
      insuranceDue: roundMoney(line.insuranceDue),
      feesDue: 0,
      totalDue: roundMoney(line.totalDue),
      totalPaid: 0,
      principalPaid: 0,
      interestPaid: 0,
      feesPaid: 0,
      insurancePaid: 0,
      remainingPrincipalAfter: roundMoney(line.remainingPrincipalAfter),
      lastPaidAt: null,
      status: "A_ECHoir",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });
  await batch.commit();
};

export const createDebt = functions.https.onCall(async (data, context) => {
  const uid = ensureAuth(context);
  const payload = debtSchema.parse(data);

  const docRef = db.collection("debts").doc();
  const now = admin.firestore.FieldValue.serverTimestamp();

  await docRef.set({
    ...payload,
    userId: uid,
    counterparty: payload.counterparty ?? null,
    startDate: toTimestamp(payload.startDate),
    contractFilePath: null,
    status: "EN_COURS",
    remainingPrincipal: roundMoney(payload.principalInitial),
    nextDueDate: null,
    nextDueAmount: null,
    createdAt: now,
    updatedAt: now,
  });

  const snapshot = await docRef.get();
  return { id: docRef.id, ...snapshot.data() };
});

/**
 * Mirror root debts into per-user subcollection for client-side scoped queries.
 * This keeps /users/{uid}/debts in sync with /debts while authoritative writes
 * continue to target the root collection from callable functions.
 */
export const onDebtWrite = functions.firestore
  .document('debts/{debtId}')
  .onWrite(async (change, context) => {
    const debtId = context.params.debtId as string;
    const before = change.before.exists ? change.before.data() : null as any;
    const after = change.after.exists ? change.after.data() : null as any;

    // Determine userId from after or before
    const userId = (after && after.userId) || (before && before.userId);
    if (!userId) {
      console.warn('[onDebtWrite] Missing userId for debt', debtId);
      return;
    }

    const mirrorRef = db.doc(`users/${userId}/debts/${debtId}`);

    if (!after) {
      // Delete mirror when root deleted
      await mirrorRef.delete().catch(() => undefined);
      return;
    }

    // Copy allowed fields as-is (root is source of truth)
    await mirrorRef.set({ ...after }, { merge: true });
  });

export const buildSchedule = functions.https.onCall(async (data, context) => {
  const uid = ensureAuth(context);
  const { debtId } = z.object({ debtId: z.string().min(1) }).parse(data);

  const { ref, data: debt } = await assertDebtOwner(uid, debtId);
  await clearSchedules(debtId);

  const buildInput = await buildInputForDebt(debtId, debt);
  const scheduleLines = computeSchedule(buildInput);

  await writeSchedule(debtId, scheduleLines);

  const { nextDueDate, nextDueAmount } = computeNextInstallment(
    scheduleLines.map((line) => ({
      debtId,
      periodIndex: line.periodIndex,
      dueDate: toTimestamp(line.dueDate),
      principalDue: line.principalDue,
      interestDue: line.interestDue,
      insuranceDue: line.insuranceDue,
      feesDue: line.feesDue,
      totalDue: line.totalDue,
      totalPaid: 0,
      principalPaid: 0,
      interestPaid: 0,
      feesPaid: 0,
      insurancePaid: 0,
      remainingPrincipalAfter: line.remainingPrincipalAfter,
      lastPaidAt: null,
      status: "A_ECHoir",
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
    }))
  );

  await ref.update({
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    nextDueDate,
    nextDueAmount,
  });

  return {
    totalPeriods: scheduleLines.length,
    nextDueDate: nextDueDate ? nextDueDate.toDate() : null,
    nextDueAmount,
  };
});

export const recordPayment = functions.https.onCall(async (data, context) => {
  const uid = ensureAuth(context);
  const payload = paymentSchema.parse(data);

  const { ref, data: debt } = await assertDebtOwner(uid, payload.debtId);
  const schedulesSnapshot = await loadSchedules(payload.debtId);
  if (schedulesSnapshot.empty) {
    throw new HttpsError(
      "failed-precondition",
      "Aucun échéancier généré pour cette dette."
    );
  }

  const scheduleDocs = schedulesSnapshot.docs;
  const amountInitial = roundMoney(payload.amount);
  let amountRemaining = amountInitial;
  const touchedDocIds = new Set<string>();
  let totalPrincipalAllocation = 0;
  let totalInterestAllocation = 0;
  let totalFeesAllocation = 0;
  let totalInsuranceAllocation = 0;

  const updates = new Map<string, DebtScheduleDoc>();

  const targetDocs = payload.scheduleId
    ? scheduleDocs.filter((doc) => doc.id === payload.scheduleId)
    : scheduleDocs;

  if (payload.scheduleId && targetDocs.length === 0) {
    throw new HttpsError("not-found", "Échéance introuvable.");
  }

  for (const doc of targetDocs) {
    if (amountRemaining <= EPSILON) break;
    const dataDoc = doc.data() as DebtScheduleDoc;

    const outstanding = {
      feesOutstanding: roundMoney(dataDoc.feesDue - dataDoc.feesPaid),
      interestOutstanding: roundMoney(
        dataDoc.interestDue - dataDoc.interestPaid
      ),
      insuranceOutstanding: roundMoney(
        dataDoc.insuranceDue - dataDoc.insurancePaid
      ),
      principalOutstanding: roundMoney(
        dataDoc.principalDue - dataDoc.principalPaid
      ),
    };

    if (
      outstanding.feesOutstanding <= EPSILON &&
      outstanding.interestOutstanding <= EPSILON &&
      outstanding.insuranceOutstanding <= EPSILON &&
      outstanding.principalOutstanding <= EPSILON
    ) {
      continue;
    }

    const { allocation, remainder } = allocatePayment(
      amountRemaining,
      {
        feesDue: dataDoc.feesDue,
        interestDue: dataDoc.interestDue,
        insuranceDue: dataDoc.insuranceDue,
        principalDue: dataDoc.principalDue,
      },
      {
        feesPaid: dataDoc.feesPaid,
        interestPaid: dataDoc.interestPaid,
        insurancePaid: dataDoc.insurancePaid,
        principalPaid: dataDoc.principalPaid,
      }
    );

    const appliedAmount = roundMoney(
      allocation.fees +
        allocation.interests +
        allocation.insurance +
        allocation.principal
    );

    if (appliedAmount <= EPSILON) {
      continue;
    }

    amountRemaining = remainder;
    touchedDocIds.add(doc.id);

    const updatedData: DebtScheduleDoc = {
      ...dataDoc,
      feesPaid: roundMoney(dataDoc.feesPaid + allocation.fees),
      interestPaid: roundMoney(dataDoc.interestPaid + allocation.interests),
      insurancePaid: roundMoney(
        (dataDoc.insurancePaid ?? 0) + allocation.insurance
      ),
      principalPaid: roundMoney(
        dataDoc.principalPaid + allocation.principal
      ),
      totalPaid: roundMoney(dataDoc.totalPaid + appliedAmount),
      lastPaidAt: toTimestamp(payload.paidAt),
      status: "A_ECHoir",
      updatedAt: dataDoc.updatedAt,
    };

    if (roundMoney(dataDoc.totalDue - updatedData.totalPaid) <= EPSILON) {
      updatedData.status = "PAYEE";
    } else {
      updatedData.status = "PARTIEL";
    }

    totalPrincipalAllocation = roundMoney(
      totalPrincipalAllocation + allocation.principal
    );
    totalInterestAllocation = roundMoney(
      totalInterestAllocation + allocation.interests
    );
    totalFeesAllocation = roundMoney(totalFeesAllocation + allocation.fees);
    totalInsuranceAllocation = roundMoney(
      totalInsuranceAllocation + allocation.insurance
    );

    updates.set(doc.id, updatedData);
  }

  if (totalPrincipalAllocation <= EPSILON && amountRemaining >= amountInitial) {
    throw new HttpsError("failed-precondition", "Aucune échéance ouverte.");
  }

  const batch = db.batch();
  for (const doc of scheduleDocs) {
    const update = updates.get(doc.id);
    if (!update) continue;
    batch.update(doc.ref, {
      feesPaid: update.feesPaid,
      interestPaid: update.interestPaid,
      insurancePaid: update.insurancePaid,
      principalPaid: update.principalPaid,
      totalPaid: update.totalPaid,
      status: update.status,
      lastPaidAt: update.lastPaidAt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  const paymentDoc = db.collection("debtPayments").doc();
  batch.set(paymentDoc, {
    debtId: payload.debtId,
    scheduleId: payload.scheduleId ?? null,
    paidAt: toTimestamp(payload.paidAt),
    amount: amountInitial,
    currency: payload.currency,
    fxRate: payload.fxRate ?? null,
    allocation: {
      principal: roundMoney(totalPrincipalAllocation),
      interests: roundMoney(totalInterestAllocation),
      fees: roundMoney(totalFeesAllocation),
      insurance: roundMoney(totalInsuranceAllocation),
    },
    sourceAccountId: payload.sourceAccountId ?? null,
    method: payload.method,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  const remainingPrincipalAfterPayment = Math.max(
    0,
    roundMoney(debt.remainingPrincipal - totalPrincipalAllocation - amountRemaining)
  );

  if (amountRemaining > EPSILON) {
    await rebuildRemainingSchedule(
      payload.debtId,
      { ...debt, remainingPrincipal: remainingPrincipalAfterPayment },
      schedulesSnapshot,
      touchedDocIds,
      remainingPrincipalAfterPayment,
      "RACCOURCIR_DUREE"
    );
  }

  const refreshedSnapshot = await loadSchedules(payload.debtId);
  const allSchedules = refreshedSnapshot.docs.map(
    (doc) => doc.data() as DebtScheduleDoc
  );
  const { nextDueDate, nextDueAmount } = computeNextInstallment(allSchedules);
  const status = determineDebtStatus(
    remainingPrincipalAfterPayment,
    allSchedules
  );

  await ref.update({
    remainingPrincipal: remainingPrincipalAfterPayment,
    nextDueDate,
    nextDueAmount,
    status,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return {
    allocation: {
      principal: roundMoney(totalPrincipalAllocation),
      interests: roundMoney(totalInterestAllocation),
      fees: roundMoney(totalFeesAllocation),
      insurance: roundMoney(totalInsuranceAllocation),
    },
    remainder: roundMoney(amountRemaining),
    remainingPrincipal: remainingPrincipalAfterPayment,
    status,
  };
});

export const simulatePrepayment = functions.https.onCall(
  async (data, context) => {
    const uid = ensureAuth(context);
    const payload = prepaymentSchema.parse(data);
    return simulatePrepaymentInternal(uid, payload);
  }
);

export const applyPrepayment = functions.https.onCall(
  async (data, context) => {
    const uid = ensureAuth(context);
    const payload = prepaymentSchema.parse(data);

    const { ref, data: debt } = await assertDebtOwner(uid, payload.debtId);
    const simulation = await simulatePrepaymentInternal(uid, payload);
    const schedulesSnapshot = await loadSchedules(payload.debtId);
    const amountApplied = simulation.prepaymentApplied;
    const penalty = simulation.penalty;
    const newPrincipal = Math.max(0, simulation.newPrincipal);

    if (amountApplied <= EPSILON) {
      throw new HttpsError(
        "failed-precondition",
        "Montant de remboursement anticipé insuffisant."
      );
    }

    const paymentDoc = db.collection("debtPayments").doc();
    await paymentDoc.set({
      debtId: payload.debtId,
      scheduleId: null,
      paidAt: toTimestamp(payload.date),
      amount: roundMoney(amountApplied + penalty),
      currency: debt.currency,
      fxRate: null,
      allocation: {
        principal: roundMoney(amountApplied),
        interests: 0,
        fees: roundMoney(penalty),
        insurance: 0,
      },
      sourceAccountId: null,
      method: "virement",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await rebuildRemainingSchedule(
      payload.debtId,
      { ...debt, remainingPrincipal: newPrincipal },
      schedulesSnapshot,
      new Set<string>(),
      newPrincipal,
      payload.mode
    );

    const refreshedSnapshot = await loadSchedules(payload.debtId);
    const schedules = refreshedSnapshot.docs.map(
      (doc) => doc.data() as DebtScheduleDoc
    );
    const { nextDueDate, nextDueAmount } = computeNextInstallment(schedules);
    const status = determineDebtStatus(newPrincipal, schedules);

    await ref.update({
      remainingPrincipal: newPrincipal,
      nextDueDate,
      nextDueAmount,
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      ...simulation,
      remainingPrincipal: newPrincipal,
      status,
    };
  }
);

export const markLateAndPenalize = functions.pubsub
  .schedule("every day 03:00")
  .onRun(async () => {
    const threshold = addDays(new Date(), -GRACE_DAYS);
    const snapshot = await db
      .collection("debtSchedules")
      .where("status", "==", "A_ECHoir")
      .where("dueDate", "<", toTimestamp(threshold))
      .get();

    if (snapshot.empty) {
      return null;
    }

    const batch = db.batch();
    snapshot.forEach((doc) => {
      const data = doc.data() as DebtScheduleDoc;
      batch.update(doc.ref, {
        status: "EN_RETARD",
        feesDue: roundMoney(data.feesDue + LATE_FEE_FLAT),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();
    logger.info(`Marked ${snapshot.size} debt schedules as late.`);
    return null;
  });

export const restructureDebt = functions.https.onCall(
  async (data, context) => {
    const uid = ensureAuth(context);
    const payload = restructureSchema.parse(data);
    const { ref, data: debt } = await assertDebtOwner(uid, payload.debtId);

    const schedulesSnapshot = await loadSchedules(payload.debtId);
    const remainingPrincipal = schedulesSnapshot.docs.reduce((acc, doc) => {
      const line = doc.data() as DebtScheduleDoc;
      const outstanding = Math.max(0, line.principalDue - line.principalPaid);
      return roundMoney(acc + outstanding);
    }, 0);

    const batch = db.batch();
    batch.update(ref, {
      status: "RESTRUCTUREE",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const newDebtRef = db.collection("debts").doc();
    batch.set(newDebtRef, {
      ...payload.newTerms,
      userId: uid,
      counterparty: payload.newTerms.counterparty ?? null,
      principalInitial: roundMoney(remainingPrincipal),
      remainingPrincipal: roundMoney(remainingPrincipal),
      startDate: toTimestamp(payload.newTerms.startDate),
      contractFilePath: debt.contractFilePath,
      status: "EN_COURS",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return { newDebtId: newDebtRef.id };
  }
);

export const uploadContractUrl = functions.https.onCall(
  async (data, context) => {
    const uid = ensureAuth(context);
    const { debtId } = z.object({ debtId: z.string().min(1) }).parse(data);
    const { ref } = await assertDebtOwner(uid, debtId);

    const destination = `contracts/${uid}/${debtId}.pdf`;
    const file = storage.bucket().file(destination);
    const expires = Date.now() + 15 * 60 * 1000;

    const [url] = await file.getSignedUrl({
      version: "v4",
      action: "write",
      expires,
      contentType: CONTRACT_CONTENT_TYPE,
    });

    await ref.update({
      contractFilePath: destination,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      uploadUrl: url,
      path: destination,
      expiresAt: new Date(expires).toISOString(),
    };
  }
);

export const getDebtSummary = functions.https.onCall(
  async (data, context) => {
    const uid = ensureAuth(context);
    const payload = debtSummarySchema.parse(data);

    const { data: debt } = await assertDebtOwner(uid, payload.debtId);
    const schedulesSnapshot = await loadSchedules(payload.debtId);
    const paymentsSnapshot = await db
      .collection("debtPayments")
      .where("debtId", "==", payload.debtId)
      .orderBy("paidAt", "desc")
      .limit(50)
      .get();

    const schedules = schedulesSnapshot.docs.map(
      (doc) => doc.data() as DebtScheduleDoc
    );

    const totalInterestsPlanned = schedules.reduce(
      (acc, line) => acc + line.interestDue,
      0
    );
    const totalInterestsPaid = schedules.reduce(
      (acc, line) => acc + line.interestPaid,
      0
    );

    const upcoming = schedules
      .filter((line) => line.status !== "PAYEE")
      .sort(
        (a, b) => toDate(a.dueDate).getTime() - toDate(b.dueDate).getTime()
      )
      .slice(0, 3)
      .map((line) => ({
        debtId: payload.debtId,
        periodIndex: line.periodIndex,
        dueDate: line.dueDate,
        totalDue: roundMoney(line.totalDue - line.totalPaid),
        status: line.status,
      }));

    const hasLate = schedules.some((line) => line.status === "EN_RETARD");
    const remainingPrincipal = roundMoney(debt.remainingPrincipal);

    let debtToIncomeRatio: number | null = null;
    const userProfile = await db.collection("users").doc(uid).get();
    if (userProfile.exists) {
      const dataProfile = userProfile.data() ?? {};
      const monthlyIncome = dataProfile.monthlyNetIncome;
      if (monthlyIncome && monthlyIncome > 0) {
        const frequencyConfig = FREQUENCY_CONFIG[debt.frequency];
        const upcomingPayment = upcoming[0]?.totalDue ?? 0;
        const monthlyEquivalent =
          frequencyConfig.periodsPerYear === 0
            ? 0
            : (upcomingPayment * 12) / frequencyConfig.periodsPerYear;
        debtToIncomeRatio = Number(
          (monthlyEquivalent / monthlyIncome).toFixed(4)
        );
      }
    }

    return {
      remainingPrincipal,
      totalInterestsPlanned: roundMoney(totalInterestsPlanned),
      totalInterestsPaid: roundMoney(totalInterestsPaid),
      nextInstallments: upcoming,
      hasLateInstallments: hasLate,
      debtToIncomeRatio,
      payments: paymentsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as DebtPaymentDoc),
      })),
    };
  }
);
