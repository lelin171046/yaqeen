import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export type EmailProvider = typeof env.EMAIL_PROVIDER;

export interface SendEmailInput {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  provider: EmailProvider;
  messageId: string;
}

export function getEmailStatus(): {
  provider: EmailProvider;
  configured: boolean;
} {
  const provider = env.EMAIL_PROVIDER;

  if (provider === 'resend') {
    return {
      provider,
      configured: Boolean(env.RESEND_API_KEY && env.EMAIL_FROM),
    };
  }

  if (provider === 'smtp') {
    return {
      provider,
      configured: Boolean(
        env.SMTP_HOST &&
        env.SMTP_PORT &&
        (env.EMAIL_FROM || env.SMTP_USER) &&
        env.SMTP_USER &&
        env.SMTP_PASS,
      ),
    };
  }

  return { provider, configured: false };
}

function assertConfigured(): void {
  const status = getEmailStatus();

  if (status.provider === 'disabled') {
    throw new Error(
      'Email provider is disabled. Set EMAIL_PROVIDER=resend or smtp in the environment.',
    );
  }

  if (!status.configured) {
    throw new Error(
      status.provider === 'resend'
        ? 'Resend is missing RESEND_API_KEY or EMAIL_FROM.'
        : 'SMTP is missing SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, or EMAIL_FROM.',
    );
  }
}

async function sendWithResend(input: SendEmailInput): Promise<SendEmailResult> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      reply_to: input.replyTo,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Resend rejected the email (${response.status}): ${body.slice(0, 500)}`);
  }

  const data = (await response.json()) as { id?: string };

  return {
    provider: 'resend',
    messageId: data.id ?? '',
  };
}

async function sendWithSmtp(input: SendEmailInput): Promise<SendEmailResult> {
  const nodemailer = await import('nodemailer');
  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
    auth: env.SMTP_USER && env.SMTP_PASS ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });

  try {
    const info = await transport.sendMail({
      from: env.EMAIL_FROM || env.SMTP_USER,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
      replyTo: input.replyTo,
    });

    return {
      provider: 'smtp',
      messageId: info.messageId,
    };
  } finally {
    transport.close();
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  assertConfigured();

  logger.info(
    {
      provider: env.EMAIL_PROVIDER,
      to: input.to,
      subject: input.subject,
    },
    'Sending email',
  );

  return env.EMAIL_PROVIDER === 'resend' ? sendWithResend(input) : sendWithSmtp(input);
}
