import { env } from '../../config/env.js';
import { CHAT_HISTORY_LIMIT, ERROR_CODES } from '../../config/constants.js';
import { AppError } from '../../core/errors/AppError.js';
import { HTTP_STATUS } from '../../core/http/statusCodes.js';
import { createChatCompletion, type GlmChatMessage } from '../../infra/glm/glmClient.js';
import type { ChatRequestDto, ChatResponseDto } from './chat.dto.js';

const SYSTEM_PROMPT =
  'You are a helpful, concise AI assistant. Answer clearly and directly. Use plain text.';

export const sendChatMessage = async (
  dto: ChatRequestDto,
  requestId: string,
): Promise<ChatResponseDto> => {
  if (env.GLM_API_KEY === '') {
    throw new AppError(
      ERROR_CODES.CHAT_NOT_CONFIGURED,
      'The chat service is not configured yet. Please try again later.',
      HTTP_STATUS.SERVICE_UNAVAILABLE,
    );
  }

  // The server owns the system prompt — client-supplied system messages are dropped.
  const history: GlmChatMessage[] = dto.messages
    .filter((message) => message.role !== 'system')
    .slice(-CHAT_HISTORY_LIMIT);

  const result = await createChatCompletion(
    [{ role: 'system', content: SYSTEM_PROMPT }, ...history],
    requestId,
  );

  return {
    reply: { role: 'assistant', content: result.content },
    model: result.model,
    ...(result.usage !== undefined ? { usage: result.usage } : {}),
  };
};
