import { RiskScoreInput, RiskScoreResult, RiskFactor, RiskLevel } from './risk.types';

const WEIGHTS = {
  overdueObligationPoints: 15,
  overdueObligationsCap: 45,
  expiredDays: 40,
  within30Days: 25,
  within90Days: 10,
  highValueThreshold: 100_000,
  highValuePoints: 15,
  workflowSlaBreachedPoints: 15,
  vendorRisk: { High: 20, Medium: 10, Low: 0 } as Record<'High' | 'Medium' | 'Low', number>,
};

function levelForScore(score: number): RiskLevel {
  if (score >= 70) return 'Critical';
  if (score >= 45) return 'High';
  if (score >= 20) return 'Medium';
  return 'Low';
}

export function computeRiskScore(input: RiskScoreInput): RiskScoreResult {
  const factors: RiskFactor[] = [];

  if (input.overdueObligations > 0) {
    const points = Math.min(input.overdueObligations * WEIGHTS.overdueObligationPoints, WEIGHTS.overdueObligationsCap);
    factors.push({ label: `${input.overdueObligations} overdue obligation(s)`, points });
  }

  if (input.daysToExpiry !== null) {
    if (input.daysToExpiry < 0) {
      factors.push({ label: 'Past expiry date, still open', points: WEIGHTS.expiredDays });
    } else if (input.daysToExpiry <= 30) {
      factors.push({ label: 'Expires within 30 days', points: WEIGHTS.within30Days });
    } else if (input.daysToExpiry <= 90) {
      factors.push({ label: 'Expires within 90 days', points: WEIGHTS.within90Days });
    }
  }

  if (input.contractValue !== null && input.contractValue >= WEIGHTS.highValueThreshold) {
    factors.push({ label: 'High contract value', points: WEIGHTS.highValuePoints });
  }

  if (input.workflowSlaBreached) {
    factors.push({ label: 'Approval SLA breached', points: WEIGHTS.workflowSlaBreachedPoints });
  }

  if (input.vendorRiskRating) {
    const points = WEIGHTS.vendorRisk[input.vendorRiskRating];
    if (points > 0) {
      factors.push({ label: `${input.vendorRiskRating} vendor risk rating`, points });
    }
  }

  const rawScore = factors.reduce((sum, f) => sum + f.points, 0);
  const score = Math.min(rawScore, 100);

  return { score, level: levelForScore(score), factors };
}
