import {
  supportMessageInputSchema,
  supportMessageQuerySchema,
  supportMessageStatusUpdateSchema,
  supportReplySchema,
} from '@anando-deal/shared';
import { Router } from 'express';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  createSupportMessage,
  getSupportMessage,
  listSupportMessages,
  replyToSupportMessage,
  updateSupportMessageStatus,
} from './support.service.js';

export const publicSupportRouter = Router();

publicSupportRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = supportMessageInputSchema.parse(req.body);
    const result = await createSupportMessage(input);

    res.status(201).json(result);
  }),
);

export const adminSupportRouter = Router();

adminSupportRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = supportMessageQuerySchema.parse(req.query);
    const result = await listSupportMessages(query);
    res.json(result);
  }),
);

adminSupportRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const message = await getSupportMessage(String(req.params.id));
    res.json({ message });
  }),
);

adminSupportRouter.patch(
  '/:id/status',
  asyncHandler(async (req, res) => {
    const input = supportMessageStatusUpdateSchema.parse(req.body);
    const message = await updateSupportMessageStatus(String(req.params.id), input.status);
    res.json({ message });
  }),
);

adminSupportRouter.post(
  '/:id/reply',
  asyncHandler(async (req, res) => {
    const adminId = req.admin?._id.toString();

    if (!adminId) {
      throw AppError.unauthorized();
    }

    const input = supportReplySchema.parse(req.body);
    const message = await replyToSupportMessage(String(req.params.id), adminId, input.message);
    res.json({ message });
  }),
);
