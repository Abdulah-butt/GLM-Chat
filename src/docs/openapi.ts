import { API_BASE_PATH, APP_NAME, CHAT_MAX_CONTENT_LENGTH, CHAT_MAX_MESSAGES } from '../config/constants.js';

const errorResponse = (description: string) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/ErrorResponse' },
    },
  },
});

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: `${APP_NAME} API`,
    version: '1.0.0',
    description: 'Minimal GLM chat test API. All endpoints are public but rate-limited.',
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Service is healthy.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Service is healthy.',
                  data: { status: 'ok', uptime: 42, timestamp: '2026-01-01T00:00:00.000Z', environment: 'production' },
                },
              },
            },
          },
        },
      },
    },
    [`${API_BASE_PATH}/chat`]: {
      post: {
        summary: 'Send a chat conversation and receive a GLM reply',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['messages'],
                additionalProperties: false,
                properties: {
                  messages: {
                    type: 'array',
                    minItems: 1,
                    maxItems: CHAT_MAX_MESSAGES,
                    items: {
                      type: 'object',
                      required: ['role', 'content'],
                      properties: {
                        role: { type: 'string', enum: ['system', 'user', 'assistant'] },
                        content: { type: 'string', minLength: 1, maxLength: CHAT_MAX_CONTENT_LENGTH },
                      },
                    },
                  },
                },
              },
              example: { messages: [{ role: 'user', content: 'Hello! What can you do?' }] },
            },
          },
        },
        responses: {
          '200': {
            description: 'Reply generated successfully.',
            content: {
              'application/json': {
                example: {
                  success: true,
                  message: 'Reply generated successfully.',
                  data: {
                    reply: { role: 'assistant', content: 'Hi! I can answer questions...' },
                    model: 'glm-4.5-flash',
                    usage: { promptTokens: 20, completionTokens: 15, totalTokens: 35 },
                  },
                },
              },
            },
          },
          '400': errorResponse('Malformed request body.'),
          '422': errorResponse('Validation failure.'),
          '429': errorResponse('Rate limit exceeded.'),
          '502': errorResponse('Upstream GLM API error.'),
          '503': errorResponse('Chat not configured or upstream busy.'),
          '504': errorResponse('Upstream GLM API timeout.'),
        },
      },
    },
  },
  components: {
    schemas: {
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              message: { type: 'string' },
              details: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: { field: { type: 'string' }, message: { type: 'string' } },
                },
              },
              requestId: { type: 'string' },
            },
          },
        },
      },
    },
  },
} as const;
