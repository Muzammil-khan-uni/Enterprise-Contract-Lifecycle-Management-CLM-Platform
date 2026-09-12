import { Router } from 'express';
import { dashboardController } from './dashboard.controller';
import { riskController } from '../risk/risk.controller';
import { authMiddleware } from '../../core/middleware/auth.middleware';
import { requirePermission } from '../../core/middleware/rbac.middleware';
import { Permission } from '../users/user.types';

const router = Router();

router.use(authMiddleware, requirePermission(Permission.DASHBOARD_READ));
router.get('/summary', dashboardController.summary);
router.get('/expiring', dashboardController.expiring);
router.get('/by-department', dashboardController.byDepartment);
router.get('/by-vendor', dashboardController.byVendor);

router.get('/risk', riskController.topRisk);

export default router;
