import { onEntityChange } from '../../core/realtime/realtime-bus';
import { invalidateTenantDashboardCache } from './dashboard.cache.util';
import { logger } from '../../core/utils/logger';

const DASHBOARD_AFFECTING_RESOURCES = new Set(['Contract', 'Obligation', 'ApprovalWorkflow', 'Department']);

export function registerDashboardCacheInvalidation(): void {
  onEntityChange(({ resource, tenantId }) => {
    if (!DASHBOARD_AFFECTING_RESOURCES.has(resource)) return;
    invalidateTenantDashboardCache(tenantId).catch((err) => {
      logger.warn('Dashboard cache invalidation listener failed', { resource, tenantId, error: (err as Error).message });
    });
  });
}
