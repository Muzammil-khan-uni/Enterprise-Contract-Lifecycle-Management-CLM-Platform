export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface RiskFactor {
  label: string;
  points: number;
}

export interface RiskScoreResult {
  score: number; 
  level: RiskLevel;
  factors: RiskFactor[];
}

export interface RiskScoreInput {
  overdueObligations: number;
  daysToExpiry: number | null; 
  contractValue: number | null;
  workflowSlaBreached: boolean;
  vendorRiskRating: 'Low' | 'Medium' | 'High' | null;
}
