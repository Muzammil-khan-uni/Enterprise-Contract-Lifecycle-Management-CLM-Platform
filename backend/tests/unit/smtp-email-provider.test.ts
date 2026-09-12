

const sendMailMock = jest.fn();
const createTransportMock = jest.fn((..._args: unknown[]) => ({ sendMail: sendMailMock }));

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: { createTransport: (...args: unknown[]) => createTransportMock(...args) },
}));

const ORIGINAL_ENV = { ...process.env };

function loadEmailProvider(envOverrides: Record<string, string>) {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV, ...envOverrides };
  
  return require('../../src/core/email/email.provider').emailProvider;
}

describe('SmtpEmailProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('is named "smtp" — there is no other provider to select', () => {
    const provider = loadEmailProvider({ SMTP_HOST: 'smtp.example.com' });
    expect(provider.name).toBe('smtp');
  });

  it('sends via nodemailer with the configured EMAIL_FROM and message fields', async () => {
    sendMailMock.mockResolvedValue({ messageId: 'abc123' });
    const provider = loadEmailProvider({
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      EMAIL_FROM: 'no-reply@acme.test',
    });

    await provider.send({ to: 'jane@example.com', subject: 'Reset your password', body: 'Click here...' });

    expect(createTransportMock).toHaveBeenCalledWith(
      expect.objectContaining({ host: 'smtp.example.com', port: 587 })
    );
    expect(sendMailMock).toHaveBeenCalledWith({
      from: 'no-reply@acme.test',
      to: 'jane@example.com',
      subject: 'Reset your password',
      text: 'Click here...',
      html: undefined,
    });
  });

  it('wraps a transport-level send failure in an AppError rather than leaking the raw error', async () => {
    sendMailMock.mockRejectedValue(new Error('ECONNREFUSED'));
    const provider = loadEmailProvider({ SMTP_HOST: 'smtp.example.com' });

    await expect(provider.send({ to: 'jane@example.com', subject: 'x', body: 'y' })).rejects.toThrow(
      /Failed to send email via SMTP/
    );
  });

  it('reuses the same transporter across multiple sends (connection pooling)', async () => {
    sendMailMock.mockResolvedValue({ messageId: 'abc' });
    const provider = loadEmailProvider({ SMTP_HOST: 'smtp.example.com' });

    await provider.send({ to: 'a@example.com', subject: 'x', body: 'y' });
    await provider.send({ to: 'b@example.com', subject: 'x', body: 'y' });

    expect(createTransportMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledTimes(2);
  });
});

describe('env.ts — SMTP configuration is mandatory at boot, not at send-time', () => {
  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('throws (rather than allowing the app to boot) when SMTP_HOST is missing', () => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV, SMTP_HOST: '' };
    expect(() => require('../../src/config/env')).toThrow(/SMTP_HOST/);
  });

  it('throws when SMTP_USER or SMTP_PASSWORD is missing', () => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV, SMTP_HOST: 'smtp.example.com', SMTP_USER: '' };
    expect(() => require('../../src/config/env')).toThrow(/SMTP_USER/);
  });
});
