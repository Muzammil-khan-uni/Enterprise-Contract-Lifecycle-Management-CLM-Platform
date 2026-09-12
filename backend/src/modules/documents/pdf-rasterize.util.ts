import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { logger } from '../../core/utils/logger';

const execFileAsync = promisify(execFile);

export async function rasterizePdfFirstPage(pdfBuffer: Buffer): Promise<Buffer | null> {
  let workDir: string | null = null;
  try {
    workDir = await mkdtemp(path.join(tmpdir(), 'clm-pdf-'));
    const inputPath = path.join(workDir, 'input.pdf');
    const outputPrefix = path.join(workDir, 'page');

    await writeFile(inputPath, pdfBuffer);
    await execFileAsync('pdftoppm', ['-png', '-r', '200', '-f', '1', '-l', '1', '-singlefile', inputPath, outputPrefix]);

    return await readFile(`${outputPrefix}.png`);
  } catch (err) {
    logger.warn('PDF rasterization failed (is poppler-utils installed?), skipping OCR for this file', {
      error: (err as Error).message,
    });
    return null;
  } finally {
    if (workDir) {
      await rm(workDir, { recursive: true, force: true }).catch(() => {
        
      });
    }
  }
}
