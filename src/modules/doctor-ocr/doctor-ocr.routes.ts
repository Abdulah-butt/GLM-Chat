import { Router } from 'express';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { uploadPdf } from '../../middlewares/upload.middleware.js';
import { doctorOcrRateLimit } from '../../middlewares/rateLimit.middleware.js';
import * as doctorOcrController from './doctor-ocr.controller.js';

const router = Router();

router.post('/analyze', doctorOcrRateLimit, uploadPdf('report'), asyncHandler(doctorOcrController.analyze));

export const doctorOcrRoutes = router;
