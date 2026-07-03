import { env } from '../../config/env.js';
import { ERROR_CODES, GLM_REQUEST_TIMEOUT_MS } from '../../config/constants.js';
import { AppError } from '../../core/errors/AppError.js';
import { HTTP_STATUS } from '../../core/http/statusCodes.js';
import { logger } from '../logger/logger.js';

export interface GlmToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

export type GlmChatMessage =
  | { role: 'system' | 'user'; content: string }
  | { role: 'assistant'; content: string | null; tool_calls?: GlmToolCall[] }
  | { role: 'tool'; content: string; tool_call_id: string };

export interface GlmTool {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
}

export interface GlmChatResult {
  content: string | null;
  toolCalls: GlmToolCall[];
  model: string;
}

interface GlmApiResponse {
  model?: string;
  choices?: {
    message?: {
      content?: string | null;
      tool_calls?: { id?: string; function?: { name?: string; arguments?: string } }[];
    };
  }[];
}

const UPSTREAM_UNAVAILABLE_MESSAGE = 'The AI service is temporarily unavailable. Please try again.';

export const createChatCompletion = async (
  messages: GlmChatMessage[],
  requestId: string,
  tools?: GlmTool[],
): Promise<GlmChatResult> => {
  let response: globalThis.Response;

  try {
    response = await fetch(`${env.GLM_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.GLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.GLM_MODEL,
        messages,
        stream: false,
        // GLM-4.5 models reason ("think") before answering by default, which adds
        // 30-50s of latency on the flash tier. Chat answers don't need it.
        thinking: { type: 'disabled' },
        ...(tools !== undefined && tools.length > 0 ? { tools, tool_choice: 'auto' } : {}),
      }),
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
  const message = payload?.choices?.[0]?.message;

  const toolCalls: GlmToolCall[] = (message?.tool_calls ?? [])
    .filter(
      (call): call is { id: string; function: { name: string; arguments: string } } =>
        typeof call.id === 'string' &&
        typeof call.function?.name === 'string' &&
        typeof call.function?.arguments === 'string',
    )
    .map((call) => ({ id: call.id, type: 'function' as const, function: call.function }));

  const content = typeof message?.content === 'string' ? message.content : null;

  if ((content === null || content === '') && toolCalls.length === 0) {
    logger.error({ requestId }, 'GLM API returned an unexpected response shape');
    throw new AppError(ERROR_CODES.GLM_API_ERROR, UPSTREAM_UNAVAILABLE_MESSAGE, HTTP_STATUS.BAD_GATEWAY);
  }

  return { content, toolCalls, model: payload?.model ?? env.GLM_MODEL };
};
