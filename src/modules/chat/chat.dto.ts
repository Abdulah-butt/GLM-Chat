import type { ChatMessage } from './chat.types.js';
import type { GlmUsage } from '../../infra/glm/glmClient.js';

export interface ChatRequestDto {
  messages: ChatMessage[];
}

export interface ChatResponseDto {
  reply: ChatMessage;
  model: string;
  usage?: GlmUsage;
}
