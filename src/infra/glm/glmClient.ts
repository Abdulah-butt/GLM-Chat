import { env } from '../../config/env.js';
import { ERROR_CODES, GLM_REQUEST_TIMEOUT_MS } from '../../config/constants.js';
import { AppError } from '../../core/errors/AppError.js';
import { HTTP_STATUS } from '../../core/http/statusCodes.js';
import { logger } from '../logger/logger.js';

export interface GlmChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GlmUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface GlmChatResult {
  content: string;
  model: string;
  usage?: GlmUsage;
}

interface GlmApiResponse {
  model?: string;
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

const UPSTREAM_UNAVAILABLE_MESSAGE = 'The AI service is temporarily unavailable. Please try again.';

export const createChatCompletion = async (
  messages: GlmChatMessage[],
  requestId: string,
): Promise<GlmChatResult> => {
  let response: globalThis.Response;

  try {
    response = await fetch(`${env.GLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GLM_API_KEY}`,
      },
      body: JSON.stringify({ model: env.GLM_MODEL, messages, stream: false }),
      signal: AbortSignal.timeout(GLM_REQUEST_TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
      logger.error({ requestId }, 'GLM API request timed out');
      throw new AppError(
        ERROR_CODES.GLM_TIMEOUT,
        'The AI service took too long to respond. Please try again.',
        HTTP_STATUS.GATEWAY_TIMEOUT,
      );
    }
    logger.error({ requestId, err }, 'GLM API request failed to send');
    throw new AppError(ERROR_CODES.GLM_API_ERROR, UPSTREAM_UNAVAILABLE_MESSAGE, HTTP_STATUS.BAD_GATEWAY);
  }

  if (!response.ok) {
    const upstreamBody = await response.text().catch(() => '');
    logger.error(
      { requestId, upstreamStatus: response.status, upstreamBody: upstreamBody.slice(0, 500) },
      'GLM API returned an error response',
    );
    if (response.status === HTTP_STATUS.TOO_MANY_REQUESTS) {
      throw new AppError(
        ERROR_CODES.GLM_RATE_LIMITED,
        'The AI service is busy right now. Please try again in a moment.',
        HTTP_STATUS.SERVICE_UNAVAILABLE,
      );
    }
    throw new AppError(ERROR_CODES.GLM_API_ERROR, UPSTREAM_UNAVAILABLE_MESSAGE, HTTP_STATUS.BAD_GATEWAY);
  }

  const payload = (await response.json().catch(() => null)) as GlmApiResponse | null;
  const content = payload?.choices?.[0]?.message?.content;

  if (typeof content !== 'string' || content.length === 0) {
    logger.error({ requestId }, 'GLM API returned an unexpected response shape');
    throw new AppError(ERROR_CODES.GLM_API_ERROR, UPSTREAM_UNAVAILABLE_MESSAGE, HTTP_STATUS.BAD_GATEWAY);
  }

  const usage = payload?.usage;
  return {
    content,
    model: payload?.model ?? env.GLM_MODEL,
    ...(usage !== undefined
      ? {
          usage: {
            promptTokens: usage.prompt_tokens ?? 0,
            completionTokens: usage.completion_tokens ?? 0,
            totalTokens: usage.total_tokens ?? 0,
          },
        }
      : {}),
  };
};
