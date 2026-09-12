import { Worker } from 'bullmq';
import { getQueue } from '../queues/queue.factory';
import { QueueName } from '../queues/queue.names';
import { redisConnection } from '../../config/redis';
import { runReminderScan } from './reminder-scan.job';
import { logger } from '../utils/logger';

const DAILY_CRON = '0 6 * * *'; 
const SCHEDULER_ID = 'reminder-scan-daily';

export async function startReminderScheduler(): Promise<Worker> {
  const queue = getQueue(QueueName.REMINDER_SCAN);
  await queue.upsertJobScheduler(
    SCHEDULER_ID,
    { pattern: DAILY_CRON },
    { name: 'daily-sweep', data: {} }
  );

  const worker = new Worker(
    QueueName.REMINDER_SCAN,
    async () => {
      await runReminderScan();
    },
    { connection: redisConnection, concurrency: 1 }
  );

  worker.on('failed', (job, err) => {
    logger.error('Reminder scan job failed', { jobId: job?.id, error: err.message });
  });

  
  
  
  
  worker.on('error', (err) => {
    logger.error('Reminder scan worker error', { error: err.message });
  });

  logger.info('Reminder scan scheduler started', { cron: DAILY_CRON, schedulerId: SCHEDULER_ID });
  return worker;
}
