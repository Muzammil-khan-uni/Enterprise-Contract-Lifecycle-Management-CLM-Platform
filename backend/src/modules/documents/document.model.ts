import { Schema, model, Document as MongooseDocument, Types } from 'mongoose';
import { DocumentType } from './document.types';
import { realtimeBroadcastPlugin } from '../../core/realtime/realtime-broadcast.plugin';
import { tenantScopePlugin } from '../../core/tenancy/tenant-scope.plugin';

export interface IDocumentFile extends MongooseDocument {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  contract: Types.ObjectId;
  type: DocumentType;
  fileName: string;
  storageKey: string; 
  storageUrl: string; 
  mimeType: string;
  sizeBytes: number;
  uploadedBy: Types.ObjectId;
  version: number;
  ocrText: string | null; 
  createdAt: Date;
  updatedAt: Date;
}

const documentSchema = new Schema<IDocumentFile>(
  {
    contract: { type: Schema.Types.ObjectId, ref: 'Contract', required: true, index: true },
    type: { type: String, enum: Object.values(DocumentType), required: true },
    fileName: { type: String, required: true },
    storageKey: { type: String, required: true },
    storageUrl: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    version: { type: Number, default: 1 },
    ocrText: { type: String, default: null },
  },
  { timestamps: true }
);

documentSchema.plugin(tenantScopePlugin);
documentSchema.plugin(realtimeBroadcastPlugin);

documentSchema.index({ tenant: 1, contract: 1 });

export const DocumentModel = model<IDocumentFile>('Document', documentSchema);
