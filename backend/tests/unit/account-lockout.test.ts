

jest.mock('../../src/modules/users/user.repository', () => ({
  userRepository: {
    findByEmailWithPassword: jest.fn(),
    touchLastLogin: jest.fn().mockResolvedValue(undefined),
    clearFailedLoginAttempts: jest.fn().mockResolvedValue(undefined),
    incrementFailedLoginAttempts: jest.fn(),
    lockAccount: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('../../src/modules/tenants/tenant.model', () => ({
  TenantModel: { findOne: jest.fn().mockResolvedValue({ _id: { toString: () => 'tenant-a' } }) },
}));
jest.mock('../../src/config/redis', () => ({
  redisClient: { sadd: jest.fn(), expire: jest.fn() },
}));

import bcrypt from 'bcryptjs';
import { userRepository } from '../../src/modules/users/user.repository';
import { userService } from '../../src/modules/users/user.service';
import { authService } from '../../src/modules/auth/auth.service';
import { env } from '../../src/config/env';

describe('userService.isAccountLocked (pure predicate)', () => {
  it('is false when lockedUntil is null', () => {
    expect(userService.isAccountLocked({ lockedUntil: null })).toBe(false);
  });

  it('is true when lockedUntil is in the future', () => {
    expect(userService.isAccountLocked({ lockedUntil: new Date(Date.now() + 60_000) })).toBe(true);
  });

  it('is false when lockedUntil is in the past (lock has expired)', () => {
    expect(userService.isAccountLocked({ lockedUntil: new Date(Date.now() - 60_000) })).toBe(false);
  });
});

describe('authService.login — account lockout', () => {
  beforeEach(() => jest.clearAllMocks());

  async function mockUser(overrides: Record<string, unknown> = {}) {
    return {
      _id: { toString: () => 'user1' },
      email: 'jane@example.com',
      passwordHash: await bcrypt.hash('CorrectPassword1', 10),
      role: 'DepartmentUser',
      permissionOverrides: [],
      businessUnit: null,
      tenant: { toString: () => 'tenant-a' },
      isActive: true,
      tokenVersion: 0,
      lockedUntil: null,
      emailVerified: true,
      ...overrides,
    };
  }

  it('rejects a locked account BEFORE attempting password verification', async () => {
    const lockedUser = await mockUser({ lockedUntil: new Date(Date.now() + 5 * 60_000) });
    (userRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(lockedUser);

    
    
    
    await expect(authService.login('jane@example.com', 'CorrectPassword1', 'acme')).rejects.toThrow(/locked/i);

    expect(userRepository.incrementFailedLoginAttempts).not.toHaveBeenCalled();
  });

  it('increments failed attempts on a wrong password without locking below the threshold', async () => {
    const user = await mockUser();
    (userRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(user);
    (userRepository.incrementFailedLoginAttempts as jest.Mock).mockResolvedValue({
      failedLoginAttempts: env.MAX_FAILED_LOGIN_ATTEMPTS - 1,
    });

    await expect(authService.login('jane@example.com', 'WrongPassword', 'acme')).rejects.toThrow(
      'Invalid email or password'
    );

    expect(userRepository.incrementFailedLoginAttempts).toHaveBeenCalledWith('user1');
    expect(userRepository.lockAccount).not.toHaveBeenCalled();
  });

  it('locks the account on the attempt that reaches the configured threshold', async () => {
    const user = await mockUser();
    (userRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(user);
    (userRepository.incrementFailedLoginAttempts as jest.Mock).mockResolvedValue({
      failedLoginAttempts: env.MAX_FAILED_LOGIN_ATTEMPTS,
    });

    await expect(authService.login('jane@example.com', 'WrongPassword', 'acme')).rejects.toThrow(
      /now locked/i
    );

    expect(userRepository.lockAccount).toHaveBeenCalledWith('user1', expect.any(Date));
  });

  it('clears failed-attempt state on a successful login', async () => {
    const user = await mockUser();
    (userRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(user);

    await authService.login('jane@example.com', 'CorrectPassword1', 'acme');

    expect(userRepository.clearFailedLoginAttempts).toHaveBeenCalledWith('user1');
  });
});
