import { Router } from 'express';
import { signatureController } from './signature.controller';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { requirePermission } from '../../core/middleware/rbac.middleware';
import { validate } from '../../core/middleware/validate.middleware';
import { auditLog } from '../../core/middleware/audit-log.middleware';
import { AuditAction } from '../audit/audit.types';
import { initiateSignatureSchema } from './signature.validation';
import { Permission } from '../users/user.types';

const contractScopedRouter = Router({ mergeParams: true });
contractScopedRouter.use(authMiddleware);
contractScopedRouter.post(
  '/initiate',
  requirePermission(Permission.CONTRACT_UPDATE),
  validate(initiateSignatureSchema),
  
  
  
  
  
  
  
  
  auditLog('Signature', AuditAction.SIGN),
  signatureController.initiate
);
contractScopedRouter.get('/', requirePermission(Permission.CONTRACT_READ), signatureController.listForContract);

const signatureRouter = Router();

signatureRouter.post('/webhook/docusign', signatureController.docusignWebhook);
signatureRouter.post('/webhook/adobesign', signatureController.adobesignWebhook);

signatureRouter.use(authMiddleware);

signatureRouter.get('/mine', signatureController.listMine);
signatureRouter.get('/:signatureId/audit-trail', requirePermission(Permission.CONTRACT_READ), signatureController.auditTrail);

export { contractScopedRouter, signatureRouter };
