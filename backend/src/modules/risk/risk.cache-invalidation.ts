import { onEntityChange } from '../../core/realtime/realtime-bus';
import { invalidateByPattern } from '../dashboard/dashboard.cache.util';
import { logger } from '../../core/utils/logger';

const RISK_AFFECTING_RESOURCES = new Set(['Contract', 'Obligation', 'ApprovalWorkflow', 'Vendor']);

export function registerRiskCacheInvalidation(): void {
  onEntityChange(({ resource, tenantId }) => {
    if (!RISK_AFFECTING_RESOURCES.has(resource)) return;
    invalidateByPattern(`risk:${tenantId}:top:*`).catch((err) => {
      logger.warn('Risk cache invalidation listener failed', { resource, tenantId, error: (err as Error).message });
    });
  });
}
