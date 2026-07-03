# GLM Chat

A fast, minimal full-stack AI chat app for testing the free GLM model API (Z.ai), built as a **single Railway-deployable service**: an Express 5 API that also serves the Vite/React frontend in production.

> Architecture rules for this codebase live in [BACKEND_README.md](BACKEND_README.md) — read it before adding features.

## Stack

- Node.js 20+ · TypeScript (strict) · Express 5
- Vite + React 18 (npm workspace in `client/`)
- Zod validation · Pino logging · Helmet · CORS allowlist · express-rate-limit
- No database

## Project layout

```
src/
  app.ts / server.ts        Express app + entry
  config/                   Zod-validated env, constants
  core/                     AppError, error handler, asyncHandler, API response helpers
  infra/                    Pino logger, GLM API client (fetch, OpenAI-compatible endpoint)
  middlewares/              requestId, validate (Zod), rate limiters
  modules/chat/             routes → validation → controller → service
  modules/health/           GET /health
  docs/openapi.ts           OpenAPI spec (served at /api/docs in dev)
client/                     Vite + React frontend (built to client/dist)
```

## API

All responses use the standard shape from BACKEND_README.md (`{ success, message, data }` / `{ success: false, error: { code, message, details?, requestId } }`).

| Method | Path           | Description                                        |
| ------ | -------------- | -------------------------------------------------- |
| GET    | `/health`      | Health check (used by Railway)                     |
| POST   | `/api/v1/chat` | Send `{ messages: [{ role, content }] }`, get GLM reply |
| GET    | `/api/docs`    | OpenAPI JSON (development only)                    |

## Environment variables

Copy `.env.example` to `.env` and fill in values. **Never commit `.env`.**

| Variable                    | Required | Default                        | Purpose                                  |
| --------------------------- | -------- | ------------------------------ | ---------------------------------------- |
| `GLM_API_KEY`               | ✅       | —                              | Z.ai API key (server-side only)          |
| `GLM_BASE_URL`              | —        | `https://api.z.ai/api/paas/v4` | OpenAI-compatible GLM base URL           |
| `GLM_MODEL`                 | —        | `glm-4.5-flash`                | Model name                               |
| `PORT`                      | —        | `3000`                         | Server port (Railway injects this)       |
| `NODE_ENV`                  | —        | `development`                  | Set `production` on Railway              |
| `CORS_ORIGINS`              | —        | localhost origins              | Comma-separated allowlist                |
| `LOG_LEVEL`                 | —        | `info`                         | Pino log level                           |
| `RATE_LIMIT_WINDOW_MS/MAX`  | —        | `900000` / `300`               | Global `/api` rate limit                 |
| `CHAT_RATE_LIMIT_WINDOW_MS/MAX` | —    | `60000` / `10`                 | Chat endpoint rate limit                 |
| `BODY_LIMIT_JSON`           | —        | `100kb`                        | JSON body size limit                     |

## Local development

```bash
npm install                # installs root + client workspace
cp .env.example .env       # add your GLM_API_KEY

npm run dev                # API on http://localhost:3000
npm run dev:client         # (second terminal) UI on http://localhost:5173 (proxies /api)
```

To test the production setup locally:

```bash
npm run build && NODE_ENV=production npm start   # everything on http://localhost:3000
```

## Railway deploy

1. Push this repo to GitHub and create a new Railway service from it. `railway.json` configures the build (`npm run build`), start (`npm run start`), and health check (`/health`) automatically — no separate frontend service needed.
2. Set service variables in Railway:
   - `GLM_API_KEY` — your Z.ai key (required)
   - `NODE_ENV=production`
   - `CORS_ORIGINS=https://<your-app>.up.railway.app` (plus any custom domain)
   - Optional: `GLM_MODEL`, `GLM_BASE_URL`, `LOG_LEVEL`, rate-limit overrides
   - Do **not** set `PORT` — Railway injects it.
3. Deploy. The Express server serves the built React app at `/`, the API at `/api/v1/chat`, and the health check at `/health`.

## Scripts

| Script              | What it does                                  |
| ------------------- | --------------------------------------------- |
| `npm run dev`       | API dev server with reload (tsx watch)        |
| `npm run dev:client`| Vite dev server with API proxy                |
| `npm run build`     | Compile server (`dist/`) + frontend (`client/dist/`) |
| `npm start`         | Run compiled server (serves API + frontend)   |
| `npm run typecheck` | Strict typecheck for server and client        |
