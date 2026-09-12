import { AxiosError } from 'axios';

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    const message = data?.message;
    if (typeof message === 'string' && message.length > 0) {
      const fieldErrors = data?.details?.fieldErrors as Record<string, string[]> | undefined;
      if (fieldErrors && typeof fieldErrors === 'object') {
        const reasons = Object.entries(fieldErrors)
          .filter(([, msgs]) => Array.isArray(msgs) && msgs.length > 0)
          .map(([field, msgs]) => `${field}: ${msgs.join(', ')}`);
        if (reasons.length > 0) return `${message}: ${reasons.join('; ')}`;
      }
      return message;
    }
  }
  return fallback;
}
