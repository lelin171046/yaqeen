import { STORE_WHATSAPP, SUPPORT_EMAIL, SUPPORT_PHONE } from '@anando-deal/shared';
import type { Types } from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../config/db.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { AdminModel } from '../models/admin.js';
import { CategoryModel } from '../models/category.js';
import { ProductModel } from '../models/product.js';
import { SettingsModel } from '../models/settings.js';
import { hashPassword } from '../utils/password.js';
import { slugify } from '../utils/slug.js';

const placeholder = (text: string) =>
  `https://placehold.co/800x800/1463c9/f2be5c?text=${encodeURIComponent(text)}`;

type SeedVariant = {
  label: string;
  skuPart: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
};

type SeedProduct = {
  name: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  tags: string[];
  badge: string;
  isFeatured: boolean;
  variants: SeedVariant[];
};

const categories = [
  {
    name: 'Winter Essentials',
    slug: 'winter-essentials',
    description: 'Hot water bottles, room heaters, blankets and winter must-haves.',
    sortOrder: 1,
    isActive: true,
  },
  {
    name: 'Winter Fashion',
    slug: 'winter-fashion',
    description: 'Winter dresses, jackets, sweaters, shawls and layered clothing.',
    sortOrder: 2,
    isActive: true,
  },
  {
    name: 'Kids & Toys',
    slug: 'kids-toys',
    description: 'Toys, games, learning sets and kids clothing.',
    sortOrder: 3,
    isActive: true,
  },
  {
    name: 'Home & Decorative',
    slug: 'home-decorative',
    description: 'Decorative items, wall art, lights, vases and cushions.',
    sortOrder: 4,
    isActive: true,
  },
  {
    name: 'General Products',
    slug: 'general-products',
    description: 'Everyday products for home, travel, work and more.',
    sortOrder: 5,
    isActive: true,
  },
];

const products: SeedProduct[] = [
  {
    name: 'Reusable Hot Water Bottle',
    categorySlug: 'winter-essentials',
    shortDescription: 'Warm, reusable comfort for cold nights.',
    description:
      'A durable hot water bottle for cozy winter evenings. Easy to fill, reuse, and keep close on cold nights at home.',
    tags: ['hot water bottle', 'winter', 'warmth'],
    badge: 'Winter pick',
    isFeatured: true,
    variants: [
      { label: '1 L', skuPart: '1l', price: 450, compareAtPrice: 520, stock: 30 },
      { label: '2 L', skuPart: '2l', price: 650, stock: 20 },
    ],
  },
  {
    name: 'Portable Room Heater',
    categorySlug: 'winter-essentials',
    shortDescription: 'Compact warmth for bedrooms and small spaces.',
    description:
      'A portable room heater designed for quick, convenient warmth in bedrooms, offices, and small living spaces during winter.',
    tags: ['room heater', 'winter', 'home'],
    badge: 'Seasonal deal',
    isFeatured: true,
    variants: [
      { label: 'Standard', skuPart: 'std', price: 2800, stock: 12 },
      { label: 'Premium', skuPart: 'prm', price: 3900, compareAtPrice: 4500, stock: 8 },
    ],
  },
  {
    name: 'Winter Dress for Women',
    categorySlug: 'winter-fashion',
    shortDescription: 'A warm, stylish dress for winter days.',
    description:
      'A comfortable winter dress made for layering and everyday wear. Simple styling with a warm feel for the cold season.',
    tags: ['winter dress', 'fashion', 'clothing'],
    badge: 'New season',
    isFeatured: true,
    variants: [
      { label: 'M', skuPart: 'm', price: 1250, stock: 20 },
      { label: 'L', skuPart: 'l', price: 1250, stock: 18 },
      { label: 'XL', skuPart: 'xl', price: 1350, stock: 10 },
    ],
  },
  {
    name: 'Kids Building Blocks Set',
    categorySlug: 'kids-toys',
    shortDescription: 'Creative building fun for kids.',
    description:
      'A colorful building blocks set that encourages creative play and simple construction projects for kids.',
    tags: ['kids toys', 'building blocks', 'learning'],
    badge: 'Kids favourite',
    isFeatured: true,
    variants: [
      { label: '50 pieces', skuPart: '50pcs', price: 850, stock: 25 },
      { label: '100 pieces', skuPart: '100pcs', price: 1400, stock: 15 },
    ],
  },
  {
    name: 'Decorative LED String Lights',
    categorySlug: 'home-decorative',
    shortDescription: 'Soft lighting for rooms and special corners.',
    description:
      'Decorative LED string lights for bedrooms, shelves, windows, and small celebrations. A simple way to brighten any space.',
    tags: ['decorative items', 'lights', 'home decor'],
    badge: 'Home pick',
    isFeatured: true,
    variants: [
      { label: '5 m', skuPart: '5m', price: 550, stock: 30 },
      { label: '10 m', skuPart: '10m', price: 850, stock: 20 },
    ],
  },
  {
    name: 'Everyday Travel Backpack',
    categorySlug: 'general-products',
    shortDescription: 'A practical backpack for daily use.',
    description:
      'A simple, practical backpack for work, study, and short trips. Spacious enough for daily essentials without feeling bulky.',
    tags: ['backpack', 'travel', 'everyday'],
    badge: 'Everyday value',
    isFeatured: false,
    variants: [
      { label: '20 L', skuPart: '20l', price: 1200, stock: 22 },
      { label: '30 L', skuPart: '30l', price: 1600, stock: 14 },
    ],
  },
];

