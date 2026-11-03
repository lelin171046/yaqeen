import 'dotenv/config';
import { z } from 'zod';

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(4000),
    MONGODB_URI: z.string().trim().min(1).optional(),
    CORS_ORIGIN: z.string().trim().default('http://localhost:5173'),
    JWT_ACCESS_SECRET: z.string().min(16).default('dev-access-secret-change-me'),
    JWT_REFRESH_SECRET: z.string().min(16).default('dev-refresh-secret-change-me'),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    WHATSAPP_PROVIDER: z.enum(['cloud', 'ultramsg', 'disabled']).default('disabled'),
    WHATSAPP_PHONE_NUMBER_ID: z.string().trim().optional(),
    WHATSAPP_ACCESS_TOKEN: z.string().trim().optional(),
    WHATSAPP_SELLER_NUMBER: z.string().trim().optional(),
    WHATSAPP_TEMPLATE_NAME: z.string().trim().default('new_order_alert'),
    WHATSAPP_ULTRAMSG_INSTANCE_ID: z.string().trim().optional(),
    WHATSAPP_ULTRAMSG_TOKEN: z.string().trim().optional(),
    EMAIL_PROVIDER: z.enum(['resend', 'smtp', 'disabled']).default('disabled'),
    RESEND_API_KEY: z.string().trim().optional(),
    EMAIL_FROM: z.string().trim().optional(),
    SELLER_ALERT_EMAILS: z.string().trim().optional(),
    SMTP_HOST: z.string().trim().optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    SMTP_USER: z.string().trim().optional(),
    SMTP_PASS: z.string().trim().optional(),
    CLOUDINARY_CLOUD_NAME: z.string().trim().optional(),
    CLOUDINARY_API_KEY: z.string().trim().optional(),
    CLOUDINARY_API_SECRET: z.string().trim().optional(),
    BKASH_MERCHANT_NUMBER: z.string().trim().optional(),
    FREE_DELIVERY_THRESHOLD: z.coerce.number().min(0).default(2000),
    DEFAULT_DELIVERY_CHARGE: z.coerce.number().min(0).default(80),
    ADMIN_NAME: z.string().trim().default('Yaqeen Admin'),
    ADMIN_EMAIL: z.string().trim().email().optional(),
    ADMIN_PASSWORD: z.string().min(8).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.NODE_ENV !== 'production') {
      return;
    }

    if (!value.MONGODB_URI) {
      ctx.addIssue({
        code: 'custom',
        message: 'MONGODB_URI is required in production',
        path: ['MONGODB_URI'],
      });
    }

    if (value.JWT_ACCESS_SECRET === 'dev-access-secret-change-me') {
      ctx.addIssue({
        code: 'custom',
        message: 'Set a strong JWT_ACCESS_SECRET in production',
        path: ['JWT_ACCESS_SECRET'],
      });
    }

    if (value.JWT_REFRESH_SECRET === 'dev-refresh-secret-change-me') {
      ctx.addIssue({
        code: 'custom',
        message: 'Set a strong JWT_REFRESH_SECRET in production',
        path: ['JWT_REFRESH_SECRET'],
      });
    }
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n');

  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = parsed.data;
export type Env = typeof env;
