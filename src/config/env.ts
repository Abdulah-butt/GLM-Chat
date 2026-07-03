import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  GLM_API_KEY: z.string().default(''),
  GLM_BASE_URL: z.string().url().default('https://api.z.ai/api/paas/v4'),
  GLM_MODEL: z.string().min(1).default('glm-4.5-flash'),

  CORS_ORIGINS: z.string().default('http://localhost:5173,http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),
  CHAT_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  CHAT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),
  BODY_LIMIT_JSON: z.string().default('100kb'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  process.stderr.write(`Invalid environment configuration — ${issues}\n`);
  process.exit(1);
}

export const env = {
  ...parsed.data,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

export const isProduction = env.NODE_ENV === 'production';
