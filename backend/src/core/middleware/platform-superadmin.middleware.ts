import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { JwtAccessPayload } from '../../modules/users/user.types';

export function requirePlatformSuperAdmin(req: Request, _res: Response, next: NextFunction): void {
  const user = (req as Request & { user?: JwtAccessPayload }).user;

  if (!user) {
    next(AppError.unauthorized());
    return;
  }

  if (!user.isPlatformSuperAdmin) {
    next(AppError.forbidden('This action requires platform superadmin access'));
    return;
  }

  next();
}
