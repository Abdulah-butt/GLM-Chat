import { Router } from 'express';
import { asyncHandler } from '../../core/errors/asyncHandler.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { chatRateLimit } from '../../middlewares/rateLimit.middleware.js';
import { chatRequestSchema } from './chat.validation.js';
import * as chatController from './chat.controller.js';

const router = Router();

router.post('/', chatRateLimit, validate(chatRequestSchema), asyncHandler(chatController.sendMessage));

export const chatRoutes = router;
