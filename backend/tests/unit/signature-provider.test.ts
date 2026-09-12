import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

const ORIGINAL_ENV = { ...process.env };

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs1', format: 'pem' },
});

function loadDocuSignProvider(envOverrides: Record<string, string> = {}) {
  jest.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    SIGNATURE_PROVIDER: 'docusign',
    DOCUSIGN_INTEGRATION_KEY: 'test-integration-key',
    DOCUSIGN_USER_ID: 'test-user-id',
    DOCUSIGN_ACCOUNT_ID: 'test-account-id',
    DOCUSIGN_PRIVATE_KEY: privateKey.replace(/\n/g, '\\n'),
    DOCUSIGN_OAUTH_BASE_URL: 'https://account-d.docusign.com',
    DOCUSIGN_API_BASE_URL: 'https://demo.docusign.net/restapi',
    DOCUSIGN_WEBHOOK_HMAC_KEY: 'test-hmac-key',
    API_PUBLIC_BASE_URL: 'https://api.test.example.com',
    ...envOverrides,
  };
  
  return require('../../src/modules/signature/signature.provider').signatureProvider;
}

function loadAdobeSignProvider(envOverrides: Record<string, string> = {}) {
  jest.resetModules();
  process.env = {
    ...ORIGINAL_ENV,
    SIGNATURE_PROVIDER: 'adobesign',
    ADOBESIGN_CLIENT_ID: 'test-client-id',
    ADOBESIGN_CLIENT_SECRET: 'test-client-secret',
    ADOBESIGN_REFRESH_TOKEN: 'test-refresh-token',
    ADOBESIGN_BASE_URI: 'https://api.na1.adobesign.com',
    ADOBESIGN_WEBHOOK_CLIENT_ID: 'test-webhook-client-id',
    API_PUBLIC_BASE_URL: 'https://api.test.example.com',
    ...envOverrides,
  };
  
  return require('../../src/modules/signature/signature.provider').signatureProvider;
}

describe('DocuSignProvider', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('requests an access token with a genuinely valid RS256 JWT assertion, then creates a real envelope', async () => {
    fetchMock
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'fake-access-token', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ envelopeId: 'envelope-123' }),
      });

    const provider = loadDocuSignProvider();
    const result = await provider.requestSignature({
      contractId: 'contract-1',
      signatureId: 'sig-1',
      signerName: 'Jane Doe',
      signerEmail: 'jane@example.com',
      documentBuffer: Buffer.from('%PDF-1.4 fake pdf bytes'),
      documentFileName: 'contract.pdf',
      subject: 'Please sign',
    });

    expect(result.providerReferenceId).toBe('envelope-123');

    
    const [tokenUrl, tokenInit] = fetchMock.mock.calls[0];
    expect(tokenUrl).toBe('https://account-d.docusign.com/oauth/token');
    const tokenBody = new URLSearchParams(tokenInit.body as string);
    expect(tokenBody.get('grant_type')).toBe('urn:ietf:params:oauth:grant-type:jwt-bearer');
    const assertion = tokenBody.get('assertion')!;
    const decoded = jwt.verify(assertion, publicKey, { algorithms: ['RS256'] }) as jwt.JwtPayload;
    expect(decoded.iss).toBe('test-integration-key');
    expect(decoded.sub).toBe('test-user-id');
    expect(decoded.scope).toBe('signature impersonation');

    
    
    const [envelopeUrl, envelopeInit] = fetchMock.mock.calls[1];
    expect(envelopeUrl).toBe('https://demo.docusign.net/restapi/v2.1/accounts/test-account-id/envelopes');
    expect(envelopeInit.headers.Authorization).toBe('Bearer fake-access-token');
    const envelopeBody = JSON.parse(envelopeInit.body as string);
    expect(envelopeBody.documents[0].documentBase64).toBe(Buffer.from('%PDF-1.4 fake pdf bytes').toString('base64'));
    expect(envelopeBody.recipients.signers[0].email).toBe('jane@example.com');
    expect(envelopeBody.eventNotification.url).toBe('https://api.test.example.com/api/v1/signature/webhook/docusign');
  });

  it('caches the access token across multiple requestSignature calls instead of re-authenticating every time', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'tok', expires_in: 3600 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ envelopeId: 'env-1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ envelopeId: 'env-2' }) });

    const provider = loadDocuSignProvider();
    const input = {
      contractId: 'c1',
      signatureId: 's1',
      signerName: 'A',
      signerEmail: 'a@example.com',
      documentBuffer: Buffer.from('doc'),
      documentFileName: 'a.pdf',
      subject: 'sign',
    };
    await provider.requestSignature(input);
    await provider.requestSignature({ ...input, signatureId: 's2' });

    
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('throws a clear AppError when DocuSign rejects the envelope request', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'tok', expires_in: 3600 }) })
      .mockResolvedValueOnce({ ok: false, status: 400, text: async () => 'bad request' });

    const provider = loadDocuSignProvider();
    await expect(
      provider.requestSignature({
        contractId: 'c1',
        signatureId: 's1',
        signerName: 'A',
        signerEmail: 'a@example.com',
        documentBuffer: Buffer.from('doc'),
        documentFileName: 'a.pdf',
        subject: 'sign',
      })
    ).rejects.toThrow(/Failed to create DocuSign envelope/);
  });

  it('verifies a webhook whose HMAC matches the configured key, and rejects one that does not', () => {
    const provider = loadDocuSignProvider();
    const rawBody = Buffer.from(JSON.stringify({ envelopeId: 'env-1', status: 'completed' }));
    const validSignature = crypto.createHmac('sha256', 'test-hmac-key').update(rawBody).digest('base64');

    expect(provider.verifyWebhook({ rawBody, headers: { 'x-docusign-signature-1': validSignature } })).toBe(true);
    expect(provider.verifyWebhook({ rawBody, headers: { 'x-docusign-signature-1': 'not-the-right-signature' } })).toBe(
      false
    );
    expect(provider.verifyWebhook({ rawBody, headers: {} })).toBe(false);
  });

  it('parses a completed envelope webhook into a normalized "signed" event', () => {
    const provider = loadDocuSignProvider();
    const rawBody = Buffer.from(
      JSON.stringify({ envelopeId: 'env-1', status: 'completed', completedDateTime: '2026-01-15T10:00:00Z' })
    );
    const event = provider.parseWebhookEvent(rawBody);
    expect(event).toEqual({
      providerReferenceId: 'env-1',
      status: 'signed',
      signedAt: new Date('2026-01-15T10:00:00Z'),
    });
  });

  it('parses a declined envelope webhook into a normalized "declined" event', () => {
    const provider = loadDocuSignProvider();
    const rawBody = Buffer.from(JSON.stringify({ envelopeId: 'env-1', status: 'declined' }));
    expect(provider.parseWebhookEvent(rawBody)).toEqual({
      providerReferenceId: 'env-1',
      status: 'declined',
      signedAt: null,
    });
  });
});

