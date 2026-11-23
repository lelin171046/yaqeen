import mongoose from 'mongoose';
import { env, requireMongoUri, resolveMongoUri } from './env.js';
import { logger } from './logger.js';

export type DatabaseState =
  'connected' | 'connecting' | 'disconnected' | 'disconnecting' | 'unconfigured';

export function isDatabaseConfigured(): boolean {
  return Boolean(resolveMongoUri(env));
}

export function databaseState(): DatabaseState {
  if (!isDatabaseConfigured()) {
    return 'unconfigured';
  }

  switch (mongoose.connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    default:
      return 'disconnected';
  }
}

export async function connectDatabase(): Promise<void> {
  if (!resolveMongoUri(env)) {
    logger.warn('No MongoDB URI set. API is running without a database connection.');
    return;
  }

  const uri = requireMongoUri(env);

  logger.info(
    { mode: env.NODE_ENV === 'production' ? 'production' : 'local' },
    'MongoDB connection mode selected',
  );

  mongoose.connection.on('connected', () => {
    logger.info({ host: mongoose.connection.host }, 'MongoDB connected');
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (error) => {
    logger.error({ err: error }, 'MongoDB connection error');
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10_000,
  });
}

export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 0) {
    return;
  }

  await mongoose.disconnect();
  logger.info('MongoDB connection closed');
}
