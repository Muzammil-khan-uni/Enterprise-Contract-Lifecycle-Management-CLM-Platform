import { NotificationType } from './notification.types';

export interface NotificationJobData {
  tenantId: string;
  recipient: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedContract?: string;
  relatedObligation?: string;
}
