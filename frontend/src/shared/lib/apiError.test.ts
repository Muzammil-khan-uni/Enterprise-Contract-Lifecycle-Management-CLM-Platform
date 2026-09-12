import { describe, it, expect } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { getApiErrorMessage } from './apiError';

function makeAxiosError(data: unknown, status = 400): AxiosError {
  const error = new AxiosError('Request failed');
  error.response = {
    data,
    status,
    statusText: 'Bad Request',
    headers: {},
    config: { headers: new AxiosHeaders() },
  };
  return error;
}

describe('getApiErrorMessage', () => {
  it('extracts the backend message field from a 4xx/5xx response', () => {
    const error = makeAxiosError({ success: false, message: 'Cannot delete a department that still has users' });
    expect(getApiErrorMessage(error)).toBe('Cannot delete a department that still has users');
  });

  it('falls back to the default message when the response has no message field', () => {
    const error = makeAxiosError({ success: false });
    expect(getApiErrorMessage(error)).toBe('Something went wrong. Please try again.');
  });

  it('falls back to a custom message when provided', () => {
    const error = makeAxiosError({});
    expect(getApiErrorMessage(error, 'Could not save changes')).toBe('Could not save changes');
  });

  it('falls back to the default message for a non-Axios error (e.g. a network failure)', () => {
    expect(getApiErrorMessage(new Error('Network Error'))).toBe('Something went wrong. Please try again.');
  });

  it('falls back to the default message when message is present but not a string', () => {
    const error = makeAxiosError({ message: { nested: 'not a string' } });
    expect(getApiErrorMessage(error)).toBe('Something went wrong. Please try again.');
  });

  it('appends field-level reasons from a Zod validation error\'s details.fieldErrors', () => {
    const error = makeAxiosError({
      success: false,
      message: 'Validation failed',
      details: { fieldErrors: { category: ['Required'], title: ['Required'] } },
    });
    expect(getApiErrorMessage(error)).toBe('Validation failed: category: Required; title: Required');
  });

  it('joins multiple reasons for the same field', () => {
    const error = makeAxiosError({
      success: false,
      message: 'Validation failed',
      details: { fieldErrors: { password: ['Too short', 'Must contain a number'] } },
    });
    expect(getApiErrorMessage(error)).toBe('Validation failed: password: Too short, Must contain a number');
  });

  it('falls back to the plain message when details has no usable fieldErrors', () => {
    const error = makeAxiosError({ success: false, message: 'Validation failed', details: {} });
    expect(getApiErrorMessage(error)).toBe('Validation failed');
  });
});
