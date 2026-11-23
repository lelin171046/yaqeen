import {
  SUPPORT_TOPIC_LABELS,
  type SupportMessageInput,
  type SupportMessageStatus,
  type SupportMessageQueryInput,
} from '@anando-deal/shared';
import { Types } from 'mongoose';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { nextSequence } from '../../models/counter.js';
import { SupportMessageModel, type SupportMessageDocument } from '../../models/support-message.js';
import { getEmailStatus, sendEmail } from '../../services/email.js';
import { getSupportEmailRecipients } from '../settings/settings.service.js';
import { AppError } from '../../utils/app-error.js';
import { escapeHtml } from '../../utils/html.js';

export interface SupportReplyDto {
  id: string;
  body: string;
  sentAt: Date;
  provider: string;
}

export interface SupportMessageDto {
  id: string;
  ticket: string;
  name: string;
  email: string;
  phone: string;
  topic: string;
  orderNumber: string;
  message: string;
  status: SupportMessageStatus;
  deliveryStatus: 'PENDING' | 'SENT' | 'FAILED' | 'SKIPPED';
  deliveryError: string;
  acknowledgementStatus: 'NOT_SENT' | 'SENT' | 'FAILED';
  replies: SupportReplyDto[];
  createdAt: Date;
  updatedAt: Date;
}

export function toSupportMessage(message: SupportMessageDocument): SupportMessageDto {
  return {
    id: message._id.toString(),
    ticket: message.ticket,
    name: message.name,
    email: message.email,
    phone: message.phone ?? '',
    topic: message.topic,
    orderNumber: message.orderNumber ?? '',
    message: message.message,
    status: message.status,
    deliveryStatus: message.deliveryStatus,
    deliveryError: message.deliveryError ?? '',
    acknowledgementStatus: message.acknowledgementStatus,
    replies: message.replies.map((reply) => ({
      id: reply._id.toString(),
      body: reply.body,
      sentAt: reply.sentAt,
      provider: reply.provider ?? '',
    })),
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
  };
}

function topicLabel(topic: string): string {
  return SUPPORT_TOPIC_LABELS[topic as keyof typeof SUPPORT_TOPIC_LABELS] ?? topic;
}

function buildNotificationEmail(message: SupportMessageDocument): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `[${message.ticket}] ${topicLabel(message.topic)} - ${message.name}`;
  const sentAt = message.createdAt.toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' });

  const text = [
    `Support request ${message.ticket}`,
    '',
    `Name: ${message.name}`,
    `Email: ${message.email}`,
    `Phone: ${message.phone || 'Not provided'}`,
    `Topic: ${topicLabel(message.topic)}`,
    `Order number: ${message.orderNumber || 'Not provided'}`,
    `Received: ${sentAt}`,
    '',
    message.message,
    '',
    'Reply directly to this email to reach the customer.',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111827;">
      <h2 style="margin:0 0 4px;">Support request ${escapeHtml(message.ticket)}</h2>
      <p style="margin:0 0 20px;color:#6b7280;">Received ${escapeHtml(sentAt)}</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:4px 0;color:#6b7280;">Name</td><td style="padding:4px 0;text-align:right;">${escapeHtml(
          message.name,
        )}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Email</td><td style="padding:4px 0;text-align:right;">${escapeHtml(
          message.email,
        )}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Phone</td><td style="padding:4px 0;text-align:right;">${escapeHtml(
          message.phone || 'Not provided',
        )}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Topic</td><td style="padding:4px 0;text-align:right;">${escapeHtml(
          topicLabel(message.topic),
        )}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Order</td><td style="padding:4px 0;text-align:right;">${escapeHtml(
          message.orderNumber || 'Not provided',
        )}</td></tr>
      </table>
      <p style="margin:0 0 16px;white-space:pre-wrap;">${escapeHtml(message.message)}</p>
      <p style="margin:0;color:#6b7280;">Reply directly to this email to reach the customer.</p>
    </div>`;

  return { subject, text, html };
}

function buildAcknowledgementEmail(message: SupportMessageDocument): {
  subject: string;
  text: string;
  html: string;
} {
  const subject = `We received your support request (${message.ticket})`;
  const text = [
    `Hi ${message.name},`,
    '',
    `Thanks for contacting us. Your support request ${message.ticket} has been received, and our team will get back to you soon.`,
    '',
    'Your message:',
    message.message,
    '',
    'Anando Deal Support',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111827;">
      <h2 style="margin:0 0 16px;">Thanks for contacting us</h2>
      <p>Hi ${escapeHtml(message.name)},</p>
      <p>Your support request <strong>${escapeHtml(
        message.ticket,
      )}</strong> has been received. Our team will get back to you soon.</p>
      <p style="color:#6b7280;">Your message: ${escapeHtml(message.message)}</p>
      <p>Anando Deal Support</p>
    </div>`;

  return { subject, text, html };
}

