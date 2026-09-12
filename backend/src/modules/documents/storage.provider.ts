import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { env } from '../../config/env';
import { AppError } from '../../core/errors/AppError';
import path from 'node:path';
import { logger } from '../../core/utils/logger';

export interface StorageUploadResult {
  storageKey: string; 
  storageUrl: string; 
}

export interface IStorageProvider {
  upload(buffer: Buffer, fileName: string, mimeType: string, folder?: string, privateAsset?: boolean): Promise<StorageUploadResult>;
  getDownloadUrl(storageKey: string, fileName: string, mimeType: string, expiresInSeconds?: number): string;
  delete(storageKey: string): Promise<void>;
}

class CloudinaryStorageProvider implements IStorageProvider {
  constructor() {
    cloudinary.config({
      cloud_name: env.CLOUDINARY_CLOUD_NAME,
      api_key: env.CLOUDINARY_API_KEY,
      api_secret: env.CLOUDINARY_API_SECRET,
    });
  }

  

  async upload(buffer: Buffer, fileName: string, mimeType: string, folder = 'clm-platform/documents', privateAsset = false): Promise<StorageUploadResult> {
    if (!env.CLOUDINARY_CLOUD_NAME) {
      throw AppError.badRequest('Cloudinary is not configured (missing CLOUDINARY_CLOUD_NAME)');
    }

    
    
    
    
    
    
    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          filename_override: fileName,
          use_filename: true,
          unique_filename: true,
          ...(privateAsset ? { type: 'private' as const } : {}),
        },
        (error, result) => {
          if (error || !result) {
            reject(error ?? new Error('Cloudinary upload returned no result'));
            return;
          }
          resolve(result);
        }
      );
      uploadStream.end(buffer);
    });

    logger.info('File uploaded to Cloudinary', { publicId: result.public_id, mimeType, folder });

    return { storageKey: result.public_id, storageUrl: result.secure_url };
  }

  getDownloadUrl(storageKey: string, fileName: string, mimeType: string, expiresInSeconds = 300): string {
    const extension = path.extname(fileName).replace(/^\./, '') || 'bin';
    return cloudinary.utils.private_download_url(storageKey, extension, {
      resource_type: mimeType.startsWith('image/') ? 'image' : 'raw',
      type: 'private',
      expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
      attachment: true,
    });
  }

  async delete(storageKey: string): Promise<void> {
    await cloudinary.uploader.destroy(storageKey, { resource_type: 'raw', invalidate: true }).catch(async () => {
      
      
      
      await cloudinary.uploader.destroy(storageKey, { resource_type: 'image', invalidate: true });
    });
  }
}

export const storageProvider: IStorageProvider = new CloudinaryStorageProvider();
