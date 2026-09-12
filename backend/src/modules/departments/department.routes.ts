import { Router } from 'express';
import { departmentController } from './department.controller';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { requirePermission } from '../../core/middleware/rbac.middleware';
import { validate } from '../../core/middleware/validate.middleware';
import { auditLog } from '../../core/middleware/audit-log.middleware';
import { createDepartmentSchema, updateDepartmentSchema, departmentIdParamSchema } from './department.validation';
import { Permission } from '../users/user.types';

const router = Router();

router.use(authMiddleware);

router.get('/', departmentController.list);
router.get('/:id', validate(departmentIdParamSchema), departmentController.getById);

router.post(
  '/',
  requirePermission(Permission.ORG_STRUCTURE_MANAGE),
  validate(createDepartmentSchema),
  auditLog('Department'),
  departmentController.create
);
router.patch(
  '/:id',
  requirePermission(Permission.ORG_STRUCTURE_MANAGE),
  validate(updateDepartmentSchema),
  auditLog('Department'),
  departmentController.update
);
router.delete(
  '/:id',
  requirePermission(Permission.ORG_STRUCTURE_MANAGE),
  validate(departmentIdParamSchema),
  auditLog('Department'),
  departmentController.remove
);

export default router;
