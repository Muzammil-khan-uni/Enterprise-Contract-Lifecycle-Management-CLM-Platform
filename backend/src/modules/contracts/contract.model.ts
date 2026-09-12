import { Schema, model, Document, Types } from 'mongoose';
import { ContractType, ContractStatus, PartyType, ContractParty } from './contract.types';
import { tenantScopePlugin } from '../../core/tenancy/tenant-scope.plugin';
import { realtimeBroadcastPlugin } from '../../core/realtime/realtime-broadcast.plugin';

export interface IContract extends Document {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  contractNumber: string;
  title: string;
  contractType: ContractType;
  department: Types.ObjectId;
  businessUnit: Types.ObjectId;
  parties: ContractParty[];
  effectiveDate: Date | null;
  expiryDate: Date | null;
  governingLawCountry: string | null;
  timezone: string;
  status: ContractStatus;
  currentVersion: Types.ObjectId | null;
  activeWorkflow: Types.ObjectId | null;
  contractValue: number | null;
  currency: string | null;
  tags: string[];
  confidentialityLevel: 'Public' | 'Internal' | 'Confidential' | 'Restricted';
  createdBy: Types.ObjectId;
  owner: Types.ObjectId;
  
  
  
  
  
  
  renewedFrom: Types.ObjectId | null;
  renewedTo: Types.ObjectId | null;
  
  
  
  
  
  
  
  
  
  
  
  sourceTemplate: Types.ObjectId | null;
  sourceTemplateVersionNumber: number | null;
  createdAt: Date;
  updatedAt: Date;
}

const partySchema = new Schema<ContractParty>(
  {
    partyType: { type: String, enum: Object.values(PartyType), required: true },
    refId: { type: Schema.Types.ObjectId, refPath: 'parties.partyType' },
    name: { type: String, required: true },
    role: { type: String, required: true },
  },
  { _id: false }
);

const contractSchema = new Schema<IContract>(
  {
    contractNumber: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true, index: 'text' },
    contractType: { type: String, enum: Object.values(ContractType), required: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    businessUnit: { type: Schema.Types.ObjectId, ref: 'BusinessUnit', required: true, index: true },
    parties: { type: [partySchema], default: [] },
    effectiveDate: { type: Date, default: null },
    expiryDate: { type: Date, default: null, index: true },
    governingLawCountry: { type: String, default: null },
    timezone: { type: String, default: 'UTC' },
    status: {
      type: String,
      enum: Object.values(ContractStatus),
      default: ContractStatus.DRAFT,
      index: true,
    },
    currentVersion: { type: Schema.Types.ObjectId, ref: 'ContractVersion', default: null },
    activeWorkflow: { type: Schema.Types.ObjectId, ref: 'ApprovalWorkflow', default: null },
    contractValue: { type: Number, default: null },
    currency: { type: String, default: null },
    tags: { type: [String], default: [] },
    confidentialityLevel: {
      type: String,
      enum: ['Public', 'Internal', 'Confidential', 'Restricted'],
      default: 'Internal',
    },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    renewedFrom: { type: Schema.Types.ObjectId, ref: 'Contract', default: null, index: true },
    renewedTo: { type: Schema.Types.ObjectId, ref: 'Contract', default: null },
    sourceTemplate: { type: Schema.Types.ObjectId, ref: 'Template', default: null },
    sourceTemplateVersionNumber: { type: Number, default: null },
  },
  { timestamps: true }
);

contractSchema.index({ expiryDate: 1, status: 1 });

contractSchema.index({ status: 1, effectiveDate: 1 });
contractSchema.index({ status: 1, expiryDate: 1 });

contractSchema.index({ tenant: 1, _id: 1 });
contractSchema.index({ tenant: 1, status: 1, _id: 1 });
contractSchema.index({ tenant: 1, businessUnit: 1, _id: 1 });
contractSchema.index({ tenant: 1, department: 1, _id: 1 });

contractSchema.index({ tenant: 1, contractNumber: 1 }, { unique: true });

contractSchema.plugin(tenantScopePlugin);
contractSchema.plugin(realtimeBroadcastPlugin);

export const ContractModel = model<IContract>('Contract', contractSchema);
