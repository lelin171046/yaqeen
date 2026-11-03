import { dashboardQuerySchema } from '@yaqeen/shared';
import { Router } from 'express';
import { asyncHandler } from '../../utils/async-handler.js';
import { getDashboardSummary } from './dashboard.service.js';

export const adminDashboardRouter = Router();

adminDashboardRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = dashboardQuerySchema.parse(req.query);
    const summary = await getDashboardSummary(query.range);
    res.json(summary);
  }),
);
