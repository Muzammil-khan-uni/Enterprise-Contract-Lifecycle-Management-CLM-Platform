import bcrypt from 'bcryptjs';
import { userRepository } from './user.repository';
import { getRolePermissions } from '../../core/middleware/permissions.config';
import { UserRole, Permission } from './user.types';
import { IUser } from './user.model';
import { AppError } from '../../core/errors/AppError';
import { TenantModel } from '../tenants/tenant.model';
import { emailProvider } from '../../core/email/email.provider';
import { generateSecureToken } from '../../core/utils/secure-token.util';
import { env } from '../../config/env';
import { logger } from '../../core/utils/logger';
import { storageProvider as avatarStorageProvider } from '../documents/storage.provider';

const BCRYPT_ROUNDS = 12;
const AVATAR_MAX_UPLOAD_BYTES = 5 * 1024 * 1024; 
const AVATAR_ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const AVATAR_FOLDER = 'clm-platform/avatars';

function hasValidAvatarSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === 'image/jpeg') return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (mimeType === 'image/webp') {
    return buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WEBP';
  }
  return false;
}

function isDuplicateKeyError(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { code?: number }).code === 11000;
}

function getEffectivePermissions(role: UserRole, overrides: Permission[]): Permission[] {
  const base = getRolePermissions(role);
  const merged = new Set([...base, ...overrides]);
  return Array.from(merged);
}

function isAccountLocked(user: Pick<IUser, 'lockedUntil'>): boolean {
  return !!user.lockedUntil && user.lockedUntil.getTime() > Date.now();
}

async function sendVerificationEmail(user: Pick<IUser, '_id' | 'email' | 'name'>): Promise<void> {
  const { token, tokenHash } = generateSecureToken();
  const expires = new Date(Date.now() + env.EMAIL_VERIFICATION_TOKEN_HOURS * 60 * 60 * 1000);
  await userRepository.setEmailVerificationToken(user._id.toString(), tokenHash, expires);

  const verifyUrl = `${env.APP_BASE_URL}/verify-email?token=${token}`;
  await emailProvider.send({
    to: user.email,
    subject: 'Verify your email',
    body: `Hi ${user.name},\n\nVerify your email by visiting:\n${verifyUrl}\n\nThis link expires in ${env.EMAIL_VERIFICATION_TOKEN_HOURS} hours.`,
  });
}

