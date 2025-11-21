import { addMonths, addWeeks, addYears } from "date-fns";

export type AmortizationMode =
  | "ANNUITE"
  | "PRINCIPAL_CONSTANT"
  | "INTEREST_ONLY"
  | "BALLOON";

export type DebtFrequency = "MENSUEL" | "HEBDOMADAIRE" | "ANNUEL";
export type RateType = "FIXE" | "VARIABLE";

export type FrequencyConfig = {
  periodsPerYear: number;
  addFn: (date: Date, periods: number) => Date;
};

export const FREQUENCY_CONFIG: Record<DebtFrequency, FrequencyConfig> = {
  MENSUEL: {
    periodsPerYear: 12,
    addFn: (date, periods) => addMonths(date, periods),
  },
  HEBDOMADAIRE: {
    periodsPerYear: 52,
    addFn: (date, periods) => addWeeks(date, periods),
  },
  ANNUEL: {
    periodsPerYear: 1,
    addFn: (date, periods) => addYears(date, periods),
  },
};

export interface BuildScheduleInput {
  principal: number;
  annualRate: number;
  rateType: RateType;
  amortizationMode: AmortizationMode;
  totalPeriods: number;
  gracePeriods: number;
  balloonPct: number;
  monthlyInsurance: number;
  upfrontFees: number;
  frequency: DebtFrequency;
  startDate: Date;
  variableRates?: Array<{
    effectiveDate: Date;
    effectiveAnnualRate: number;
  }>;
  recalcEachPeriod: boolean;
}

export interface ScheduleLine {
  periodIndex: number;
  dueDate: Date;
  principalDue: number;
  interestDue: number;
  insuranceDue: number;
  feesDue: number;
  totalDue: number;
  remainingPrincipalAfter: number;
}

const ROUND = (value: number, precision = 2) => {
  const factor = Math.pow(10, precision);
  return Math.round(value * factor) / factor;
};

