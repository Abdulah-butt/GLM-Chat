import type { NextFunction, Request, RequestHandler, Response } from 'express';
import type { ZodSchema } from 'zod';
import { sendError } from '../core/http/apiResponse.js';
import { HTTP_STATUS } from '../core/http/statusCodes.js';
import { ERROR_CODES } from '../config/constants.js';

export const validate = (schema: ZodSchema): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'body',
        message: issue.message,
      }));
      sendError(
        res,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ERROR,
        'Please check the highlighted fields and try again.',
        details,
      );
      return;
    }

    req.body = result.data;
    next();
  };
};

// Express 5 exposes req.query as a getter, so validated values go to res.locals.query.
export const validateQuery = (schema: ZodSchema): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || 'query',
        message: issue.message,
      }));
      sendError(
        res,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        ERROR_CODES.VALIDATION_ERROR,
        'Please check the highlighted fields and try again.',
        details,
      );
      return;
    }

    res.locals['query'] = result.data;
    next();
  };
};
