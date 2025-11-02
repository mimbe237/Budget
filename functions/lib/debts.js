"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDebtSummary = exports.uploadContractUrl = exports.restructureDebt = exports.markLateAndPenalize = exports.applyPrepayment = exports.simulatePrepayment = exports.recordPayment = exports.buildSchedule = exports.createDebt = void 0;
const functions = __importStar(require("firebase-functions"));
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const zod_1 = require("zod");
const amortization_1 = require("./lib/amortization");
const date_fns_1 = require("date-fns");
const db = admin.firestore();
const storage = admin.storage();
const logger = functions.logger;
const GRACE_DAYS = 5;
const LATE_FEE_FLAT = 0;
const MAX_CONTRACT_BYTES = 10 * 1024 * 1024;
const CONTRACT_CONTENT_TYPE = "application/pdf";
const EPSILON = 0.01;
const roundMoney = (value, precision = 2) => {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
};
const toDate = (value) => {
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
const toTimestamp = (value) => admin.firestore.Timestamp.fromDate(value);
const ensureAuth = (context) => {
    if (!context.auth) {
        throw new https_1.HttpsError("unauthenticated", "Authentication required.");
    }
    return context.auth.uid;
};
const assertDebtOwner = async (uid, debtId) => {
    const ref = db.collection("debts").doc(debtId);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
        throw new https_1.HttpsError("not-found", "Dette introuvable.");
    }
    const data = snapshot.data();
    if (data.userId !== uid) {
        throw new https_1.HttpsError("permission-denied", "Accès refusé à cette dette.");
    }
    return { ref, data, snapshot };
};
const fetchRateHistory = async (debtId) => {
    const snapshot = await db
        .collection("debtRateHistory")
        .where("debtId", "==", debtId)
        .orderBy("effectiveDate", "asc")
        .get();
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            effectiveDate: toDate(data.effectiveDate),
            effectiveAnnualRate: data.effectiveAnnualRate,
        };
    });
};
const loadSchedules = (debtId) => db
    .collection("debtSchedules")
    .where("debtId", "==", debtId)
    .orderBy("periodIndex", "asc")
    .get();
