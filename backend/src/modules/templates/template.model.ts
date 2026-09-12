import { Schema, model, Document, Types } from 'mongoose';
import { tenantScopePlugin } from '../../core/tenancy/tenant-scope.plugin';
import { realtimeBroadcastPlugin } from '../../core/realtime/realtime-broadcast.plugin';

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean';
  required: boolean;
}

export interface TemplateSection {
  title: string;
  order: number;
  clauses: Types.ObjectId[];
}

export interface ITemplate extends Document {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  name: string;
  contractType: string;
  sections: TemplateSection[];
  variables: TemplateVariable[];
  isActive: boolean;
  createdBy: Types.ObjectId;
  
  
  
  
  
  
  
  
  
  currentVersion: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const variableSchema = new Schema<TemplateVariable>(
  {
    name: { type: String, required: true },
    label: { type: String, required: true },
    type: { type: String, enum: ['text', 'number', 'date', 'boolean'], required: true },
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

const sectionSchema = new Schema<TemplateSection>(
  {
    title: { type: String, required: true },
    order: { type: Number, required: true },
    clauses: [{ type: Schema.Types.ObjectId, ref: 'Clause' }],
  },
  { _id: false }
);

const templateSchema = new Schema<ITemplate>(
  {
    name: { type: String, required: true, trim: true },
    contractType: { type: String, required: true, index: true },
    sections: { type: [sectionSchema], default: [] },
    variables: { type: [variableSchema], default: [] },
    isActive: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    currentVersion: { type: Schema.Types.ObjectId, ref: 'TemplateVersion', default: null },
  },
  { timestamps: true }
);

templateSchema.plugin(tenantScopePlugin);
templateSchema.plugin(realtimeBroadcastPlugin);

export const TemplateModel = model<ITemplate>('Template', templateSchema);
