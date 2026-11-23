import { z } from 'zod';
import { formatBdt } from './money.js';

export const APP_NAME = 'Anando Deal';
export const APP_TAGLINE = 'All kinds of products for every season and every need.';

export const BRAND_LOGO_URL =
  'https://res.cloudinary.com/dcdmktxtz/image/upload/v1795029495/762944462_122125767986775176_6251977437859688810_n_tofy6h.jpg';
export const STORE_WHATSAPP = '+8801770937260';
export const SUPPORT_EMAIL = 'rabuofficial007@gmail.com';
export const SUPPORT_PHONE = '+880 1770-937260';

export const CURRENCY = 'BDT';
export const CURRENCY_SYMBOL = '৳';

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'DELIVERY_FAILED',
  'CANCELLED',
  'RETURNED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Packing in Progress',
  SHIPPED: 'Picked Up',
  DELIVERED: 'Delivered',
  DELIVERY_FAILED: 'Delivery Failed',
  CANCELLED: 'Order Cancelled',
  RETURNED: 'Returned',
};

export const ORDER_STATUS_UPDATE_OPTIONS = [
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'DELIVERY_FAILED',
  'CANCELLED',
] as const satisfies readonly OrderStatus[];

export const ORDER_COURIERS = ['PATHAO', 'STEADFAST', 'REDX'] as const;
export type OrderCourier = (typeof ORDER_COURIERS)[number];

export const ORDER_COURIER_LABELS: Record<OrderCourier, string> = {
  PATHAO: 'Pathao',
  STEADFAST: 'Steadfast',
  REDX: 'RedX',
};

export const PAYMENT_METHODS = [
  'COD',
  'BKASH_MANUAL',
  'NAGAD_MANUAL',
  'ROCKET_MANUAL',
  'BKASH_PGW',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const MANUAL_PAYMENT_METHODS = ['BKASH_MANUAL', 'NAGAD_MANUAL', 'ROCKET_MANUAL'] as const;
export type ManualPaymentMethod = (typeof MANUAL_PAYMENT_METHODS)[number];

export function isManualPaymentMethod(method: string): method is ManualPaymentMethod {
  return (MANUAL_PAYMENT_METHODS as readonly string[]).includes(method);
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  COD: 'Cash on delivery',
  BKASH_MANUAL: 'bKash (send money)',
  NAGAD_MANUAL: 'Nagad (send money)',
  ROCKET_MANUAL: 'Rocket (send money)',
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

const optionalDateSchema = z.preprocess(
  (value) => (value === '' || value === null || value === undefined ? undefined : value),
  z.coerce.date().optional(),
);

export const bdPhoneSchema = z
  .string()
  .trim()
  .transform((value) => value.replace(/[\s-]/g, ''))
  .pipe(z.string().regex(/^(?:\+?880|0)1[3-9]\d{8}$/, 'Enter a valid Bangladeshi mobile number'));

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
    paymentTrxId: z.string().trim().min(4).max(60).optional().or(z.literal('')),
    bkashTrxId: z.string().trim().min(4).max(60).optional().or(z.literal('')),
    source: orderSourceSchema.optional(),
    idempotencyKey: z.string().trim().min(8).max(120).optional(),
  })
  .refine(
    (value) =>
      !isManualPaymentMethod(value.paymentMethod) ||
      Boolean(value.paymentTrxId || value.bkashTrxId),
    {
      message: 'Transaction ID is required for send-money payments',
      path: ['paymentTrxId'],
    },
  );

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const trackOrderQuerySchema = z.object({
  phone: bdPhoneSchema,
});

export type TrackOrderQueryInput = z.infer<typeof trackOrderQuerySchema>;

