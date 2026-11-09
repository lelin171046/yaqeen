import { formatBdt } from '@yaqeen/shared';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { NotificationLogModel } from '../models/notification-log.js';
import type { OrderDocument } from '../models/order.js';
import { getAlertEmailRecipients } from '../modules/settings/settings.service.js';
import { getEmailStatus, sendEmail } from './email.js';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatAddress(order: OrderDocument): string {
  return [order.customer.address, order.customer.area, order.customer.district]
    .filter(Boolean)
    .join(', ');
}

function buildOrderEmail(order: OrderDocument): { subject: string; text: string; html: string } {
  const itemLines = order.items.map(
    (item) =>
      `${item.name} (${item.variantLabel}) x ${item.quantity} = ${formatBdt(item.lineTotal)}`,
  );
  const address = formatAddress(order);
  const notes = order.customer.notes || 'None';
  const subject = `New order ${order.orderNumber} - ${formatBdt(order.total)}`;

  const text = [
    `New order ${order.orderNumber}`,
    '',
    `Customer: ${order.customer.name}`,
    `Phone: ${order.customer.phone}`,
    `Email: ${order.customer.email || 'Not provided'}`,
    `Address: ${address}`,
    `Notes: ${notes}`,
    '',
    'Items:',
    ...itemLines,
    '',
    `Subtotal: ${formatBdt(order.subtotal)}`,
    `Delivery: ${formatBdt(order.deliveryCharge)}`,
    `Total: ${formatBdt(order.total)}`,
    `Payment: ${order.paymentMethod} (${order.paymentStatus})`,
    order.bkashTrxId ? `bKash transaction: ${order.bkashTrxId}` : '',
  ]
    .filter((line) => line !== '')
    .join('\n');

  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;">${escapeHtml(
            item.name,
          )}<br><span style="color:#6b7280;font-size:12px;">${escapeHtml(
            item.variantLabel,
          )} &times; ${item.quantity}</span></td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;text-align:right;">${formatBdt(
            item.lineTotal,
          )}</td>
        </tr>`,
    )
    .join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111827;">
      <h2 style="margin:0 0 4px;">New order ${escapeHtml(order.orderNumber)}</h2>
      <p style="margin:0 0 20px;color:#6b7280;">Placed ${order.createdAt.toLocaleString(
        'en-BD',
        { timeZone: 'Asia/Dhaka' },
      )}</p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:4px 0;color:#6b7280;">Customer</td><td style="padding:4px 0;text-align:right;">${escapeHtml(
          order.customer.name,
        )}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Phone</td><td style="padding:4px 0;text-align:right;">${escapeHtml(
          order.customer.phone,
        )}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Email</td><td style="padding:4px 0;text-align:right;">${escapeHtml(
          order.customer.email || 'Not provided',
        )}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;vertical-align:top;">Address</td><td style="padding:4px 0;text-align:right;">${escapeHtml(
          address,
        )}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;vertical-align:top;">Notes</td><td style="padding:4px 0;text-align:right;">${escapeHtml(
          notes,
        )}</td></tr>
      </table>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        ${rows}
      </table>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:4px 0;color:#6b7280;">Subtotal</td><td style="padding:4px 0;text-align:right;">${formatBdt(
          order.subtotal,
        )}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Delivery</td><td style="padding:4px 0;text-align:right;">${formatBdt(
          order.deliveryCharge,
        )}</td></tr>
        <tr><td style="padding:8px 0;font-weight:700;">Total</td><td style="padding:8px 0;text-align:right;font-weight:700;">${formatBdt(
          order.total,
        )}</td></tr>
      </table>
      <p style="margin:0;color:#6b7280;">Payment: ${escapeHtml(
        order.paymentMethod,
      )} (${escapeHtml(order.paymentStatus)})${
        order.bkashTrxId
          ? `<br>bKash transaction: ${escapeHtml(order.bkashTrxId)}`
          : ''
      }</p>
    </div>`;

  return { subject, text, html };
}

export async function notifyNewOrder(order: OrderDocument): Promise<void> {
  const recipients = await getAlertEmailRecipients();

  if (recipients.length === 0) {
    logger.warn(
      { orderNumber: order.orderNumber },
      'New order email skipped: no alert recipients configured',
    );
    return;
  }

  const emailStatus = getEmailStatus();

  if (!emailStatus.configured) {
    logger.warn(
      {
        orderNumber: order.orderNumber,
        provider: emailStatus.provider,
      },
      'New order email skipped: email provider is not configured',
    );
    return;
  }

  const email = buildOrderEmail(order);

  for (const recipient of recipients) {
    const log = await NotificationLogModel.create({
      order: order._id,
      type: 'EMAIL',
      provider: env.EMAIL_PROVIDER,
      recipient,
      payload: {
        orderNumber: order.orderNumber,
        subject: email.subject,
      },
      status: 'PENDING',
      attempts: 0,
    });

    try {
      const result = await sendEmail({
        to: recipient,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });

      await NotificationLogModel.updateOne(
        { _id: log._id },
        {
          $set: {
            provider: result.provider,
            status: 'SENT',
            attempts: 1,
            sentAt: new Date(),
            lastError: '',
          },
        },
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      await NotificationLogModel.updateOne(
        { _id: log._id },
        {
          $set: {
            status: 'FAILED',
            attempts: 1,
            lastError: message.slice(0, 1000),
          },
        },
      );

      logger.error(
        { err: error, orderNumber: order.orderNumber, recipient },
        'New order email failed',
      );
    }
  }
}
