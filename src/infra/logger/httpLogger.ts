import { pinoHttp } from 'pino-http';
import { logger } from './logger.js';

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => String(req.headers['x-request-id'] ?? ''),
  autoLogging: {
    ignore: (req) => req.url === '/health',
  },
  customLogLevel: (_req, res, err) => {
    if (err !== undefined || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});
