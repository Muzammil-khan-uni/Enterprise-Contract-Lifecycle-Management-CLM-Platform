import { Router } from 'express';
import { versionController } from './version.controller';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { requirePermission } from '../../core/middleware/rbac.middleware';
import { validate } from '../../core/middleware/validate.middleware';
import { auditLog } from '../../core/middleware/audit-log.middleware';
import { AuditAction } from '../audit/audit.types';
import { rollbackSchema, compareVersionsSchema } from './version.validation';
import { Permission } from '../users/user.types';

const router = Router({ mergeParams: true });

router.use(authMiddleware);
router.get('/', requirePermission(Permission.CONTRACT_READ), versionController.list);
router.post('/', requirePermission(Permission.CONTRACT_UPDATE), auditLog('Contract', AuditAction.UPDATE), versionController.create);
router.get('/:versionId/compare', requirePermission(Permission.CONTRACT_READ), versionController.compare);
router.get('/compare', requirePermission(Permission.CONTRACT_READ), validate(compareVersionsSchema), versionController.compareVersions);
router.post(
  '/rollback',
  requirePermission(Permission.CONTRACT_UPDATE),
  validate(rollbackSchema),
  auditLog('Contract', AuditAction.UPDATE),
  versionController.rollback
);

export default router;
