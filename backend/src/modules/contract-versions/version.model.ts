import { Schema, model, Document, Types } from 'mongoose';
import { realtimeBroadcastPlugin } from '../../core/realtime/realtime-broadcast.plugin';
import { tenantScopePlugin } from '../../core/tenancy/tenant-scope.plugin';

export interface IContractVersion extends Document {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  contract: Types.ObjectId;
  versionNumber: number;
  content: Record<string, unknown>;
  changedFields: string[];
  changeSummary: string | null;
  editedBy: Types.ObjectId;
  isRollbackOf: Types.ObjectId | null;
  createdAt: Date;
}

const versionSchema = new Schema<IContractVersion>(
  {
    contract: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    versionNumber: { type: Number, required: true },
    content: { type: Schema.Types.Mixed, required: true },
    changedFields: { type: [String], default: [] },
    changeSummary: { type: String, default: null },
    editedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isRollbackOf: { type: Schema.Types.ObjectId, ref: 'ContractVersion', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

versionSchema.index({ tenant: 1, contract: 1, versionNumber: 1 }, { unique: true });
versionSchema.plugin(tenantScopePlugin);
versionSchema.plugin(realtimeBroadcastPlugin);

export const ContractVersionModel = model<IContractVersion>('ContractVersion', versionSchema);
