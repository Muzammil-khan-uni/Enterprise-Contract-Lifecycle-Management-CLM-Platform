import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '../../config/env';
import { redisClient } from '../../config/redis';
import { userRepository } from '../users/user.repository';
import { userService } from '../users/user.service';
import { TenantModel } from '../tenants/tenant.model';
import { AppError } from '../../core/errors/AppError';
import { logger } from '../../core/utils/logger';
import { IUser, UserModel } from '../users/user.model';
import { JwtAccessPayload, JwtRefreshPayload } from '../users/user.types';
import { emailProvider } from '../../core/email/email.provider';
import { generateSecureToken, hashSecureToken } from '../../core/utils/secure-token.util';

function signAccessToken(user: IUser): string {
  const payload: JwtAccessPayload = {
    sub: user._id.toString(),
    role: user.role,
    businessUnit: user.businessUnit ? user.businessUnit.toString() : null,
    tenant: user.tenant.toString(),
    permissions: userService.getEffectivePermissions(user.role, user.permissionOverrides),
    isPlatformSuperAdmin: user.isPlatformSuperAdmin,
  };
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY,
  } as SignOptions);
}

function signRefreshToken(user: IUser): string {
  const payload: JwtRefreshPayload = {
    sub: user._id.toString(),
    tokenVersion: user.tokenVersion,
  };
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY,
  } as SignOptions);
}

function refreshSetKey(userId: string, tokenVersion: number) {
  return `refresh:${userId}:${tokenVersion}`;
}

