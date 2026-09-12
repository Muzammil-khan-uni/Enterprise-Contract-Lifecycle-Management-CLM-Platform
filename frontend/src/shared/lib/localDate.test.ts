import { describe, it, expect } from 'vitest';
import { parseLocalDateInput, localDateInputToISOString } from './localDate';

describe('parseLocalDateInput', () => {
  it('produces a Date whose LOCAL calendar date matches the input string exactly', () => {
    const result = parseLocalDateInput('2026-09-04');
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(8); 
    expect(result.getDate()).toBe(4);
  });

  it('sets the time to local midnight, not some other hour', () => {
    const result = parseLocalDateInput('2026-09-04');
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
  });

  it('handles single-digit months and days correctly (no off-by-one from string padding)', () => {
    const result = parseLocalDateInput('2026-01-05');
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(0); 
    expect(result.getDate()).toBe(5);
  });
});

describe('localDateInputToISOString', () => {
  it('returns a valid ISO 8601 string', () => {
    const result = localDateInputToISOString('2026-09-04');
    expect(() => new Date(result)).not.toThrow();
    expect(new Date(result).toISOString()).toBe(result);
  });

  

  it('differs from naive UTC date-string parsing by exactly the local UTC offset', () => {
    const dateOnlyString = '2026-09-04';
    const oldBuggyResult = new Date(dateOnlyString); 
    const fixedResult = parseLocalDateInput(dateOnlyString); 
    const expectedOffsetMs = fixedResult.getTimezoneOffset() * 60 * 1000;

    expect(fixedResult.getTime() - oldBuggyResult.getTime()).toBe(expectedOffsetMs);
  });
});
