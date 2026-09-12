export enum ObligationType {
  PAYMENT = 'Payment',
  SERVICE = 'Service',
  DELIVERABLE = 'Deliverable',
  SLA = 'SLA',
  RENEWAL = 'Renewal',
  COMPLIANCE = 'Compliance',
}

export enum ObligationStatus {
  PENDING = 'Pending',
  COMPLETED = 'Completed',
  OVERDUE = 'Overdue',
  WAIVED = 'Waived',
}

export enum RecurrenceInterval {
  NONE = 'None',
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
  QUARTERLY = 'Quarterly',
  ANNUALLY = 'Annually',
}
