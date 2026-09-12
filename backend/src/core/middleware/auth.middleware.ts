import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { AppError } from '../errors/AppError';
import { JwtAccessPayload } from '../../modules/users/user.types';
import { runWithTenant } from '../tenancy/tenant-context';

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(AppError.unauthorized('Missing or malformed Authorization header'));
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;
    (req as Request & { user?: JwtAccessPayload }).user = payload;
    runWithTenant(payload.tenant, next);
  } catch {
    next(AppError.unauthorized('Invalid or expired access token'));
  }
}

export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessPayload;
    (req as Request & { user?: JwtAccessPayload }).user = payload;
    runWithTenant(payload.tenant, next);
  } catch {
    
    
    
    
    next();
  }
}
