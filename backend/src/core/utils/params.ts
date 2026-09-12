import { Request } from 'express';
import { AppError } from '../errors/AppError';

export function getParam(req: Request, name: string): string {
  const value = req.params[name];
  if (Array.isArray(value)) {
    throw AppError.badRequest(`Route parameter "${name}" resolved to multiple values, which this route does not support`);
  }
  if (value === undefined) {
    throw AppError.badRequest(`Missing required route parameter "${name}"`);
  }
  return value;
}
