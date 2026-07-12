import { PDFDocument } from 'pdf-lib';
import { env } from '../../config/env.js';
import { ERROR_CODES } from '../../config/constants.js';
import { AppError } from '../../core/errors/AppError.js';
import { HTTP_STATUS } from '../../core/http/statusCodes.js';

export interface PdfInfo {
  pageCount: number;
}

const PDF_MAGIC = '%PDF-';

// Structural validation only — content extraction is done by the vision model.
export const validatePdf = async (buffer: Buffer): Promise<PdfInfo> => {
  if (buffer.length === 0) {
    throw new AppError(ERROR_CODES.PDF_EMPTY, 'The uploaded file is empty.', HTTP_STATUS.BAD_REQUEST);
  }

  if (!buffer.subarray(0, 1024).toString('latin1').includes(PDF_MAGIC)) {
    throw new AppError(
      ERROR_CODES.PDF_CORRUPTED,
      'This file does not look like a valid PDF. Please re-export it and try again.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  let document: PDFDocument;
  try {
    document = await PDFDocument.load(new Uint8Array(buffer), { updateMetadata: false });
  } catch (err) {
    if (err instanceof Error && err.constructor.name === 'EncryptedPDFError') {
      throw new AppError(
        ERROR_CODES.PDF_ENCRYPTED,
        'This PDF is password-protected. Please remove the password and upload it again.',
        HTTP_STATUS.BAD_REQUEST,
      );
    }
    throw new AppError(
      ERROR_CODES.PDF_CORRUPTED,
      'This PDF appears to be corrupted and could not be read.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const pageCount = document.getPageCount();

  if (pageCount === 0) {
    throw new AppError(ERROR_CODES.PDF_EMPTY, 'This PDF has no pages.', HTTP_STATUS.BAD_REQUEST);
  }

  if (pageCount > env.DOCTOR_OCR_MAX_PAGES) {
    throw new AppError(
      ERROR_CODES.PDF_TOO_MANY_PAGES,
      `This PDF has ${pageCount} pages. The maximum supported is ${env.DOCTOR_OCR_MAX_PAGES} pages.`,
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return { pageCount };
};
