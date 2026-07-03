import type { Request, Response } from 'express';
import { sendSuccess } from '../../core/http/apiResponse.js';
import { HTTP_STATUS } from '../../core/http/statusCodes.js';
import { env } from '../../config/env.js';

export const getHealth = (_req: Request, res: Response): void => {
  sendSuccess(res, HTTP_STATUS.OK, 'Service is healthy.', {
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
};
