import { Router } from 'express';
import multer from 'multer';
import { documentController } from './document.controller';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { requirePermission } from '../../core/middleware/rbac.middleware';
import { validate } from '../../core/middleware/validate.middleware';
import { auditLog } from '../../core/middleware/audit-log.middleware';
import { AuditAction } from '../audit/audit.types';
import { uploadDocumentSchema } from './document.validation';
import { Permission } from '../users/user.types';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

const contractScopedRouter = Router({ mergeParams: true });
contractScopedRouter.use(authMiddleware);
contractScopedRouter.get('/', requirePermission(Permission.CONTRACT_READ), documentController.listForContract);
contractScopedRouter.post(
  '/',
  requirePermission(Permission.CONTRACT_UPDATE),
  upload.single('file'),
  validate(uploadDocumentSchema),
  auditLog('Document', AuditAction.CREATE),
  documentController.upload
);
contractScopedRouter.get(
  '/:id/download',
  requirePermission(Permission.CONTRACT_READ),
  auditLog('Document', AuditAction.DOWNLOAD),
  documentController.download
);
contractScopedRouter.delete(
  '/:id',
  requirePermission(Permission.CONTRACT_UPDATE),
  auditLog('Document', AuditAction.DELETE),
  documentController.remove
);

export { contractScopedRouter };
