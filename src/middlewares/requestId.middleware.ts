import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, RequestHandler, Response } from 'express';

// Always generate the ID server-side — never trust a client-supplied X-Request-Id.
export const requestId: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  const id = `req_${randomUUID()}`;
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-Id', id);
  next();
};

export const getRequestId = (req: Request): string => {
  return String(req.headers['x-request-id'] ?? '');
};
