import type { CategoryInput, CategoryUpdateInput } from '@yaqeen/shared';
import { CategoryModel } from '../../models/category.js';
import { ProductModel } from '../../models/product.js';
import { AppError } from '../../utils/app-error.js';
import { ensureUniqueSlug } from '../../utils/slug.js';

async function slugIsTaken(slug: string, excludeId?: string): Promise<boolean> {
  const filter: Record<string, unknown> = { slug };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  return Boolean(await CategoryModel.exists(filter));
}

export async function listCategories(options: { includeInactive?: boolean } = {}) {
  const filter = options.includeInactive ? {} : { isActive: true };

  return CategoryModel.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
}

export async function getCategoryBySlug(slug: string, includeInactive = false) {
  const category = await CategoryModel.findOne({
    slug: slug.toLowerCase(),
    ...(includeInactive ? {} : { isActive: true }),
  }).lean();

  if (!category) {
    throw AppError.notFound('Category not found');
  }

  return category;
}

export async function getCategoryById(id: string) {
  const category = await CategoryModel.findById(id).lean();

  if (!category) {
    throw AppError.notFound('Category not found');
  }

  return category;
}

export async function createCategory(input: CategoryInput) {
  const slug = await ensureUniqueSlug(input.slug ?? input.name, (candidate) =>
    slugIsTaken(candidate),
  );

  return CategoryModel.create({
    name: input.name,
    slug,
    description: input.description ?? '',
    image: input.image ?? '',
    sortOrder: input.sortOrder,
    isActive: input.isActive,
  });
}

export async function updateCategory(id: string, input: CategoryUpdateInput) {
  const category = await CategoryModel.findById(id);

  if (!category) {
    throw AppError.notFound('Category not found');
  }

  if (input.name !== undefined) {
    category.name = input.name;
  }

  if (input.description !== undefined) {
    category.description = input.description;
  }

  if (input.image !== undefined) {
    category.image = input.image;
  }

  if (input.sortOrder !== undefined) {
    category.sortOrder = input.sortOrder;
  }

  if (input.isActive !== undefined) {
    category.isActive = input.isActive;
  }

  if (input.slug && input.slug !== category.slug) {
    if (await slugIsTaken(input.slug, id)) {
      throw AppError.conflict('A category with this slug already exists');
    }
    category.slug = input.slug;
  } else if (input.name && input.name !== category.name && !input.slug) {
    category.slug = await ensureUniqueSlug(input.name, (candidate) => slugIsTaken(candidate, id));
  }

  await category.save();
  return category;
}

export async function deleteCategory(id: string): Promise<void> {
  const category = await CategoryModel.findById(id);

  if (!category) {
    throw AppError.notFound('Category not found');
  }

  const productCount = await ProductModel.countDocuments({ category: category._id });

  if (productCount > 0) {
    throw AppError.conflict(
      'This category still has products. Move or remove them before deleting it.',
    );
  }

  await category.deleteOne();
}
