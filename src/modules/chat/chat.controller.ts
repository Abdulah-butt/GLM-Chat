import type { Request, Response } from 'express';
import { sendSuccess } from '../../core/http/apiResponse.js';
import { HTTP_STATUS } from '../../core/http/statusCodes.js';
import { getRequestId } from '../../middlewares/requestId.middleware.js';
import * as chatService from './chat.service.js';
import type { ChatRequestDto } from './chat.dto.js';

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  const result = await chatService.sendChatMessage(req.body as ChatRequestDto, getRequestId(req));
  sendSuccess(res, HTTP_STATUS.OK, 'Reply generated successfully.', result);
};