const getRateForPeriod = (
  input: BuildScheduleInput,
  dueDate: Date,
  currentAnnualRate: number
) => {
  if (input.rateType === "FIXE" || !input.variableRates?.length) {
    return currentAnnualRate;
  }

  const sorted = [...input.variableRates].sort(
    (a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime()
  );
  let rate = currentAnnualRate;

  for (const entry of sorted) {
    if (entry.effectiveDate.getTime() <= dueDate.getTime()) {
      rate = entry.effectiveAnnualRate;
    } else {
      break;
    }
  }
  return rate;
};

export const buildSchedule = (input: BuildScheduleInput): ScheduleLine[] => {
  const config = FREQUENCY_CONFIG[input.frequency];
  if (!config) {
    throw new Error(`Frequency ${input.frequency} not supported`);
  }

  const { periodsPerYear } = config;
  const schedule: ScheduleLine[] = [];

  let remainingPrincipal = input.principal;
  let currentRate = input.annualRate;

  const grace = Math.max(0, Math.min(input.gracePeriods, input.totalPeriods));

  const basePrincipalPeriods =
    input.totalPeriods - (input.amortizationMode === "BALLOON" ? 1 : 0);

  const calcAnnuityPayment = (
    principal: number,
    rate: number,
    periods: number
  ) => {
    if (rate === 0) {
      return periods === 0 ? 0 : principal / periods;
    }
    const r = rate / periodsPerYear;
    const numerator = r * Math.pow(1 + r, periods);
    const denominator = Math.pow(1 + r, periods) - 1;
    if (denominator === 0) return principal / periods;
    return principal * (numerator / denominator);
  };

  let annuityPayment: number | null = null;
  if (input.amortizationMode === "ANNUITE") {
    annuityPayment = calcAnnuityPayment(
      remainingPrincipal,
      input.annualRate,
      input.totalPeriods - grace
    );
  }

  const balloonPrincipal =
    input.amortizationMode === "BALLOON"
      ? ROUND(input.principal * input.balloonPct, 2)
      : 0;

  let runningDate = new Date(input.startDate);

  for (let period = 1; period <= input.totalPeriods; period++) {
    runningDate = config.addFn(
      period === 1 ? input.startDate : runningDate,
      period === 1 ? 0 : 1
    );

    if (input.rateType === "VARIABLE" && input.recalcEachPeriod) {
      currentRate = getRateForPeriod(input, runningDate, currentRate);
      if (input.amortizationMode === "ANNUITE") {
        annuityPayment = calcAnnuityPayment(
          remainingPrincipal,
          currentRate,
          input.totalPeriods - (period - 1) - grace
        );
      }
    } else if (input.rateType === "VARIABLE") {
      currentRate = getRateForPeriod(input, runningDate, currentRate);
    }

    const periodicRateDynamic = currentRate / periodsPerYear;

    const interestBase = remainingPrincipal * periodicRateDynamic;

    const insuranceDue = input.monthlyInsurance > 0 ? input.monthlyInsurance : 0;
    let principalDue = 0;
    let interestDue = ROUND(interestBase, 2);

    const isInGrace = period <= grace;

    switch (input.amortizationMode) {
      case "ANNUITE": {
        const annuity = annuityPayment ?? 0;
        if (isInGrace) {
          principalDue = 0;
        } else {
          principalDue = ROUND(annuity - interestDue - insuranceDue, 2);
        }
        break;
      }
      case "PRINCIPAL_CONSTANT": {
        if (isInGrace) {
          principalDue = 0;
        } else {
          const amortPeriods = basePrincipalPeriods - grace;
          principalDue = ROUND(
            remainingPrincipal /
              Math.max(1, amortPeriods - (period - grace - 1)),
            2
          );
        }
        break;
      }
      case "INTEREST_ONLY": {
        if (period === input.totalPeriods && balloonPrincipal === 0) {
          principalDue = ROUND(remainingPrincipal, 2);
        } else if (balloonPrincipal > 0 && period === input.totalPeriods) {
          principalDue = ROUND(
            remainingPrincipal * (1 - input.balloonPct),
            2
          );
        } else {
          principalDue =
            balloonPrincipal > 0 && period === basePrincipalPeriods
              ? ROUND(remainingPrincipal - balloonPrincipal, 2)
              : 0;
        }
        break;
      }
      case "BALLOON": {
        if (isInGrace) {
          principalDue = 0;
        } else if (period === input.totalPeriods) {
          principalDue = ROUND(balloonPrincipal + remainingPrincipal, 2);
        } else {
          const amortPeriods = basePrincipalPeriods - grace;
          principalDue = ROUND(
            (remainingPrincipal - balloonPrincipal) /
              Math.max(1, amortPeriods - (period - grace - 1)),
            2
          );
        }
        break;
      }
      default:
        principalDue = 0;
    }

    if (principalDue > remainingPrincipal) {
      principalDue = ROUND(remainingPrincipal, 2);
    }

    const feesDue =
      period === 1 && input.upfrontFees > 0 ? ROUND(input.upfrontFees, 2) : 0;

    const totalDue = ROUND(
      principalDue + interestDue + insuranceDue + feesDue,
      2
    );
    remainingPrincipal = ROUND(remainingPrincipal - principalDue, 2);
    if (remainingPrincipal < 0.01) {
      remainingPrincipal = 0;
    }

    schedule.push({
      periodIndex: period,
      dueDate: runningDate,
      principalDue,
      interestDue,
      insuranceDue,
      feesDue,
      totalDue,
      remainingPrincipalAfter: remainingPrincipal,
    });
  }

  return schedule;
};

export const allocatePayment = (
  amount: number,
  line: Pick<
    ScheduleLine,
    "feesDue" | "interestDue" | "insuranceDue" | "principalDue"
  >,
  alreadyPaid: {
    feesPaid: number;
    interestPaid: number;
    insurancePaid: number;
    principalPaid: number;
  }
) => {
  let remaining = amount;
  const result = {
    fees: 0,
    interests: 0,
    insurance: 0,
    principal: 0,
  };

  const allocate = (need: number, key: keyof typeof result) => {
    if (need <= 0 || remaining <= 0) return;
    const portion = Math.min(need, remaining);
    result[key] = ROUND(portion, 2);
    remaining = ROUND(remaining - portion, 2);
  };

  allocate(ROUND(line.feesDue - alreadyPaid.feesPaid, 2), "fees");
  allocate(ROUND(line.interestDue - alreadyPaid.interestPaid, 2), "interests");
  allocate(
    ROUND(line.insuranceDue - alreadyPaid.insurancePaid, 2),
    "insurance"
  );
  allocate(
    ROUND(line.principalDue - alreadyPaid.principalPaid, 2),
    "principal"
  );

  return {
    allocation: result,
    remainder: remaining,
  };
};
