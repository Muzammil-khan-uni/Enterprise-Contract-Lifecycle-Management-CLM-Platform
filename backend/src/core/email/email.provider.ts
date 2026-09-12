import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../../config/env';
import { logger } from '../utils/logger';
import { AppError } from '../errors/AppError';

export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
  html?: string;
}

export interface IEmailProvider {
  readonly name: string;
  send(message: EmailMessage): Promise<void>;
}

class SmtpEmailProvider implements IEmailProvider {
  readonly name = 'smtp';
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASSWORD } : undefined,
      pool: true,
      maxConnections: 5,
    });
  }

  async send(message: EmailMessage): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: env.EMAIL_FROM,
        to: message.to,
        subject: message.subject,
        text: message.body,
        html: message.html,
      });
      logger.info('Email sent', { to: message.to, subject: message.subject });
    } catch (error) {
      
      
      
      
      logger.error('SMTP send failed', { to: message.to, error: error instanceof Error ? error.message : error });
      throw AppError.internal('Failed to send email via SMTP');
    }
  }
}

export const emailProvider: IEmailProvider = new SmtpEmailProvider();
