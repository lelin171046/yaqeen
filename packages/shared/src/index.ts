import { z } from 'zod';

export const APP_NAME = 'Yaqeen';
export const APP_TAGLINE = 'Natural nuts, dry foods and nutrition you can trust.';

export const BRAND_LOGO_URL =
  'https://res.cloudinary.com/dcdmktxtz/image/upload/v1793672666/Yaqeen_Healthy_Foods_Emblem_pagvrd.png';
export const STORE_WHATSAPP = '+8801799573916';

export const CURRENCY = 'BDT';
export const CURRENCY_SYMBOL = '৳';

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
};

export const PAYMENT_METHODS = ['COD', 'BKASH_MANUAL', 'BKASH_PGW'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  COD: 'Cash on delivery',
  BKASH_MANUAL: 'bKash (manual transfer)',
  BKASH_PGW: 'bKash online payment',
};

export const ORDER_PAYMENT_STATUSES = ['UNPAID', 'PAID', 'REFUNDED'] as const;
export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUSES)[number];

export const ORDER_SOURCES = ['DIRECT', 'LINK', 'FACEBOOK'] as const;
export type OrderSource = (typeof ORDER_SOURCES)[number];

export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const bdPhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .pipe(
    z
      .string()
      .regex(/^(?:\+?880|0)1[3-9]\d{8}$/, 'Enter a valid Bangladeshi mobile number'),
  );

export const customerSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(120),
  phone: bdPhoneSchema,
  altPhone: bdPhoneSchema.optional().or(z.literal('')),
  email: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  address: z.string().trim().min(5, 'Full address is required').max(500),
  district: z.string().trim().min(2, 'District is required').max(80),
  area: z.string().trim().max(120).optional().or(z.literal('')),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export type CustomerInput = z.infer<typeof customerSchema>;

export const orderItemSchema = z.object({
  productId: objectIdSchema,
  variantSku: z.string().trim().min(1, 'Select a product size'),
  quantity: z.coerce.number().int().min(1, 'Minimum quantity is 1').max(50),
});

export type OrderItemInput = z.infer<typeof orderItemSchema>;

export const orderSourceSchema = z.object({
  type: z.enum(ORDER_SOURCES).default('DIRECT'),
  linkCode: z.string().trim().max(40).optional(),
  utm: z.record(z.string(), z.string()).optional(),
});

export type OrderSourceInput = z.infer<typeof orderSourceSchema>;

export const createOrderSchema = z
  .object({
    items: z.array(orderItemSchema).min(1, 'Add at least one product').max(20),
    customer: customerSchema,
    paymentMethod: z.enum(PAYMENT_METHODS).default('COD'),
    bkashTrxId: z.string().trim().min(4).max(60).optional().or(z.literal('')),
    source: orderSourceSchema.optional(),
    idempotencyKey: z.string().trim().min(8).max(120).optional(),
  })
  .refine(
    (value) => value.paymentMethod !== 'BKASH_MANUAL' || Boolean(value.bkashTrxId),
    {
      message: 'bKash transaction ID is required for manual bKash payments',
      path: ['bkashTrxId'],
    },
  );

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const trackOrderQuerySchema = z.object({
  phone: bdPhoneSchema,
});

export type TrackOrderQueryInput = z.infer<typeof trackOrderQuerySchema>;

export const orderStatusUpdateSchema = z.object({
  status: z.enum(ORDER_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export type OrderStatusUpdateInput = z.infer<typeof orderStatusUpdateSchema>;

export const orderPaymentUpdateSchema = z.object({
  paymentStatus: z.enum(ORDER_PAYMENT_STATUSES),
  note: z.string().trim().max(500).optional(),
});

export type OrderPaymentUpdateInput = z.infer<typeof orderPaymentUpdateSchema>;

export const orderNotesUpdateSchema = z.object({
  adminNotes: z.string().trim().max(1000).default(''),
});

export type OrderNotesUpdateInput = z.infer<typeof orderNotesUpdateSchema>;

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

export const slugSchema = z
  .string()
  .trim()
  .min(2)
  .max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens only');

export const imageSchema = z.object({
  url: z.string().trim().url('Enter a valid image URL'),
  publicId: z.string().trim().max(200).optional().or(z.literal('')),
  alt: z.string().trim().max(160).optional().or(z.literal('')),
});

export type ImageInput = z.infer<typeof imageSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(80),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  image: z.string().trim().url('Enter a valid image URL').optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
  slug: slugSchema.optional(),
});

export const categoryUpdateSchema = categoryInputSchema.partial();

export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;

export const productVariantSchema = z.object({
  label: z.string().trim().min(1, 'Variant label is required').max(60),
  grams: z.coerce.number().positive().optional(),
  price: z.coerce.number().min(1, 'Price must be greater than zero'),
  compareAtPrice: z.coerce.number().min(0).optional(),
  stock: z.coerce.number().int().min(0).default(0),
  sku: z.string().trim().max(60).optional().or(z.literal('')),
});

export type ProductVariantInput = z.infer<typeof productVariantSchema>;

export const productNutritionSchema = z.object({
  calories: z.coerce.number().min(0).optional(),
  protein: z.coerce.number().min(0).optional(),
  carbs: z.coerce.number().min(0).optional(),
  fat: z.coerce.number().min(0).optional(),
  fiber: z.coerce.number().min(0).optional(),
  sugar: z.coerce.number().min(0).optional(),
});

export const productInputSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(160),
  description: z.string().trim().min(10, 'Description is required').max(5000),
  shortDescription: z.string().trim().max(300).optional().or(z.literal('')),
  categoryId: objectIdSchema,
  images: z.array(imageSchema).max(8).default([]),
  video: z.string().trim().url('Enter a valid video URL').optional().or(z.literal('')),
  tags: z.array(z.string().trim().min(1).max(30)).max(20).default([]),
  ingredients: z.string().trim().max(1000).optional().or(z.literal('')),
  nutrition: productNutritionSchema.optional(),
  variants: z.array(productVariantSchema).min(1, 'Add at least one variant').max(10),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  badge: z.string().trim().max(40).optional().or(z.literal('')),
  slug: slugSchema.optional(),
  seo: z
    .object({
      title: z.string().trim().max(70).optional().or(z.literal('')),
      description: z.string().trim().max(160).optional().or(z.literal('')),
    })
    .optional(),
});

