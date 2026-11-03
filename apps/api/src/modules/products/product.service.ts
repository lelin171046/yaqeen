import type {
  ProductInput,
  ProductQueryInput,
  ProductUpdateInput,
  ProductVariantInput,
} from '@yaqeen/shared';
import { Types, type QueryFilter } from 'mongoose';
import { CategoryModel } from '../../models/category.js';
import { ProductModel, type Product } from '../../models/product.js';
import { AppError } from '../../utils/app-error.js';
import { ensureUniqueSlug } from '../../utils/slug.js';

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function slugIsTaken(slug: string, excludeId?: string): Promise<boolean> {
  const filter: Record<string, unknown> = { slug };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  return Boolean(await ProductModel.exists(filter));
}

function buildVariantSku(slug: string, variant: ProductVariantInput, index: number): string {
  const suffix = variant.grams ? `${variant.grams}g` : variant.label;
  return `${slug}-${suffix}-${index + 1}`
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function normalizeVariants(slug: string, variants: ProductVariantInput[]) {
  const seenSkus = new Set<string>();

  return variants.map((variant, index) => {
    if (
      variant.compareAtPrice !== undefined &&
      variant.compareAtPrice > 0 &&
      variant.compareAtPrice <= variant.price
    ) {
      throw AppError.badRequest(
        `Compare-at price for "${variant.label}" must be higher than the selling price`,
      );
    }

    const sku = (variant.sku?.trim() || buildVariantSku(slug, variant, index)).toUpperCase();

    if (seenSkus.has(sku)) {
      throw AppError.badRequest(`Duplicate SKU: ${sku}`);
    }

    seenSkus.add(sku);

    return {
      label: variant.label,
      grams: variant.grams,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
      stock: variant.stock,
      sku,
    };
  });
}

function computePricing(variants: Array<{ price: number; stock: number }>) {
  return {
    basePrice: Math.min(...variants.map((variant) => variant.price)),
    totalStock: variants.reduce((sum, variant) => sum + variant.stock, 0),
  };
}

async function assertSkuAvailable(
  variants: Array<{ sku: string }>,
  excludeId?: string,
): Promise<void> {
  const skus = variants.map((variant) => variant.sku);
  const filter: QueryFilter<Product> = {
    'variants.sku': { $in: skus },
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const clash = await ProductModel.findOne(filter).select('name variants.sku').lean();

  if (clash) {
    const clashingSku = clash.variants.find((variant) => skus.includes(variant.sku))?.sku;
    throw AppError.conflict(
      `SKU ${clashingSku ?? skus[0]} is already used by "${clash.name}"`,
    );
  }
}

async function assertCategoryExists(categoryId: string): Promise<void> {
  const exists = await CategoryModel.exists({ _id: categoryId });

  if (!exists) {
    throw AppError.badRequest('Category not found');
  }
}

const emptyPage = (input: ProductQueryInput) => ({
  items: [],
  pagination: {
    page: input.page,
    limit: input.limit,
    total: 0,
    pages: 0,
  },
});

export async function listProducts(
  input: ProductQueryInput,
  options: { includeInactive?: boolean } = {},
) {
  const filter: QueryFilter<Product> = {};

  if (options.includeInactive) {
    if (input.active !== undefined) {
      filter.isActive = input.active;
    }
  } else {
    filter.isActive = true;
  }

  if (input.featured !== undefined) {
    filter.isFeatured = input.featured;
  }

  if (input.search) {
    const regex = new RegExp(escapeRegex(input.search), 'i');
    filter.$or = [
      { name: regex },
      { shortDescription: regex },
      { tags: regex },
    ];
  }

  if (input.category) {
    const category = Types.ObjectId.isValid(input.category)
      ? await CategoryModel.findOne({
          $or: [
            { slug: input.category.toLowerCase() },
            { _id: new Types.ObjectId(input.category) },
          ],
        })
          .select('_id')
          .lean()
      : await CategoryModel.findOne({ slug: input.category.toLowerCase() })
          .select('_id')
          .lean();

    if (!category) {
      return emptyPage(input);
    }

    filter.category = category._id;
  }

  if (input.minPrice !== undefined || input.maxPrice !== undefined) {
    const priceFilter: Record<string, number> = {};

    if (input.minPrice !== undefined) {
      priceFilter.$gte = input.minPrice;
    }

    if (input.maxPrice !== undefined) {
      priceFilter.$lte = input.maxPrice;
    }

    filter.basePrice = priceFilter;
  }

  const sortMap: Record<ProductQueryInput['sort'], Record<string, 1 | -1>> = {
    newest: { createdAt: -1 },
    price_asc: { basePrice: 1 },
    price_desc: { basePrice: -1 },
    name_asc: { name: 1 },
  };

  const skip = (input.page - 1) * input.limit;

  const [items, total] = await Promise.all([
    ProductModel.find(filter)
      .populate('category', 'name slug')
      .sort(sortMap[input.sort])
      .skip(skip)
      .limit(input.limit)
      .lean(),
    ProductModel.countDocuments(filter),
  ]);

  return {
    items,
    pagination: {
      page: input.page,
      limit: input.limit,
      total,
      pages: Math.ceil(total / input.limit),
    },
  };
}

export async function getProductBySlug(slug: string, includeInactive = false) {
  const product = await ProductModel.findOne({
    slug: slug.toLowerCase(),
    ...(includeInactive ? {} : { isActive: true }),
  })
    .populate('category', 'name slug')
    .lean();

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  return product;
}

export async function getProductById(id: string) {
  const product = await ProductModel.findById(id)
    .populate('category', 'name slug')
    .lean();

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  return product;
}

export async function createProduct(input: ProductInput) {
  await assertCategoryExists(input.categoryId);

  const slug = await ensureUniqueSlug(input.slug ?? input.name, (candidate) =>
    slugIsTaken(candidate),
  );

  const variants = normalizeVariants(slug, input.variants);
  await assertSkuAvailable(variants);
  const pricing = computePricing(variants);

  return ProductModel.create({
    name: input.name,
    slug,
    description: input.description,
    shortDescription: input.shortDescription ?? '',
    category: input.categoryId,
    images: input.images,
    video: input.video ?? '',
    tags: input.tags,
    ingredients: input.ingredients ?? '',
    nutrition: input.nutrition ?? undefined,
    variants,
    ...pricing,
    isFeatured: input.isFeatured,
    isActive: input.isActive,
    badge: input.badge ?? '',
    seo: input.seo ?? undefined,
  });
}

export async function updateProduct(id: string, input: ProductUpdateInput) {
  const product = await ProductModel.findById(id);

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  if (input.categoryId) {
    await assertCategoryExists(input.categoryId);
  }

  const updates: Record<string, unknown> = {};

  if (input.categoryId !== undefined) {
    updates.category = input.categoryId;
  }

  if (input.name !== undefined) {
    updates.name = input.name;
  }

  if (input.description !== undefined) {
    updates.description = input.description;
  }

  if (input.shortDescription !== undefined) {
    updates.shortDescription = input.shortDescription;
  }

  if (input.images !== undefined) {
    updates.images = input.images;
  }

  if (input.video !== undefined) {
    updates.video = input.video;
  }

  if (input.tags !== undefined) {
    updates.tags = input.tags;
  }

  if (input.ingredients !== undefined) {
    updates.ingredients = input.ingredients;
  }

  if (input.nutrition !== undefined) {
    updates.nutrition = input.nutrition;
  }

  if (input.isFeatured !== undefined) {
    updates.isFeatured = input.isFeatured;
  }

  if (input.isActive !== undefined) {
    updates.isActive = input.isActive;
  }

  if (input.badge !== undefined) {
    updates.badge = input.badge;
  }

  if (input.seo !== undefined) {
    updates.seo = input.seo;
  }

  let nextSlug = product.slug;

  if (input.slug && input.slug !== product.slug) {
    if (await slugIsTaken(input.slug, id)) {
      throw AppError.conflict('A product with this slug already exists');
    }
    nextSlug = input.slug;
  } else if (input.name && input.name !== product.name && !input.slug) {
    nextSlug = await ensureUniqueSlug(input.name, (candidate) =>
      slugIsTaken(candidate, id),
    );
  }

  if (nextSlug !== product.slug) {
    updates.slug = nextSlug;
  }

  if (input.variants) {
    const variants = normalizeVariants(nextSlug, input.variants);
    await assertSkuAvailable(variants, id);

    updates.variants = variants;
    Object.assign(updates, computePricing(variants));
  }

  product.set(updates);
  await product.save();

  return product;
}

export async function deleteProduct(id: string) {
  const product = await ProductModel.findById(id);

  if (!product) {
    throw AppError.notFound('Product not found');
  }

  product.isActive = false;
  await product.save();

  return product;
}
