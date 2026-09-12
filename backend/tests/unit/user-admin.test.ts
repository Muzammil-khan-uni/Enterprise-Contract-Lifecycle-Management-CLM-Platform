

jest.mock('../../src/modules/users/user.repository', () => ({
  userRepository: {
    findById: jest.fn(),
    findByIdInTenant: jest.fn(),
    listByTenant: jest.fn(),
    updateById: jest.fn(),
    incrementTokenVersion: jest.fn().mockResolvedValue(undefined),
  },
}));

import { userRepository } from '../../src/modules/users/user.repository';
import { userService } from '../../src/modules/users/user.service';
import { userController } from '../../src/modules/users/user.controller';
import { UserRole } from '../../src/modules/users/user.types';

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('userService.updateUser', () => {
  beforeEach(() => jest.resetAllMocks());

  it('rejects an admin deactivating their own account', async () => {
    (userRepository.findByIdInTenant as jest.Mock).mockResolvedValue({ _id: 'u1' });

    await expect(
      userService.updateUser('u1', 'tenant-a', 'u1', { isActive: false })
    ).rejects.toThrow(/cannot deactivate your own account/);
    expect(userRepository.updateById).not.toHaveBeenCalled();
  });

  it('rejects an admin removing their own Admin role', async () => {
    (userRepository.findByIdInTenant as jest.Mock).mockResolvedValue({ _id: 'u1' });

    await expect(
      userService.updateUser('u1', 'tenant-a', 'u1', { role: UserRole.LEGAL_OFFICER })
    ).rejects.toThrow(/cannot remove your own Admin role/);
    expect(userRepository.updateById).not.toHaveBeenCalled();
  });

  it('404s when the target user is outside the caller tenant', async () => {
    (userRepository.findByIdInTenant as jest.Mock).mockResolvedValue(null);

    await expect(
      userService.updateUser('other-user', 'tenant-a', 'admin1', { isActive: false })
    ).rejects.toThrow(/User not found/);
  });

  it('bumps tokenVersion when role changes, to invalidate existing sessions', async () => {
    (userRepository.findByIdInTenant as jest.Mock).mockResolvedValue({ _id: 'u2' });
    (userRepository.updateById as jest.Mock).mockResolvedValue({ _id: 'u2', role: UserRole.FINANCE_OFFICER });

    await userService.updateUser('u2', 'tenant-a', 'admin1', { role: UserRole.FINANCE_OFFICER });
    expect(userRepository.incrementTokenVersion).toHaveBeenCalledWith('u2');
  });

  it('does not bump tokenVersion for a businessUnit-only change', async () => {
    (userRepository.findByIdInTenant as jest.Mock).mockResolvedValue({ _id: 'u2' });
    (userRepository.updateById as jest.Mock).mockResolvedValue({ _id: 'u2' });

    await userService.updateUser('u2', 'tenant-a', 'admin1', { businessUnit: 'bu1' });
    expect(userRepository.incrementTokenVersion).not.toHaveBeenCalled();
  });
});

describe('userController tenant scoping', () => {
  beforeEach(() => jest.resetAllMocks());

  it('lists only users within the caller tenant', async () => {
    (userRepository.listByTenant as jest.Mock).mockResolvedValue([]);
    const req: any = { user: { tenant: 'tenant-a', sub: 'admin1' } };
    const res = mockRes();

    await userController.list(req, res, jest.fn());
    await flushPromises();
    expect(userRepository.listByTenant).toHaveBeenCalledWith('tenant-a');
  });

  it('404s getById for a user in a different tenant', async () => {
    (userRepository.findByIdInTenant as jest.Mock).mockResolvedValue(null);
    const req: any = { user: { tenant: 'tenant-a', sub: 'admin1' }, params: { id: 'foreign-user' } };
    const res = mockRes();
    const next = jest.fn();

    await userController.getById(req, res, next);
    await flushPromises();
    expect(userRepository.findByIdInTenant).toHaveBeenCalledWith('foreign-user', 'tenant-a');
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ message: expect.stringMatching(/User not found/) }));
  });

  it('never includes passwordHash-adjacent fields in the returned profile', async () => {
    (userRepository.listByTenant as jest.Mock).mockResolvedValue([
      {
        _id: { toString: () => 'u1' },
        name: 'Jane',
        email: 'jane@acme.test',
        role: UserRole.LEGAL_OFFICER,
        businessUnit: null,
        department: null,
        permissionOverrides: [],
        isActive: true,
        emailVerified: true,
        lastLoginAt: null,
        createdAt: new Date('2026-01-01'),
        passwordHash: 'should-never-appear',
      },
    ]);
    const req: any = { user: { tenant: 'tenant-a', sub: 'admin1' } };
    const res = mockRes();

    await userController.list(req, res, jest.fn());
    await flushPromises();

    const payload = res.json.mock.calls[0][0];
    expect(JSON.stringify(payload)).not.toContain('passwordHash');
    expect(JSON.stringify(payload)).not.toContain('should-never-appear');
  });
});
