import { Router } from 'express';
import { obligationController } from './obligation.controller';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { requirePermission } from '../../core/middleware/rbac.middleware';
import { validate } from '../../core/middleware/validate.middleware';
import { auditLog } from '../../core/middleware/audit-log.middleware';
import { AuditAction } from '../audit/audit.types';
import { createObligationSchema, completeObligationSchema } from './obligation.validation';
import { Permission } from '../users/user.types';

const contractScopedRouter = Router({ mergeParams: true });
contractScopedRouter.use(authMiddleware);
contractScopedRouter.get('/', requirePermission(Permission.CONTRACT_READ), obligationController.listForContract);
contractScopedRouter.post(
  '/',
  requirePermission(Permission.OBLIGATION_MANAGE),
  validate(createObligationSchema),
  auditLog('Obligation', AuditAction.CREATE),
  obligationController.create
);

const obligationRouter = Router();
obligationRouter.use(authMiddleware);
obligationRouter.get('/mine', obligationController.listMine);
obligationRouter.post(
  '/:id/complete',
  requirePermission(Permission.OBLIGATION_MANAGE),
  validate(completeObligationSchema),
  auditLog('Obligation', AuditAction.STATUS_CHANGE),
  obligationController.complete
);
obligationRouter.post(
  '/:id/waive',
  requirePermission(Permission.OBLIGATION_MANAGE),
  auditLog('Obligation', AuditAction.STATUS_CHANGE),
  obligationController.waive
);

export { contractScopedRouter, obligationRouter };
