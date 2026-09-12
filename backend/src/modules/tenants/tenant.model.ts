import { Schema, model, Document, Types } from 'mongoose';

export interface ITenant extends Document {
  _id: Types.ObjectId;
  name: string;
  slug: string; 
  plan: 'Free' | 'Standard' | 'Enterprise';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const tenantSchema = new Schema<ITenant>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    plan: { type: String, enum: ['Free', 'Standard', 'Enterprise'], default: 'Free' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const TenantModel = model<ITenant>('Tenant', tenantSchema);