export const orderStatusUpdateSchema = z
  .object({
    status: z.enum(ORDER_STATUSES),
    note: z.string().trim().max(500).optional(),
    courier: z.enum(ORDER_COURIERS).optional(),
    courierTrackingId: z.string().trim().max(80).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status !== 'SHIPPED') {
      return;
    }

    if (!value.courier) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Select a courier',
        path: ['courier'],
      });
    }

    if (!value.courierTrackingId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Courier tracking ID is required',
        path: ['courierTrackingId'],
      });
    }
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

export const SUPPORT_TOPICS = ['ORDER', 'PRODUCT', 'RETURN', 'PAYMENT', 'OTHER'] as const;
export type SupportTopic = (typeof SUPPORT_TOPICS)[number];

export const SUPPORT_TOPIC_LABELS: Record<SupportTopic, string> = {
  ORDER: 'Order help',
  PRODUCT: 'Product question',
  RETURN: 'Return or refund',
  PAYMENT: 'Payment question',
  OTHER: 'Something else',
};

export const SUPPORT_MESSAGE_STATUSES = ['NEW', 'IN_PROGRESS', 'RESOLVED', 'ARCHIVED'] as const;
export type SupportMessageStatus = (typeof SUPPORT_MESSAGE_STATUSES)[number];

export const SUPPORT_MESSAGE_STATUS_LABELS: Record<SupportMessageStatus, string> = {
  NEW: 'New',
  IN_PROGRESS: 'In progress',
  RESOLVED: 'Resolved',
  ARCHIVED: 'Archived',
};

export const supportMessageInputSchema = z.object({
  name: z.string().trim().min(2, 'Name is required').max(120),
  email: z.string().trim().email('Enter a valid email').max(160),
  phone: bdPhoneSchema.optional().or(z.literal('')),
  topic: z.enum(SUPPORT_TOPICS).default('OTHER'),
  orderNumber: z.string().trim().max(40).optional().or(z.literal('')),
  message: z.string().trim().min(10, 'Tell us a little more (at least 10 characters)').max(2000),
});

export type SupportMessageInput = z.infer<typeof supportMessageInputSchema>;

export const supportMessageQuerySchema = paginationSchema.extend({
  status: z.enum(SUPPORT_MESSAGE_STATUSES).optional(),
  search: z.string().trim().max(120).optional(),
});

export type SupportMessageQueryInput = z.infer<typeof supportMessageQuerySchema>;

export const supportMessageStatusUpdateSchema = z.object({
  status: z.enum(SUPPORT_MESSAGE_STATUSES),
});

export type SupportMessageStatusUpdateInput = z.infer<typeof supportMessageStatusUpdateSchema>;

export const supportReplySchema = z.object({
  message: z.string().trim().min(2, 'Write a reply').max(2000),
});

export type SupportReplyInput = z.infer<typeof supportReplySchema>;

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
  flashPrice: z.coerce.number().min(1).optional(),
  flashStartsAt: optionalDateSchema,
  flashEndsAt: optionalDateSchema,
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

const booleanQuerySchema = z.enum(['true', 'false']).transform((value) => value === 'true');

export const productSortSchema = z.enum(['newest', 'price_asc', 'price_desc', 'name_asc']);

export const productQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(100).optional(),
  category: z.string().trim().max(180).optional(),
  featured: booleanQuerySchema.optional(),
  flashSale: booleanQuerySchema.optional(),
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

export const HERO_SLIDE_THEME_VALUES = ['forest', 'amber', 'navy', 'berry', 'slate'] as const;

export type HeroSlideTheme = (typeof HERO_SLIDE_THEME_VALUES)[number];

export const HERO_SLIDE_THEMES: Array<{
  value: HeroSlideTheme;
  label: string;
}> = [
  { value: 'forest', label: 'Charcoal' },
  { value: 'amber', label: 'Graphite' },
  { value: 'navy', label: 'Deep black' },
  { value: 'berry', label: 'Slate gray' },
  { value: 'slate', label: 'Soft charcoal' },
];

