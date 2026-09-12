

jest.mock('../../src/modules/users/user.repository', () => ({
  userRepository: {
    findByEmail: jest.fn(),
    count: jest.fn(),
    create: jest.fn(),
  },
}));
jest.mock('../../src/modules/tenants/tenant.model', () => ({
  TenantModel: { findOne: jest.fn(), create: jest.fn() },
}));

import { userRepository } from '../../src/modules/users/user.repository';
import { TenantModel } from '../../src/modules/tenants/tenant.model';
import { userService } from '../../src/modules/users/user.service';
import { UserRole } from '../../src/modules/users/user.types';

const baseInput = {
  name: 'Jane Doe',
  email: 'jane@example.com',
  password: 'SuperSecret123',
};

describe('userService.createUser — registration gating', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (userRepository.findByEmail as jest.Mock).mockResolvedValue(null);
    (userRepository.create as jest.Mock).mockImplementation((doc) => Promise.resolve({ _id: 'u1', ...doc }));
  });

  describe('anonymous bootstrap path (no actor)', () => {
    it('rejects with no tenantSlug provided', async () => {
      await expect(userService.createUser({ ...baseInput, role: 'Admin' })).rejects.toThrow(/tenantSlug is required/);
    });

    it('auto-creates a brand-new tenant when the slug does not exist yet, and becomes its first Admin', async () => {
      (TenantModel.findOne as jest.Mock).mockResolvedValue(null);
      (TenantModel.create as jest.Mock).mockResolvedValue({ _id: 'new-tenant', isActive: true });
      (userRepository.count as jest.Mock).mockResolvedValue(0);

      await userService.createUser({ ...baseInput, tenantSlug: 'brand-new-co', tenantName: 'Brand New Co' });

      expect(TenantModel.create).toHaveBeenCalledWith({ name: 'Brand New Co', slug: 'brand-new-co' });
      const createCall = (userRepository.create as jest.Mock).mock.calls[0][0];
      expect(createCall.role).toBe(UserRole.ADMIN);
      expect(createCall.tenant).toBe('new-tenant');
    });

    it('falls back to the raw slug as the tenant name when tenantName is omitted', async () => {
      (TenantModel.findOne as jest.Mock).mockResolvedValue(null);
      (TenantModel.create as jest.Mock).mockResolvedValue({ _id: 'new-tenant', isActive: true });

      await userService.createUser({ ...baseInput, tenantSlug: 'no-name-given' });

      expect(TenantModel.create).toHaveBeenCalledWith({ name: 'no-name-given', slug: 'no-name-given' });
    });

    it('rejects with a friendly conflict error when two signups race for the same new slug', async () => {
      (TenantModel.findOne as jest.Mock).mockResolvedValue(null);
      const duplicateKeyError = Object.assign(new Error('E11000 duplicate key'), { code: 11000 });
      (TenantModel.create as jest.Mock).mockRejectedValue(duplicateKeyError);

      await expect(userService.createUser({ ...baseInput, tenantSlug: 'racing-co' })).rejects.toThrow(
        /just claimed by another signup/
      );
    });

    it('rejects when the tenant exists but has been deactivated, even with zero members', async () => {
      (TenantModel.findOne as jest.Mock).mockResolvedValue({ _id: 'tenant1', isActive: false });

      await expect(userService.createUser({ ...baseInput, tenantSlug: 'suspended-co' })).rejects.toThrow(
        /No active organization found/
      );
      expect(userRepository.count).not.toHaveBeenCalled();
    });

    it('rejects when the tenant already has members', async () => {
      (TenantModel.findOne as jest.Mock).mockResolvedValue({ _id: 'tenant1', isActive: true });
      (userRepository.count as jest.Mock).mockResolvedValue(3);

      await expect(
        userService.createUser({ ...baseInput, tenantSlug: 'acme', role: 'DepartmentUser' })
      ).rejects.toThrow(/already has members/);
    });

    it('succeeds for an existing, active tenant with zero members, forcing role to Admin', async () => {
      (TenantModel.findOne as jest.Mock).mockResolvedValue({ _id: 'tenant1', isActive: true });
      (userRepository.count as jest.Mock).mockResolvedValue(0);

      
      
      await userService.createUser({ ...baseInput, tenantSlug: 'acme', role: 'DepartmentUser' });

      const createCall = (userRepository.create as jest.Mock).mock.calls[0][0];
      expect(createCall.role).toBe(UserRole.ADMIN);
      expect(createCall.tenant).toBe('tenant1');
    });
  });

  describe('authenticated path (actor present)', () => {
    it('uses the actor\'s own tenant, ignoring any tenantSlug in the body', async () => {
      await userService.createUser(
        { ...baseInput, role: 'DepartmentUser', tenantSlug: 'someone-elses-org' },
        { tenantId: 'actor-tenant' }
      );

      const createCall = (userRepository.create as jest.Mock).mock.calls[0][0];
      expect(createCall.tenant).toBe('actor-tenant');
      expect(createCall.role).toBe('DepartmentUser');
      
      
      expect(TenantModel.findOne).not.toHaveBeenCalled();
    });

    it('rejects when no valid role is supplied', async () => {
      await expect(
        userService.createUser({ ...baseInput, role: 'NotARealRole' }, { tenantId: 'actor-tenant' })
      ).rejects.toThrow(/valid role is required/);
    });
  });

  it('rejects if the email is already registered, regardless of path', async () => {
    (userRepository.findByEmail as jest.Mock).mockResolvedValue({ _id: 'existing' });
    await expect(
      userService.createUser({ ...baseInput, tenantSlug: 'acme' })
    ).rejects.toThrow(/already exists/);
  });
});
