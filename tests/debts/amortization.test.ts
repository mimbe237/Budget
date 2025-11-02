import { describe, expect, it } from 'vitest';
import {
  buildSchedule,
  allocatePayment,
  type BuildScheduleInput,
} from '@/lib/debts/amortization';

const baseInput = (overrides: Partial<BuildScheduleInput> = {}): BuildScheduleInput => ({
  principal: 1000,
  annualRate: 0.05,
  rateType: 'FIXE',
  amortizationMode: 'ANNUITE',
  totalPeriods: 12,
  gracePeriods: 0,
  balloonPct: 0,
  monthlyInsurance: 0,
  upfrontFees: 0,
  frequency: 'MENSUEL',
  startDate: new Date('2024-01-01'),
  variableRates: undefined,
  recalcEachPeriod: false,
  ...overrides,
});

describe('buildSchedule', () => {
  it('computes annuity correctly when rate is zero', () => {
    const schedule = buildSchedule(
      baseInput({
        annualRate: 0,
        totalPeriods: 10,
      })
    );
    const totals = schedule.map((line) => line.principalDue);
    expect(totals.every((value) => value === 100)).toBe(true);
    expect(schedule[schedule.length - 1].remainingPrincipalAfter).toBe(0);
  });

  it('handles principal constant with grace periods', () => {
    const schedule = buildSchedule(
      baseInput({
        principal: 1200,
        amortizationMode: 'PRINCIPAL_CONSTANT',
        gracePeriods: 2,
        totalPeriods: 6,
      })
    );
    expect(schedule[0].principalDue).toBe(0);
    expect(schedule[1].principalDue).toBe(0);
    expect(schedule[2].principalDue).toBeCloseTo(300);
    expect(schedule[5].remainingPrincipalAfter).toBe(0);
  });

  it('handles interest-only loans with lump-sum at maturity', () => {
    const schedule = buildSchedule(
      baseInput({
        amortizationMode: 'INTEREST_ONLY',
        totalPeriods: 5,
      })
    );
    expect(schedule.slice(0, 4).every((line) => line.principalDue === 0)).toBe(true);
    expect(schedule[4].principalDue).toBe(1000);
    expect(schedule[4].remainingPrincipalAfter).toBe(0);
  });

  it('computes balloon payments according to percentage', () => {
    const schedule = buildSchedule(
      baseInput({
        principal: 10000,
        amortizationMode: 'BALLOON',
        totalPeriods: 12,
        balloonPct: 0.2,
      })
    );
    const last = schedule[schedule.length - 1];
    expect(last.principalDue).toBeCloseTo(2000, 2);
    expect(last.remainingPrincipalAfter).toBe(0);
  });
});

describe('allocatePayment', () => {
  it('allocates following fees → interest → insurance → principal', () => {
    const { allocation, remainder } = allocatePayment(
      250,
      {
        feesDue: 20,
        interestDue: 80,
        insuranceDue: 30,
        principalDue: 200,
      },
      {
        feesPaid: 0,
        interestPaid: 0,
        insurancePaid: 0,
        principalPaid: 0,
      }
    );
    expect(allocation.fees).toBe(20);
    expect(allocation.interests).toBe(80);
    expect(allocation.insurance).toBe(30);
    expect(allocation.principal).toBe(120);
    expect(remainder).toBe(0);
  });
});
