import { Router } from 'express';
import { requireAuth } from '../middleware/require-auth.js';
import { authRouter } from '../modules/auth/auth.routes.js';
import { adminCategoryRouter, publicCategoryRouter } from '../modules/categories/category.routes.js';
import { adminDashboardRouter } from '../modules/dashboard/dashboard.routes.js';
import { adminLinkRouter, publicLinkRouter } from '../modules/links/link.routes.js';
import { adminOrderRouter, publicOrderRouter } from '../modules/orders/order.routes.js';
import { adminProductRouter, publicProductRouter } from '../modules/products/product.routes.js';
import {
  adminSettingsRouter,
  publicSettingsRouter,
} from '../modules/settings/settings.routes.js';
import { uploadRouter } from '../modules/uploads/upload.routes.js';
import { healthRouter } from './health.js';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/categories', publicCategoryRouter);
apiRouter.use('/products', publicProductRouter);
apiRouter.use('/orders', publicOrderRouter);
apiRouter.use('/settings', publicSettingsRouter);
apiRouter.use('/links', publicLinkRouter);

export const adminApiRouter = Router();

adminApiRouter.use('/auth', authRouter);
adminApiRouter.use('/dashboard', requireAuth, adminDashboardRouter);
adminApiRouter.use('/categories', requireAuth, adminCategoryRouter);
adminApiRouter.use('/products', requireAuth, adminProductRouter);
adminApiRouter.use('/orders', requireAuth, adminOrderRouter);
adminApiRouter.use('/links', requireAuth, adminLinkRouter);
adminApiRouter.use('/settings', requireAuth, adminSettingsRouter);
adminApiRouter.use('/uploads', requireAuth, uploadRouter);
