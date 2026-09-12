import { documentRepository } from './document.repository';
import { storageProvider } from './storage.provider';
import { contractRepository } from '../contracts/contract.repository';
import { DocumentType } from './document.types';
import { AppError } from '../../core/errors/AppError';
import { logger } from '../../core/utils/logger';
import { getQueue } from '../../core/queues/queue.factory';
import { QueueName } from '../../core/queues/queue.names';
import { runWithTenant } from '../../core/tenancy/tenant-context';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; 
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const OCR_ELIGIBLE_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'application/pdf']);
const OCR_MAX_BYTES = 8 * 1024 * 1024;

function hasExpectedFileSignature(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === 'application/pdf') return buffer.subarray(0, 5).toString('ascii') === '%PDF-';
  if (mimeType === 'image/png') return buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  if (mimeType === 'image/jpeg') return buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
  if (mimeType === 'application/msword') return buffer.subarray(0, 8).equals(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]));
  if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    return buffer.subarray(0, 4).equals(Buffer.from([0x50, 0x4b, 0x03, 0x04]));
  }
  return false;
}

export const documentService = {
  async uploadDocument(
    contractId: string,
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    type: DocumentType,
    uploadedBy: string,
    tenantId: string
  ) {
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    return runWithTenant(tenantId, async () => {
      const contract = await contractRepository.findById(contractId);
      if (!contract) throw AppError.notFound('Contract not found');

      if (file.size > MAX_UPLOAD_BYTES) {
        throw AppError.badRequest(`File exceeds the ${MAX_UPLOAD_BYTES / (1024 * 1024)}MB upload limit`);
      }
      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        throw AppError.badRequest(`File type "${file.mimetype}" is not permitted for contract attachments`);
      }
      if (!hasExpectedFileSignature(file.buffer, file.mimetype)) {
        throw AppError.badRequest('The uploaded file content does not match its declared file type');
      }

      const { storageKey, storageUrl } = await storageProvider.upload(file.buffer, file.originalname, file.mimetype, 'clm-platform/documents', true);

      const document = await documentRepository.create({
        contract: contract._id,
        type,
        fileName: file.originalname,
        storageKey,
        storageUrl,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        uploadedBy: uploadedBy as never,
        version: 1,
        ocrText: null,
      });

      logger.info('Document record created', { documentId: document._id.toString(), contractId });

      if (OCR_ELIGIBLE_MIME_TYPES.has(file.mimetype) && file.size <= OCR_MAX_BYTES) {
        await getQueue(QueueName.OCR_PROCESSING).add('extract', {
          documentId: document._id.toString(),
          contractId: contract._id.toString(),
          tenantId,
          bufferBase64: file.buffer.toString('base64'),
          mimeType: file.mimetype,
        });
        logger.info('OCR job enqueued', { documentId: document._id.toString() });
      }

      return document;
    });
  },

  async listForContract(contractId: string) {
    return documentRepository.listForContract(contractId);
  },

  

  async getForDownload(contractId: string, documentId: string) {
    const document = await documentRepository.findById(documentId);
    if (!document || document.contract.toString() !== contractId) {
      throw AppError.notFound('Document not found for this contract');
    }
    return document;
  },

  async getDownloadUrl(contractId: string, documentId: string) {
    const document = await documentRepository.findById(documentId);
    if (!document || document.contract.toString() !== contractId) {
      throw AppError.notFound('Document not found for this contract');
    }
    return storageProvider.getDownloadUrl(document.storageKey, document.fileName, document.mimeType);
  },

  async deleteDocument(contractId: string, id: string) {
    const document = await documentRepository.findById(id);
    
    
    
    
    
    
    if (!document || document.contract.toString() !== contractId) {
      throw AppError.notFound('Document not found for this contract');
    }

    await storageProvider.delete(document.storageKey);
    await documentRepository.deleteById(id);
  },
};
