import crypto from 'node:crypto';

export function generateSecureToken(): { token: string; tokenHash: string } {
  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, tokenHash };
}

export function hashSecureToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
