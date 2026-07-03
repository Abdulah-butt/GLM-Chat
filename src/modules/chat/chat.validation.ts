import { z } from 'zod';
import { CHAT_MAX_CONTENT_LENGTH, CHAT_MAX_MESSAGES } from '../../config/constants.js';

const chatMessageSchema = z.object({
  role: z.enum(['system', 'user', 'assistant']),
  content: z
    .string()
    .trim()
    .min(1, 'Message content cannot be empty.')
    .max(CHAT_MAX_CONTENT_LENGTH, `Message content must be at most ${CHAT_MAX_CONTENT_LENGTH} characters.`),
});

export const chatRequestSchema = z
  .object({
    messages: z
      .array(chatMessageSchema)
      .min(1, 'At least one message is required.')
      .max(CHAT_MAX_MESSAGES, `A conversation can include at most ${CHAT_MAX_MESSAGES} messages.`),
  })
  .strict()
  .refine((body) => body.messages[body.messages.length - 1]?.role === 'user', {
    message: 'The last message must be from the user.',
    path: ['messages'],
  });
