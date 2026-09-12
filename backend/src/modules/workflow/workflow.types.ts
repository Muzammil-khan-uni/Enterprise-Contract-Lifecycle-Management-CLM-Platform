import { Permission } from '../users/user.types';

export enum ApprovalLevel {
  LEGAL = 'Legal',
  FINANCE = 'Finance',
  EXECUTIVE = 'Executive',
}

export const APPROVAL_LEVEL_ORDER: ApprovalLevel[] = [
  ApprovalLevel.LEGAL,
  ApprovalLevel.FINANCE,
  ApprovalLevel.EXECUTIVE,
];

export const APPROVAL_LEVEL_PERMISSION: Record<ApprovalLevel, Permission> = {
  [ApprovalLevel.LEGAL]: Permission.WORKFLOW_APPROVE_LEGAL,
  [ApprovalLevel.FINANCE]: Permission.WORKFLOW_APPROVE_FINANCE,
  [ApprovalLevel.EXECUTIVE]: Permission.WORKFLOW_APPROVE_EXECUTIVE,
};

export enum StepStatus {
  PENDING = 'Pending',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  ESCALATED = 'Escalated',
  SKIPPED = 'Skipped',
}

export enum WorkflowStatus {
  IN_PROGRESS = 'InProgress',
  APPROVED = 'Approved',
  REJECTED = 'Rejected',
  CANCELLED = 'Cancelled',
}
