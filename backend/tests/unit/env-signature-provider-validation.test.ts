const ORIGINAL_ENV = { ...process.env };

function loadEnvWith(overrides: Record<string, string>) {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV, ...overrides };
  return () => require('../../src/config/env');
}

describe('env.ts — SIGNATURE_PROVIDER credential requirements', () => {
  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('rejects an unrecognized SIGNATURE_PROVIDER value (no "simulated" option exists)', () => {
    expect(loadEnvWith({ SIGNATURE_PROVIDER: 'simulated' })).toThrow();
  });

  it('requires the full DocuSign credential set when SIGNATURE_PROVIDER=docusign', () => {
    expect(
      loadEnvWith({
        SIGNATURE_PROVIDER: 'docusign',
        DOCUSIGN_INTEGRATION_KEY: '',
        DOCUSIGN_USER_ID: '',
        DOCUSIGN_ACCOUNT_ID: '',
        DOCUSIGN_PRIVATE_KEY: '',
        DOCUSIGN_WEBHOOK_HMAC_KEY: '',
      })
    ).toThrow(/DOCUSIGN_INTEGRATION_KEY/);
  });

  it('boots successfully when every required DocuSign credential is present', () => {
    expect(
      loadEnvWith({
        SIGNATURE_PROVIDER: 'docusign',
        DOCUSIGN_INTEGRATION_KEY: 'key',
        DOCUSIGN_USER_ID: 'user',
        DOCUSIGN_ACCOUNT_ID: 'account',
        DOCUSIGN_PRIVATE_KEY: 'pem',
        DOCUSIGN_WEBHOOK_HMAC_KEY: 'hmac',
      })
    ).not.toThrow();
  });

  it('requires the full Adobe Sign credential set when SIGNATURE_PROVIDER=adobesign', () => {
    expect(
      loadEnvWith({
        SIGNATURE_PROVIDER: 'adobesign',
        ADOBESIGN_CLIENT_ID: '',
        ADOBESIGN_CLIENT_SECRET: '',
        ADOBESIGN_REFRESH_TOKEN: '',
        ADOBESIGN_WEBHOOK_CLIENT_ID: '',
      })
    ).toThrow(/ADOBESIGN_CLIENT_ID/);
  });

  it('boots successfully when every required Adobe Sign credential is present', () => {
    expect(
      loadEnvWith({
        SIGNATURE_PROVIDER: 'adobesign',
        ADOBESIGN_CLIENT_ID: 'id',
        ADOBESIGN_CLIENT_SECRET: 'secret',
        ADOBESIGN_REFRESH_TOKEN: 'token',
        ADOBESIGN_WEBHOOK_CLIENT_ID: 'webhook-id',
      })
    ).not.toThrow();
  });
});
