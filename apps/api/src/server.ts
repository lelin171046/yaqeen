import type { Server } from 'node:http';
import { createApp } from './app.js';
import { connectDatabase, disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';

async function shutdown(server: Server, signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down');

  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });

  await disconnectDatabase();
}

async function main(): Promise<void> {
  await connectDatabase();

  const app = createApp();
  const server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, env: env.NODE_ENV },
      `Yaqeen API listening on http://localhost:${env.PORT}`,
    );
  });

  let shuttingDown = false;

  const handleSignal = (signal: string) => {
    if (shuttingDown) {
      return;
    }
    shuttingDown = true;

    shutdown(server, signal)
      .then(() => process.exit(0))
      .catch((error: unknown) => {
        logger.error({ err: error }, 'Graceful shutdown failed');
        process.exit(1);
      });
  };

  process.on('SIGINT', () => handleSignal('SIGINT'));
  process.on('SIGTERM', () => handleSignal('SIGTERM'));
}

main().catch((error: unknown) => {
  logger.fatal({ err: error }, 'Failed to start Yaqeen API');
  process.exit(1);
});
