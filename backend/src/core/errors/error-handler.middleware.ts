import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { AppError } from './AppError';
import { ErrorCode } from './error-codes';
import { logger } from '../utils/logger';

function multerErrorToAppError(err: MulterError): AppError {
  switch (err.code) {
    case 'LIMIT_FILE_SIZE':
      return AppError.badRequest('The uploaded file is too large.');
    case 'LIMIT_UNEXPECTED_FILE':
      return AppError.badRequest(`Unexpected file field "${err.field}".`);
    case 'LIMIT_FILE_COUNT':
      return AppError.badRequest('Too many files were uploaded at once.');
    default:
      return AppError.badRequest('The file upload was rejected.');
  }
}

export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  
  
  
  
  
  
  
  
  
  
  
  if (res.headersSent) {
    next(err);
    return;
  }

  const resolvedErr = err instanceof MulterError ? multerErrorToAppError(err) : err;

  if (resolvedErr instanceof AppError) {
    logger.warn('Handled application error', {
      path: req.path,
      code: resolvedErr.code,
      message: resolvedErr.message,
      
      
      
      
      
      
      
      ...(resolvedErr.details !== undefined ? { details: resolvedErr.details } : {}),
    });
    writeErrorResponse(res, resolvedErr.statusCode, {
      success: false,
      code: resolvedErr.code,
      message: resolvedErr.message,
      details: resolvedErr.details,
    });
    return;
  }

  
  
  logger.error('Unhandled error', {
    path: req.path,
    error: err instanceof Error ? err.message : String(err),
    stack: err instanceof Error ? err.stack : undefined,
  });

  writeErrorResponse(res, 500, {
    success: false,
    code: ErrorCode.INTERNAL_ERROR,
    message: 'An unexpected error occurred. Please try again later.',
  });
}

function writeErrorResponse(res: Response, statusCode: number, body: Record<string, unknown>): void {
  try {
    res.status(statusCode).json(body);
  } catch (writeErr) {
    logger.error('errorHandlerMiddleware itself failed to write a response', {
      error: writeErr instanceof Error ? writeErr.message : String(writeErr),
    });
  }
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
