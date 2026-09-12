import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../errors/AppError';

export function validate(schema: AnyZodObject) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({ body: req.body, query: req.query, params: req.params }) as {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };

      if (parsed.body && typeof parsed.body === 'object' && req.body && typeof req.body === 'object') {
        for (const key of Object.keys(req.body as Record<string, unknown>)) delete (req.body as Record<string, unknown>)[key];
        Object.assign(req.body as Record<string, unknown>, parsed.body);
      }
      if (parsed.params && typeof parsed.params === 'object') {
        for (const key of Object.keys(req.params)) delete (req.params as Record<string, unknown>)[key];
        Object.assign(req.params, parsed.params);
      }
      if (parsed.query && typeof parsed.query === 'object') {
        Object.defineProperty(req, 'query', {
          value: parsed.query,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(AppError.badRequest('Validation failed', err.flatten()));
        return;
      }
      next(err);
    }
  };
}
