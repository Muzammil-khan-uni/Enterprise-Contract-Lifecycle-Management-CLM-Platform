import { Schema, model, Document, Types } from 'mongoose';
import { tenantScopePlugin } from '../../core/tenancy/tenant-scope.plugin';
import { realtimeBroadcastPlugin } from '../../core/realtime/realtime-broadcast.plugin';

export interface IClause extends Document {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  title: string;
  category: string;
  text: string; 
  isMandatory: boolean;
  applicableContractTypes: string[];
  createdAt: Date;
  updatedAt: Date;
}

const clauseSchema = new Schema<IClause>(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    text: { type: String, required: true },
    isMandatory: { type: Boolean, default: false },
    applicableContractTypes: { type: [String], default: [] },
  },
  { timestamps: true }
);

clauseSchema.plugin(tenantScopePlugin);
clauseSchema.plugin(realtimeBroadcastPlugin);

export const ClauseModel = model<IClause>('Clause', clauseSchema);
