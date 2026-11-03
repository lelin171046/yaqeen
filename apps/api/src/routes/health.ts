import { Router } from 'express';
import { apiHealthSchema } from '@yaqeen/shared';
import { databaseState } from '../config/db.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const database = databaseState();
  const status = database === 'connected' ? 'ok' : 'degraded';

  res.status(200).json(
    apiHealthSchema.parse({
      status,
      uptime: process.uptime(),
      database,
      timestamp: new Date().toISOString(),
    }),
  );
});
