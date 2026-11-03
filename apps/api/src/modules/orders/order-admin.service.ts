import type {
  AdminOrderQueryInput,
  OrderNotesUpdateInput,
  OrderPaymentUpdateInput,
  OrderStatusUpdateInput,
} from '@yaqeen/shared';
import { Types } from 'mongoose';
import { OrderModel, type OrderDocument } from '../../models/order.js';
import { ProductModel } from '../../models/product.js';
import { AppError } from '../../utils/app-error.js';
import { toPublicOrder } from './order.service.js';

const RESTOCKING_STATUSES = new Set(['CANCELLED', 'RETURNED']);

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export interface AdminOrder extends ReturnType<typeof toPublicOrder> {
  id: string;
  adminNotes: string;
  source: {
    type: string;
    linkCode: string;
    utm: Record<string, string> | null;
  };
}

export function toAdminOrder(order: OrderDocument): AdminOrder {
  const utm =
    order.source?.utm instanceof Map
      ? Object.fromEntries(order.source.utm)
      : ((order.source?.utm as Record<string, string> | undefined) ?? null);

  return {
    ...toPublicOrder(order),
    id: order._id.toString(),
    adminNotes: order.adminNotes ?? '',
    source: {
      type: order.source?.type ?? 'DIRECT',
      linkCode: order.source?.linkCode ?? '',
      utm,
    },
  };
}

export async function listAdminOrders(input: AdminOrderQueryInput) {
  const filter: Record<string, unknown> = {};

  if (input.status) {
    filter.status = input.status;
  }

  if (input.paymentStatus) {
    filter.paymentStatus = input.paymentStatus;
  }

  if (input.paymentMethod) {
    filter.paymentMethod = input.paymentMethod;
  }

  if (input.search) {
    const regex = new RegExp(escapeRegex(input.search), 'i');
    filter.$or = [
      { orderNumber: regex },
      { 'customer.name': regex },
      { 'customer.phone': regex },
      { 'customer.email': regex },
    ];
  }

  if (input.from || input.to) {
    const createdAt: Record<string, Date> = {};

    if (input.from) {
      const from = new Date(input.from);

      if (Number.isNaN(from.getTime())) {
        throw AppError.badRequest('Invalid "from" date');
      }

      createdAt.$gte = from;
    }

    if (input.to) {
      const to = new Date(input.to);

      if (Number.isNaN(to.getTime())) {
        throw AppError.badRequest('Invalid "to" date');
      }

      to.setHours(23, 59, 59, 999);
      createdAt.$lte = to;
    }

    filter.createdAt = createdAt;
  }

  const sortMap: Record<AdminOrderQueryInput['sort'], Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    oldest: { createdAt: 1 },
    total_desc: { total: -1 },
    total_asc: { total: 1 },
  };

  const skip = (input.page - 1) * input.limit;

  const [orders, total] = await Promise.all([
    OrderModel.find(filter)
      .sort(sortMap[input.sort])
      .skip(skip)
      .limit(input.limit),
    OrderModel.countDocuments(filter),
  ]);

  return {
    items: orders.map(toAdminOrder),
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      pages: Math.ceil(total / input.limit),
    },
  };
}

export async function getAdminOrder(orderNumber: string): Promise<AdminOrder> {
  const order = await OrderModel.findOne({
    orderNumber: orderNumber.trim().toUpperCase(),
  });

  if (!order) {
    throw AppError.notFound('Order not found');
  }

  return toAdminOrder(order);
}

async function restoreOrderStock(order: OrderDocument): Promise<void> {
  for (const item of order.items) {
    await ProductModel.updateOne(
      { _id: item.productId, 'variants.sku': item.variantSku },
      {
        $inc: {
          'variants.$.stock': item.quantity,
          totalStock: item.quantity,
        },
      },
    );
  }
}

async function takeOrderStock(order: OrderDocument): Promise<void> {
  const applied: Array<{ productId: Types.ObjectId; variantSku: string; quantity: number }> =
    [];

  for (const item of order.items) {
    const result = await ProductModel.updateOne(
      {
        _id: item.productId,
        variants: {
          $elemMatch: {
            sku: item.variantSku,
            stock: { $gte: item.quantity },
          },
        },
      },
      {
        $inc: {
          'variants.$.stock': -item.quantity,
          totalStock: -item.quantity,
        },
      },
    );

    if (result.modifiedCount !== 1) {
      for (const line of applied) {
        await ProductModel.updateOne(
          { _id: line.productId, 'variants.sku': line.variantSku },
          {
            $inc: {
              'variants.$.stock': line.quantity,
              totalStock: line.quantity,
            },
          },
        );
      }

      throw AppError.conflict(
        `${item.name} (${item.variantLabel}) does not have enough stock to reopen this order.`,
      );
    }

    applied.push({
      productId: item.productId,
      variantSku: item.variantSku,
      quantity: item.quantity,
    });
  }
}

export async function updateOrderStatus(
  orderNumber: string,
  input: OrderStatusUpdateInput,
  adminId: string,
): Promise<AdminOrder> {
  const order = await OrderModel.findOne({
    orderNumber: orderNumber.trim().toUpperCase(),
  });

  if (!order) {
    throw AppError.notFound('Order not found');
  }

  const wasRestocking = RESTOCKING_STATUSES.has(order.status);
  const willRestock = RESTOCKING_STATUSES.has(input.status);

  if (!wasRestocking && willRestock) {
    await restoreOrderStock(order);
  } else if (wasRestocking && !willRestock) {
    await takeOrderStock(order);
  }

  order.status = input.status;
  order.statusHistory.push({
    status: input.status,
    note: input.note ?? '',
    changedBy: new Types.ObjectId(adminId),
    changedAt: new Date(),
  });

  await order.save();

  return toAdminOrder(order);
}

export async function updateOrderPayment(
  orderNumber: string,
  input: OrderPaymentUpdateInput,
): Promise<AdminOrder> {
  const order = await OrderModel.findOne({
    orderNumber: orderNumber.trim().toUpperCase(),
  });

  if (!order) {
    throw AppError.notFound('Order not found');
  }

  order.paymentStatus = input.paymentStatus;

  if (input.note) {
    order.statusHistory.push({
      status: order.status,
      note: input.note,
      changedAt: new Date(),
    });
  }

  await order.save();

  return toAdminOrder(order);
}

export async function updateOrderNotes(
  orderNumber: string,
  input: OrderNotesUpdateInput,
): Promise<AdminOrder> {
  const order = await OrderModel.findOne({
    orderNumber: orderNumber.trim().toUpperCase(),
  });

  if (!order) {
    throw AppError.notFound('Order not found');
  }

  order.adminNotes = input.adminNotes;
  await order.save();

  return toAdminOrder(order);
}
