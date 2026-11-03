import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { Types } from 'mongoose';
import { env } from '../config/env.js';
import { AppError } from './app-error.js';

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const ISSUER = 'yaqeen-api';
const AUDIENCE = 'yaqeen-admin';

type TokenType = 'access' | 'refresh';

interface AdminTokenPayload extends JwtPayload {
  sub: string;
  role: string;
  tokenVersion: number;
  type: TokenType;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AdminTokenSource {
  _id: Types.ObjectId;
  role: string;
  tokenVersion: number;
}

function signToken(
  admin: AdminTokenSource,
  type: TokenType,
  secret: string,
  expiresIn: number,
): string {
  return jwt.sign(
    {
      sub: admin._id.toString(),
      role: admin.role,
      tokenVersion: admin.tokenVersion,
      type,
    },
    secret,
    {
      expiresIn,
      issuer: ISSUER,
      audience: AUDIENCE,
    },
  );
}

export function issueAdminTokens(admin: AdminTokenSource): AuthTokens {
  return {
    accessToken: signToken(
      admin,
      'access',
      env.JWT_ACCESS_SECRET,
      ACCESS_TOKEN_TTL_SECONDS,
    ),
    refreshToken: signToken(
      admin,
      'refresh',
      env.JWT_REFRESH_SECRET,
      REFRESH_TOKEN_TTL_SECONDS,
    ),
  };
}

function verifyToken(token: string, secret: string, expectedType: TokenType): AdminTokenPayload {
  try {
    const decoded = jwt.verify(token, secret, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if (
      typeof decoded === 'string' ||
      decoded.type !== expectedType ||
      typeof decoded.sub !== 'string' ||
      typeof decoded.role !== 'string' ||
      typeof decoded.tokenVersion !== 'number'
    ) {
      throw new Error('Invalid token payload');
    }

    return decoded as AdminTokenPayload;
  } catch {
    throw AppError.unauthorized('Your session has expired. Please sign in again.');
  }
}

export function verifyAccessToken(token: string): AdminTokenPayload {
  return verifyToken(token, env.JWT_ACCESS_SECRET, 'access');
}

export function verifyRefreshToken(token: string): AdminTokenPayload {
  return verifyToken(token, env.JWT_REFRESH_SECRET, 'refresh');
}
