export type NotificationType =
  | 'ContractExpiry'
  | 'ApprovalUpdate'
  | 'ObligationReminder'
  | 'SlaDeadline'
  | 'SignatureUpdate';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: string;
  read?: boolean;
}
