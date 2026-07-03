import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from './AppError.js';
import { sendError } from '../http/apiResponse.js';
import { HTTP_STATUS } from '../http/statusCodes.js';
import { ERROR_CODES } from '../../config/constants.js';
import { logger } from '../../infra/logger/logger.js';

export const notFoundHandler: RequestHandler = (_req, res) => {
  sendError(res, HTTP_STATUS.NOT_FOUND, ERROR_CODES.NOT_FOUND, 'We could not find that endpoint.');
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const requestId = String(req.headers['x-request-id'] ?? '');

  if (res.headersSent) {
    logger.error({ requestId, err }, 'Error after headers were sent');
    return;
  }

  if (err instanceof AppError) {
    logger.warn({ requestId, code: err.code, statusCode: err.statusCode }, err.message);
    sendError(res, err.statusCode, err.code, err.message, err.details);
    return;
  }

  // Malformed JSON body from express.json()
  if (err instanceof SyntaxError && 'body' in err) {
    sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      'The request body is not valid JSON.',
    );
    return;
  }

  // Body exceeded the configured size limit
  if (isHttpError(err) && err.status === 413) {
    sendError(
      res,
      HTTP_STATUS.BAD_REQUEST,
      ERROR_CODES.VALIDATION_ERROR,
      'The request body is too large.',
    );
    return;
  }

  logger.error({ requestId, err }, 'Unhandled error');
  sendError(
    res,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    ERROR_CODES.INTERNAL_ERROR,
    'Something went wrong on our end. Please try again.',
  );
};

const isHttpError = (err: unknown): err is { status: number } => {
  return typeof err === 'object' && err !== null && typeof (err as { status?: unknown }).status === 'number';
};
