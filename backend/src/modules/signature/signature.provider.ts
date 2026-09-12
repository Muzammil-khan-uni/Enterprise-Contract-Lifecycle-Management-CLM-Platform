import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { logger } from '../../core/utils/logger';
import { AppError } from '../../core/errors/AppError';
import { SignatureProviderName } from './signature.types';

export interface SignatureRequestInput {
  contractId: string;
  signatureId: string;
  signerName: string;
  signerEmail: string;
  documentBuffer: Buffer;
  documentFileName: string;
  subject: string;
}

export interface SignatureRequestResult {
  providerReferenceId: string;
}

export interface WebhookVerificationInput {
  rawBody: Buffer;
  headers: Record<string, string | string[] | undefined>;
}

export interface WebhookEvent {
  providerReferenceId: string;
  status: 'signed' | 'declined' | 'voided' | 'ignored';
  signedAt: Date | null;
}

export interface ISignatureProvider {
  readonly name: SignatureProviderName;
  requestSignature(input: SignatureRequestInput): Promise<SignatureRequestResult>;
  
  verifyWebhook(input: WebhookVerificationInput): boolean;
  
  parseWebhookEvent(rawBody: Buffer): WebhookEvent;
}

function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function firstHeaderValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

interface CachedToken {
  accessToken: string;
  expiresAt: number; 
}

class DocuSignProvider implements ISignatureProvider {
  readonly name = SignatureProviderName.DOCUSIGN;
  private cachedToken: CachedToken | null = null;

