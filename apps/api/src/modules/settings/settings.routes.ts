import { settingsUpdateSchema } from '@yaqeen/shared';
import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  getAdminSettings,
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