export const authService = {
  

  async login(email: string, password: string, tenantSlug: string) {
    const tenant = await TenantModel.findOne({ slug: tenantSlug.toLowerCase(), isActive: true });
    if (!tenant) {
      throw AppError.unauthorized('Invalid email or password');
    }

    const user = await userRepository.findByEmailWithPassword(email, tenant._id.toString());
    if (!user) {
      
      
      
      
      throw AppError.unauthorized('Invalid email or password');
    }

    if (!user.isActive) {
      throw AppError.forbidden('This account has been deactivated');
    }

    if (userService.isAccountLocked(user)) {
      const minutesLeft = Math.ceil(((user.lockedUntil as Date).getTime() - Date.now()) / 60000);
      throw AppError.locked(`This account is temporarily locked due to repeated failed login attempts. Try again in ${minutesLeft} minute(s).`);
    }

    const passwordValid = await userService.verifyPassword(password, user.passwordHash);
    if (!passwordValid) {
      const { justLocked } = await userService.recordFailedLogin(user._id.toString());
      if (justLocked) {
        throw AppError.locked(
          `Too many failed login attempts. This account is now locked for ${env.ACCOUNT_LOCK_MINUTES} minutes.`
        );
      }
      throw AppError.unauthorized('Invalid email or password');
    }

    if (env.REQUIRE_EMAIL_VERIFICATION && !user.emailVerified) {
      
      
      
      
      throw AppError.forbidden('Please verify your email before logging in. Check your inbox for the verification link.');
    }

    await userService.recordSuccessfulLogin(user._id.toString());

    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);

    await redisClient.sadd(refreshSetKey(user._id.toString(), user.tokenVersion), refreshToken);
    await redisClient.expire(refreshSetKey(user._id.toString(), user.tokenVersion), 60 * 60 * 24 * 30);

    await userRepository.touchLastLogin(user._id.toString());

    logger.info('User logged in', { userId: user._id.toString() });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        businessUnit: user.businessUnit,
        department: user.department,
        tenant: user.tenant.toString(),
        emailVerified: user.emailVerified,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        permissions: userService.getEffectivePermissions(user.role, user.permissionOverrides),
      },
    };
  },

  async refresh(refreshToken: string) {
    let payload: JwtRefreshPayload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    const user = await userRepository.findById(payload.sub);
    if (!user || !user.isActive) {
      throw AppError.unauthorized('Account no longer active');
    }

    
    
    if (user.tokenVersion !== payload.tokenVersion) {
      throw AppError.unauthorized('Session has been invalidated, please log in again');
    }

    const isKnown = await redisClient.sismember(
      refreshSetKey(user._id.toString(), user.tokenVersion),
      refreshToken
    );
    if (!isKnown) {
      throw AppError.unauthorized('Refresh token is not recognized (possibly already used or revoked)');
    }

    
    
    
    
    const newAccessToken = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);
    const rotationResult = await redisClient.eval(
      `if redis.call('SISMEMBER', KEYS[1], ARGV[1]) == 0 then return 0 end
       redis.call('SREM', KEYS[1], ARGV[1])
       redis.call('SADD', KEYS[1], ARGV[2])
       return 1`,
      1,
      refreshSetKey(user._id.toString(), user.tokenVersion),
      refreshToken,
      newRefreshToken
    );
    if (rotationResult !== 1) {
      throw AppError.unauthorized('Refresh token is no longer valid');
    }

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken: string) {
    try {
      const payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as JwtRefreshPayload;
      await redisClient.srem(refreshSetKey(payload.sub, payload.tokenVersion), refreshToken);
    } catch {
      
    }
  },

  async logoutAllSessions(userId: string) {
    const updated = await userRepository.incrementTokenVersion(userId);
    if (!updated) throw AppError.notFound('User not found');
    logger.info('All sessions invalidated for user', { userId });
  },

  

  async forgotPassword(email: string, tenantSlug: string): Promise<void> {
    const tenant = await TenantModel.findOne({ slug: tenantSlug.toLowerCase(), isActive: true });
    if (!tenant) return;

    const user = await userRepository.findByEmail(email, tenant._id.toString());
    if (!user || !user.isActive) return;

    const { token, tokenHash } = generateSecureToken();
    const expires = new Date(Date.now() + env.PASSWORD_RESET_TOKEN_MINUTES * 60 * 1000);
    await userRepository.setPasswordResetToken(user._id.toString(), tokenHash, expires);

    const resetUrl = `${env.APP_BASE_URL}/reset-password?token=${token}`;
    await emailProvider.send({
      to: user.email,
      subject: 'Reset your password',
      body: `Hi ${user.name},\n\nReset your password by visiting:\n${resetUrl}\n\nThis link expires in ${env.PASSWORD_RESET_TOKEN_MINUTES} minutes. If you didn't request this, you can safely ignore this email.`,
    });

    logger.info('Password reset requested', { userId: user._id.toString() });
  },

  

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashSecureToken(token);
    const user = await userRepository.findByPasswordResetToken(tokenHash);
    if (!user) {
      throw AppError.badRequest('This password reset link is invalid or has expired. Request a new one.');
    }

    const passwordHash = await userService.hashPassword(newPassword);
    await UserModel.findByIdAndUpdate(user._id, {
      passwordHash,
      passwordResetTokenHash: null,
      passwordResetExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      $inc: { tokenVersion: 1 },
    }).exec();

    
    
    
    

    logger.info('Password reset completed', { userId: user._id.toString() });
  },

  

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await UserModel.findById(userId).select('+passwordHash').exec();
    if (!user) throw AppError.notFound('User not found');

    const matches = await userService.verifyPassword(currentPassword, user.passwordHash);
    if (!matches) throw AppError.badRequest('Current password is incorrect');

    const passwordHash = await userService.hashPassword(newPassword);
    await UserModel.findByIdAndUpdate(userId, {
      passwordHash,
      $inc: { tokenVersion: 1 },
    }).exec();

    
    
    

    logger.info('Password changed by user', { userId });
  },

  async verifyEmail(token: string): Promise<void> {
    const tokenHash = hashSecureToken(token);
    const user = await userRepository.findByEmailVerificationToken(tokenHash);
    if (!user) {
      throw AppError.badRequest('This verification link is invalid or has expired. Request a new one.');
    }
    await userRepository.markEmailVerified(user._id.toString());
    logger.info('Email verified', { userId: user._id.toString() });
  },

  

  async resendVerificationEmail(userId: string): Promise<void> {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound('User not found');
    if (user.emailVerified) {
      throw AppError.conflict('This email is already verified');
    }
    await userService.sendVerificationEmail(user);
  },
};
