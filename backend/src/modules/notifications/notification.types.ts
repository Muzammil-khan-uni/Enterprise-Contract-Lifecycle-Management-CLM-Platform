

export enum NotificationType {
  CONTRACT_EXPIRY = 'ContractExpiry',
  APPROVAL_UPDATE = 'ApprovalUpdate',
  OBLIGATION_REMINDER = 'ObligationReminder',
  SLA_DEADLINE = 'SlaDeadline',
  SIGNATURE_UPDATE = 'SignatureUpdate',
}

export enum NotificationChannel {
  IN_APP = 'InApp',
  EMAIL = 'Email',
}

export enum NotificationStatus {
  PENDING = 'Pending',
  SENT = 'Sent',
  READ = 'Read',
  FAILED = 'Failed',
}
