import Redis from 'ioredis';
import { env } from './env';
import { logger } from '../core/utils/logger';

export const redisClient = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  retryStrategy: (times) => (times > 5 ? null : Math.min(times * 200, 2000)),
});

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
  retryStrategy: (times) => (times > 5 ? null : Math.min(times * 200, 2000)),
});

redisClient.on('connect', () => logger.info('Redis (client) connected'));
redisClient.on('error', (err) => logger.error('Redis (client) error', { error: err.message }));

redisConnection.on('error', (err) => logger.error('Redis (BullMQ connection) error', { error: err.message }));

export async function connectRedis(): Promise<void> {
  await redisClient.connect();
  
  
  
  
}