function errorMessage(error: unknown): string {
  return (error instanceof Error ? error.message : String(error)).slice(0, 1000);
}

function supportReplyAddress(): string | undefined {
  const from = env.EMAIL_FROM?.trim() ?? '';
  const address = from.match(/<([^>]+)>/)?.[1]?.trim() ?? from;

  return address || undefined;
}

async function sendAcknowledgement(message: SupportMessageDocument): Promise<void> {
  if (!getEmailStatus().configured) {
    return;
  }

  const email = buildAcknowledgementEmail(message);

  try {
    const result = await sendEmail({
      to: message.email,
      subject: email.subject,
      text: email.text,
      html: email.html,
      replyTo: supportReplyAddress(),
    });

    await SupportMessageModel.updateOne(
      { _id: message._id },
      {
        $set: {
          acknowledgementStatus: 'SENT',
          acknowledgementError: '',
        },
      },
    );
    logger.debug(
      { ticket: message.ticket, provider: result.provider },
      'Support acknowledgement sent',
    );
  } catch (error) {
    await SupportMessageModel.updateOne(
      { _id: message._id },
      {
        $set: {
          acknowledgementStatus: 'FAILED',
          acknowledgementError: errorMessage(error),
        },
      },
    );
    logger.error({ err: error, ticket: message.ticket }, 'Support acknowledgement failed');
  }
}

async function deliverNewSupportMessage(message: SupportMessageDocument): Promise<void> {
  const recipients = await getSupportEmailRecipients();
  const emailStatus = getEmailStatus();

  if (recipients.length === 0 || !emailStatus.configured) {
    const reason =
      recipients.length === 0
        ? 'No support email recipient is configured.'
        : 'Email provider is not configured.';

    await SupportMessageModel.updateOne(
      { _id: message._id },
      { $set: { deliveryStatus: 'SKIPPED', deliveryError: reason } },
    );
    logger.warn({ ticket: message.ticket, reason }, 'Support email notification skipped');
    await sendAcknowledgement(message);
    return;
  }

  const email = buildNotificationEmail(message);

  try {
    const result = await sendEmail({
      to: recipients,
      subject: email.subject,
      text: email.text,
      html: email.html,
      replyTo: message.email,
    });

    await SupportMessageModel.updateOne(
      { _id: message._id },
      {
        $set: {
          deliveryStatus: 'SENT',
          deliveryProvider: result.provider,
          deliveryError: '',
          deliveredAt: new Date(),
        },
      },
    );
  } catch (error) {
    await SupportMessageModel.updateOne(
      { _id: message._id },
      { $set: { deliveryStatus: 'FAILED', deliveryError: errorMessage(error) } },
    );
    logger.error({ err: error, ticket: message.ticket }, 'Support email notification failed');
  }

  await sendAcknowledgement(message);
}

async function findSupportMessage(id: string): Promise<SupportMessageDocument> {
  if (!Types.ObjectId.isValid(id)) {
    throw AppError.badRequest('Invalid support message id');
  }

  const message = await SupportMessageModel.findById(id);

  if (!message) {
    throw AppError.notFound('Support message not found');
  }

  return message;
}

