

jest.mock('../../src/modules/users/user.repository', () => ({
  userRepository: {
    findByEmailWithPassword: jest.fn(),
    touchLastLogin: jest.fn().mockResolvedValue(undefined),
    clearFailedLoginAttempts: jest.fn().mockResolvedValue(undefined),
  },
}));
jest.mock('../../src/modules/tenants/tenant.model', () => ({
  TenantModel: { findOne: jest.fn() },
}));
jest.mock('../../src/config/redis', () => ({
  redisClient: { sadd: jest.fn(), expire: jest.fn() },
}));

import { userRepository } from '../../src/modules/users/user.repository';
import { TenantModel } from '../../src/modules/tenants/tenant.model';
import { authService } from '../../src/modules/auth/auth.service';
import bcrypt from 'bcryptjs';

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

describe('authService.login — tenant-scoped disambiguation', () => {
  beforeEach(() => jest.clearAllMocks());

  it('resolves the tenant by slug before looking up the user', async () => {
    (TenantModel.findOne as jest.Mock).mockResolvedValue({ _id: { toString: () => 'tenant-a' } });
    (userRepository.findByEmailWithPassword as jest.Mock).mockResolvedValue(await mockUser());

    await authService.login('jane@example.com', 'CorrectPassword1', 'acme');

    expect(TenantModel.findOne).toHaveBeenCalledWith({ slug: 'acme', isActive: true });
    expect(userRepository.findByEmailWithPassword).toHaveBeenCalledWith('jane@example.com', 'tenant-a');
  });

  it('rejects with a generic error for an unknown tenant slug, not a distinct "no such org" message', async () => {
    (TenantModel.findOne as jest.Mock).mockResolvedValue(null);

    await expect(authService.login('jane@example.com', 'CorrectPassword1', 'ghost-co')).rejects.toThrow(
      'Invalid email or password'
    );
    
    
    expect(userRepository.findByEmailWithPassword).not.toHaveBeenCalled();
  });

  it('the SAME email in two different tenants resolves to two different users', async () => {
    (TenantModel.findOne as jest.Mock)
      .mockResolvedValueOnce({ _id: { toString: () => 'tenant-a' } })
      .mockResolvedValueOnce({ _id: { toString: () => 'tenant-b' } });

    const userInTenantA = await mockUser({ tenant: { toString: () => 'tenant-a' } });
    const userInTenantB = await mockUser({ tenant: { toString: () => 'tenant-b' } });

    (userRepository.findByEmailWithPassword as jest.Mock)
      .mockResolvedValueOnce(userInTenantA)
      .mockResolvedValueOnce(userInTenantB);

    const resultA = await authService.login('jane@example.com', 'CorrectPassword1', 'acme');
    const resultB = await authService.login('jane@example.com', 'CorrectPassword1', 'globex');

    expect(resultA.user.tenant).toBe('tenant-a');
    expect(resultB.user.tenant).toBe('tenant-b');
  });

  it('rejects an inactive tenant the same generic way', async () => {
    (TenantModel.findOne as jest.Mock).mockResolvedValue(null); 

    await expect(authService.login('jane@example.com', 'CorrectPassword1', 'suspended-org')).rejects.toThrow(
      'Invalid email or password'
    );
  });
});