export const userService = {
  getEffectivePermissions,
  isAccountLocked,
  sendVerificationEmail,

  async hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, BCRYPT_ROUNDS);
  },

  async verifyPassword(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  },

  

  async recordFailedLogin(userId: string): Promise<{ justLocked: boolean }> {
    const updated = await userRepository.incrementFailedLoginAttempts(userId);
    if (updated && updated.failedLoginAttempts >= env.MAX_FAILED_LOGIN_ATTEMPTS) {
      const until = new Date(Date.now() + env.ACCOUNT_LOCK_MINUTES * 60 * 1000);
      await userRepository.lockAccount(userId, until);
      logger.warn('Account locked after repeated failed login attempts', { userId });
      return { justLocked: true };
    }
    return { justLocked: false };
  },

  async recordSuccessfulLogin(userId: string): Promise<void> {
    await userRepository.clearFailedLoginAttempts(userId);
  },

  

  async createUser(
    input: {
      name: string;
      email: string;
      password: string;
      role?: string;
      tenantSlug?: string;
      tenantName?: string;
      businessUnit?: string | null;
      department?: string | null;
      country?: string | null;
    },
    actor?: { tenantId: string }
  ) {
    let tenantId: string;
    let role: UserRole;

    if (actor) {
      tenantId = actor.tenantId;
      if (!input.role || !Object.values(UserRole).includes(input.role as UserRole)) {
        throw AppError.badRequest('A valid role is required when creating a user as an Admin');
      }
      role = input.role as UserRole;
    } else {
      if (!input.tenantSlug) {
        throw AppError.badRequest('tenantSlug is required to register without an existing account');
      }
      const normalizedSlug = input.tenantSlug.toLowerCase().trim();
      let tenant = await TenantModel.findOne({ slug: normalizedSlug });

      if (!tenant) {
        
        
        
        
        
        
        
        
        
        
        
        try {
          tenant = await TenantModel.create({
            name: input.tenantName?.trim() || input.tenantSlug,
            slug: normalizedSlug,
          });
        } catch (err) {
          
          
          
          
          
          
          if (isDuplicateKeyError(err)) {
            throw AppError.conflict(
              `"${input.tenantSlug}" was just claimed by another signup. Please choose a different organization slug.`
            );
          }
          throw err;
        }
      } else if (!tenant.isActive) {
        
        
        
        
        throw AppError.badRequest(`No active organization found for "${input.tenantSlug}"`);
      } else {
        const memberCount = await userRepository.count({ tenant: tenant._id });
        if (memberCount > 0) {
          throw AppError.forbidden(
            'This organization already has members. Ask an existing Admin to create your account instead of self-registering.'
          );
        }
      }

      tenantId = tenant._id.toString();
      role = UserRole.ADMIN;
    }

    
    
    
    
    const existing = await userRepository.findByEmail(input.email, tenantId);
    if (existing) {
      throw AppError.conflict('A user with this email already exists in this organization');
    }

    const passwordHash = await this.hashPassword(input.password);

    const user = await userRepository.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
      role,
      businessUnit: (input.businessUnit as unknown as null) ?? null,
      department: (input.department as unknown as null) ?? null,
      tenant: tenantId as never,
      country: input.country ?? null,
      permissionOverrides: [],
      isActive: true,
      tokenVersion: 0,
      lastLoginAt: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      emailVerified: false,
      emailVerificationTokenHash: null,
      emailVerificationExpires: null,
      passwordResetTokenHash: null,
      passwordResetExpires: null,
    });

    
    
    
    
    
    await sendVerificationEmail(user).catch((err) => {
      logger.error('Failed to send verification email after registration', {
        userId: user._id.toString(),
        error: (err as Error).message,
      });
    });

    return user;
  },

  

  async updateUser(
    targetId: string,
    tenantId: string,
    actorId: string,
    updates: {
      role?: UserRole;
      businessUnit?: string | null;
      department?: string | null;
      permissionOverrides?: Permission[];
      isActive?: boolean;
    }
  ) {
    const target = await userRepository.findByIdInTenant(targetId, tenantId);
    if (!target) throw AppError.notFound('User not found');

    if (targetId === actorId && updates.isActive === false) {
      throw AppError.badRequest('You cannot deactivate your own account');
    }
    if (targetId === actorId && updates.role && updates.role !== UserRole.ADMIN) {
      throw AppError.badRequest('You cannot remove your own Admin role');
    }

    const patch: Partial<IUser> = {};
    if (updates.role !== undefined) patch.role = updates.role;
    if (updates.businessUnit !== undefined) patch.businessUnit = updates.businessUnit as unknown as IUser['businessUnit'];
    if (updates.department !== undefined) patch.department = updates.department as unknown as IUser['department'];
    if (updates.permissionOverrides !== undefined) patch.permissionOverrides = updates.permissionOverrides;
    if (updates.isActive !== undefined) patch.isActive = updates.isActive;

    const updated = await userRepository.updateById(targetId, patch);

    
    
    
    
    
    
    if (updates.role !== undefined || updates.isActive !== undefined) {
      await userRepository.incrementTokenVersion(targetId);
    }

    return updated;
  },

  

  async updateOwnProfile(userId: string, updates: { name: string; bio?: string | null }) {
    const update: { name: string; bio?: string | null } = { name: updates.name };
    
    
    
    
    if (updates.bio !== undefined) update.bio = updates.bio || null;
    const updated = await userRepository.updateById(userId, update);
    if (!updated) throw AppError.notFound('User not found');
    return updated;
  },

  

  async uploadAvatar(
    userId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number }
  ) {
    if (!AVATAR_ALLOWED_MIME_TYPES.has(file.mimetype)) {
      throw AppError.badRequest('Profile photos must be a PNG or JPEG image');
    }
    if (file.size > AVATAR_MAX_UPLOAD_BYTES) {
      throw AppError.badRequest('Profile photos must be 5MB or smaller');
    }
    if (!hasValidAvatarSignature(file.buffer, file.mimetype)) {
      throw AppError.badRequest('The uploaded profile photo content does not match its declared image type');
    }

    const existing = await userRepository.findById(userId);
    if (!existing) throw AppError.notFound('User not found');

    const uploaded = await avatarStorageProvider.upload(file.buffer, file.originalname, file.mimetype, AVATAR_FOLDER);

    const updated = await userRepository.updateById(userId, {
      avatarUrl: uploaded.storageUrl,
      avatarStorageKey: uploaded.storageKey,
    });
    if (!updated) throw AppError.notFound('User not found');

    if (existing.avatarStorageKey) {
      await avatarStorageProvider.delete(existing.avatarStorageKey).catch((err) => {
        logger.warn('Failed to delete replaced avatar from storage', { userId, err });
      });
    }

    return updated;
  },

  
  async deleteAvatar(userId: string) {
    const existing = await userRepository.findById(userId);
    if (!existing) throw AppError.notFound('User not found');

    if (existing.avatarStorageKey) {
      await avatarStorageProvider.delete(existing.avatarStorageKey).catch((err) => {
        logger.warn('Failed to delete avatar from storage', { userId, err });
      });
    }

    const updated = await userRepository.updateById(userId, { avatarUrl: null, avatarStorageKey: null });
    if (!updated) throw AppError.notFound('User not found');
    return updated;
  },
};
