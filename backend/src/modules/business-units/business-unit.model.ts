import { Schema, model, Document, Types } from 'mongoose';
import { tenantScopePlugin } from '../../core/tenancy/tenant-scope.plugin';
import { realtimeBroadcastPlugin } from '../../core/realtime/realtime-broadcast.plugin';

export interface IBusinessUnit extends Document {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  name: string;
  code: string;
  parentUnit: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const businessUnitSchema = new Schema<IBusinessUnit>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    parentUnit: { type: Schema.Types.ObjectId, ref: 'BusinessUnit', default: null },
  },
  { timestamps: true }
);

businessUnitSchema.index({ tenant: 1, code: 1 }, { unique: true });
businessUnitSchema.plugin(tenantScopePlugin);
businessUnitSchema.plugin(realtimeBroadcastPlugin);

export const BusinessUnitModel = model<IBusinessUnit>('BusinessUnit', businessUnitSchema);
