import {
  productInputSchema,
  productQuerySchema,
  productUpdateSchema,
} from '@yaqeen/shared';
import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProductBySlug,
  listProducts,
  updateProduct,
} from './product.service.js';

export const publicProductRouter = Router();

publicProductRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = productQuerySchema.parse(req.query);
    const result = await listProducts(query);
    res.json(result);
  }),
);

publicProductRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const product = await getProductBySlug(String(req.params.slug));
    res.json({ product });
  }),
);

export const adminProductRouter = Router();

adminProductRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = productQuerySchema.parse(req.query);
    const result = await listProducts(query, { includeInactive: true });
    res.json(result);
  }),
);

adminProductRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const product = await getProductById(String(req.params.id));
    res.json({ product });
  }),
);

adminProductRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const input = productInputSchema.parse(req.body);
    const product = await createProduct(input);
    res.status(201).json({ product });
  }),
);

adminProductRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const input = productUpdateSchema.parse(req.body);
    const product = await updateProduct(String(req.params.id), input);
    res.json({ product });
  }),
);

adminProductRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    await deleteProduct(String(req.params.id));
    res.status(204).end();
  }),
);