  private get webhookUrl(): string {
    return `${env.API_PUBLIC_BASE_URL}/api/${env.API_VERSION}/signature/webhook/docusign`;
  }

  

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now() + 60_000) {
      return this.cachedToken.accessToken;
    }

    const privateKey = env.DOCUSIGN_PRIVATE_KEY.replace(/\\n/g, '\n');
    const now = Math.floor(Date.now() / 1000);
    const assertion = jwt.sign(
      {
        iss: env.DOCUSIGN_INTEGRATION_KEY,
        sub: env.DOCUSIGN_USER_ID,
        aud: new URL(env.DOCUSIGN_OAUTH_BASE_URL).host,
        iat: now,
        exp: now + 3600,
        scope: 'signature impersonation',
      },
      privateKey,
      { algorithm: 'RS256' }
    );

    const response = await fetch(`${env.DOCUSIGN_OAUTH_BASE_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error('DocuSign OAuth token request failed', { status: response.status, body });
      throw AppError.internal('Failed to authenticate with DocuSign');
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    this.cachedToken = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return data.access_token;
  }

  async requestSignature(input: SignatureRequestInput): Promise<SignatureRequestResult> {
    const accessToken = await this.getAccessToken();

    const envelopeDefinition = {
      emailSubject: input.subject,
      status: 'sent',
      documents: [
        {
          documentBase64: input.documentBuffer.toString('base64'),
          name: input.documentFileName,
          fileExtension: 'pdf',
          documentId: '1',
        },
      ],
      recipients: {
        signers: [
          {
            email: input.signerEmail,
            name: input.signerName,
            recipientId: '1',
            routingOrder: '1',
          },
        ],
      },
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      
      eventNotification: {
        url: this.webhookUrl,
        loggingEnabled: 'true',
        requireAcknowledgment: 'true',
        includeDocuments: 'false',
        includeCertificateOfCompletion: 'false',
        envelopeEvents: [
          { envelopeEventStatusCode: 'completed' },
          { envelopeEventStatusCode: 'declined' },
          { envelopeEventStatusCode: 'voided' },
        ],
        eventData: {
          version: 'restv2.1',
        },
      },
    };

    const response = await fetch(`${env.DOCUSIGN_API_BASE_URL}/v2.1/accounts/${env.DOCUSIGN_ACCOUNT_ID}/envelopes`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(envelopeDefinition),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error('DocuSign envelope creation failed', { status: response.status, body, signatureId: input.signatureId });
      throw AppError.internal('Failed to create DocuSign envelope');
    }

    const data = (await response.json()) as { envelopeId: string };
    logger.info('DocuSign envelope created', { envelopeId: data.envelopeId, signatureId: input.signatureId });
    return { providerReferenceId: data.envelopeId };
  }

  

  verifyWebhook(input: WebhookVerificationInput): boolean {
    const signatureHeader = firstHeaderValue(input.headers['x-docusign-signature-1']);
    if (!signatureHeader) return false;
    const expected = crypto.createHmac('sha256', env.DOCUSIGN_WEBHOOK_HMAC_KEY).update(input.rawBody).digest('base64');
    return timingSafeEqualStrings(signatureHeader, expected);
  }

  

  parseWebhookEvent(rawBody: Buffer): WebhookEvent {
    const payload = JSON.parse(rawBody.toString('utf8')) as {
      envelopeId?: string;
      status?: string;
      completedDateTime?: string;
      event?: string; 
      uri?: string; 
      generatedDateTime?: string;
      data?: { envelopeId?: string; envelopeSummary?: { status?: string; completedDateTime?: string } };
    };

    const envelopeIdFromUri = payload.uri?.match(/\/envelopes\/([^/]+)/)?.[1];
    const envelopeId = payload.envelopeId ?? payload.data?.envelopeId ?? envelopeIdFromUri;

    
    
    
    const rawStatus = (
      payload.event?.replace(/^envelope-/, '') ??
      payload.status ??
      payload.data?.envelopeSummary?.status ??
      ''
    ).toLowerCase();
    const completedAt = payload.completedDateTime ?? payload.data?.envelopeSummary?.completedDateTime ?? payload.generatedDateTime ?? null;

    if (!envelopeId) {
      throw AppError.badRequest('DocuSign webhook payload is missing an envelope id');
    }

    let status: WebhookEvent['status'] = 'ignored';
    if (rawStatus === 'completed') status = 'signed';
    else if (rawStatus === 'declined') status = 'declined';
    else if (rawStatus === 'voided') status = 'voided';

    return { providerReferenceId: envelopeId, status, signedAt: completedAt ? new Date(completedAt) : null };
  }
}

class AdobeSignProvider implements ISignatureProvider {
  readonly name = SignatureProviderName.ADOBESIGN;
  private cachedToken: CachedToken | null = null;

  private get webhookUrl(): string {
    return `${env.API_PUBLIC_BASE_URL}/api/${env.API_VERSION}/signature/webhook/adobesign`;
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now() + 60_000) {
      return this.cachedToken.accessToken;
    }

    const response = await fetch(`${env.ADOBESIGN_BASE_URI}/oauth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: env.ADOBESIGN_REFRESH_TOKEN,
        client_id: env.ADOBESIGN_CLIENT_ID,
        client_secret: env.ADOBESIGN_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      logger.error('Adobe Sign OAuth refresh failed', { status: response.status, body });
      throw AppError.internal('Failed to authenticate with Adobe Sign');
    }

    const data = (await response.json()) as { access_token: string; expires_in: number };
    this.cachedToken = { accessToken: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
    return data.access_token;
  }

  private webhookEnsured = false;

  

  private async ensureWebhookRegistered(accessToken: string): Promise<void> {
    if (this.webhookEnsured) return;

    const listResponse = await fetch(`${env.ADOBESIGN_BASE_URI}/api/rest/v6/webhooks`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (listResponse.ok) {
      const data = (await listResponse.json()) as { userWebhookList?: Array<{ webhookUrlInfo?: { url?: string } }> };
      const alreadyRegistered = (data.userWebhookList ?? []).some((w) => w.webhookUrlInfo?.url === this.webhookUrl);
      if (alreadyRegistered) {
        this.webhookEnsured = true;
        return;
      }
    }

    const createResponse = await fetch(`${env.ADOBESIGN_BASE_URI}/api/rest/v6/webhooks`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'clm-platform-agreement-events',
        scope: 'ACCOUNT',
        state: 'ACTIVE',
        webhookSubscriptionEvents: [
          'AGREEMENT_WORKFLOW_COMPLETED',
          'AGREEMENT_ACTION_COMPLETED',
          'AGREEMENT_ACTION_DECLINED',
          'AGREEMENT_EXPIRED',
        ],
        webhookUrlInfo: { url: this.webhookUrl },
      }),
    });

    if (!createResponse.ok) {
      const body = await createResponse.text();
      
      
      
      logger.error('Adobe Sign webhook registration failed — agreement status updates will not arrive until this is fixed', {
        status: createResponse.status,
        body,
      });
      return;
    }

    this.webhookEnsured = true;
  }

  async requestSignature(input: SignatureRequestInput): Promise<SignatureRequestResult> {
    const accessToken = await this.getAccessToken();
    await this.ensureWebhookRegistered(accessToken);

    const form = new FormData();
    form.append('File-Name', input.documentFileName);
    form.append(
      'File',
      new Blob([new Uint8Array(input.documentBuffer)], { type: 'application/pdf' }),
      input.documentFileName
    );

    const uploadResponse = await fetch(`${env.ADOBESIGN_BASE_URI}/api/rest/v6/transientDocuments`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: form,
    });

    if (!uploadResponse.ok) {
      const body = await uploadResponse.text();
      logger.error('Adobe Sign transient document upload failed', { status: uploadResponse.status, body });
      throw AppError.internal('Failed to upload document to Adobe Sign');
    }

    const { transientDocumentId } = (await uploadResponse.json()) as { transientDocumentId: string };

    const agreementResponse = await fetch(`${env.ADOBESIGN_BASE_URI}/api/rest/v6/agreements`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileInfos: [{ transientDocumentId }],
        name: input.subject,
        participantSetsInfo: [
          {
            memberInfos: [{ email: input.signerEmail }],
            order: 1,
            role: 'SIGNER',
          },
        ],
        signatureType: 'ESIGN',
        state: 'IN_PROCESS',
        externalId: { id: input.signatureId },
      }),
    });

    if (!agreementResponse.ok) {
      const body = await agreementResponse.text();
      logger.error('Adobe Sign agreement creation failed', { status: agreementResponse.status, body, signatureId: input.signatureId });
      throw AppError.internal('Failed to create Adobe Sign agreement');
    }

    const { id } = (await agreementResponse.json()) as { id: string };
    logger.info('Adobe Sign agreement created', { agreementId: id, signatureId: input.signatureId });
    return { providerReferenceId: id };
  }

  

  verifyWebhook(input: WebhookVerificationInput): boolean {
    const clientIdHeader = firstHeaderValue(input.headers['x-adobesign-clientid']);
    if (!clientIdHeader) return false;
    return timingSafeEqualStrings(clientIdHeader, env.ADOBESIGN_WEBHOOK_CLIENT_ID);
  }

  parseWebhookEvent(rawBody: Buffer): WebhookEvent {
    const payload = JSON.parse(rawBody.toString('utf8')) as {
      event?: string;
      agreement?: { id?: string; status?: string };
      agreementId?: string;
    };

    const agreementId = payload.agreement?.id ?? payload.agreementId;
    if (!agreementId) {
      throw AppError.badRequest('Adobe Sign webhook payload is missing an agreement id');
    }

    const eventName = payload.event ?? '';
    let status: WebhookEvent['status'] = 'ignored';
    if (eventName === 'AGREEMENT_WORKFLOW_COMPLETED' || payload.agreement?.status === 'SIGNED') {
      status = 'signed';
    } else if (eventName === 'AGREEMENT_ACTION_DECLINED') {
      status = 'declined';
    } else if (eventName === 'AGREEMENT_EXPIRED') {
      status = 'voided';
    }

    return { providerReferenceId: agreementId, status, signedAt: status === 'signed' ? new Date() : null };
  }
}

function selectProvider(): ISignatureProvider {
  switch (env.SIGNATURE_PROVIDER) {
    case SignatureProviderName.ADOBESIGN:
      return new AdobeSignProvider();
    case SignatureProviderName.DOCUSIGN:
    default:
      return new DocuSignProvider();
  }
}

export const signatureProvider: ISignatureProvider = selectProvider();