describe('AdobeSignProvider', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('refreshes an OAuth token, registers the webhook once, uploads the document, and creates an agreement', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'adobe-token', expires_in: 3600 }) }) 
      .mockResolvedValueOnce({ ok: true, json: async () => ({ userWebhookList: [] }) }) 
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) }) 
      .mockResolvedValueOnce({ ok: true, json: async () => ({ transientDocumentId: 'td-1' }) }) 
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'agreement-1' }) }); 

    const provider = loadAdobeSignProvider();
    const result = await provider.requestSignature({
      contractId: 'c1',
      signatureId: 's1',
      signerName: 'Jane Doe',
      signerEmail: 'jane@example.com',
      documentBuffer: Buffer.from('%PDF-1.4 fake pdf bytes'),
      documentFileName: 'contract.pdf',
      subject: 'Please sign',
    });

    expect(result.providerReferenceId).toBe('agreement-1');
    expect(fetchMock).toHaveBeenCalledTimes(5);

    const agreementCall = fetchMock.mock.calls[4];
    const agreementBody = JSON.parse(agreementCall[1].body as string);
    expect(agreementBody.fileInfos[0].transientDocumentId).toBe('td-1');
    expect(agreementBody.participantSetsInfo[0].memberInfos[0].email).toBe('jane@example.com');
    expect(agreementBody.externalId.id).toBe('s1');
  });

  it('skips re-registering the webhook when one already exists for this deployment URL', async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'adobe-token', expires_in: 3600 }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          userWebhookList: [{ webhookUrlInfo: { url: 'https://api.test.example.com/api/v1/signature/webhook/adobesign' } }],
        }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ transientDocumentId: 'td-1' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'agreement-1' }) });

    const provider = loadAdobeSignProvider();
    await provider.requestSignature({
      contractId: 'c1',
      signatureId: 's1',
      signerName: 'Jane Doe',
      signerEmail: 'jane@example.com',
      documentBuffer: Buffer.from('doc'),
      documentFileName: 'contract.pdf',
      subject: 'sign',
    });

    
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('verifies a webhook by its x-adobesign-clientid header, and rejects a mismatched or missing one', () => {
    const provider = loadAdobeSignProvider();
    const rawBody = Buffer.from(JSON.stringify({ event: 'AGREEMENT_WORKFLOW_COMPLETED', agreementId: 'agreement-1' }));

    expect(provider.verifyWebhook({ rawBody, headers: { 'x-adobesign-clientid': 'test-webhook-client-id' } })).toBe(true);
    expect(provider.verifyWebhook({ rawBody, headers: { 'x-adobesign-clientid': 'someone-else' } })).toBe(false);
    expect(provider.verifyWebhook({ rawBody, headers: {} })).toBe(false);
  });

  it('parses an agreement-completed webhook into a normalized "signed" event', () => {
    const provider = loadAdobeSignProvider();
    const rawBody = Buffer.from(JSON.stringify({ event: 'AGREEMENT_WORKFLOW_COMPLETED', agreementId: 'agreement-1' }));
    const event = provider.parseWebhookEvent(rawBody);
    expect(event.providerReferenceId).toBe('agreement-1');
    expect(event.status).toBe('signed');
  });

  it('parses a declined-action webhook into a normalized "declined" event', () => {
    const provider = loadAdobeSignProvider();
    const rawBody = Buffer.from(JSON.stringify({ event: 'AGREEMENT_ACTION_DECLINED', agreementId: 'agreement-1' }));
    expect(provider.parseWebhookEvent(rawBody)).toMatchObject({ providerReferenceId: 'agreement-1', status: 'declined' });
  });
});
