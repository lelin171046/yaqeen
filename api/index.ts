import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { createApp } from '../apps/api/dist/app.js';

const app = createApp();

interface MongooseCache {
  connection: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const globalWithMongoose = globalThis as typeof globalThis & {
  __yaqeenMongoose?: MongooseCache;
};

const cached = (globalWithMongoose.__yaqeenMongoose ??= {
  connection: null,
  promise: null,
});

async function connectDatabase(): Promise<typeof mongoose> {
  if (cached.connection) {
    return cached.connection;
  }

  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not configured');
  }

  cached.promise ??= mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });

  cached.connection = await cached.promise;
  return cached.connection;
}

export default async function handler(req: Request, res: Response) {
  try {
    await connectDatabase();
  } catch {
    res.statusCode = 503;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        error: 'Database unavailable',
        code: 'DATABASE_UNAVAILABLE',
      }),
    );
    return;
  }

  return app(req, res);
}
