import { loginSchema } from '@yaqeen/shared';
import { Router } from 'express';
import { loginRateLimiter } from '../../middleware/rate-limit.js';
import { requireAuth } from '../../middleware/require-auth.js';
import { AppError } from '../../utils/app-error.js';
import { asyncHandler } from '../../utils/async-handler.js';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearAuthCookies,
  setAuthCookies,
} from '../../utils/auth-cookies.js';
import {
  loginAdmin,
  refreshAdminSession,
  revokeAdminSession,
  toSafeAdmin,
} from './auth.service.js';

export const authRouter = Router();

authRouter.post(
  '/login',
  loginRateLimiter,
  asyncHandler(async (req, res) => {
    const input = loginSchema.parse(req.body);
    const result = await loginAdmin(input);

    setAuthCookies(res, result.tokens);
    res.json({ admin: result.admin });
  }),
);

authRouter.post(
  '/refresh',
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE] as string | undefined;

    if (!refreshToken) {
      throw AppError.unauthorized('Refresh token missing');
    }

    const result = await refreshAdminSession(refreshToken);

    setAuthCookies(res, result.tokens);
    res.json({ admin: result.admin });
  }),
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    const token = (req.cookies?.[REFRESH_COOKIE] ?? req.cookies?.[ACCESS_COOKIE]) as
      | string
      | undefined;

    if (token) {
      await revokeAdminSession(token);
    }

    clearAuthCookies(res);
    res.status(204).end();
  }),
);

authRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (!req.admin) {
      throw AppError.unauthorized();
    }

    res.json({ admin: toSafeAdmin(req.admin) });
  }),
);
