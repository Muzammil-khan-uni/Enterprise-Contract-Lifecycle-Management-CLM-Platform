

export enum DomainEvent {
  CONTRACT_CREATED = 'contract.created',
  CONTRACT_STATUS_CHANGED = 'contract.status.changed',
  CONTRACT_EXPIRING = 'contract.expiring',
  APPROVAL_SUBMITTED = 'approval.submitted',
  APPROVAL_COMPLETED = 'approval.completed',
  APPROVAL_REJECTED = 'approval.rejected',
  WORKFLOW_SLA_BREACHED = 'workflow.sla.breached',
  SIGNATURE_COMPLETED = 'signature.completed',
  SIGNATURE_REMINDER = 'signature.reminder',
  OBLIGATION_DUE_SOON = 'obligation.due_soon',
  OBLIGATION_OVERDUE = 'obligation.overdue',
}

export interface DomainEventPayloadMap {
  [DomainEvent.CONTRACT_CREATED]: { contractId: string; createdBy: string };
  [DomainEvent.CONTRACT_STATUS_CHANGED]: { contractId: string; fromStatus: string; toStatus: string };
  [DomainEvent.CONTRACT_EXPIRING]: { contractId: string; expiryDate: string; recipientId: string; tenantId: string };
  [DomainEvent.APPROVAL_SUBMITTED]: { workflowId: string; contractId: string };
  [DomainEvent.APPROVAL_COMPLETED]: { workflowId: string; contractId: string };
  [DomainEvent.APPROVAL_REJECTED]: { workflowId: string; contractId: string; reason: string };
  [DomainEvent.WORKFLOW_SLA_BREACHED]: { workflowId: string; contractId: string; level: string };
  [DomainEvent.SIGNATURE_COMPLETED]: { contractId: string; signatureId: string };
  [DomainEvent.SIGNATURE_REMINDER]: { contractId: string; signatureId: string; recipientId: string };
  [DomainEvent.OBLIGATION_DUE_SOON]: { obligationId: string; obligationType: string; dueDate: string; recipientId: string; tenantId: string };
  [DomainEvent.OBLIGATION_OVERDUE]: { obligationId: string; obligationType: string; recipientId: string; tenantId: string };
}
