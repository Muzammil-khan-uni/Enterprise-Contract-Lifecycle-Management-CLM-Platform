import { Schema, model, Document, Types } from 'mongoose';
import { SignerType, SignatureStatus, SignatureProviderName, SignatureAuditEntry } from './signature.types';
import { realtimeBroadcastPlugin } from '../../core/realtime/realtime-broadcast.plugin';
import { tenantScopePlugin } from '../../core/tenancy/tenant-scope.plugin';

export interface ISignature extends Document {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  contract: Types.ObjectId;
  signerType: SignerType;
  signer: Types.ObjectId | null; 
  externalSignerName: string | null;
  externalSignerEmail: string | null;
  signatureStatus: SignatureStatus;
  signedAt: Date | null;
  ipAddress: string | null;
  auditTrail: SignatureAuditEntry[];
  provider: SignatureProviderName;
  providerReferenceId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const auditEntrySchema = new Schema<SignatureAuditEntry>(
  {
    action: { type: String, required: true },
    timestamp: { type: Date, required: true },
    actor: { type: String, required: true },
  },
  { _id: false }
);

const signatureSchema = new Schema<ISignature>(
  {
    contract: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    signerType: { type: String, enum: Object.values(SignerType), required: true },
    signer: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    externalSignerName: { type: String, default: null },
    externalSignerEmail: { type: String, default: null },
    signatureStatus: { type: String, enum: Object.values(SignatureStatus), default: SignatureStatus.PENDING, index: true },
    signedAt: { type: Date, default: null },
    ipAddress: { type: String, default: null },
    auditTrail: { type: [auditEntrySchema], default: [] },
    provider: { type: String, enum: Object.values(SignatureProviderName), required: true },
    providerReferenceId: { type: String, default: null },
  },
  { timestamps: true }
);

signatureSchema.plugin(tenantScopePlugin);
signatureSchema.plugin(realtimeBroadcastPlugin);

signatureSchema.index({ tenant: 1, contract: 1 });

export const SignatureModel = model<ISignature>('Signature', signatureSchema);
