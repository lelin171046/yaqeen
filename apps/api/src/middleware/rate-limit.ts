import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env.js';

const sharedOptions = {
  standardHeaders: 'draft-8' as const,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test',
};

export const loginRateLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    message: 'Too many login attempts. Try again in a few minutes.',
    code: 'TOO_MANY_REQUESTS',
  },
});

export const supportRateLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: {
    message: 'You have sent several messages. Please try again in a few minutes.',
    code: 'TOO_MANY_REQUESTS',
  },
});

export const testEmailRateLimiter = rateLimit({
  ...sharedOptions,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  message: {
    message: 'Too many test emails. Try again in a few minutes.',
    code: 'TOO_MANY_REQUESTS',
  },
});
