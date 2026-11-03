import type { CreateOrderInput } from '@yaqeen/shared';
import { Types } from 'mongoose';
import { nextSequence } from '../../models/counter.js';
import { OrderLinkModel } from '../../models/order-link.js';
import { OrderModel, type OrderDocument } from '../../models/order.js';
import { ProductModel } from '../../models/product.js';
import { AppError } from '../../utils/app-error.js';
import { getDeliveryCharge } from '../settings/settings.service.js';

interface OrderLine {
  productId: Types.ObjectId;
  name: string;
  variantSku: string;
  variantLabel: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  image: string;
}

export interface PublicOrder {
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  bkashTrxId: string;
  subtotal: number;
  deliveryCharge: number;
  discount: number;
  total: number;
  items: Array<{
    productId: string;
    name: string;
    variantSku: string;
    variantLabel: string;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    image: string;
  }>;
  customer: {
    name: string;
    phone: string;
    altPhone: string;
    email: string;
    address: string;
    district: string;
    area: string;
    notes: string;
  };
  statusHistory: Array<{ status: string; note: string; changedAt: Date }>;
  createdAt: Date;
  updatedAt: Date;
}

export function normalizeBdPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('880')) {
    return `0${digits.slice(3)}`;
  }

  if (digits.length === 10 && digits.startsWith('1')) {
    return `0${digits}`;
  }

  return digits;
}

function dhakaDateKey(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replace(/-/g, '')
    .slice(2);
}

export async function generateOrderNumber(): Promise<string> {
  const dateKey = dhakaDateKey();
  const sequence = await nextSequence(`order-${dateKey}`);

  return `YQ-${dateKey}-${String(sequence).padStart(4, '0')}`;
}

