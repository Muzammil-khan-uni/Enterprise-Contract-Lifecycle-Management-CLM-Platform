

import { Request, Response, NextFunction } from 'express';
import { requirePlatformSuperAdmin } from '../../src/core/middleware/platform-superadmin.middleware';
import { UserRole, Permission, JwtAccessPayload } from '../../src/modules/users/user.types';
import { AppError } from '../../src/core/errors/AppError';

function buildReq(user?: Partial<JwtAccessPayload>): Request {
  return { user } as unknown as Request;
}

describe('requirePlatformSuperAdmin middleware', () => {
  let next: jest.Mock<NextFunction, Parameters<NextFunction>>;

  beforeEach(() => {
    next = jest.fn();
  });

  it('calls next() with no error when isPlatformSuperAdmin is true', () => {
    const req = buildReq({
      sub: 'user1',
      role: UserRole.ADMIN,
      businessUnit: null,
      tenant: 'tenant1',
      permissions: [],
      isPlatformSuperAdmin: true,
    });

    requirePlatformSuperAdmin(req, {} as Response, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledWith();
  });

  it('rejects a tenant Admin holding USER_MANAGE but isPlatformSuperAdmin: false', () => {
    const req = buildReq({
      sub: 'user2',
      role: UserRole.ADMIN,
      businessUnit: null,
      tenant: 'tenant1',
      permissions: Object.values(Permission),
      isPlatformSuperAdmin: false,
    });

    requirePlatformSuperAdmin(req, {} as Response, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).statusCode).toBe(403);
  });

  it('rejects a request with no authenticated user at all', () => {
    const req = buildReq(undefined);

    requirePlatformSuperAdmin(req, {} as Response, next as unknown as NextFunction);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).statusCode).toBe(401);
  });
});
