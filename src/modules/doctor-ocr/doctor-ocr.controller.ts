import type { Request, Response } from 'express';
import { sendSuccess } from '../../core/http/apiResponse.js';
import { HTTP_STATUS } from '../../core/http/statusCodes.js';
import { ERROR_CODES } from '../../config/constants.js';
import { AppError } from '../../core/errors/AppError.js';
import { getRequestId } from '../../middlewares/requestId.middleware.js';
import { sanitizeFileName } from '../../middlewares/upload.middleware.js';
import * as doctorOcrService from './doctor-ocr.service.js';

export const analyze = async (req: Request, res: Response): Promise<void> => {
  if (req.file === undefined) {
    throw new AppError(
      ERROR_CODES.FILE_MISSING,
      'Please attach a PDF report in the "report" field.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const result = await doctorOcrService.analyzeReport(
    { fileName: sanitizeFileName(req.file.originalname), buffer: req.file.buffer },
    getRequestId(req),
  );

  sendSuccess(res, HTTP_STATUS.OK, 'Report analyzed successfully.', result);
};
