import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { JwtAccessPayload, Permission } from '../../modules/users/user.types';

interface RbacOptions {
  scopeToOwnBusinessUnit?: boolean;
}

export function requirePermission(required: Permission, options: RbacOptions = {}) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as Request & { user?: JwtAccessPayload }).user;

    if (!user) {
      next(AppError.unauthorized());
      return;
    }

    if (!user.permissions.includes(required)) {
      next(AppError.forbidden(`Missing required permission: ${required}`));
      return;
    }

    if (options.scopeToOwnBusinessUnit) {
      const resourceBusinessUnit = (req as Request & { resourceBusinessUnit?: string }).resourceBusinessUnit;
      const hasAllUnitsAccess = user.permissions.includes(Permission.CONTRACT_READ_ALL_UNITS);

      if (resourceBusinessUnit && !hasAllUnitsAccess && resourceBusinessUnit !== user.businessUnit) {
        next(AppError.forbidden('Resource is outside your business unit'));
        return;
      }
    }

    next();
  };
}

export function requireAnyPermission(required: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as Request & { user?: JwtAccessPayload }).user;

    if (!user) {
      next(AppError.unauthorized());
      return;
    }

    if (!required.some((permission) => user.permissions.includes(permission))) {
      next(AppError.forbidden(`Missing required permission: one of [${required.join(', ')}]`));
      return;
    }

    next();
  };
}
