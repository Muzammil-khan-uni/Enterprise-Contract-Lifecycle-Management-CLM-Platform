import { Schema, model, Document, Types } from 'mongoose';
import { tenantScopePlugin } from '../../core/tenancy/tenant-scope.plugin';
import { realtimeBroadcastPlugin } from '../../core/realtime/realtime-broadcast.plugin';
import { TemplateVariable, TemplateSection } from './template.model';

export interface ITemplateVersion extends Document {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  template: Types.ObjectId;
  versionNumber: number;
  name: string;
  contractType: string;
  sections: TemplateSection[];
  variables: TemplateVariable[];
  changeSummary: string | null;
  editedBy: Types.ObjectId;
  isRollbackOf: Types.ObjectId | null;
  createdAt: Date;
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

const templateVersionSchema = new Schema<ITemplateVersion>(
  {
    template: { type: Schema.Types.ObjectId, ref: 'Template', required: true, index: true },
    versionNumber: { type: Number, required: true },
    name: { type: String, required: true },
    contractType: { type: String, required: true },
    sections: { type: [sectionSchema], default: [] },
    variables: { type: [variableSchema], default: [] },
    changeSummary: { type: String, default: null },
    editedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isRollbackOf: { type: Schema.Types.ObjectId, ref: 'TemplateVersion', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

templateVersionSchema.index({ tenant: 1, template: 1, versionNumber: 1 }, { unique: true });
templateVersionSchema.plugin(tenantScopePlugin);
templateVersionSchema.plugin(realtimeBroadcastPlugin);

export const TemplateVersionModel = model<ITemplateVersion>('TemplateVersion', templateVersionSchema);
