import { generateSecureToken, hashSecureToken } from '../../src/core/utils/secure-token.util';

describe('generateSecureToken / hashSecureToken', () => {
  it('generates a token and its hash, and re-hashing the plain token matches', () => {
    const { token, tokenHash } = generateSecureToken();
    expect(token).toHaveLength(64); 
    expect(hashSecureToken(token)).toBe(tokenHash);
  });

  it('generates a different token (and hash) on every call', () => {
    const first = generateSecureToken();
    const second = generateSecureToken();
    expect(first.token).not.toBe(second.token);
    expect(first.tokenHash).not.toBe(second.tokenHash);
  });

  it('the stored hash never equals the plain token itself', () => {
    const { token, tokenHash } = generateSecureToken();
    expect(tokenHash).not.toBe(token);
  });
});
