import type { OrderLinkInput, OrderLinkUpdateInput } from '@yaqeen/shared';
import { createHash } from 'node:crypto';
import { LinkClickModel } from '../../models/link-click.js';
import { ProductModel } from '../../models/product.js';
import { OrderLinkModel, type OrderLinkDocument } from '../../models/order-link.js';
import { AppError } from '../../utils/app-error.js';
import { ensureUniqueSlug } from '../../utils/slug.js';

interface PopulatedProduct {
  _id: unknown;
  name?: string;
  slug?: string;
}

function productSummary(product: unknown) {
  if (product && typeof product === 'object' && 'name' in product) {
    const value = product as PopulatedProduct;
    return {
      id: String(value._id),
      name: value.name ?? '',
      slug: value.slug ?? '',
    };
  }

  return {
    id: String(product),
    name: '',
    slug: '',
  };
}

function serializeLink(link: OrderLinkDocument) {
  return {
    id: link._id.toString(),
    code: link.code,
    product: productSummary(link.product),
    title: link.title,
    campaign: link.campaign,
    destination: link.destination,
    clicks: link.clicks,
    orders: link.orders,
    revenue: link.revenue,
    isActive: link.isActive,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
  };
}

async function codeIsTaken(code: string, excludeId?: string): Promise<boolean> {
  const filter: Record<string, unknown> = { code };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  return Boolean(await OrderLinkModel.exists(filter));
}

async function assertProductExists(productId: string): Promise<void> {
  const exists = await ProductModel.exists({ _id: productId });

  if (!exists) {
    throw AppError.badRequest('Product not found');
  }
}

export async function listOrderLinks() {
  const links = await OrderLinkModel.find()
    .populate('product', 'name slug')
    .sort({ createdAt: -1 });

  return links.map(serializeLink);
}

export async function createOrderLink(input: OrderLinkInput) {
  await assertProductExists(input.productId);

  const code = await ensureUniqueSlug(
    input.code ?? input.title ?? input.campaign ?? input.productId,
    (candidate) => codeIsTaken(candidate),
  );

  const link = await OrderLinkModel.create({
    code,
    product: input.productId,
    title: input.title ?? '',
    campaign: input.campaign ?? '',
    destination: input.destination,
    isActive: input.isActive,
  });

  await link.populate('product', 'name slug');

  return serializeLink(link);
}

export async function updateOrderLink(code: string, input: OrderLinkUpdateInput) {
  const link = await OrderLinkModel.findOne({ code: code.toLowerCase() }).populate(
    'product',
    'name slug',
  );

  if (!link) {
    throw AppError.notFound('Link not found');
  }

  if (input.productId) {
    await assertProductExists(input.productId);
    link.product = input.productId as unknown as typeof link.product;
  }

  if (input.title !== undefined) {
    link.title = input.title;
  }

  if (input.campaign !== undefined) {
    link.campaign = input.campaign;
  }

  if (input.destination !== undefined) {
    link.destination = input.destination;
  }

  if (input.isActive !== undefined) {
    link.isActive = input.isActive;
  }

  if (input.code && input.code !== link.code) {
    if (await codeIsTaken(input.code, link._id.toString())) {
      throw AppError.conflict('A link with this code already exists');
    }

    link.code = input.code;
  }

  await link.save();
  await link.populate('product', 'name slug');

  return serializeLink(link);
}

export async function deleteOrderLink(code: string): Promise<void> {
  const result = await OrderLinkModel.deleteOne({ code: code.toLowerCase() });

  if (result.deletedCount === 0) {
    throw AppError.notFound('Link not found');
  }
}

export async function resolveOrderLink(
  code: string,
  meta: { ip?: string; userAgent?: string; referrer?: string },
) {
  const link = await OrderLinkModel.findOne({
    code: code.toLowerCase(),
    isActive: true,
  }).populate('product', 'name slug');

  if (!link) {
    throw AppError.notFound('This campaign link is no longer active');
  }

  link.clicks += 1;
  await link.save();

  await LinkClickModel.create({
    link: link._id,
    ipHash: meta.ip ? createHash('sha256').update(meta.ip).digest('hex') : '',
    userAgent: meta.userAgent ?? '',
    referrer: meta.referrer ?? '',
  });

  return {
    code: link.code,
    destination: link.destination,
    product: productSummary(link.product),
  };
}