async function seedAdmin(): Promise<string> {
  const email = env.ADMIN_EMAIL ?? 'admin@anandodeal.local';
  const password = env.ADMIN_PASSWORD ?? 'ChangeMe123!';

  if (env.NODE_ENV === 'production' && (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD)) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required when seeding production');
  }

  const passwordHash = await hashPassword(password);

  await AdminModel.findOneAndUpdate(
    { email },
    {
      $set: {
        name: env.ADMIN_NAME,
        passwordHash,
        role: 'OWNER',
        isActive: true,
      },
      $setOnInsert: {
        tokenVersion: 0,
      },
    },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
    },
  );

  return email;
}

async function main(): Promise<void> {
  await connectDatabase();

  const adminEmail = await seedAdmin();
  const categoryIds = new Map<string, Types.ObjectId>();

  for (const category of categories) {
    const document = await CategoryModel.findOneAndUpdate(
      { slug: category.slug },
      { $set: category },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      },
    );

    categoryIds.set(category.slug, document._id);
  }

  for (const product of products) {
    const categoryId = categoryIds.get(product.categorySlug);

    if (!categoryId) {
      throw new Error(`Missing category ${product.categorySlug}`);
    }

    const slug = slugify(product.name);
    const variants = product.variants.map((variant, index) => ({
      ...variant,
      sku: `${slug}-${variant.skuPart}-${index + 1}`.toUpperCase(),
    }));

    await ProductModel.findOneAndUpdate(
      { slug },
      {
        $set: {
          name: product.name,
          slug,
          description: product.description,
          shortDescription: product.shortDescription,
          category: categoryId,
          images: [
            {
              url: placeholder(product.name),
              alt: product.name,
              publicId: '',
            },
          ],
          tags: product.tags,
          variants,
          basePrice: Math.min(...variants.map((variant) => variant.price)),
          totalStock: variants.reduce((sum, variant) => sum + variant.stock, 0),
          isFeatured: product.isFeatured,
          isActive: true,
          badge: product.badge,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true,
      },
    );
  }

  await SettingsModel.findOneAndUpdate(
    { key: 'store' },
    {
      $setOnInsert: {
        key: 'store',
        storeName: 'Anando Deal',
        supportPhone: SUPPORT_PHONE,
        supportEmail: SUPPORT_EMAIL,
        bkashMerchantNumber: env.BKASH_MERCHANT_NUMBER ?? '',
        nagadMerchantNumber: env.NAGAD_MERCHANT_NUMBER ?? '',
        rocketMerchantNumber: env.ROCKET_MERCHANT_NUMBER ?? '',
        freeDeliveryThreshold: env.FREE_DELIVERY_THRESHOLD,
        defaultDeliveryCharge: env.DEFAULT_DELIVERY_CHARGE,
        deliveryZones: [
          { name: 'Inside Dhaka', charge: 60, isActive: true },
          { name: 'Outside Dhaka', charge: 120, isActive: true },
        ],
        adminAlertEmails: [],
        adminAlertWhatsapp: [],
        socialLinks: {
          facebook: '',
          instagram: '',
          whatsapp: `https://wa.me/${STORE_WHATSAPP.replace(/\D/g, '')}`,
        },
      },
    },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
    },
  );

  await SettingsModel.updateOne(
    { key: 'store', supportPhone: '' },
    { $set: { supportPhone: SUPPORT_PHONE } },
  );

  await SettingsModel.updateOne(
    { key: 'store', supportEmail: '' },
    { $set: { supportEmail: SUPPORT_EMAIL } },
  );

  await SettingsModel.updateOne(
    {
      key: 'store',
      $or: [{ 'socialLinks.whatsapp': '' }, { 'socialLinks.whatsapp': { $exists: false } }],
    },
    { $set: { 'socialLinks.whatsapp': `https://wa.me/${STORE_WHATSAPP.replace(/\D/g, '')}` } },
  );

  logger.info(
    {
      adminEmail,
      categories: categories.length,
      products: products.length,
      adminPasswordSource: env.ADMIN_PASSWORD ? 'ADMIN_PASSWORD' : 'development default',
    },
    'Seed complete',
  );

  if (env.NODE_ENV !== 'production' && !env.ADMIN_PASSWORD) {
    logger.warn(
      'Development admin password is "ChangeMe123!". Set ADMIN_PASSWORD in apps/api/.env to change it.',
    );
  }
}

main()
  .then(async () => {
    await disconnectDatabase();
    process.exit(0);
  })
  .catch(async (error: unknown) => {
    logger.error({ err: error }, 'Seed failed');
    await disconnectDatabase();
    process.exit(1);
  });
