import {
  adminOrderQuerySchema,
  createOrderSchema,
  orderNotesUpdateSchema,
  orderPaymentUpdateSchema,
  orderStatusUpdateSchema,
  trackOrderQuerySchema,
} from '@yaqeen/shared';
import { Router } from 'express';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  getAdminOrder,
  listAdminOrders,
  updateOrderNotes,
  updateOrderPayment,
  updateOrderStatus,
} from './order-admin.service.js';
import { createOrder, trackOrder } from './order.service.js';

export const publicOrderRouter = Router();

publicOrderRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = createOrderSchema.parse(req.body);
    const order = await createOrder(input);

    res.status(201).json({ order });
  }),
);

publicOrderRouter.get(
  '/track/:orderNumber',
  asyncHandler(async (req, res) => {
    const query = trackOrderQuerySchema.parse(req.query);
    const order = await trackOrder(String(req.params.orderNumber), query.phone);

    res.json({ order });
  }),
);

export const adminOrderRouter = Router();

adminOrderRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = adminOrderQuerySchema.parse(req.query);
    const result = await listAdminOrders(query);
    res.json(result);
  }),
);

adminOrderRouter.get(
  '/:orderNumber',
  asyncHandler(async (req, res) => {
    const order = await getAdminOrder(String(req.params.orderNumber));
    res.json({ order });
  }),
);

adminOrderRouter.patch(
  '/:orderNumber/status',
  asyncHandler(async (req, res) => {
    const adminId = req.admin?._id.toString();

    if (!adminId) {
      throw AppError.unauthorized();
    }

    const input = orderStatusUpdateSchema.parse(req.body);
    const order = await updateOrderStatus(String(req.params.orderNumber), input, adminId);
    res.json({ order });
  }),
);

adminOrderRouter.patch(
  '/:orderNumber/payment',
  asyncHandler(async (req, res) => {
    const input = orderPaymentUpdateSchema.parse(req.body);
    const order = await updateOrderPayment(String(req.params.orderNumber), input);
    res.json({ order });
  }),
);

adminOrderRouter.patch(
  '/:orderNumber/notes',
  asyncHandler(async (req, res) => {
    const input = orderNotesUpdateSchema.parse(req.body);
    const order = await updateOrderNotes(String(req.params.orderNumber), input);
    res.json({ order });
  }),
);
