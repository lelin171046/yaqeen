import type { LoginInput } from '@yaqeen/shared';
import { AdminModel, type AdminDocument } from '../../models/admin.js';
import { AppError } from '../../utils/app-error.js';
import { verifyPassword } from '../../utils/password.js';
import {
  issueAdminTokens,
  verifyAccessToken,
  verifyRefreshToken,
  type AuthTokens,
} from '../../utils/tokens.js';

export interface SafeAdmin {
  id: string;
  name: string;
  email: string;
  role: string;
  lastLoginAt: string | null;
}

export interface AuthResult {
  admin: SafeAdmin;
  tokens: AuthTokens;
}

export function toSafeAdmin(admin: AdminDocument): SafeAdmin {
  return {
    id: admin._id.toString(),
    name: admin.name,
    email: admin.email,
    role: admin.role,
    lastLoginAt: admin.lastLoginAt?.toISOString() ?? null,
  };
}

export async function loginAdmin(input: LoginInput): Promise<AuthResult> {
  const admin = await AdminModel.findOne({
    email: input.email.toLowerCase(),
  }).select('+passwordHash');

  if (!admin || !admin.isActive) {
    throw AppError.unauthorized('Invalid email or password');
  }

  const passwordMatches = await verifyPassword(input.password, admin.passwordHash);

  if (!passwordMatches) {
    throw AppError.unauthorized('Invalid email or password');
  }

  admin.lastLoginAt = new Date();
  await admin.save();

  return {
    admin: toSafeAdmin(admin),
    tokens: issueAdminTokens(admin),
  };
}

export async function refreshAdminSession(refreshToken: string): Promise<AuthResult> {
  const payload = verifyRefreshToken(refreshToken);
  const admin = await AdminModel.findById(payload.sub);

  if (!admin || !admin.isActive || admin.tokenVersion !== payload.tokenVersion) {
    throw AppError.unauthorized('Your session is no longer valid. Please sign in again.');
  }

  admin.tokenVersion += 1;
  await admin.save();

  return {
    admin: toSafeAdmin(admin),
    tokens: issueAdminTokens(admin),
  };
}

export async function revokeAdminSession(token: string): Promise<void> {
  let payload;

  try {
    payload = verifyRefreshToken(token);
  } catch {
    try {
      payload = verifyAccessToken(token);
    } catch {
      return;
    }
  }

  await AdminModel.updateOne(
    {
      _id: payload.sub,
      tokenVersion: payload.tokenVersion,
    },
    {
      $inc: { tokenVersion: 1 },
    },
  );
}
