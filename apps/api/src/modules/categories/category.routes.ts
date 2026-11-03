import { categoryInputSchema, categoryUpdateSchema } from '@yaqeen/shared';
import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  createCategory,
  deleteCategory,
  getCategoryById,
  getCategoryBySlug,
  listCategories,
  updateCategory,
} from './category.service.js';

export const publicCategoryRouter = Router();

publicCategoryRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await listCategories();
    res.json({ items });
  }),
);

publicCategoryRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const category = await getCategoryBySlug(String(req.params.slug));
    res.json({ category });
  }),
);

export const adminCategoryRouter = Router();

adminCategoryRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const items = await listCategories({ includeInactive: true });
    res.json({ items });
  }),
);

adminCategoryRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const category = await getCategoryById(String(req.params.id));
    res.json({ category });
  }),
);

adminCategoryRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = categoryInputSchema.parse(req.body);
    const category = await createCategory(input);
    res.status(201).json({ category });
  }),
);

adminCategoryRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const input = categoryUpdateSchema.parse(req.body);
    const category = await updateCategory(String(req.params.id), input);
    res.json({ category });
  }),
);

adminCategoryRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deleteCategory(String(req.params.id));
    res.status(204).end();
  }),
);