export async function createSupportMessage(input: SupportMessageInput): Promise<{
  message: SupportMessageDto;
  delivered: boolean;
}> {
  const sequence = await nextSequence('support-message');
  const ticket = `SUP-${String(sequence).padStart(5, '0')}`;
  const created = await SupportMessageModel.create({
    name: input.name,
    email: input.email,
    phone: input.phone ?? '',
    topic: input.topic,
    orderNumber: input.orderNumber ?? '',
    message: input.message,
    ticket,
    status: 'NEW',
  });

  await deliverNewSupportMessage(created);

  const updated = await SupportMessageModel.findById(created._id);

  if (!updated) {
    throw AppError.notFound('Support message not found');
  }

  return {
    message: toSupportMessage(updated),
    delivered: updated.deliveryStatus === 'SENT',
  };
}

export async function listSupportMessages(input: SupportMessageQueryInput): Promise<{
  items: SupportMessageDto[];
  pagination: { page: number; limit: number; total: number; pages: number };
}> {
  const filter: Record<string, unknown> = {};

  if (input.status) {
    filter.status = input.status;
  }

  if (input.search) {
    const regex = new RegExp(input.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [
      { ticket: regex },
      { name: regex },
      { email: regex },
      { orderNumber: regex },
      { message: regex },
    ];
  }

  const skip = (input.page - 1) * input.limit;
  const [messages, total] = await Promise.all([
    SupportMessageModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(input.limit),
    SupportMessageModel.countDocuments(filter),
  ]);

  return {
    items: messages.map(toSupportMessage),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      pages: Math.ceil(total / input.limit),
    },
  };
}

export async function getSupportMessage(id: string): Promise<SupportMessageDto> {
  return toSupportMessage(await findSupportMessage(id));
}

export async function updateSupportMessageStatus(
  id: string,
  status: SupportMessageStatus,
): Promise<SupportMessageDto> {
  const message = await SupportMessageModel.findByIdAndUpdate(
    id,
    { $set: { status } },
    { returnDocument: 'after', runValidators: true },
  );

  if (!message) {
    throw AppError.notFound('Support message not found');
  }

  return toSupportMessage(message);
}

export async function replyToSupportMessage(
  id: string,
  adminId: string,
  body: string,
): Promise<SupportMessageDto> {
  const message = await findSupportMessage(id);
  const emailStatus = getEmailStatus();

  if (!emailStatus.configured) {
    throw new AppError(
      503,
      'Email is not configured. Set EMAIL_PROVIDER=resend or smtp before replying.',
      'EMAIL_NOT_CONFIGURED',
    );
  }

  const subject = `Re: ${message.ticket} - ${topicLabel(message.topic)}`;
  const text = [body, '', 'Anando Deal Support', '', `Reference: ${message.ticket}`].join('\n');
  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111827;">
      <p style="white-space:pre-wrap;">${escapeHtml(body)}</p>
      <p>Anando Deal Support</p>
      <p style="color:#6b7280;">Reference: ${escapeHtml(message.ticket)}</p>
    </div>`;

  try {
    const result = await sendEmail({
      to: message.email,
      subject,
      text,
      html,
      replyTo: supportReplyAddress(),
    });

    message.replies.push({
      body,
      sentBy: new Types.ObjectId(adminId),
      sentAt: new Date(),
      provider: result.provider,
      messageId: result.messageId,
    });
    message.lastReplyAt = new Date();

    if (message.status === 'NEW') {
      message.status = 'IN_PROGRESS';
    }

    await message.save();
  } catch (error) {
    throw new AppError(
      502,
      'The reply could not be emailed. Please try again.',
      'EMAIL_SEND_FAILED',
      {
        detail: errorMessage(error),
      },
    );
  }

  return toSupportMessage(message);
}
