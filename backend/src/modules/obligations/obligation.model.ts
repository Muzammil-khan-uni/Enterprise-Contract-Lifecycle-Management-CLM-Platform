import { Schema, model, Document, Types } from 'mongoose';
import { ObligationType, ObligationStatus, RecurrenceInterval } from './obligation.types';
import { tenantScopePlugin } from '../../core/tenancy/tenant-scope.plugin';
import { realtimeBroadcastPlugin } from '../../core/realtime/realtime-broadcast.plugin';

export interface IObligation extends Document {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  contract: Types.ObjectId;
  type: ObligationType;
  description: string;
  dueDate: Date;
  assignedTo: Types.ObjectId | null;
  status: ObligationStatus;
  recurrence: RecurrenceInterval;
  completedAt: Date | null;
  completedBy: Types.ObjectId | null;
  evidence: Types.ObjectId | null; 
  amount: number | null; 
  currency: string | null; 
  slaThreshold: string | null; 
  slaPenalty: string | null; 
  breached: boolean; 
  createdAt: Date;
  updatedAt: Date;
}

const obligationSchema = new Schema<IObligation>(
  {
    contract: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    type: { type: String, enum: Object.values(ObligationType), required: true },
    description: { type: String, required: true },
    dueDate: { type: Date, required: true, index: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    status: { type: String, enum: Object.values(ObligationStatus), default: ObligationStatus.PENDING, index: true },
    recurrence: { type: String, enum: Object.values(RecurrenceInterval), default: RecurrenceInterval.NONE },
    completedAt: { type: Date, default: null },
    completedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    evidence: { type: Schema.Types.ObjectId, ref: 'Document', default: null },
    amount: { type: Number, default: null },
    currency: { type: String, default: null },
    slaThreshold: { type: String, default: null },
    slaPenalty: { type: String, default: null },
    breached: { type: Boolean, default: false },
  },
  { timestamps: true }
);

obligationSchema.index({ status: 1, dueDate: 1 });
obligationSchema.index({ assignedTo: 1, status: 1 });

obligationSchema.plugin(tenantScopePlugin);
obligationSchema.plugin(realtimeBroadcastPlugin);

export const ObligationModel = model<IObligation>('Obligation', obligationSchema);
