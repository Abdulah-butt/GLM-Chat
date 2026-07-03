import { env } from '../../config/env.js';
import { CHAT_HISTORY_LIMIT, ERROR_CODES } from '../../config/constants.js';
import { AppError } from '../../core/errors/AppError.js';
import { HTTP_STATUS } from '../../core/http/statusCodes.js';
import {
  createChatCompletion,
  type GlmChatMessage,
  type GlmTool,
  type GlmToolCall,
} from '../../infra/glm/glmClient.js';
import { logger } from '../../infra/logger/logger.js';
import * as ordersService from '../orders/orders.service.js';
import { createOrderRequestSchema } from '../orders/orders.validation.js';
import { FILLET_SIZES, PACKAGE_TYPES } from '../orders/orders.types.js';
import { SYSTEM_PROMPT } from './chat.prompt.js';
import type { ChatRequestDto, ChatResponseDto } from './chat.dto.js';

const MAX_TOOL_ROUNDS = 3;

const PLACE_ORDER_TOOL: GlmTool = {
  type: 'function',
  function: {
    name: 'place_order',
    description:
      'Place a Blue Crown Seafood order request after the buyer has confirmed all details. ' +
      'Returns an order reference number the buyer should keep.',
    parameters: {
      type: 'object',
      required: ['packageType', 'filletSize', 'quantity', 'destination', 'companyName', 'email'],
      properties: {
        packageType: { type: 'string', enum: [...PACKAGE_TYPES] },
        filletSize: { type: 'string', enum: [...FILLET_SIZES] },
        quantity: { type: 'integer', minimum: 1, description: 'Number of boxes, pallets, or containers' },
        destination: { type: 'string', description: 'Destination city and country' },
        companyName: { type: 'string' },
        contactName: { type: 'string' },
        email: { type: 'string' },
        phone: { type: 'string' },
        notes: { type: 'string', description: 'Any special requirements from the buyer' },
      },
    },
  },
};

const executePlaceOrder = (call: GlmToolCall, requestId: string): string => {
  let rawArgs: unknown;
  try {
    rawArgs = JSON.parse(call.function.arguments);
  } catch {
    return JSON.stringify({ ok: false, error: 'Invalid tool arguments: not valid JSON.' });
  }

  const parsed = createOrderRequestSchema.safeParse(rawArgs);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    logger.warn({ requestId, issues }, 'place_order tool call failed validation');
    return JSON.stringify({
      ok: false,
      error: `Missing or invalid order fields — ask the buyer and try again. ${issues}`,
    });
  }

  const order = ordersService.createOrderRequest(parsed.data, requestId);
  return JSON.stringify({
    ok: true,
    orderNumber: order.orderNumber,
    status: order.status,
    message: 'Order request recorded. The sales team will contact the buyer with a quote.',
  });
};

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
  const history = dto.messages
    .filter((message) => message.role !== 'system')
    .slice(-CHAT_HISTORY_LIMIT);

  const messages: GlmChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }, ...history];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const result = await createChatCompletion(messages, requestId, [PLACE_ORDER_TOOL]);

    if (result.toolCalls.length === 0) {
      if (result.content === null || result.content === '') {
        throw new AppError(
          ERROR_CODES.GLM_API_ERROR,
          'The AI service is temporarily unavailable. Please try again.',
          HTTP_STATUS.BAD_GATEWAY,
        );
      }
      return { reply: { role: 'assistant', content: result.content } };
    }

    messages.push({ role: 'assistant', content: result.content, tool_calls: result.toolCalls });
    for (const call of result.toolCalls) {
      const outcome =
        call.function.name === 'place_order'
          ? executePlaceOrder(call, requestId)
          : JSON.stringify({ ok: false, error: `Unknown tool: ${call.function.name}` });
      messages.push({ role: 'tool', tool_call_id: call.id, content: outcome });
    }
  }

  logger.error({ requestId }, 'Tool-calling loop exceeded max rounds');
  throw new AppError(
    ERROR_CODES.GLM_API_ERROR,
    'The AI service is temporarily unavailable. Please try again.',
    HTTP_STATUS.BAD_GATEWAY,
  );
};
