import type { RequestHandler } from 'express';
import { AppError } from '../utils/app-error.js';

export const requireOwner: RequestHandler = (req, _res, next) => {
  if (req.admin?.role !== 'OWNER') {
    next(AppError.forbidden('Only the store owner can use this action.'));
    return;
  }

  next();
};
