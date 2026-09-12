import { Queue, QueueOptions } from 'bullmq';
import { redisConnection } from '../../config/redis';
import { QueueName } from './queue.names';
import { logger } from '../utils/logger';

const defaultQueueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
};

const queues = new Map<QueueName, Queue>();

export function getQueue(name: QueueName): Queue {
  if (!queues.has(name)) {
    const queue = new Queue(name, defaultQueueOptions);
    
    
    
    
    
    
    
    
    
    
    
    
    
    queue.on('error', (err) => {
      logger.error('BullMQ queue connection error', { queue: name, error: err.message });
    });
    queues.set(name, queue);
  }
  return queues.get(name)!;
}
