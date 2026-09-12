import { redisClient } from '../../config/redis';
import { logger } from '../../core/utils/logger';

export async function cached<T>(key: string, ttlSeconds: number, compute: () => Promise<T>): Promise<T> {
  try {
    const hit = await redisClient.get(key);
    if (hit) return JSON.parse(hit) as T;
  } catch (err) {
    logger.warn('Dashboard cache read failed, computing directly', { key, error: (err as Error).message });
  }

  const result = await compute();

  try {
    await redisClient.set(key, JSON.stringify(result), 'EX', ttlSeconds);
  } catch (err) {
    logger.warn('Dashboard cache write failed', { key, error: (err as Error).message });
  }

  return result;
}

export const DASHBOARD_CACHE_SUFFIXES = ['summary', 'expiring', 'by-department', 'by-vendor'] as const;

export function tenantCacheKey(tenantId: string, suffix: (typeof DASHBOARD_CACHE_SUFFIXES)[number]): string {
  return `dashboard:${tenantId}:${suffix}`;
}

export async function invalidateByPattern(pattern: string): Promise<void> {
  try {
    let cursor = '0';
    do {
      const [nextCursor, keys] = await redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;
      if (keys.length > 0) await redisClient.del(...keys);
    } while (cursor !== '0');
  } catch (err) {
    logger.warn('Cache pattern invalidation failed', { pattern, error: (err as Error).message });
  }
}

export async function invalidateTenantDashboardCache(tenantId: string): Promise<void> {
  try {
    const keys = DASHBOARD_CACHE_SUFFIXES.map((suffix) => tenantCacheKey(tenantId, suffix));
    await redisClient.del(...keys);
  } catch (err) {
    logger.warn('Dashboard cache invalidation failed', { tenantId, error: (err as Error).message });
  }
}
