

jest.mock('../../src/modules/users/user.repository', () => ({
  userRepository: {
    findByEmail: jest.fn(),
    setPasswordResetToken: jest.fn().mockResolvedValue(undefined),
    findByPasswordResetToken: jest.fn(),
  },
}));
jest.mock('../../src/modules/tenants/tenant.model', () => ({
  TenantModel: { findOne: jest.fn() },
}));
jest.mock('../../src/core/email/email.provider', () => ({
  emailProvider: { name: 'console', send: jest.fn().mockResolvedValue(undefined) },
}));
jest.mock('../../src/config/redis', () => ({
  redisClient: { keys: jest.fn().mockResolvedValue([]), del: jest.fn() },
}));

import { userRepository } from '../../src/modules/users/user.repository';
import { TenantModel } from '../../src/modules/tenants/tenant.model';
import { emailProvider } from '../../src/core/email/email.provider';
import { authService } from '../../src/modules/auth/auth.service';
import { UserModel } from '../../src/modules/users/user.model';

jest.mock('../../src/modules/users/user.model', () => ({
  UserModel: { findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(undefined) }) },
}));

describe('authService.forgotPassword — non-enumeration', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resolves silently (no throw) for an unknown tenant', async () => {
    (TenantModel.findOne as jest.Mock).mockResolvedValue(null);
    await expect(authService.forgotPassword('jane@example.com', 'ghost-co')).resolves.toBeUndefined();
    expect(emailProvider.send).not.toHaveBeenCalled();
  });

  it('resolves silently for an unknown email within a real tenant', async () => {
    (TenantModel.findOne as jest.Mock).mockResolvedValue({ _id: { toString: () => 'tenant-a' } });
    (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    await expect(authService.forgotPassword('nobody@example.com', 'acme')).resolves.toBeUndefined();
    expect(emailProvider.send).not.toHaveBeenCalled();
  });

  it('resolves silently for a deactivated account', async () => {
    (TenantModel.findOne as jest.Mock).mockResolvedValue({ _id: { toString: () => 'tenant-a' } });
    (userRepository.findByEmail as jest.Mock).mockResolvedValue({
      _id: { toString: () => 'user1' },
      email: 'jane@example.com',
      isActive: false,
    });
    await expect(authService.forgotPassword('jane@example.com', 'acme')).resolves.toBeUndefined();
    expect(emailProvider.send).not.toHaveBeenCalled();
  });

  it('actually sends an email and stores a token for a real, active match', async () => {
    (TenantModel.findOne as jest.Mock).mockResolvedValue({ _id: { toString: () => 'tenant-a' } });
    (userRepository.findByEmail as jest.Mock).mockResolvedValue({
      _id: { toString: () => 'user1' },
      email: 'jane@example.com',
      name: 'Jane',
      isActive: true,
    });

    await authService.forgotPassword('jane@example.com', 'acme');

    expect(userRepository.setPasswordResetToken).toHaveBeenCalledWith('user1', expect.any(String), expect.any(Date));
    expect(emailProvider.send).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'jane@example.com', subject: expect.stringContaining('Reset') })
    );
  });
});

describe('authService.resetPassword', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects an invalid or expired token loudly (this IS safe to reveal — no email is involved)', async () => {
    (userRepository.findByPasswordResetToken as jest.Mock).mockResolvedValue(null);
    await expect(authService.resetPassword('bad-token', 'NewPassword123')).rejects.toThrow(/invalid or has expired/i);
  });

  it('updates the password, clears the token, and bumps tokenVersion (invalidating all sessions) on success', async () => {
    (userRepository.findByPasswordResetToken as jest.Mock).mockResolvedValue({ _id: { toString: () => 'user1' } });

    await authService.resetPassword('good-token', 'NewPassword123');

    expect(UserModel.findByIdAndUpdate).toHaveBeenCalledWith(
      { toString: expect.any(Function) },
      expect.objectContaining({
        passwordHash: expect.any(String),
        passwordResetTokenHash: null,
        failedLoginAttempts: 0,
        lockedUntil: null,
        $inc: { tokenVersion: 1 },
      })
    );
  });
});
