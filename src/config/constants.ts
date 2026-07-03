export const APP_NAME = 'glm-chat';
export const API_BASE_PATH = '/api/v1';

export const CHAT_MAX_MESSAGES = 40;
export const CHAT_MAX_CONTENT_LENGTH = 8000;
// Only the most recent messages are forwarded upstream to keep latency and token usage bounded.
export const CHAT_HISTORY_LIMIT = 20;
export const GLM_REQUEST_TIMEOUT_MS = 60_000;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CHAT_NOT_CONFIGURED: 'CHAT_NOT_CONFIGURED',
  GLM_API_ERROR: 'GLM_API_ERROR',
  GLM_TIMEOUT: 'GLM_TIMEOUT',
  GLM_RATE_LIMITED: 'GLM_RATE_LIMITED',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
