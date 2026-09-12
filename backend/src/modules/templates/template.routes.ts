import { Router } from 'express';
import { templateController } from './template.controller';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { requirePermission } from '../../core/middleware/rbac.middleware';
import { validate } from '../../core/middleware/validate.middleware';
import { auditLog } from '../../core/middleware/audit-log.middleware';
import { AuditAction } from '../audit/audit.types';
import {
  createTemplateSchema,
  createClauseSchema,
  updateTemplateSchema,
  updateClauseSchema,
  templateIdParamSchema,
  clauseIdParamSchema,
  rollbackTemplateSchema,
  compareTemplateVersionsSchema,
} from './template.validation';
import { Permission } from '../users/user.types';

const router = Router();

router.use(authMiddleware);

router.get('/', requirePermission(Permission.CONTRACT_READ), templateController.list);

router.get('/admin', requirePermission(Permission.CONTRACT_UPDATE), templateController.adminList);
router.get('/:id', requirePermission(Permission.CONTRACT_READ), validate(templateIdParamSchema), templateController.getById);

router.get(
  '/:id/for-authoring',
  requirePermission(Permission.CONTRACT_READ),
  validate(templateIdParamSchema),
  templateController.getForAuthoring
);
router.post(
  '/',
  requirePermission(Permission.CONTRACT_CREATE),
  validate(createTemplateSchema),
  auditLog('Template'),
  templateController.create
);
router.patch(
  '/:id',
  requirePermission(Permission.CONTRACT_UPDATE),
  validate(updateTemplateSchema),
  auditLog('Template'),
  templateController.update
);

router.get(
  '/:id/versions',
  requirePermission(Permission.CONTRACT_READ),
  validate(templateIdParamSchema),
  templateController.listVersions
);
router.get(
  '/:id/versions/compare',
  requirePermission(Permission.CONTRACT_READ),
  validate(compareTemplateVersionsSchema),
  templateController.compareVersions
);
router.post(
  '/:id/versions/rollback',
  requirePermission(Permission.CONTRACT_UPDATE),
  validate(rollbackTemplateSchema),
  auditLog('Template', AuditAction.STATUS_CHANGE),
  templateController.rollbackVersion
);

router.get('/clauses/all', requirePermission(Permission.CONTRACT_READ), templateController.listClauses);
router.post(
  '/clauses',
  requirePermission(Permission.CONTRACT_CREATE),
  validate(createClauseSchema),
  auditLog('Clause'),
  templateController.createClause
);
router.patch(
  '/clauses/:id',
  requirePermission(Permission.CONTRACT_UPDATE),
  validate(updateClauseSchema),
  auditLog('Clause'),
  templateController.updateClause
);
router.delete(
  '/clauses/:id',
  requirePermission(Permission.CONTRACT_UPDATE),
  validate(clauseIdParamSchema),
  auditLog('Clause'),
  templateController.deleteClause
);

export default router;
