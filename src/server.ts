import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './infra/logger/logger.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, environment: env.NODE_ENV, model: env.GLM_MODEL },
    'Server started',
  );
  if (env.GLM_API_KEY === '') {
    logger.warn('GLM_API_KEY is not set — the chat endpoint will return 503 until it is configured.');
  }
});

const shutdown = (signal: string): void => {
  logger.info({ signal }, 'Shutting down gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  // Force-exit if connections refuse to drain.
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});
