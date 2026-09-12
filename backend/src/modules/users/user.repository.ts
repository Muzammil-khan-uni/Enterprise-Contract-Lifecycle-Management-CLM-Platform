import { BaseRepository } from '../../core/base/BaseRepository';
import { UserModel, IUser } from './user.model';
import { UserRole } from './user.types';

class UserRepository extends BaseRepository<IUser> {
  constructor() {
    super(UserModel);
  }

  async findByEmailWithPassword(email: string, tenantId: string) {
    return UserModel.findOne({ email: email.toLowerCase(), tenant: tenantId }).select('+passwordHash').exec();
  }

  async findByEmail(email: string, tenantId: string) {
    return UserModel.findOne({ email: email.toLowerCase(), tenant: tenantId }).exec();
  }

  async incrementTokenVersion(userId: string) {
    return UserModel.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } }, { new: true }).exec();
  }

  async touchLastLogin(userId: string) {
    return UserModel.findByIdAndUpdate(userId, { lastLoginAt: new Date() }).exec();
  }

  

  async incrementFailedLoginAttempts(userId: string) {
    return UserModel.findByIdAndUpdate(userId, { $inc: { failedLoginAttempts: 1 } }, { new: true }).exec();
  }

  async lockAccount(userId: string, until: Date) {
    return UserModel.findByIdAndUpdate(userId, { lockedUntil: until, failedLoginAttempts: 0 }).exec();
  }

  async clearFailedLoginAttempts(userId: string) {
    return UserModel.findByIdAndUpdate(userId, { failedLoginAttempts: 0, lockedUntil: null }).exec();
  }

  async setEmailVerificationToken(userId: string, tokenHash: string, expires: Date) {
    return UserModel.findByIdAndUpdate(userId, {
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpires: expires,
    }).exec();
  }

  

  async findByEmailVerificationToken(tokenHash: string) {
    return UserModel.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpires: { $gt: new Date() },
    })
      .select('+emailVerificationTokenHash')
      .exec();
  }

  async markEmailVerified(userId: string) {
    return UserModel.findByIdAndUpdate(userId, {
      emailVerified: true,
      emailVerificationTokenHash: null,
      emailVerificationExpires: null,
    }).exec();
  }

  async setPasswordResetToken(userId: string, tokenHash: string, expires: Date) {
    return UserModel.findByIdAndUpdate(userId, {
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: expires,
    }).exec();
  }

  
  async findByPasswordResetToken(tokenHash: string) {
    return UserModel.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    })
      .select('+passwordResetTokenHash')
      .exec();
  }

  

  async findActiveByRoles(roles: UserRole[], tenantId: string) {
    return UserModel.find({ tenant: tenantId, role: { $in: roles }, isActive: true }).limit(500).exec();
  }

  

  async listByTenant(tenantId: string, limit = 500) {
    return UserModel.find({ tenant: tenantId }).sort({ name: 1 }).limit(limit).exec();
  }

  async findByIdInTenant(id: string, tenantId: string) {
    return UserModel.findOne({ _id: id, tenant: tenantId }).exec();
  }
}

export const userRepository = new UserRepository();
