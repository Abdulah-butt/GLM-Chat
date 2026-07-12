import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import { env } from '../config/env.js';
import { ERROR_CODES } from '../config/constants.js';
import { HTTP_STATUS } from '../core/http/statusCodes.js';
import { sendError } from '../core/http/apiResponse.js';
import { logger } from '../infra/logger/logger.js';

interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message: string;
}

const createRateLimiter = (options: RateLimiterOptions): RateLimitRequestHandler => {
  return rateLimit({
    windowMs: options.windowMs,
    limit: options.max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(
        { requestId: String(req.headers['x-request-id'] ?? ''), ip: req.ip, path: req.path },
        'Rate limit exceeded',
      );
      res.setHeader('Retry-After', Math.ceil(options.windowMs / 1000));
      sendError(res, HTTP_STATUS.TOO_MANY_REQUESTS, ERROR_CODES.RATE_LIMIT_EXCEEDED, options.message);
    },
  });
};

export const apiRateLimit = createRateLimiter({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: 'Too many requests. Please try again in a few minutes.',
});

export const chatRateLimit = createRateLimiter({
  windowMs: env.CHAT_RATE_LIMIT_WINDOW_MS,
  max: env.CHAT_RATE_LIMIT_MAX,
  message: 'Too many messages. Please wait a moment before sending more.',
});

export const doctorOcrRateLimit = createRateLimiter({
  windowMs: env.DOCTOR_OCR_RATE_LIMIT_WINDOW_MS,
  max: env.DOCTOR_OCR_RATE_LIMIT_MAX,
  message: 'Too many reports analyzed recently. Please wait a few minutes and try again.',
});
