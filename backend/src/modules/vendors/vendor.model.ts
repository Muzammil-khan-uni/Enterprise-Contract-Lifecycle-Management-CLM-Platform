import { Schema, model, Document, Types } from 'mongoose';
import { tenantScopePlugin } from '../../core/tenancy/tenant-scope.plugin';
import { realtimeBroadcastPlugin } from '../../core/realtime/realtime-broadcast.plugin';

export interface IVendor extends Document {
  _id: Types.ObjectId;
  tenant: Types.ObjectId;
  name: string;
  vendorCode: string;
  contactEmail: string | null;
  contactPhone: string | null;
  country: string;
  businessUnits: Types.ObjectId[];
  riskRating: 'Low' | 'Medium' | 'High' | null; 
  activeContractsCount: number; 
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<IVendor>(
  {
    name: { type: String, required: true, trim: true, index: true },
    vendorCode: { type: String, required: true, trim: true },
    contactEmail: { type: String, default: null },
    contactPhone: { type: String, default: null },
    country: { type: String, required: true },
    businessUnits: [{ type: Schema.Types.ObjectId, ref: 'BusinessUnit' }],
    riskRating: { type: String, enum: ['Low', 'Medium', 'High'], default: null },
    activeContractsCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

vendorSchema.index({ tenant: 1, vendorCode: 1 }, { unique: true });
vendorSchema.plugin(tenantScopePlugin);
vendorSchema.plugin(realtimeBroadcastPlugin);

export const VendorModel = model<IVendor>('Vendor', vendorSchema);
