import { Request, Response, NextFunction } from 'express';
import { auditService } from '../../modules/audit/audit.service';
import { AuditAction } from '../../modules/audit/audit.types';
import { JwtAccessPayload } from '../../modules/users/user.types';
import { logger } from '../utils/logger';

const METHOD_ACTION: Record<string, AuditAction> = {
  POST: AuditAction.CREATE,
  PATCH: AuditAction.UPDATE,
  PUT: AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
};

export function auditLog(entityType: string, actionOverride?: AuditAction) {
  return (req: Request, res: Response, next: NextFunction): void => {
    res.on('finish', () => {
      if (res.statusCode >= 400) return;

      const user = (req as Request & { user?: JwtAccessPayload }).user;
      const action = actionOverride ?? METHOD_ACTION[req.method] ?? AuditAction.UPDATE;
      
      
      
      
      
      const entityId = [req.params.id, req.params.contractId, req.params.workflowId, req.params.signatureId].find(
        (value): value is string => typeof value === 'string'
      );

      auditService
        .record({
          actor: user?.sub ?? null,
          action,
          entityType,
          entityId: entityId ?? null,
          changes: Object.keys(req.body ?? {}).length > 0 ? req.body : null,
          ipAddress: req.ip ?? null,
        })
        .catch((err) => {
          
          
          
          logger.error('Failed to write audit log entry', { entityType, error: err.message });
        });
    });

    next();
  };
}
