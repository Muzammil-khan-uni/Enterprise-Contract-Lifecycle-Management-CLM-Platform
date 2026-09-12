import fs from 'node:fs';
import path from 'node:path';
import { ocrProvider } from '../../src/modules/documents/ocr.provider';

describe('ocrProvider (real Tesseract engine)', () => {
  it('extracts recognizable text from a clean test image', async () => {
    const imagePath = path.join(__dirname, '..', 'fixtures', 'ocr-sample.png');
    const buffer = fs.readFileSync(imagePath);

    const text = await ocrProvider.extractText(buffer, 'image/png');

    expect(text).not.toBeNull();
    
    
    
    const normalized = (text ?? '').toUpperCase();
    expect(normalized).toContain('SAMPLE');
    expect(normalized).toContain('AGREEMENT');
    expect(normalized).toContain('DOCUMENT');
  }, 30_000);

  it('extracts recognizable text from a real PDF by rasterizing page 1 first', async () => {
    const pdfPath = path.join(__dirname, '..', 'fixtures', 'ocr-sample.pdf');
    const buffer = fs.readFileSync(pdfPath);

    const text = await ocrProvider.extractText(buffer, 'application/pdf');

    expect(text).not.toBeNull();
    const normalized = (text ?? '').toUpperCase();
    expect(normalized).toContain('SAMPLE');
    expect(normalized).toContain('AGREEMENT');
  }, 30_000);

  it('returns null gracefully for a corrupt PDF, without throwing', async () => {
    
    
    
    
    const corruptPdf = Buffer.from('this is not a valid PDF file');

    const text = await ocrProvider.extractText(corruptPdf, 'application/pdf');

    expect(text).toBeNull();
  }, 15_000);

  it('returns null for a genuinely unsupported mime type without attempting extraction', async () => {
    const result = await ocrProvider.extractText(Buffer.from('irrelevant'), 'application/msword');
    expect(result).toBeNull();
  });
});