export const HERO_SLIDE_THEME_GRADIENTS: Record<HeroSlideTheme, string> = {
  forest: 'linear-gradient(135deg, #0a0a0a 0%, #262626 52%, #4d4d4d 100%)',
  amber: 'linear-gradient(135deg, #1a1a1a 0%, #3d3d3d 48%, #666666 100%)',
  navy: 'linear-gradient(135deg, #000000 0%, #1f1f1f 52%, #404040 100%)',
  berry: 'linear-gradient(135deg, #222222 0%, #4d4d4d 48%, #737373 100%)',
  slate: 'linear-gradient(135deg, #111111 0%, #2b2b2b 52%, #525252 100%)',
};

const storefrontLinkSchema = z
  .string()
  .trim()
  .min(1, 'Button link is required')
  .max(300)
  .refine(
    (value) =>
      value.startsWith('/') ||
      value.startsWith('#') ||
      /^https?:\/\//i.test(value) ||
      /^mailto:/i.test(value) ||
      /^tel:/i.test(value),
    'Use a store path or full URL',
  );

export const heroSlideSettingsSchema = z.object({
  id: z.string().trim().min(1).max(80),
  eyebrow: z.string().trim().max(60).default(''),
  title: z.string().trim().min(2, 'Slide title is required').max(140),
  description: z.string().trim().max(500).default(''),
  ctaLabel: z.string().trim().min(1, 'Button text is required').max(40),
  ctaHref: storefrontLinkSchema,
  badge: z.string().trim().max(40).default(''),
  image: optionalUrlSchema,
  imageAlt: z.string().trim().max(180).default(''),
  theme: z.enum(HERO_SLIDE_THEME_VALUES).default('forest'),
  isActive: z.boolean().default(true),
  startsAt: optionalDateSchema,
  endsAt: optionalDateSchema,
});

export const heroCarouselSettingsSchema = z.object({
  autoplaySeconds: z.coerce.number().min(0).max(30).default(6),
  pauseOnHover: z.boolean().default(true),
  slides: z.array(heroSlideSettingsSchema).max(8).default([]),
});

export type HeroSlideSettings = z.infer<typeof heroSlideSettingsSchema>;
export type HeroCarouselSettings = z.infer<typeof heroCarouselSettingsSchema>;

export const DEFAULT_HERO_CAROUSEL: HeroCarouselSettings = {
  autoplaySeconds: 6,
  pauseOnHover: true,
  slides: [
    {
      id: 'winter-essentials',
      eyebrow: 'Winter collection',
      title: 'Stay warm with winter essentials',
      description:
        'Shop hot water bottles, room heaters, blankets, and cozy winter essentials delivered across Bangladesh.',
      ctaLabel: 'Shop winter essentials',
      ctaHref: '/shop',
      badge: 'Winter picks',
      image: '',
      imageAlt: '',
      theme: 'navy',
      isActive: true,
    },
    {
      id: 'winter-fashion',
      eyebrow: 'Seasonal fashion',
      title: 'Winter dresses and layers for everyone',
      description:
        'Find winter dresses, jackets, sweaters, and shawls in a range of sizes, styles, and prices.',
      ctaLabel: 'Explore winter wear',
      ctaHref: '/shop',
      badge: 'New season',
      image: '',
      imageAlt: '',
      theme: 'berry',
      isActive: true,
    },
    {
      id: 'kids-and-decor',
      eyebrow: 'Something for every home',
      title: 'Kids toys and decorative items',
      description:
        'Discover toys for kids and decorative pieces that brighten every room, plus many more everyday products.',
      ctaLabel: 'Browse all products',
      ctaHref: '/shop',
      badge: 'All kinds of products',
      image: '',
      imageAlt: '',
      theme: 'amber',
      isActive: true,
    },
    {
      id: 'free-delivery',
      eyebrow: 'Free delivery',
      title: `Free delivery on orders over ${formatBdt(2000)}`,
      description:
        'Shop all kinds of products across Bangladesh and enjoy free delivery on qualifying orders. Cash on delivery available.',
      ctaLabel: 'Start shopping',
      ctaHref: '/shop',
      badge: 'Nationwide',
      image: '',
      imageAlt: '',
      theme: 'forest',
      isActive: true,
    },
  ],
};

