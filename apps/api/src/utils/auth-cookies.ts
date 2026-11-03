import type { CookieOptions, Response } from 'express';
import { env } from '../config/env.js';
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  type AuthTokens,
} from './tokens.js';

export const ACCESS_COOKIE = 'yaqeen_access';
export const REFRESH_COOKIE = 'yaqeen_refresh';
export const REFRESH_COOKIE_PATH = '/api/admin/auth';

const baseCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
};

const accessCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  path: '/',
  maxAge: ACCESS_TOKEN_TTL_SECONDS * 1000,
};

const refreshCookieOptions: CookieOptions = {
  ...baseCookieOptions,
  path: REFRESH_COOKIE_PATH,
  maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
};

export function setAuthCookies(res: Response, tokens: AuthTokens): void {
  res.cookie(ACCESS_COOKIE, tokens.accessToken, accessCookieOptions);
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions);
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_COOKIE, {
    ...baseCookieOptions,
    path: '/',
  });
  res.clearCookie(REFRESH_COOKIE, {
    ...baseCookieOptions,
    path: REFRESH_COOKIE_PATH,
  });
}
