import { Router } from 'express';
import { workflowController } from './workflow.controller';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { requirePermission } from '../../core/middleware/rbac.middleware';
import { validate } from '../../core/middleware/validate.middleware';
import { auditLog } from '../../core/middleware/audit-log.middleware';
import { AuditAction } from '../audit/audit.types';
import { actionWorkflowSchema, escalateWorkflowSchema } from './workflow.validation';
import { Permission } from '../users/user.types';

const contractScopedRouter = Router({ mergeParams: true });
contractScopedRouter.use(authMiddleware);
contractScopedRouter.post(
  '/submit',
  requirePermission(Permission.CONTRACT_UPDATE),
  
  
  
  auditLog('ApprovalWorkflow', AuditAction.STATUS_CHANGE),
  workflowController.submit
);
contractScopedRouter.get('/', requirePermission(Permission.CONTRACT_READ), workflowController.listForContract);

const workflowRouter = Router();
workflowRouter.use(authMiddleware);
workflowRouter.get('/queue', workflowController.getQueue);
workflowRouter.post(
  '/:workflowId/approve',
  validate(actionWorkflowSchema),
  auditLog('ApprovalWorkflow', AuditAction.APPROVE),
  workflowController.approve
);
workflowRouter.post(
  '/:workflowId/reject',
  validate(actionWorkflowSchema),
  auditLog('ApprovalWorkflow', AuditAction.REJECT),
  workflowController.reject
);
workflowRouter.post(
  '/:workflowId/escalate',
  validate(escalateWorkflowSchema),
  auditLog('ApprovalWorkflow', AuditAction.STATUS_CHANGE),
  workflowController.escalate
);

export { contractScopedRouter, workflowRouter };
