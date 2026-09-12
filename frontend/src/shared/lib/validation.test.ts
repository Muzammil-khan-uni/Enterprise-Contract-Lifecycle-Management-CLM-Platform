import { describe, it, expect } from 'vitest';
import { EMAIL_VALIDATION, OPTIONAL_EMAIL_VALIDATION } from './validation';

const VALID = ['test@test.com', 'jane.doe@example.co.uk'];
const INVALID = ['test@test', 'jane@example', 'a@b.c', 'not-an-email', 'test@localhost', 'a@b'];

describe('EMAIL_VALIDATION', () => {
  it('accepts emails the backend accepts', () => {
    for (const v of VALID) expect(EMAIL_VALIDATION.pattern.value.test(v)).toBe(true);
  });

  it('rejects emails the backend rejects, including the easy-to-type "test@test" placeholder', () => {
    for (const v of INVALID) expect(EMAIL_VALIDATION.pattern.value.test(v)).toBe(false);
  });
});

describe('OPTIONAL_EMAIL_VALIDATION', () => {
  it('passes on an empty value (field is optional)', () => {
    expect(OPTIONAL_EMAIL_VALIDATION.validate(undefined)).toBe(true);
    expect(OPTIONAL_EMAIL_VALIDATION.validate('')).toBe(true);
  });

  it('validates format once a value is actually provided', () => {
    expect(OPTIONAL_EMAIL_VALIDATION.validate('test@test.com')).toBe(true);
    expect(OPTIONAL_EMAIL_VALIDATION.validate('test@test')).not.toBe(true);
  });
});
