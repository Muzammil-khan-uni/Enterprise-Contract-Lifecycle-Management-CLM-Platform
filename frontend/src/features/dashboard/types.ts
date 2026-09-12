export interface DashboardSummary {
  activeContracts: number;
  expiringContracts: number;
  pendingApprovals: number;
  complianceStatus: { status: string; count: number }[];
  valueByContractType: { contractType: string; totalValue: number; count: number }[];
}

export interface ExpiringContract {
  _id: string;
  title: string;
  contractNumber: string;
  expiryDate: string;
  status: string;
}

export interface DepartmentBreakdown {
  departmentId: string;
  departmentName: string | null;
  count: number;
}

export interface VendorBreakdown {
  vendorName: string;
  count: number;
}

export interface RiskFactor {
  label: string;
  points: number;
}

export interface ScoredContract {
  contractId: string;
  title: string;
  contractNumber: string;
  status: string;
  risk: {
    score: number;
    level: 'Low' | 'Medium' | 'High' | 'Critical';
    factors: RiskFactor[];
  };
}
