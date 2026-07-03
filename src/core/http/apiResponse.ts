import type { Response } from 'express';
import type { ErrorCode } from '../../config/constants.js';
import type { ErrorDetail } from '../errors/AppError.js';

export interface ResponseMeta {
  [key: string]: unknown;
}

export const getResponseRequestId = (res: Response): string => {
  return String(res.getHeader('X-Request-Id') ?? '');
};

export const sendSuccess = <T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T,
  meta?: ResponseMeta,
): void => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta !== undefined ? { meta } : {}),
  });
};

export const sendError = (
  res: Response,
  statusCode: number,
  code: ErrorCode,
  message: string,
  details?: ErrorDetail[],
): void => {
  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
      requestId: getResponseRequestId(res),
    },
  });
};
