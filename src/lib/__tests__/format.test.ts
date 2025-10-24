import { describe, it, expect } from 'vitest';
import { formatMoneyFromCents } from '../format';

describe('formatMoneyFromCents', () => {
  it('formate correctement les montants en USD', () => {
    expect(formatMoneyFromCents(12345, 'USD', 'en-US')).toBe('$123.45');
  });
  it('formate correctement les montants en EUR', () => {
    expect(formatMoneyFromCents(9876, 'EUR', 'fr-FR')).toBe('98,76 €');
  });
  it('gère les montants nuls', () => {
    expect(formatMoneyFromCents(0, 'USD', 'en-US')).toBe('$0.00');
  });
});
