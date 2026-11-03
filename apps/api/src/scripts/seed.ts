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
  `https://placehold.co/800x800/f3ede0/1f4d3b?text=${encodeURIComponent(text)}`;

const categories = [
  {
    name: 'Nuts & Seeds',
    slug: 'nuts-seeds',
    description: 'Cashews, almonds, pistachios, walnuts and everyday seeds.',
    sortOrder: 1,
    isActive: true,
  },
  {
    name: 'Dry Fruits',
    slug: 'dry-fruits',
    description: 'Dates, raisins, figs and naturally sweet dry fruits.',
    sortOrder: 2,
    isActive: true,
  },
  {
    name: 'Diet Foods',
    slug: 'diet-foods',
    description: 'Clean, filling foods for mindful eating and weight goals.',
    sortOrder: 3,
    isActive: true,
  },
  {
    name: 'Nutritional Foods',
    slug: 'nutritional-foods',
    description: 'Protein, fibre and energy support for active days.',
    sortOrder: 4,
    isActive: true,
  },
  {
    name: 'Gift Boxes',
    slug: 'gift-boxes',
    description: 'Premium assortments packed for gifting.',
    sortOrder: 5,
    isActive: true,
  },
  {
    name: 'Combo Packs',
    slug: 'combo-packs',
    description: 'Value bundles for families and regular customers.',
    sortOrder: 6,
    isActive: true,
  },
];

const products = [
  {
    name: 'Premium Cashews',
    categorySlug: 'nuts-seeds',
    shortDescription: 'Hand-picked, creamy cashews packed fresh.',
    description:
      'Our premium cashews are carefully selected for size, crunch and natural sweetness. Roasted lightly and packed in small batches so every handful tastes fresh.',
    tags: ['cashew', 'kaju', 'premium'],
    badge: 'Best seller',
    isFeatured: true,
    variants: [
      { label: '250g', grams: 250, price: 450, compareAtPrice: 520, stock: 30 },
      { label: '500g', grams: 500, price: 850, compareAtPrice: 950, stock: 20 },
      { label: '1kg', grams: 1000, price: 1600, compareAtPrice: 1800, stock: 10 },
    ],
  },
  {
    name: 'California Almonds',
    categorySlug: 'nuts-seeds',
    shortDescription: 'Crunchy almonds for snacking and breakfast bowls.',
    description:
      'Naturally nutritious California almonds with a clean crunch. A simple everyday source of protein, fibre and healthy fats.',
    tags: ['almond', 'badam', 'healthy'],
    badge: 'Daily favourite',
    isFeatured: true,
    variants: [
      { label: '250g', grams: 250, price: 380, stock: 35 },
      { label: '500g', grams: 500, price: 720, stock: 25 },
      { label: '1kg', grams: 1000, price: 1350, stock: 12 },
    ],
  },
  {
    name: 'Salted Pistachios',
    categorySlug: 'nuts-seeds',
    shortDescription: 'Roasted pistachios with a light touch of salt.',
    description:
      'Premium pistachios, roasted and lightly salted for a satisfying snack. Great for sharing, gifting or keeping at your desk.',
    tags: ['pistachio', 'pista', 'salted'],
    badge: 'New',
    isFeatured: true,
    variants: [
      { label: '250g', grams: 250, price: 620, stock: 18 },
      { label: '500g', grams: 500, price: 1180, stock: 10 },
    ],
  },
  {
    name: 'Medjool Dates',
    categorySlug: 'dry-fruits',
    shortDescription: 'Soft, caramel-like dates with natural sweetness.',
    description:
      'Large Medjool dates with a rich, soft texture. A naturally sweet snack that works beautifully in breakfasts, desserts and gift boxes.',
    tags: ['dates', 'khejur', 'natural'],
    badge: 'Natural energy',
    isFeatured: true,
    variants: [
      { label: '500g', grams: 500, price: 650, stock: 22 },
      { label: '1kg', grams: 1000, price: 1200, stock: 15 },
    ],
  },
  {
    name: 'Chia Seeds',
    categorySlug: 'nutritional-foods',
    shortDescription: 'Fibre-rich chia seeds for smoothies and oats.',
    description:
      'Clean chia seeds that absorb liquid and add satisfying texture to smoothies, puddings and breakfast bowls. A simple fibre boost.',
    tags: ['chia', 'seeds', 'fibre'],
    badge: 'Diet friendly',
    isFeatured: false,
    variants: [
      { label: '250g', grams: 250, price: 320, stock: 40 },
      { label: '500g', grams: 500, price: 580, stock: 25 },
    ],
  },
  {
    name: 'Protein Snack Mix',
    categorySlug: 'nutritional-foods',
    shortDescription: 'A balanced mix of nuts, seeds and dried fruit.',
    description:
      'A balanced trail mix built for busy days. Nuts, seeds and dried fruit in one convenient pouch, with no unnecessary fillers.',
    tags: ['protein', 'trail mix', 'gym'],
    badge: 'Gym pick',
    isFeatured: false,
    variants: [
      { label: '200g', grams: 200, price: 420, stock: 30 },
      { label: '500g', grams: 500, price: 950, stock: 18 },
    ],
  },
];

async function seedAdmin(): Promise<string> {
  const email = env.ADMIN_EMAIL ?? 'admin@yaqeen.local';
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
      sku: `${slug}-${variant.grams}g-${index + 1}`.toUpperCase(),
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
        storeName: 'Yaqeen',
        supportPhone: '+8801799573916',
        supportEmail: '',
        bkashMerchantNumber: env.BKASH_MERCHANT_NUMBER ?? '',
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
          whatsapp: 'https://wa.me/8801799573916',
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
    { $set: { supportPhone: '+8801799573916' } },
  );

  await SettingsModel.updateOne(
    {
      key: 'store',
      $or: [
        { 'socialLinks.whatsapp': '' },
        { 'socialLinks.whatsapp': { $exists: false } },
      ],
    },
    { $set: { 'socialLinks.whatsapp': 'https://wa.me/8801799573916' } },
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
