import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export function loadResourceBusinessUnit(resolver: (req: Request) => Promise<string | null>) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const businessUnit = await resolver(req);
      (req as Request & { resourceBusinessUnit?: string }).resourceBusinessUnit = businessUnit ?? undefined;
      next();
    } catch (err) {
      
      
      
      
      logger.warn('loadResourceBusinessUnit resolver failed, proceeding unscoped', {
        error: (err as Error).message,
      });
      next();
    }
  };
}
