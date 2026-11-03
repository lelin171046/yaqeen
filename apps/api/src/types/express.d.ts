import type { AdminDocument } from '../models/admin.js';

declare global {
  namespace Express {
    interface Request {
      admin?: AdminDocument;
    }
  }
}

export {};
