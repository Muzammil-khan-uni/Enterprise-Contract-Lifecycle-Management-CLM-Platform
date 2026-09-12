import { Request, Response, NextFunction } from 'express';

const MONGO_OPERATOR_KEY = /^\$|\./;

function sanitizeValue(value: unknown, collapseArrays: boolean): unknown {
  if (Array.isArray(value)) {
    if (collapseArrays) {
      
      
      
      
      
      
      
      
      return sanitizeValue(value[value.length - 1], collapseArrays);
    }
    
    
    
    return value.map((item) => sanitizeValue(item, collapseArrays));
  }
  if (value && typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (MONGO_OPERATOR_KEY.test(key)) continue; 
      clean[key] = sanitizeValue(val, collapseArrays);
    }
    return clean;
  }
  return value;
}

function sanitizeInPlace(target: Record<string, unknown>, collapseArrays: boolean): void {
  const sanitized = sanitizeValue(target, collapseArrays) as Record<string, unknown>;
  for (const key of Object.keys(target)) delete target[key];
  Object.assign(target, sanitized);
}

export function sanitizeRequest() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.body && typeof req.body === 'object') {
      sanitizeInPlace(req.body as Record<string, unknown>, false);
    }
    if (req.params && typeof req.params === 'object') {
      sanitizeInPlace(req.params as Record<string, unknown>, false);
    }
    if (req.query && typeof req.query === 'object') {
      const sanitizedQuery = sanitizeValue(req.query, true);
      Object.defineProperty(req, 'query', {
        value: sanitizedQuery,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }
    next();
  };
}
