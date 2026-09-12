export type ObligationType = 'Payment' | 'Service' | 'Deliverable' | 'SLA' | 'Renewal' | 'Compliance';
export type ObligationStatus = 'Pending' | 'Completed' | 'Overdue' | 'Waived';
export type RecurrenceInterval = 'None' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Annually';

export interface Obligation {
  _id: string;
  
  
  
  
  
  
  contract: string | { _id: string; title: string; contractNumber: string };
  type: ObligationType;
  description: string;
  dueDate: string;
  assignedTo: string | null;
  status: ObligationStatus;
  recurrence: RecurrenceInterval;
  completedAt: string | null;
  createdAt: string;
  evidence: string | null;
  
  amount: number | null;
  currency: string | null;
  
  slaThreshold: string | null;
  slaPenalty: string | null;
  breached: boolean;
}
