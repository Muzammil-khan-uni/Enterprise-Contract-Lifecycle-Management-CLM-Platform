import { Schema, model, Document, Types } from 'mongoose';
import { NotificationType, NotificationChannel, NotificationStatus } from './notification.types';
import { tenantScopePlugin } from '../../core/tenancy/tenant-scope.plugin';

export interface INotification extends Document {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  recipient: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  relatedContract: Types.ObjectId | null;
  relatedObligation: Types.ObjectId | null;
  channel: NotificationChannel;
  status: NotificationStatus;
  scheduledFor: Date;
  sentAt: Date | null;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: Object.values(NotificationType), required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    relatedContract: { type: Schema.Types.ObjectId, ref: 'Contract', default: null },
    relatedObligation: { type: Schema.Types.ObjectId, ref: 'Obligation', default: null },
    channel: { type: String, enum: Object.values(NotificationChannel), default: NotificationChannel.IN_APP },
    status: { type: String, enum: Object.values(NotificationStatus), default: NotificationStatus.PENDING, index: true },
    scheduledFor: { type: Date, default: () => new Date() },
    sentAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.index({ tenant: 1, recipient: 1, status: 1, createdAt: -1 });
notificationSchema.plugin(tenantScopePlugin);

export const NotificationModel = model<INotification>('Notification', notificationSchema);