export const productUpdateSchema = productInputSchema.partial();

export type ProductInput = z.infer<typeof productInputSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;

const booleanQuerySchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

export const productSortSchema = z.enum(['newest', 'price_asc', 'price_desc', 'name_asc']);

export const productQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(180).optional(),
  featured: booleanQuerySchema.optional(),
  active: booleanQuerySchema.optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: productSortSchema.default('newest'),
});

export type ProductQueryInput = z.infer<typeof productQuerySchema>;

export const adminOrderQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  status: z.enum(ORDER_STATUSES).optional(),
  paymentStatus: z.enum(ORDER_PAYMENT_STATUSES).optional(),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  from: z.string().trim().max(30).optional(),
  to: z.string().trim().max(30).optional(),
  sort: z.enum(['newest', 'oldest', 'total_desc', 'total_asc']).default('newest'),
});

export type AdminOrderQueryInput = z.infer<typeof adminOrderQuerySchema>;

export const dashboardQuerySchema = z.object({
  range: z.coerce.number().int().min(7).max(365).default(30),
});

export type DashboardQueryInput = z.infer<typeof dashboardQuerySchema>;

const optionalUrlSchema = z.string().trim().url('Enter a valid URL').optional().or(z.literal(''));

export const settingsUpdateSchema = z.object({
  storeName: z.string().trim().min(2, 'Store name is required').max(120).optional(),
  supportPhone: z.string().trim().max(20).optional().or(z.literal('')),
  supportEmail: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  bkashMerchantNumber: z.string().trim().max(20).optional().or(z.literal('')),
  freeDeliveryThreshold: z.coerce.number().min(0).optional(),
  defaultDeliveryCharge: z.coerce.number().min(0).optional(),
  deliveryZones: z
    .array(
      z.object({
        name: z.string().trim().min(2).max(120),
        charge: z.coerce.number().min(0),
        isActive: z.boolean().default(true),
      }),
    )
    .max(20)
    .optional(),
  adminAlertEmails: z.array(z.string().trim().email()).max(20).optional(),
  adminAlertWhatsapp: z.array(z.string().trim().min(6).max(20)).max(20).optional(),
  socialLinks: z
    .object({
      facebook: optionalUrlSchema,
      instagram: optionalUrlSchema,
      whatsapp: optionalUrlSchema,
    })
    .optional(),
});

export type SettingsUpdateInput = z.infer<typeof settingsUpdateSchema>;

export const orderLinkInputSchema = z.object({
  productId: objectIdSchema,
  title: z.string().trim().max(120).optional().or(z.literal('')),
  campaign: z.string().trim().max(120).optional().or(z.literal('')),
  destination: z.enum(['ORDER', 'PRODUCT']).default('ORDER'),
  code: z
    .string()
    .trim()
    .min(3, 'Code must be at least 3 characters')
    .max(40)
    .regex(/^[a-z0-9-]+$/i, 'Use letters, numbers and hyphens only')
    .optional(),
  isActive: z.boolean().default(true),
});

export type OrderLinkInput = z.infer<typeof orderLinkInputSchema>;

export const orderLinkUpdateSchema = orderLinkInputSchema.partial();

export type OrderLinkUpdateInput = z.infer<typeof orderLinkUpdateSchema>;

export const apiHealthSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  uptime: z.number(),
  database: z.enum(['connected', 'connecting', 'disconnected', 'disconnecting', 'unconfigured']),
  timestamp: z.string(),
});

export type ApiHealth = z.infer<typeof apiHealthSchema>;

export * from './money.js';
