import { Router } from 'express';
import { auditController } from './audit.controller';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { requirePermission } from '../../core/middleware/rbac.middleware';
import { Permission } from '../users/user.types';

const router = Router();

router.use(authMiddleware, requirePermission(Permission.AUDIT_READ));
router.get('/', auditController.list);
router.get('/:entityType/:entityId', auditController.listForEntity);

export default router;