export function toPublicOrder(order: OrderDocument): PublicOrder {
  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    bkashTrxId: order.bkashTrxId,
    subtotal: order.subtotal,
    deliveryCharge: order.deliveryCharge,
    discount: order.discount,
    total: order.total,
    items: order.items.map((item) => ({
      productId: String(item.productId),
      name: item.name,
      variantSku: item.variantSku,
      variantLabel: item.variantLabel,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
      image: item.image,
    })),
    customer: {
      name: order.customer.name,
      phone: order.customer.phone,
      altPhone: order.customer.altPhone,
      email: order.customer.email,
      address: order.customer.address,
      district: order.customer.district,
      area: order.customer.area,
      notes: order.customer.notes,
    },
    statusHistory: order.statusHistory.map((entry) => ({
      status: entry.status,
      note: entry.note,
      changedAt: entry.changedAt,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

async function buildOrderLines(input: CreateOrderInput): Promise<OrderLine[]> {
  const productIds = [...new Set(input.items.map((item) => item.productId))];
  const products = await ProductModel.find({
    _id: { $in: productIds },
    isActive: true,
  }).lean();
  const productsById = new Map(products.map((product) => [String(product._id), product]));

  return input.items.map((item) => {
    const product = productsById.get(item.productId);

    if (!product) {
      throw AppError.badRequest('One or more products are no longer available');
    }

    const variant = product.variants.find(
      (candidate) => candidate.sku.toUpperCase() === item.variantSku.toUpperCase(),
    );

    if (!variant) {
      throw AppError.badRequest(`${product.name}: the selected size is unavailable`);
    }

    if (variant.stock < item.quantity) {
      throw AppError.conflict(
        variant.stock > 0
          ? `${product.name} (${variant.label}) has only ${variant.stock} left`
          : `${product.name} (${variant.label}) is out of stock`,
      );
    }

    return {
      productId: product._id,
      name: product.name,
      variantSku: variant.sku,
      variantLabel: variant.label,
      unitPrice: variant.price,
      quantity: item.quantity,
      lineTotal: variant.price * item.quantity,
      image: product.images[0]?.url ?? '',
    };
  });
}

async function restoreStocks(lines: OrderLine[]): Promise<void> {
  for (const line of lines) {
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
}

async function decrementStocks(lines: OrderLine[]): Promise<OrderLine[]> {
  const applied: OrderLine[] = [];

  for (const line of lines) {
    const result = await ProductModel.updateOne(
      {
        _id: line.productId,
        isActive: true,
        variants: {
          $elemMatch: {
            sku: line.variantSku,
            stock: { $gte: line.quantity },
          },
        },
      },
      {
        $inc: {
          'variants.$.stock': -line.quantity,
          totalStock: -line.quantity,
        },
      },
    );

    if (result.modifiedCount !== 1) {
      await restoreStocks(applied);
      throw AppError.conflict(
        `${line.name} (${line.variantLabel}) just sold out. Please refresh and try again.`,
      );
    }

    applied.push(line);
  }

  return applied;
}

async function recordLinkOrder(
  linkCode: string | undefined,
  lines: OrderLine[],
  total: number,
): Promise<void> {
  if (!linkCode) {
    return;
  }

  const link = await OrderLinkModel.findOne({
    code: linkCode.toLowerCase(),
    isActive: true,
  });

  if (!link || !lines.some((line) => String(line.productId) === String(link.product))) {
    return;
  }

  await OrderLinkModel.updateOne(
    { _id: link._id },
    { $inc: { orders: 1, revenue: total } },
  );
}

function isDuplicateKeyError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 11000
  );
}

export async function createOrder(input: CreateOrderInput): Promise<PublicOrder> {
  if (input.idempotencyKey) {
    const existing = await OrderModel.findOne({ idempotencyKey: input.idempotencyKey });

    if (existing) {
      return toPublicOrder(existing);
    }
  }

  const lines = await buildOrderLines(input);
  const subtotal = lines.reduce((sum, line) => sum + line.lineTotal, 0);
  const deliveryCharge = await getDeliveryCharge(input.customer.district, subtotal);
  const total = subtotal + deliveryCharge;
  const applied = await decrementStocks(lines);

  try {
    const orderNumber = await generateOrderNumber();
    const customer = {
      ...input.customer,
      phone: normalizeBdPhone(input.customer.phone),
      altPhone: input.customer.altPhone ? normalizeBdPhone(input.customer.altPhone) : '',
      email: input.customer.email ?? '',
      area: input.customer.area ?? '',
      notes: input.customer.notes ?? '',
    };

    const order = await OrderModel.create({
      orderNumber,
      items: lines,
      customer,
      subtotal,
      deliveryCharge,
      discount: 0,
      total,
      paymentMethod: input.paymentMethod,
      paymentStatus: 'UNPAID',
      bkashTrxId: input.paymentMethod === 'BKASH_MANUAL' ? input.bkashTrxId ?? '' : '',
      status: 'PENDING',
      statusHistory: [
        {
          status: 'PENDING',
          note: 'Order placed',
          changedAt: new Date(),
        },
      ],
      source: {
        type: input.source?.type ?? 'DIRECT',
        linkCode: input.source?.linkCode ?? '',
        utm: input.source?.utm,
      },
      idempotencyKey: input.idempotencyKey ?? null,
    });

    await recordLinkOrder(input.source?.linkCode, lines, total);

    return toPublicOrder(order);
  } catch (error) {
    await restoreStocks(applied);

    if (isDuplicateKeyError(error) && input.idempotencyKey) {
      const existing = await OrderModel.findOne({ idempotencyKey: input.idempotencyKey });

      if (existing) {
        return toPublicOrder(existing);
      }
    }

    throw error;
  }
}

export async function trackOrder(orderNumber: string, phone: string): Promise<PublicOrder> {
  const order = await OrderModel.findOne({
    orderNumber: orderNumber.trim().toUpperCase(),
    'customer.phone': normalizeBdPhone(phone),
  });

  if (!order) {
    throw AppError.notFound('Order not found. Check the order number and phone number.');
  }

  return toPublicOrder(order);
}
