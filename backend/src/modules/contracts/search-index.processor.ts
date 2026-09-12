import { Worker, Job } from 'bullmq';
import { redisConnection } from '../../config/redis';
import { QueueName } from '../../core/queues/queue.names';
import { indexContractNow } from './contract-search.service';
import { logger } from '../../core/utils/logger';

interface SearchIndexJobData {
  contractId: string;
}

export function startSearchIndexWorker(): Worker<SearchIndexJobData> {
  const worker = new Worker<SearchIndexJobData>(
    QueueName.SEARCH_INDEXING,
    async (job: Job<SearchIndexJobData>) => {
      await indexContractNow(job.data.contractId);
    },
    { connection: redisConnection, concurrency: 5 }
  );

  worker.on('failed', (job, err) => {
    logger.error('Search indexing job failed', { jobId: job?.id, contractId: job?.data.contractId, error: err.message });
  });

  
  
  
  
  worker.on('error', (err) => {
    logger.error('Search indexing worker error', { error: err.message });
  });

  return worker;
}
