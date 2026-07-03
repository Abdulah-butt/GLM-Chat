import { pino } from 'pino';
import { env, isProduction } from '../../config/env.js';
import { APP_NAME } from '../../config/constants.js';

export const logger = pino({
  name: APP_NAME,
  level: env.LOG_LEVEL,
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'headers.authorization'],
    censor: '[REDACTED]',
  },
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        },
      }),
});
