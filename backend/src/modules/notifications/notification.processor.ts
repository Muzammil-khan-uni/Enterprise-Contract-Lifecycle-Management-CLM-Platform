import { Worker, Job } from 'bullmq';
import { redisConnection } from '../../config/redis';
import { QueueName } from '../../core/queues/queue.names';
import { notificationService } from './notification.service';
import { NotificationJobData } from './notification.job.types';
import { logger } from '../../core/utils/logger';

export function startNotificationWorker(): Worker<NotificationJobData> {
  const worker = new Worker<NotificationJobData>(
    QueueName.NOTIFICATIONS,
    async (job: Job<NotificationJobData>) => {
      await notificationService.createAndDeliver(job.data);
    },
    { connection: redisConnection, concurrency: 10 }
  );

  worker.on('completed', (job) => {
    logger.debug('Notification job delivered', { jobId: job.id, recipient: job.data.recipient });
  });

  worker.on('failed', (job, err) => {
    logger.error('Notification job failed', { jobId: job?.id, error: err.message });
  });

  
  
  
  
  
  worker.on('error', (err) => {
    logger.error('Notification worker error', { error: err.message });
  });

  return worker;
}
