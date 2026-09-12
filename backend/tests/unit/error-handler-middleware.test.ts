

import multer from 'multer';
import { AppError } from '../../src/core/errors/AppError';
import { errorHandlerMiddleware } from '../../src/core/errors/error-handler.middleware';
import { logger } from '../../src/core/utils/logger';

function mockReq() {
  return { path: '/test' } as any;
}

function mockRes(headersSent = false) {
  const res: any = { headersSent };
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorHandlerMiddleware', () => {
  it('formats a known AppError with its own status/code/message', () => {
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();

    errorHandlerMiddleware(AppError.notFound('Widget not found'), req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Widget not found' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('masks an unexpected error behind a generic 500 message, never leaking internals', () => {
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();

    errorHandlerMiddleware(new Error('connection string contains password=hunter2'), req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    const payload = res.json.mock.calls[0][0];
    expect(payload.message).not.toContain('hunter2');
    expect(payload.message).toBe('An unexpected error occurred. Please try again later.');
  });

  it('handles a thrown non-Error value (e.g. a rejected string) without itself throwing', () => {
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();

    expect(() => errorHandlerMiddleware('a raw string was thrown', req, res, next)).not.toThrow();
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('delegates to next(err) instead of writing a second response when headers were already sent', () => {
    const req = mockReq();
    const res = mockRes( true);
    const next = jest.fn();
    const err = new Error('boom');

    errorHandlerMiddleware(err, req, res, next);

    expect(next).toHaveBeenCalledWith(err);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });

  it('never throws even when res.json itself throws (defense in depth for the last line of defense)', () => {
    const req = mockReq();
    const res = mockRes();
    res.json = jest.fn().mockImplementation(() => {
      throw new Error('socket already closed');
    });
    const next = jest.fn();

    
    
    
    
    expect(() => errorHandlerMiddleware(new Error('original'), req, res, next)).not.toThrow();
  });

  it('includes the field-level validation reason in the server log, not just the generic "Validation failed" message', () => {
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => logger);

    const details = { fieldErrors: { category: ['Required'] } };
    errorHandlerMiddleware(AppError.badRequest('Validation failed', details), req, res, next);

    expect(warnSpy).toHaveBeenCalledWith(
      'Handled application error',
      expect.objectContaining({ details })
    );
    warnSpy.mockRestore();
  });

  it('does not add a details key to the log when the AppError has none', () => {
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => logger);

    errorHandlerMiddleware(AppError.notFound('Widget not found'), req, res, next);

    const loggedMeta = warnSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(loggedMeta).not.toHaveProperty('details');
    warnSpy.mockRestore();
  });

  

  it('translates a MulterError (e.g. file too large) into a clear 400, not a masked 500', () => {
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();
    const warnSpy = jest.spyOn(logger, 'warn').mockImplementation(() => logger);

    errorHandlerMiddleware(new multer.MulterError('LIMIT_FILE_SIZE'), req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    const payload = res.json.mock.calls[0][0];
    expect(payload.success).toBe(false);
    expect(payload.message).toBe('The uploaded file is too large.');
    
    
    
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('includes the offending field name for an unexpected-file MulterError', () => {
    const req = mockReq();
    const res = mockRes();
    const next = jest.fn();

    errorHandlerMiddleware(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'avatar'), req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    const payload = res.json.mock.calls[0][0];
    expect(payload.message).toContain('avatar');
  });
});
