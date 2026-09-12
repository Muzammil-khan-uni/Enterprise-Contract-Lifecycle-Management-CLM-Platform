import { Router } from 'express';
import { vendorController } from './vendor.controller';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { requirePermission } from '../../core/middleware/rbac.middleware';
import { validate } from '../../core/middleware/validate.middleware';
import { auditLog } from '../../core/middleware/audit-log.middleware';
import { createVendorSchema, updateVendorSchema, vendorIdParamSchema } from './vendor.validation';
import { Permission } from '../users/user.types';

const router = Router();

router.use(authMiddleware);
router.get('/', vendorController.list);
router.get('/admin', requirePermission(Permission.VENDOR_MANAGE), vendorController.adminList);
router.get('/:id', validate(vendorIdParamSchema), vendorController.getById);
router.post(
  '/',
  requirePermission(Permission.VENDOR_MANAGE),
  validate(createVendorSchema),
  auditLog('Vendor'),
  vendorController.create
);
router.patch(
  '/:id',
  requirePermission(Permission.VENDOR_MANAGE),
  validate(updateVendorSchema),
  auditLog('Vendor'),
  vendorController.update
);

export default router;
