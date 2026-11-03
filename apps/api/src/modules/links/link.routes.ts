import { orderLinkInputSchema, orderLinkUpdateSchema } from '@yaqeen/shared';
import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  createOrderLink,
  deleteOrderLink,
  listOrderLinks,
  resolveOrderLink,
  updateOrderLink,
} from './link.service.js';

export const publicLinkRouter = Router();

publicLinkRouter.get(
  '/:code',
  asyncHandler(async (req, res) => {
    const link = await resolveOrderLink(String(req.params.code), {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      referrer: req.get('referer'),
    });

    res.json({ link });
  }),
);

export const adminLinkRouter = Router();

adminLinkRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await listOrderLinks();
    res.json({ items });
  }),
);

adminLinkRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = orderLinkInputSchema.parse(req.body);
    const link = await createOrderLink(input);
    res.status(201).json({ link });
  }),
);

adminLinkRouter.patch(
  '/:code',
  asyncHandler(async (req, res) => {
    const input = orderLinkUpdateSchema.parse(req.body);
    const link = await updateOrderLink(String(req.params.code), input);
    res.json({ link });
  }),
);

adminLinkRouter.delete(
  '/:code',
  asyncHandler(async (req, res) => {
    await deleteOrderLink(String(req.params.code));
    res.status(204).end();
  }),
);
