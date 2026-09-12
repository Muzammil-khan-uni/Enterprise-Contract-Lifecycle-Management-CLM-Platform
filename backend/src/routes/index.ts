import { Router } from 'express';
import mongoose from 'mongoose';
import { redisClient } from '../config/redis';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/users/user.routes';
import tenantRoutes from '../modules/tenants/tenant.routes';
import contractRoutes from '../modules/contracts/contract.routes';
import templateRoutes from '../modules/templates/template.routes';
import vendorRoutes from '../modules/vendors/vendor.routes';
import businessUnitRoutes from '../modules/business-units/business-unit.routes';
import departmentRoutes from '../modules/departments/department.routes';
import { workflowRouter } from '../modules/workflow/workflow.routes';
import { signatureRouter } from '../modules/signature/signature.routes';
import { obligationRouter } from '../modules/obligations/obligation.routes';
import notificationRoutes from '../modules/notifications/notification.routes';
import auditRoutes from '../modules/audit/audit.routes';
import dashboardRoutes from '../modules/dashboard/dashboard.routes';

const router = Router();

router.get('/health', (_req, res) => {
  const mongoUp = mongoose.connection.readyState === 1;
  const redisUp = redisClient.status === 'ready';
  const healthy = mongoUp && redisUp;

  res.status(healthy ? 200 : 503).json({
    success: healthy,
    data: {
      status: healthy ? 'ok' : 'degraded',
      dependencies: {
        mongo: mongoUp ? 'up' : 'down',
        redis: redisUp ? 'up' : 'down',
      },
    },
  });
});

router.use('/tenants', tenantRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/contracts', contractRoutes);
router.use('/templates', templateRoutes);
router.use('/vendors', vendorRoutes);
router.use('/business-units', businessUnitRoutes);
router.use('/departments', departmentRoutes);
router.use('/workflow', workflowRouter);
router.use('/signature', signatureRouter);
router.use('/obligations', obligationRouter);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/dashboard', dashboardRoutes);

export default router;