export const DELIVERY_BENEFIT_ICON_VALUES = [
  'truck',
  'wallet',
  'shield',
  'phone',
  'package',
  'sparkles',
] as const;

export type DeliveryBenefitIcon = (typeof DELIVERY_BENEFIT_ICON_VALUES)[number];

export const deliveryBenefitSchema = z.object({
  id: z.string().trim().min(1).max(80),
  title: z.string().trim().min(2).max(80),
  description: z.string().trim().max(180).default(''),
  icon: z.enum(DELIVERY_BENEFIT_ICON_VALUES).default('truck'),
  isActive: z.boolean().default(true),
});

export type DeliveryBenefitSettings = z.infer<typeof deliveryBenefitSchema>;

export const DEFAULT_DELIVERY_BENEFITS: DeliveryBenefitSettings[] = [
  {
    id: 'cash-on-delivery',
    title: 'Cash on delivery',
    description: 'Pay when your order arrives',
    icon: 'wallet',
    isActive: true,
  },
  {
    id: 'inside-outside-dhaka',
    title: 'Inside & outside Dhaka',
    description: 'Delivery across the service areas',
    icon: 'truck',
    isActive: true,
  },
  {
    id: 'quality-checked',
    title: 'Quality checked',
    description: 'Selected products, checked before dispatch',
    icon: 'shield',
    isActive: true,
  },
  {
    id: 'real-support',
    title: 'Easy support',
    description: 'Help when you need it',
    icon: 'phone',
    isActive: true,
  },
];

export interface VariantPricingInput {
  price: number;
  compareAtPrice?: number | null;
  flashPrice?: number | null;
  flashStartsAt?: Date | string | null;
  flashEndsAt?: Date | string | null;
}

export function resolveVariantPricing(variant: VariantPricingInput, now = new Date()) {
  const startsAt = variant.flashStartsAt ? new Date(variant.flashStartsAt) : null;
  const endsAt = variant.flashEndsAt ? new Date(variant.flashEndsAt) : null;
  const flashActive =
    Boolean(variant.flashPrice && variant.flashPrice > 0) &&
    (!startsAt || startsAt <= now) &&
    (!endsAt || endsAt >= now);
  const sellingPrice = flashActive ? Number(variant.flashPrice) : variant.price;
  const referencePrice =
    variant.compareAtPrice && variant.compareAtPrice > sellingPrice
      ? variant.compareAtPrice
      : flashActive && variant.price > sellingPrice
        ? variant.price
        : undefined;
  const discountPercent = referencePrice
    ? Math.round(((referencePrice - sellingPrice) / referencePrice) * 100)
    : 0;

  return {
    sellingPrice,
    referencePrice,
    discountPercent,
    isOnSale: Boolean(referencePrice),
    saleEndsAt: flashActive ? endsAt : undefined,
    savings: referencePrice ? referencePrice - sellingPrice : 0,
  };
}

export const settingsUpdateSchema = z.object({
  storeName: z.string().trim().min(2, 'Store name is required').max(120).optional(),
  supportPhone: z.string().trim().max(20).optional().or(z.literal('')),
  supportEmail: z.string().trim().email('Enter a valid email').optional().or(z.literal('')),
  bkashMerchantNumber: z.string().trim().max(20).optional().or(z.literal('')),
  nagadMerchantNumber: z.string().trim().max(20).optional().or(z.literal('')),
  rocketMerchantNumber: z.string().trim().max(20).optional().or(z.literal('')),
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
  heroCarousel: heroCarouselSettingsSchema.optional(),
  flashDealsEnabled: z.boolean().optional(),
  featuredCategoryIds: z.array(objectIdSchema).max(8).optional(),
  deliveryBenefits: z.array(deliveryBenefitSchema).max(6).optional(),
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
