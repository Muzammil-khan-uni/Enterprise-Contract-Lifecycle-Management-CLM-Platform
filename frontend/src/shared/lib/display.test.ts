import { describe, expect, it } from 'vitest';
import { humanizeLabel } from './display';

describe('humanizeLabel', () => {
  it('separates camel-case words', () => {
    expect(humanizeLabel('PendingApproval')).toBe('Pending Approval');
    expect(humanizeLabel('InReview')).toBe('In Review');
  });

  it('normalizes separators and casing', () => {
    expect(humanizeLabel('pending_approval')).toBe('Pending Approval');
    expect(humanizeLabel('pending-approval')).toBe('Pending Approval');
  });

  it('preserves acronyms cleanly', () => {
    expect(humanizeLabel('APIError')).toBe('API Error');
  });
});
