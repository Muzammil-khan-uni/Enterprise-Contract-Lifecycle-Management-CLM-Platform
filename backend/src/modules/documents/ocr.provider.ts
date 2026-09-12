import path from 'node:path';
import { createWorker } from 'tesseract.js';
import { logger } from '../../core/utils/logger';
import { rasterizePdfFirstPage } from './pdf-rasterize.util';

const IMAGE_MIME_TYPES = new Set(['image/png', 'image/jpeg']);
const PDF_MIME_TYPE = 'application/pdf';
const SUPPORTED_MIME_TYPES = new Set([...IMAGE_MIME_TYPES, PDF_MIME_TYPE]);

function resolveLangPath(): string {
  const pkgJsonPath = require.resolve('@tesseract.js-data/eng/package.json');
  return path.join(path.dirname(pkgJsonPath), '4.0.0');
}

export interface IOcrProvider {
  extractText(buffer: Buffer, mimeType: string): Promise<string | null>;
}

class TesseractOcrProvider implements IOcrProvider {
  async extractText(buffer: Buffer, mimeType: string): Promise<string | null> {
    if (!SUPPORTED_MIME_TYPES.has(mimeType)) {
      return null;
    }

    let imageBuffer = buffer;
    if (mimeType === PDF_MIME_TYPE) {
      const rasterized = await rasterizePdfFirstPage(buffer);
      if (!rasterized) return null; 
      imageBuffer = rasterized;
    }

    
    
    
    
    
    
    
    
    const worker = await createWorker('eng', 1, {
      langPath: resolveLangPath(),
      gzip: true,
      cachePath: '/tmp/tesseract-cache',
      logger: () => {}, 
    });

    try {
      const {
        data: { text },
      } = await worker.recognize(imageBuffer);
      const trimmed = text.trim();
      return trimmed.length > 0 ? trimmed : null;
    } catch (err) {
      logger.error('OCR extraction failed', { error: (err as Error).message });
      return null;
    } finally {
      await worker.terminate();
    }
  }
}

export const ocrProvider: IOcrProvider = new TesseractOcrProvider();
