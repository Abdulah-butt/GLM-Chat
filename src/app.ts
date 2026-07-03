import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express, { type Express } from 'express';
import helmet from 'helmet';
import cors, { type CorsOptions } from 'cors';
import { env, isProduction } from './config/env.js';
import { API_BASE_PATH, APP_NAME } from './config/constants.js';
import { errorHandler, notFoundHandler } from './core/errors/errorHandler.js';
import { httpLogger } from './infra/logger/httpLogger.js';
import { requestId } from './middlewares/requestId.middleware.js';
import { apiRateLimit } from './middlewares/rateLimit.middleware.js';
import { chatRoutes } from './modules/chat/chat.routes.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { openApiSpec } from './docs/openapi.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(dirname, '../client/dist');

const corsOptions: CorsOptions = {
  // Allow requests with no Origin (same-origin, curl, health checks); otherwise enforce the allowlist.
  origin: (origin, callback) => {
    callback(null, origin === undefined || env.corsOrigins.includes(origin));
  },
};

const mountSpaFrontend = (app: Express): void => {
  app.use(
    express.static(clientDistPath, {
      index: false,
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      },
    }),
  );

  // SPA fallback: any non-API GET renders the frontend.
  app.use((req, res, next) => {
    if (req.method !== 'GET') {
      next();
      return;
    }
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
};

export const createApp = (): Express => {
  const app = express();

  app.disable('x-powered-by');
  // Behind Railway's proxy — required for correct client IPs in rate limiting.
  app.set('trust proxy', 1);

  app.use(requestId);
  app.use(httpLogger);
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use(express.json({ limit: env.BODY_LIMIT_JSON }));

  app.use('/health', healthRoutes);

  app.use(API_BASE_PATH, apiRateLimit);
  app.use(`${API_BASE_PATH}/chat`, chatRoutes);

  if (!isProduction) {
    app.get('/api/docs', (_req, res) => {
      res.json(openApiSpec);
    });
  }

  app.use('/api', notFoundHandler);

  if (fs.existsSync(path.join(clientDistPath, 'index.html'))) {
    mountSpaFrontend(app);
  } else {
    // No frontend build present (e.g. plain `npm run dev`) — serve a lightweight status page.
    app.get('/', (_req, res) => {
      res.json({
        success: true,
        message: `${APP_NAME} API is running.`,
        data: { status: 'ok', health: '/health', chat: `POST ${API_BASE_PATH}/chat` },
      });
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
