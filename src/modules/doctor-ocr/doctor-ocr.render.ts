import * as mupdf from 'mupdf';
import { ERROR_CODES } from '../../config/constants.js';
import { AppError } from '../../core/errors/AppError.js';
import { HTTP_STATUS } from '../../core/http/statusCodes.js';

// GLM-4.6V only reads a PDF's text layer through `file_url`, so scanned or
// photographed reports (no text layer) come back as garbage. Rendering each
// page to an image and sending it as `image_url` is what the vision model is
// actually built for and works for both digital and scanned PDFs.
// 120 DPI JPEG keeps lab text sharp while staying small (~25-40KB/page) so the
// upload and vision-encoding stay fast.
const RENDER_DPI = 120;
const RENDER_SCALE = RENDER_DPI / 72;
const JPEG_QUALITY = 80;

export interface RenderedPage {
  page: number;
  dataUrl: string;
}

export const renderPdfToImages = (buffer: Buffer, maxPages: number): RenderedPage[] => {
  let document: mupdf.PDFDocument | mupdf.Document;
  try {
    document = mupdf.Document.openDocument(new Uint8Array(buffer), 'application/pdf');
  } catch {
    throw new AppError(
      ERROR_CODES.PDF_CORRUPTED,
      'This PDF could not be read for analysis. Please re-export it and try again.',
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  try {
    const total = Math.min(document.countPages(), maxPages);
    const pages: RenderedPage[] = [];
    const matrix = mupdf.Matrix.scale(RENDER_SCALE, RENDER_SCALE);

    for (let index = 0; index < total; index++) {
      const page = document.loadPage(index);
      const pixmap = page.toPixmap(matrix, mupdf.ColorSpace.DeviceRGB, false, true);
      const jpeg = pixmap.asJPEG(JPEG_QUALITY, false);
      pages.push({
        page: index + 1,
        dataUrl: `data:image/jpeg;base64,${Buffer.from(jpeg).toString('base64')}`,
      });
      pixmap.destroy();
      page.destroy();
    }

    return pages;
  } finally {
    document.destroy();
  }
};
