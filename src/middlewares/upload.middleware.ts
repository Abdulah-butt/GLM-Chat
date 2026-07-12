import multer, { MulterError } from 'multer';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import path from 'node:path';
import { env } from '../config/env.js';
import { ERROR_CODES } from '../config/constants.js';
import { AppError } from '../core/errors/AppError.js';
import { HTTP_STATUS } from '../core/http/statusCodes.js';

const MAX_FILE_BYTES = Math.round(env.DOCTOR_OCR_MAX_FILE_MB * 1024 * 1024);

// Memory storage only: medical files are never written to disk, so there are
// no temp files to clean up and nothing persists after the request ends.
const pdfUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    if (file.mimetype !== 'application/pdf' || extension !== '.pdf') {
      callback(
        new AppError(
          ERROR_CODES.INVALID_FILE_TYPE,
          'Only PDF files are supported. Please upload your report as a PDF.',
          HTTP_STATUS.BAD_REQUEST,
        ),
      );
      return;
    }
    callback(null, true);
  },
});

export const uploadPdf = (field: string): RequestHandler => {
  const handler = pdfUpload.single(field);
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, (err: unknown) => {
      if (err instanceof MulterError && err.code === 'LIMIT_FILE_SIZE') {
        next(
          new AppError(
            ERROR_CODES.FILE_TOO_LARGE,
            `The file is too large. The maximum size is ${env.DOCTOR_OCR_MAX_FILE_MB} MB.`,
            HTTP_STATUS.BAD_REQUEST,
          ),
        );
        return;
      }
      next(err);
    });
  };
};

export const sanitizeFileName = (name: string): string => {
  const base = path.basename(name).replace(/[^\w.\- ()]/g, '_');
  return base.slice(0, 120) || 'report.pdf';
};
