import { Router } from 'express';
import { businessUnitController } from './business-unit.controller';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { requirePermission } from '../../core/middleware/rbac.middleware';
import { validate } from '../../core/middleware/validate.middleware';
import { auditLog } from '../../core/middleware/audit-log.middleware';
import {
  createBusinessUnitSchema,
  updateBusinessUnitSchema,
  businessUnitIdParamSchema,
} from './business-unit.validation';
import { Permission } from '../users/user.types';

const router = Router();

router.use(authMiddleware);

router.get('/', businessUnitController.list);
router.get('/:id', validate(businessUnitIdParamSchema), businessUnitController.getById);

router.post(
  '/',
  requirePermission(Permission.ORG_STRUCTURE_MANAGE),
  validate(createBusinessUnitSchema),
  auditLog('BusinessUnit'),
  businessUnitController.create
);
router.patch(
  '/:id',
  requirePermission(Permission.ORG_STRUCTURE_MANAGE),
  validate(updateBusinessUnitSchema),
  auditLog('BusinessUnit'),
  businessUnitController.update
);
router.delete(
  '/:id',
  requirePermission(Permission.ORG_STRUCTURE_MANAGE),
  validate(businessUnitIdParamSchema),
  auditLog('BusinessUnit'),
  businessUnitController.remove
);

export default router;
