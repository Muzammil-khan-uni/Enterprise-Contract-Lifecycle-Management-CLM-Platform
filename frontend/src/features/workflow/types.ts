export type ApprovalLevel = 'Legal' | 'Finance' | 'Executive';
export type StepStatus = 'Pending' | 'Approved' | 'Rejected' | 'Escalated' | 'Skipped';
export type WorkflowStatus = 'InProgress' | 'Approved' | 'Rejected' | 'Cancelled';

export interface ApprovalStep {
  level: ApprovalLevel;
  status: StepStatus;
  approver: string | null;
  actionedAt: string | null;
  comments: string | null;
  escalatedTo: string | null;
  
  
  
  isEscalated: boolean;
}

export interface WorkflowContractSummary {
  _id: string;
  title: string;
  contractNumber: string;
  status: string;
}

export interface ApprovalWorkflow {
  _id: string;
  contract: string | WorkflowContractSummary;
  steps: ApprovalStep[];
  currentStepIndex: number;
  status: WorkflowStatus;
  slaDeadline: string | null;
  submittedBy: string;
  createdAt: string;
}
