import { computeRiskScore } from '../../src/modules/risk/risk-scoring.util';

const baseInput = {
  overdueObligations: 0,
  daysToExpiry: null,
  contractValue: null,
  workflowSlaBreached: false,
  vendorRiskRating: null,
};

describe('computeRiskScore', () => {
  it('scores a clean contract as Low with no factors', () => {
    const result = computeRiskScore(baseInput);
    expect(result.score).toBe(0);
    expect(result.level).toBe('Low');
    expect(result.factors).toEqual([]);
  });

  it('caps overdue-obligation points at 45 regardless of count', () => {
    const result = computeRiskScore({ ...baseInput, overdueObligations: 10 });
    expect(result.score).toBe(45);
    expect(result.factors[0].points).toBe(45);
  });

  it('flags a contract already past its expiry date as the highest expiry tier', () => {
    const result = computeRiskScore({ ...baseInput, daysToExpiry: -5 });
    expect(result.factors).toContainEqual({ label: 'Past expiry date, still open', points: 40 });
  });

  it('does not double-count expiry tiers — only the matching bucket applies', () => {
    const result = computeRiskScore({ ...baseInput, daysToExpiry: 15 });
    expect(result.factors).toHaveLength(1);
    expect(result.factors[0].points).toBe(25);
  });

  it('adds vendor risk points only for Medium/High, not Low', () => {
    const low = computeRiskScore({ ...baseInput, vendorRiskRating: 'Low' });
    const high = computeRiskScore({ ...baseInput, vendorRiskRating: 'High' });
    expect(low.factors).toEqual([]);
    expect(high.factors).toContainEqual({ label: 'High vendor risk rating', points: 20 });
  });

  it('clamps the total score at 100 even when factors would sum higher', () => {
    const result = computeRiskScore({
      overdueObligations: 10, 
      daysToExpiry: -5, 
      contractValue: 500_000, 
      workflowSlaBreached: true, 
      vendorRiskRating: 'High', 
    }); 
    expect(result.score).toBe(100);
    expect(result.level).toBe('Critical');
  });

  it('assigns level boundaries correctly', () => {
    expect(computeRiskScore({ ...baseInput, daysToExpiry: 15 }).level).toBe('Medium'); 
    expect(computeRiskScore({ ...baseInput, overdueObligations: 3 }).level).toBe('High'); 
    expect(computeRiskScore({ ...baseInput, overdueObligations: 2, daysToExpiry: -1 }).level).toBe('Critical'); 
  });
});
