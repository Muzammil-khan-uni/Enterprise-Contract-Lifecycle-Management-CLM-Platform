

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const baseSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(5000),
  API_VERSION: z.string().regex(/^[a-zA-Z0-9_-]+$/).default('v1'),

  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET is required and must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET is required and must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  
  
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),

  
  
  
  
  SIGNATURE_PROVIDER: z.enum(['docusign', 'adobesign']),

  
  
  DOCUSIGN_INTEGRATION_KEY: z.string().optional().default(''),
  DOCUSIGN_USER_ID: z.string().optional().default(''),
  DOCUSIGN_ACCOUNT_ID: z.string().optional().default(''),
  
  
  
  
  DOCUSIGN_PRIVATE_KEY: z.string().optional().default(''),
  
  
  DOCUSIGN_OAUTH_BASE_URL: z.string().default('https://account-d.docusign.com'),
  
  
  
  DOCUSIGN_API_BASE_URL: z.string().default('https://demo.docusign.net/restapi'),
  
  
  DOCUSIGN_WEBHOOK_HMAC_KEY: z.string().optional().default(''),

  
  
  ADOBESIGN_CLIENT_ID: z.string().optional().default(''),
  ADOBESIGN_CLIENT_SECRET: z.string().optional().default(''),
  ADOBESIGN_REFRESH_TOKEN: z.string().optional().default(''),
  
  
  
  ADOBESIGN_BASE_URI: z.string().default('https://api.na1.adobesign.com'),
  
  
  ADOBESIGN_WEBHOOK_CLIENT_ID: z.string().optional().default(''),

  CORS_ORIGIN: z.string().url().default('http://localhost:5173'),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(1000),

  
  
  
  ELASTICSEARCH_URL: z.string().optional().default(''),

  
  
  EMAIL_FROM: z.string().min(1, 'EMAIL_FROM is required'),
  SMTP_HOST: z.string().min(1, 'SMTP_HOST is required'),
  SMTP_PORT: z.coerce.number().default(587),
  
  
  
  
  SMTP_SECURE: z
    .string()
    .optional()
    .default('false')
    .transform((v) => v === 'true'),
  SMTP_USER: z.string().min(1, 'SMTP_USER is required'),
  SMTP_PASSWORD: z.string().min(1, 'SMTP_PASSWORD is required'),

  
  
  
  
  
  
  APP_BASE_URL: z.string().url().default('http://localhost:5173'),

  
  
  
  
  
  API_PUBLIC_BASE_URL: z.string().url().default('http://localhost:5000'),

  
  MAX_FAILED_LOGIN_ATTEMPTS: z.coerce.number().default(5),
  ACCOUNT_LOCK_MINUTES: z.coerce.number().default(15),

  
  
  
  PASSWORD_RESET_TOKEN_MINUTES: z.coerce.number().default(30),
  EMAIL_VERIFICATION_TOKEN_HOURS: z.coerce.number().default(48),

  
  REQUIRE_EMAIL_VERIFICATION: z
    .string()
    .default('false')
    .transform((v) => v === 'true'),

  ENABLE_WORKERS: z
    .string()
    .default('true')
    .transform((v) => v === 'true'),
});

const withProviderRequirements = baseSchema.superRefine((config, ctx) => {
  if (config.JWT_ACCESS_SECRET === config.JWT_REFRESH_SECRET) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['JWT_REFRESH_SECRET'],
      message: 'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different',
    });
  }

  if (config.NODE_ENV === 'production') {
    for (const [key, value] of [
      ['CORS_ORIGIN', config.CORS_ORIGIN],
      ['APP_BASE_URL', config.APP_BASE_URL],
      ['API_PUBLIC_BASE_URL', config.API_PUBLIC_BASE_URL],
    ] as const) {
      if (!value.startsWith('https://')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [key],
          message: `${key} must use HTTPS in production`,
        });
      }
    }
  }
  if (config.SIGNATURE_PROVIDER === 'docusign') {
    const required: Array<[string, string]> = [
      ['DOCUSIGN_INTEGRATION_KEY', config.DOCUSIGN_INTEGRATION_KEY],
      ['DOCUSIGN_USER_ID', config.DOCUSIGN_USER_ID],
      ['DOCUSIGN_ACCOUNT_ID', config.DOCUSIGN_ACCOUNT_ID],
      ['DOCUSIGN_PRIVATE_KEY', config.DOCUSIGN_PRIVATE_KEY],
      ['DOCUSIGN_WEBHOOK_HMAC_KEY', config.DOCUSIGN_WEBHOOK_HMAC_KEY],
    ];
    for (const [key, value] of required) {
      if (!value) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${key} is required when SIGNATURE_PROVIDER=docusign` });
      }
    }
  }

  if (config.SIGNATURE_PROVIDER === 'adobesign') {
    const required: Array<[string, string]> = [
      ['ADOBESIGN_CLIENT_ID', config.ADOBESIGN_CLIENT_ID],
      ['ADOBESIGN_CLIENT_SECRET', config.ADOBESIGN_CLIENT_SECRET],
      ['ADOBESIGN_REFRESH_TOKEN', config.ADOBESIGN_REFRESH_TOKEN],
      ['ADOBESIGN_WEBHOOK_CLIENT_ID', config.ADOBESIGN_WEBHOOK_CLIENT_ID],
    ];
    for (const [key, value] of required) {
      if (!value) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${key} is required when SIGNATURE_PROVIDER=adobesign` });
      }
    }
  }
});

const parsed = withProviderRequirements.safeParse(process.env);

if (!parsed.success) {
  const details = JSON.stringify(parsed.error.flatten().fieldErrors, null, 2);
  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = parsed.data;
export type Env = typeof env;
