import { ErrorCode } from './error-codes';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;

  constructor(message: string, statusCode: number, code: ErrorCode, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, details?: unknown) {
    return new AppError(message, 400, ErrorCode.VALIDATION_ERROR, details);
  }
  static unauthorized(message = 'Unauthorized') {
    return new AppError(message, 401, ErrorCode.UNAUTHORIZED);
  }
  static forbidden(message = 'Forbidden') {
    return new AppError(message, 403, ErrorCode.FORBIDDEN);
  }
  static notFound(message = 'Resource not found') {
    return new AppError(message, 404, ErrorCode.NOT_FOUND);
  }
  static conflict(message: string) {
    return new AppError(message, 409, ErrorCode.CONFLICT);
  }
  static locked(message: string) {
    return new AppError(message, 423, ErrorCode.LOCKED);
  }
  

  static internal(message: string) {
    return new AppError(message, 500, ErrorCode.INTERNAL_ERROR);
  }
}
