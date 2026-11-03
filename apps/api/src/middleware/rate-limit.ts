import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
  message: {
    message: 'Too many login attempts. Try again in a few minutes.',
    code: 'TOO_MANY_REQUESTS',
  },
});
