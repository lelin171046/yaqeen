import type { Request, RequestHandler } from 'express';
import { AdminModel } from '../models/admin.js';
import { AppError } from '../utils/app-error.js';
import { asyncHandler } from '../utils/async-handler.js';
import { ACCESS_COOKIE } from '../utils/auth-cookies.js';
import { verifyAccessToken } from '../utils/tokens.js';

function extractToken(req: Request): string | null {
  const cookieToken = req.cookies?.[ACCESS_COOKIE] as string | undefined;

  if (cookieToken) {
    return cookieToken;
  }

  const header = req.headers.authorization;

  if (header?.startsWith('Bearer ')) {
    return header.slice('Bearer '.length).trim();
  }

  return null;
}

export const requireAuth: RequestHandler = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);

  if (!token) {
    throw AppError.unauthorized('Sign in required');
  }

  const payload = verifyAccessToken(token);
  const admin = await AdminModel.findById(payload.sub);

  if (!admin || !admin.isActive || admin.tokenVersion !== payload.tokenVersion) {
    throw AppError.unauthorized('Your session is no longer valid. Please sign in again.');
  }

  req.admin = admin;
  next();
});
