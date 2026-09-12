import { nextOccurrence } from '../../src/modules/obligations/obligation.service';
import { RecurrenceInterval } from '../../src/modules/obligations/obligation.types';

describe('nextOccurrence', () => {
  const base = new Date('2026-01-15T00:00:00.000Z');

  it('returns null for a one-off (None) obligation', () => {
    expect(nextOccurrence(base, RecurrenceInterval.NONE)).toBeNull();
  });

  it('advances weekly by 7 days', () => {
    const next = nextOccurrence(base, RecurrenceInterval.WEEKLY);
    expect(next?.toISOString()).toBe('2026-01-22T00:00:00.000Z');
  });

  it('advances monthly by 1 month', () => {
    const next = nextOccurrence(base, RecurrenceInterval.MONTHLY);
    expect(next?.toISOString()).toBe('2026-02-15T00:00:00.000Z');
  });

  it('advances quarterly by 3 months', () => {
    const next = nextOccurrence(base, RecurrenceInterval.QUARTERLY);
    expect(next?.toISOString()).toBe('2026-04-15T00:00:00.000Z');
  });

  it('advances annually by 1 year', () => {
    const next = nextOccurrence(base, RecurrenceInterval.ANNUALLY);
    expect(next?.toISOString()).toBe('2027-01-15T00:00:00.000Z');
  });
});
