import { Router } from 'express';
import { tenantController } from './tenant.controller';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { requirePlatformSuperAdmin } from '../../core/middleware/platform-superadmin.middleware';
import { validate } from '../../core/middleware/validate.middleware';
import { auditLog } from '../../core/middleware/audit-log.middleware';
import { createTenantSchema } from './tenant.validation';

const router = Router();

router.use(authMiddleware, requirePlatformSuperAdmin);
router.get('/', tenantController.list);

router.post('/', validate(createTenantSchema), auditLog('Tenant'), tenantController.create);

export default router;
