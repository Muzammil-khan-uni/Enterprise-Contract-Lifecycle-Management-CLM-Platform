import { Schema, model, Document, Types } from 'mongoose';
import { UserRole, Permission } from './user.types';
import { realtimeBroadcastPlugin } from '../../core/realtime/realtime-broadcast.plugin';

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  permissionOverrides: Permission[];
  businessUnit: Types.ObjectId | null;
  department: Types.ObjectId | null;
  tenant: Types.ObjectId;
  country: string | null;
  avatarUrl: string | null;
  
  
  
  
  
  avatarStorageKey: string | null;
  bio: string | null;
  isActive: boolean;
  isPlatformSuperAdmin: boolean;
  tokenVersion: number;
  lastLoginAt: Date | null;
  
  
  failedLoginAttempts: number;
  lockedUntil: Date | null;
  
  
  
  
  
  emailVerified: boolean;
  emailVerificationTokenHash: string | null;
  emailVerificationExpires: Date | null;
  
  
  
  passwordResetTokenHash: string | null;
  passwordResetExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(UserRole), required: true, index: true },
    permissionOverrides: { type: [String], enum: Object.values(Permission), default: [] },
    businessUnit: { type: Schema.Types.ObjectId, ref: 'BusinessUnit', default: null, index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    tenant: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    country: { type: String, default: null },
    avatarUrl: { type: String, default: null },
    avatarStorageKey: { type: String, default: null },
    bio: { type: String, default: null, maxlength: 500, trim: true },
    isActive: { type: Boolean, default: true },
    
    
    
    
    isPlatformSuperAdmin: { type: Boolean, default: false, index: true },
    tokenVersion: { type: Number, default: 0 },
    lastLoginAt: { type: Date, default: null },
    failedLoginAttempts: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
    emailVerified: { type: Boolean, default: false },
    emailVerificationTokenHash: { type: String, default: null, select: false, index: true },
    emailVerificationExpires: { type: Date, default: null },
    passwordResetTokenHash: { type: String, default: null, select: false, index: true },
    passwordResetExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index({ tenant: 1, email: 1 }, { unique: true });

userSchema.plugin(realtimeBroadcastPlugin);

export const UserModel = model<IUser>('User', userSchema);
