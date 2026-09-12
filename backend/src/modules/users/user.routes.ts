import { Router } from 'express';
import multer from 'multer';
import { userController } from './user.controller';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { requirePermission, requireAnyPermission } from '../../core/middleware/rbac.middleware';
import { validate } from '../../core/middleware/validate.middleware';
import { auditLog } from '../../core/middleware/audit-log.middleware';
import { AuditAction } from '../audit/audit.types';
import { userIdParamSchema, updateUserSchema } from './user.admin.validation';
import { updateMeSchema } from './user.validation';
import { Permission } from './user.types';

const router = Router();

const avatarUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/me', authMiddleware, userController.getMe);
router.patch('/me', authMiddleware, validate(updateMeSchema), auditLog('User'), userController.updateMe);
router.post(
  '/me/avatar',
  authMiddleware,
  avatarUpload.single('file'),
  auditLog('User', AuditAction.UPDATE),
  userController.uploadAvatar
);
router.delete('/me/avatar', authMiddleware, auditLog('User', AuditAction.UPDATE), userController.deleteAvatar);

router.get(
  '/directory',
  authMiddleware,
  requireAnyPermission([Permission.CONTRACT_UPDATE, Permission.OBLIGATION_MANAGE]),
  userController.directory
);

router.get('/', authMiddleware, requirePermission(Permission.USER_MANAGE), userController.list);
router.get(
  '/:id',
  authMiddleware,
  requirePermission(Permission.USER_MANAGE),
  validate(userIdParamSchema),
  userController.getById
);
router.patch(
  '/:id',
  authMiddleware,
  requirePermission(Permission.USER_MANAGE),
  validate(updateUserSchema),
  auditLog('User'),
  userController.update
);

export default router;
