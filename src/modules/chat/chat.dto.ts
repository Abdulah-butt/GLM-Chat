import type { ChatMessage } from './chat.types.js';

export interface ChatRequestDto {
  messages: ChatMessage[];
}

export interface ChatResponseDto {
  reply: ChatMessage;
}
