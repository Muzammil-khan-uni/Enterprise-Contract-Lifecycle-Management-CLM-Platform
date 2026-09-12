import { Schema, model, Document, Types } from 'mongoose';
import { AuditAction } from './audit.types';
import { tenantScopePlugin } from '../../core/tenancy/tenant-scope.plugin';
import { realtimeBroadcastPlugin } from '../../core/realtime/realtime-broadcast.plugin';

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  actor: Types.ObjectId | null; 
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  timestamp: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    action: { type: String, enum: Object.values(AuditAction), required: true },
    entityType: { type: String, required: true, index: true },
    entityId: { type: String, default: null },
    changes: { type: Schema.Types.Mixed, default: null },
    ipAddress: { type: String, default: null },
    timestamp: { type: Date, default: () => new Date(), index: true },
  },
  { versionKey: false }
);

auditLogSchema.index({ entityType: 1, entityId: 1, timestamp: -1 });
auditLogSchema.index({ actor: 1, timestamp: -1 });
auditLogSchema.plugin(tenantScopePlugin);

auditLogSchema.plugin(realtimeBroadcastPlugin);

export const AuditLogModel = model<IAuditLog>('AuditLog', auditLogSchema);
