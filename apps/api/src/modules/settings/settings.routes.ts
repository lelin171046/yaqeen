import { settingsUpdateSchema } from '@yaqeen/shared';
import { Router } from 'express';
import { z } from 'zod';
import { getEmailStatus, sendEmail } from '../../services/email.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  getAdminSettings,
  getAlertEmailRecipients,
  getPublicSettings,
  updateAdminSettings,
} from './settings.service.js';

export const publicSettingsRouter = Router();

publicSettingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const settings = await getPublicSettings();
    res.json({ settings });
  }),
);

export const adminSettingsRouter = Router();

const testEmailSchema = z.object({
  to: z.string().trim().email('Enter a valid email').optional(),
});

adminSettingsRouter.post(
  '/test-email',
  asyncHandler(async (req, res) => {
    const input = testEmailSchema.parse(req.body ?? {});
    const recipients = await getAlertEmailRecipients();
    const recipient = input.to ?? recipients[0];
    const status = getEmailStatus();

    if (!recipient) {
      throw AppError.badRequest('Add at least one alert email before sending a test.');
    }

    if (!status.configured) {
      throw AppError.badRequest(
        status.provider === 'disabled'
          ? 'Email is disabled. Set EMAIL_PROVIDER=resend or smtp in the environment.'
          : `Email provider ${status.provider} is missing required environment variables.`,
      );
    }

    const result = await sendEmail({
      to: recipient,
      subject: 'Yaqeen order email test',
      text: 'Your Yaqeen order notification email is configured correctly.',
      html: '<p>Your Yaqeen order notification email is configured correctly.</p>',
    });

    res.json({
      sentTo: recipient,
      provider: result.provider,
      messageId: result.messageId,
    });
  }),
);

adminSettingsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const settings = await getAdminSettings();
    res.json({ settings });
  }),
);

adminSettingsRouter.patch(
  '/',
  asyncHandler(async (req, res) => {
    const input = settingsUpdateSchema.parse(req.body);
    const settings = await updateAdminSettings(input);
    res.json({ settings });
  }),
);
