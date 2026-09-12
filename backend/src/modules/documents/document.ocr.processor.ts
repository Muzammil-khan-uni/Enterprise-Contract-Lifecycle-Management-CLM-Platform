import { Worker, Job } from 'bullmq';
import { redisConnection } from '../../config/redis';
import { QueueName } from '../../core/queues/queue.names';
import { ocrProvider } from './ocr.provider';
import { documentRepository } from './document.repository';
import { logger } from '../../core/utils/logger';
import { OcrJobData } from './document.ocr.job.types';
import { runWithTenant } from '../../core/tenancy/tenant-context';
import { enqueueContractIndexing } from '../contracts/contract-search.service';

export function startOcrWorker(): Worker<OcrJobData> {
  const worker = new Worker<OcrJobData>(
    QueueName.OCR_PROCESSING,
    async (job: Job<OcrJobData>) => {
      const buffer = Buffer.from(job.data.bufferBase64, 'base64');
      const text = await ocrProvider.extractText(buffer, job.data.mimeType);
      
      
      
      
      
      
      
      
      
      
      await runWithTenant(job.data.tenantId, () =>
        documentRepository.updateById(job.data.documentId, { ocrText: text })
      );
      logger.info('OCR processing complete', {
        documentId: job.data.documentId,
        extractedChars: text?.length ?? 0,
      });

      
      
      
      
      
      
      
      
      
      if (text) {
        await enqueueContractIndexing(job.data.contractId);
      }
    },
    { connection: redisConnection, concurrency: 2 } 
  );

  worker.on('failed', (job, err) => {
    logger.error('OCR job failed', { jobId: job?.id, documentId: job?.data.documentId, error: err.message });
  });

  
  
  
  worker.on('error', (err) => {
    logger.error('OCR worker error', { error: err.message });
  });

  return worker;
}
