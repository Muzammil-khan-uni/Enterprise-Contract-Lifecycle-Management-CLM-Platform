

jest.mock('../../src/modules/users/user.service', () => ({
  userService: { createUser: jest.fn() },
}));
jest.mock('../../src/modules/auth/auth.service', () => ({
  authService: { login: jest.fn() },
}));
jest.mock('../../src/modules/audit/audit.service', () => ({
  auditService: { record: jest.fn().mockResolvedValue(undefined) },
}));

import { authController } from '../../src/modules/auth/auth.controller';
import { userService } from '../../src/modules/users/user.service';
import { authService } from '../../src/modules/auth/auth.service';
import { auditService } from '../../src/modules/audit/audit.service';

function flushPromises() {
  return new Promise((resolve) => setImmediate(resolve));
}

function mockRes() {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  return res;
}

describe('authController.register', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    
    
    
    
    
    
    
    
    (auditService.record as jest.Mock).mockResolvedValue(undefined);
  });

  it('anonymous bootstrap: logs the new Admin in (accessToken + cookie), not just their profile', async () => {
    (userService.createUser as jest.Mock).mockResolvedValue({
      _id: { toString: () => 'user1' },
      name: 'Jane Doe',
      email: 'jane@example.com',
      role: 'Admin',
    });
    (authService.login as jest.Mock).mockResolvedValue({
      accessToken: 'access-token-abc',
      refreshToken: 'refresh-token-xyz',
      user: { id: 'user1', name: 'Jane Doe', email: 'jane@example.com', role: 'Admin', tenant: 'new-tenant' },
    });

    const req: any = {
      body: { name: 'Jane Doe', email: 'jane@example.com', password: 'SuperSecret123', tenantSlug: 'newco' },
      ip: '127.0.0.1',
    };
    const res = mockRes();

    await authController.register(req, res, jest.fn());
    await flushPromises();

    expect(authService.login).toHaveBeenCalledWith('jane@example.com', 'SuperSecret123', 'newco');
    expect(res.cookie).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ accessToken: 'access-token-abc' }),
      })
    );
  });

  it('authenticated Admin creating a teammate: returns only the profile, never logs the caller in as the teammate', async () => {
    (userService.createUser as jest.Mock).mockResolvedValue({
      _id: { toString: () => 'teammate1' },
      name: 'New Teammate',
      email: 'teammate@acme.com',
      role: 'LegalOfficer',
    });

    const req: any = {
      body: { name: 'New Teammate', email: 'teammate@acme.com', password: 'SuperSecret123', role: 'LegalOfficer' },
      user: { sub: 'admin1', tenant: 'acme-tenant', permissions: ['user:manage'] },
    };
    const res = mockRes();

    await authController.register(req, res, jest.fn());
    await flushPromises();

    expect(authService.login).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { id: 'teammate1', name: 'New Teammate', email: 'teammate@acme.com', role: 'LegalOfficer' },
      })
    );
  });

  it('rejects an authenticated caller who lacks USER_MANAGE, before ever calling createUser', async () => {
    const req: any = {
      body: { name: 'X', email: 'x@acme.com', password: 'SuperSecret123' },
      user: { sub: 'user1', tenant: 'acme-tenant', permissions: [] },
    };
    const res = mockRes();
    const next = jest.fn();

    await authController.register(req, res, next);
    await flushPromises();

    expect(userService.createUser).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/do not have permission/) })
    );
  });
});
