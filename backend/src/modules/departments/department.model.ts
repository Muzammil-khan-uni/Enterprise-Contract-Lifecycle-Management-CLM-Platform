import { Schema, model, Document, Types } from 'mongoose';
import { tenantScopePlugin } from '../../core/tenancy/tenant-scope.plugin';
import { realtimeBroadcastPlugin } from '../../core/realtime/realtime-broadcast.plugin';

export interface IDepartment extends Document {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  name: string;
  code: string;
  businessUnit: Types.ObjectId;
  headOfDept: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const departmentSchema = new Schema<IDepartment>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    businessUnit: { type: Schema.Types.ObjectId, ref: 'BusinessUnit', required: true, index: true },
    headOfDept: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

departmentSchema.index({ tenant: 1, code: 1 }, { unique: true });
departmentSchema.plugin(tenantScopePlugin);
departmentSchema.plugin(realtimeBroadcastPlugin);

export const DepartmentModel = model<IDepartment>('Department', departmentSchema);