const determineDebtStatus = (remainingPrincipal, schedules) => {
    if (remainingPrincipal <= EPSILON) {
        const hasOpen = schedules.some((line) => line.status !== "PAYEE");
        return hasOpen ? "EN_COURS" : "SOLDEE";
    }
    const hasLate = schedules.some((line) => line.status === "EN_RETARD");
    return hasLate ? "EN_RETARD" : "EN_COURS";
};
const computeNextInstallment = (schedules) => {
    const upcoming = schedules
        .filter((line) => line.status !== "PAYEE")
        .sort((a, b) => toDate(a.dueDate).getTime() - toDate(b.dueDate).getTime());
    if (!upcoming.length) {
        return { nextDueDate: null, nextDueAmount: null };
    }
    const target = upcoming[0];
    return {
        nextDueDate: target.dueDate,
        nextDueAmount: roundMoney(target.totalDue - target.totalPaid),
    };
};
const debtSchema = zod_1.z.object({
    type: zod_1.z.enum(["EMPRUNT", "PRET"]),
    title: zod_1.z.string().min(1),
    counterparty: zod_1.z.string().min(1).nullable().optional(),
    currency: zod_1.z.string().length(3),
    principalInitial: zod_1.z.number().positive(),
    annualRate: zod_1.z.number().min(0),
    rateType: zod_1.z.enum(["FIXE", "VARIABLE"]),
    amortizationMode: zod_1.z.enum([
        "ANNUITE",
        "PRINCIPAL_CONSTANT",
        "INTEREST_ONLY",
        "BALLOON",
    ]),
    totalPeriods: zod_1.z.number().int().positive(),
    frequency: zod_1.z.enum(["MENSUEL", "HEBDOMADAIRE", "ANNUEL"]),
    startDate: zod_1.z.coerce.date(),
    gracePeriods: zod_1.z.number().int().nonnegative(),
    balloonPct: zod_1.z.number().min(0).max(1).default(0),
    upfrontFees: zod_1.z.number().min(0).default(0),
    monthlyInsurance: zod_1.z.number().min(0).default(0),
    prepaymentPenaltyPct: zod_1.z.number().min(0).max(1).default(0),
    variableIndexCode: zod_1.z.string().nullable().optional(),
    variableMarginBps: zod_1.z.number().nullable().optional(),
    recalcEachPeriod: zod_1.z.boolean().default(false),
});
const paymentSchema = zod_1.z.object({
    debtId: zod_1.z.string().min(1),
    scheduleId: zod_1.z.string().min(1).nullable().optional(),
    paidAt: zod_1.z.coerce.date(),
    amount: zod_1.z.number().positive(),
    currency: zod_1.z.string().length(3),
    fxRate: zod_1.z.number().nullable().optional(),
    method: zod_1.z.enum(["virement", "especes", "carte", "autre"]),
    sourceAccountId: zod_1.z.string().nullable().optional(),
});
const prepaymentSchema = zod_1.z.object({
    debtId: zod_1.z.string().min(1),
    amount: zod_1.z.number().positive(),
    date: zod_1.z.coerce.date(),
    mode: zod_1.z.enum(["RE-AMORTIR", "RACCOURCIR_DUREE"]),
});
const restructureSchema = zod_1.z.object({
    debtId: zod_1.z.string().min(1),
    newTerms: debtSchema.extend({
        startDate: zod_1.z.coerce.date(),
    }),
});
const debtSummarySchema = zod_1.z.object({
    debtId: zod_1.z.string().min(1),
});
const simulatePrepaymentInternal = async (uid, payload) => {
    const { data: debt } = await assertDebtOwner(uid, payload.debtId);
    if (debt.remainingPrincipal <= EPSILON) {
        throw new https_1.HttpsError("failed-precondition", "Dette déjà soldée.");
    }
    const schedulesSnapshot = await loadSchedules(payload.debtId);
    const schedules = schedulesSnapshot.docs
        .map((doc) => doc.data())
        .filter((line) => line.status !== "PAYEE");
    const amountApplicable = Math.min(payload.amount, roundMoney(debt.remainingPrincipal));
    const newPrincipal = Math.max(0, roundMoney(debt.remainingPrincipal - amountApplicable));
    const penalty = roundMoney(debt.remainingPrincipal * (debt.prepaymentPenaltyPct ?? 0));
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
    const newSchedule = (0, amortization_1.buildSchedule)(buildInput);
    const interestsRemaining = schedules.reduce((acc, line) => acc + Math.max(0, line.interestDue - line.interestPaid), 0);
    const newInterests = newSchedule.reduce((acc, line) => acc + line.interestDue, 0);
    const trimmedSchedule = payload.mode === "RACCOURCIR_DUREE"
        ? newSchedule.filter((line, idx, arr) => {
            const isLast = idx === arr.length - 1;
            return (line.principalDue > EPSILON ||
                line.interestDue > EPSILON ||
                line.insuranceDue > EPSILON ||
                isLast);
        })
        : newSchedule;
    const newDuration = trimmedSchedule.length;
    const newInstallment = payload.mode === "RE-AMORTIR"
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
const buildInputForDebt = async (debtId, debt, overrides) => {
    const variableRates = debt.rateType === "VARIABLE" ? await fetchRateHistory(debtId) : undefined;
    return {
        principal: overrides?.principal ?? debt.remainingPrincipal ?? debt.principalInitial,
        annualRate: overrides?.annualRate ?? debt.annualRate,
        rateType: overrides?.rateType ?? debt.rateType,
        amortizationMode: overrides?.amortizationMode ?? debt.amortizationMode,
        totalPeriods: overrides?.totalPeriods ?? debt.totalPeriods,
        gracePeriods: overrides?.gracePeriods ?? debt.gracePeriods,
        balloonPct: overrides?.balloonPct ??
            (debt.amortizationMode === "BALLOON" ? debt.balloonPct : 0),
        monthlyInsurance: overrides?.monthlyInsurance ?? debt.monthlyInsurance ?? 0,
        upfrontFees: overrides?.upfrontFees ?? debt.upfrontFees ?? 0,
        frequency: overrides?.frequency ?? debt.frequency,
        startDate: overrides?.startDate ?? toDate(debt.startDate),
        variableRates: overrides?.variableRates ?? variableRates,
        recalcEachPeriod: overrides?.recalcEachPeriod ?? (debt.recalcEachPeriod ?? false),
    };
};
const writeSchedule = async (debtId, scheduleLines, startPeriodIndex = 1) => {
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
const clearSchedules = async (debtId) => {
    const snapshot = await loadSchedules(debtId);
    if (snapshot.empty)
        return;
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
const rebuildRemainingSchedule = async (debtId, debt, schedulesSnapshot, touchedDocIds, newPrincipal, mode) => {
    const untouched = schedulesSnapshot.docs.filter((doc) => {
        if (touchedDocIds.has(doc.id))
            return false;
        const data = doc.data();
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
    const first = untouched[0].data();
    const startPeriodIndex = first.periodIndex;
    const startDate = toDate(first.dueDate);
    const buildInput = await buildInputForDebt(debtId, debt, {
        principal: roundMoney(newPrincipal),
        totalPeriods: untouched.length,
        gracePeriods: 0,
        upfrontFees: 0,
        startDate,
    });
    let newLines = (0, amortization_1.buildSchedule)(buildInput);
    if (mode === "RACCOURCIR_DUREE") {
        newLines = newLines.filter((line, idx, arr) => {
            const isLast = idx === arr.length - 1;
            return (line.principalDue > EPSILON ||
                line.interestDue > EPSILON ||
                line.insuranceDue > EPSILON ||
                isLast);
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
exports.createDebt = functions.https.onCall(async (data, context) => {
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
exports.buildSchedule = functions.https.onCall(async (data, context) => {
    const uid = ensureAuth(context);
    const { debtId } = zod_1.z.object({ debtId: zod_1.z.string().min(1) }).parse(data);
    const { ref, data: debt } = await assertDebtOwner(uid, debtId);
    await clearSchedules(debtId);
    const buildInput = await buildInputForDebt(debtId, debt);
    const scheduleLines = (0, amortization_1.buildSchedule)(buildInput);
    await writeSchedule(debtId, scheduleLines);
    const { nextDueDate, nextDueAmount } = computeNextInstallment(scheduleLines.map((line) => ({
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
    })));
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
exports.recordPayment = functions.https.onCall(async (data, context) => {
    const uid = ensureAuth(context);
    const payload = paymentSchema.parse(data);
    const { ref, data: debt } = await assertDebtOwner(uid, payload.debtId);
    const schedulesSnapshot = await loadSchedules(payload.debtId);
    if (schedulesSnapshot.empty) {
        throw new https_1.HttpsError("failed-precondition", "Aucun échéancier généré pour cette dette.");
    }
    const scheduleDocs = schedulesSnapshot.docs;
    const amountInitial = roundMoney(payload.amount);
    let amountRemaining = amountInitial;
    const touchedDocIds = new Set();
    let totalPrincipalAllocation = 0;
    let totalInterestAllocation = 0;
    let totalFeesAllocation = 0;
    let totalInsuranceAllocation = 0;
    const updates = new Map();
    const targetDocs = payload.scheduleId
        ? scheduleDocs.filter((doc) => doc.id === payload.scheduleId)
        : scheduleDocs;
    if (payload.scheduleId && targetDocs.length === 0) {
        throw new https_1.HttpsError("not-found", "Échéance introuvable.");
    }
    for (const doc of targetDocs) {
        if (amountRemaining <= EPSILON)
            break;
        const dataDoc = doc.data();
        const outstanding = {
            feesOutstanding: roundMoney(dataDoc.feesDue - dataDoc.feesPaid),
            interestOutstanding: roundMoney(dataDoc.interestDue - dataDoc.interestPaid),
            insuranceOutstanding: roundMoney(dataDoc.insuranceDue - dataDoc.insurancePaid),
            principalOutstanding: roundMoney(dataDoc.principalDue - dataDoc.principalPaid),
        };
        if (outstanding.feesOutstanding <= EPSILON &&
            outstanding.interestOutstanding <= EPSILON &&
            outstanding.insuranceOutstanding <= EPSILON &&
            outstanding.principalOutstanding <= EPSILON) {
            continue;
        }
        const { allocation, remainder } = (0, amortization_1.allocatePayment)(amountRemaining, {
            feesDue: dataDoc.feesDue,
            interestDue: dataDoc.interestDue,
            insuranceDue: dataDoc.insuranceDue,
            principalDue: dataDoc.principalDue,
        }, {
            feesPaid: dataDoc.feesPaid,
            interestPaid: dataDoc.interestPaid,
            insurancePaid: dataDoc.insurancePaid,
            principalPaid: dataDoc.principalPaid,
        });
        const appliedAmount = roundMoney(allocation.fees +
            allocation.interests +
            allocation.insurance +
            allocation.principal);
        if (appliedAmount <= EPSILON) {
            continue;
        }
        amountRemaining = remainder;
        touchedDocIds.add(doc.id);
        const updatedData = {
            ...dataDoc,
            feesPaid: roundMoney(dataDoc.feesPaid + allocation.fees),
            interestPaid: roundMoney(dataDoc.interestPaid + allocation.interests),
            insurancePaid: roundMoney((dataDoc.insurancePaid ?? 0) + allocation.insurance),
            principalPaid: roundMoney(dataDoc.principalPaid + allocation.principal),
            totalPaid: roundMoney(dataDoc.totalPaid + appliedAmount),
            lastPaidAt: toTimestamp(payload.paidAt),
            status: "A_ECHoir",
            updatedAt: dataDoc.updatedAt,
        };
        if (roundMoney(dataDoc.totalDue - updatedData.totalPaid) <= EPSILON) {
            updatedData.status = "PAYEE";
        }
        else {
            updatedData.status = "PARTIEL";
        }
        totalPrincipalAllocation = roundMoney(totalPrincipalAllocation + allocation.principal);
        totalInterestAllocation = roundMoney(totalInterestAllocation + allocation.interests);
        totalFeesAllocation = roundMoney(totalFeesAllocation + allocation.fees);
        totalInsuranceAllocation = roundMoney(totalInsuranceAllocation + allocation.insurance);
        updates.set(doc.id, updatedData);
    }
    if (totalPrincipalAllocation <= EPSILON && amountRemaining >= amountInitial) {
        throw new https_1.HttpsError("failed-precondition", "Aucune échéance ouverte.");
    }
    const batch = db.batch();
    for (const doc of scheduleDocs) {
        const update = updates.get(doc.id);
        if (!update)
            continue;
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
    const remainingPrincipalAfterPayment = Math.max(0, roundMoney(debt.remainingPrincipal - totalPrincipalAllocation - amountRemaining));
    if (amountRemaining > EPSILON) {
        await rebuildRemainingSchedule(payload.debtId, { ...debt, remainingPrincipal: remainingPrincipalAfterPayment }, schedulesSnapshot, touchedDocIds, remainingPrincipalAfterPayment, "RACCOURCIR_DUREE");
    }
    const refreshedSnapshot = await loadSchedules(payload.debtId);
    const allSchedules = refreshedSnapshot.docs.map((doc) => doc.data());
    const { nextDueDate, nextDueAmount } = computeNextInstallment(allSchedules);
    const status = determineDebtStatus(remainingPrincipalAfterPayment, allSchedules);
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
exports.simulatePrepayment = functions.https.onCall(async (data, context) => {
    const uid = ensureAuth(context);
    const payload = prepaymentSchema.parse(data);
    return simulatePrepaymentInternal(uid, payload);
});
exports.applyPrepayment = functions.https.onCall(async (data, context) => {
    const uid = ensureAuth(context);
    const payload = prepaymentSchema.parse(data);
    const { ref, data: debt } = await assertDebtOwner(uid, payload.debtId);
    const simulation = await simulatePrepaymentInternal(uid, payload);
    const schedulesSnapshot = await loadSchedules(payload.debtId);
    const amountApplied = simulation.prepaymentApplied;
    const penalty = simulation.penalty;
    const newPrincipal = Math.max(0, simulation.newPrincipal);
    if (amountApplied <= EPSILON) {
        throw new https_1.HttpsError("failed-precondition", "Montant de remboursement anticipé insuffisant.");
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
    await rebuildRemainingSchedule(payload.debtId, { ...debt, remainingPrincipal: newPrincipal }, schedulesSnapshot, new Set(), newPrincipal, payload.mode);
    const refreshedSnapshot = await loadSchedules(payload.debtId);
    const schedules = refreshedSnapshot.docs.map((doc) => doc.data());
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
});
exports.markLateAndPenalize = functions.pubsub
    .schedule("every day 03:00")
    .onRun(async () => {
    const threshold = (0, date_fns_1.addDays)(new Date(), -GRACE_DAYS);
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
        const data = doc.data();
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
exports.restructureDebt = functions.https.onCall(async (data, context) => {
    const uid = ensureAuth(context);
    const payload = restructureSchema.parse(data);
    const { ref, data: debt } = await assertDebtOwner(uid, payload.debtId);
    const schedulesSnapshot = await loadSchedules(payload.debtId);
    const remainingPrincipal = schedulesSnapshot.docs.reduce((acc, doc) => {
        const line = doc.data();
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
});
exports.uploadContractUrl = functions.https.onCall(async (data, context) => {
    const uid = ensureAuth(context);
    const { debtId } = zod_1.z.object({ debtId: zod_1.z.string().min(1) }).parse(data);
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
});
exports.getDebtSummary = functions.https.onCall(async (data, context) => {
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
    const schedules = schedulesSnapshot.docs.map((doc) => doc.data());
    const totalInterestsPlanned = schedules.reduce((acc, line) => acc + line.interestDue, 0);
    const totalInterestsPaid = schedules.reduce((acc, line) => acc + line.interestPaid, 0);
    const upcoming = schedules
        .filter((line) => line.status !== "PAYEE")
        .sort((a, b) => toDate(a.dueDate).getTime() - toDate(b.dueDate).getTime())
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
    let debtToIncomeRatio = null;
    const userProfile = await db.collection("users").doc(uid).get();
    if (userProfile.exists) {
        const dataProfile = userProfile.data() ?? {};
        const monthlyIncome = dataProfile.monthlyNetIncome;
        if (monthlyIncome && monthlyIncome > 0) {
            const frequencyConfig = amortization_1.FREQUENCY_CONFIG[debt.frequency];
            const upcomingPayment = upcoming[0]?.totalDue ?? 0;
            const monthlyEquivalent = frequencyConfig.periodsPerYear === 0
                ? 0
                : (upcomingPayment * 12) / frequencyConfig.periodsPerYear;
            debtToIncomeRatio = Number((monthlyEquivalent / monthlyIncome).toFixed(4));
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
            ...doc.data(),
        })),
    };
});
