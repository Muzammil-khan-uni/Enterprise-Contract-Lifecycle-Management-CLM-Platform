import { Router } from 'express';
import { notificationController } from './notification.controller';
import { authMiddleware } from '../../core/middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);
router.get('/', notificationController.list);
router.patch('/:id/read', notificationController.markRead);
router.patch('/read-all', notificationController.markAllRead);

export default router;
