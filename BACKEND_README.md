# Backend AI Agent — Universal Reference README

> **How to use this file:**
> Copy this file into every new backend project as `README.md`.
> Replace every value inside `{{ }}` with your project-specific value before giving this to an AI agent.
> The AI agent must read and follow every rule in this file before writing a single line of code.

---

## 0. Project Identity

```
APP_NAME      = {{ myapp }}
API_VERSION   = {{ v1 }}
BASE_URL      = /api/{{ v1 }}
DEPLOY_TARGET = {{ vercel | railway | render | vps | docker }}
```

---

## 1. Mission

Build a production-grade, clean, scalable, secure REST API backend that:

- Works for small apps today.
- Scales to millions of users without rewriting from scratch.
- Is readable, testable, and maintainable by any developer or AI agent.
- Is secure by default at every layer.
- Is as fast as technically possible at every layer.

This is not a prototype. Every feature, no matter how small, must follow the architecture defined in this file.

---

## 2. Stack

Choose one option per row. Delete unused rows after choosing.

| Concern        | Option A              | Option B                     | Option C                  | Option D         |
| -------------- | --------------------- | ---------------------------- | ------------------------- | ---------------- |
| Runtime        | Node.js LTS           | —                            | —                         | —                |
| Language       | TypeScript (strict)   | —                            | —                         | —                |
| Framework      | Express 5             | Fastify 4                    | —                         | —                |
| **Database**   | **MongoDB + Mongoose**| **PostgreSQL + Prisma**      | **Firebase Firestore**    | **Supabase**     |
| Cache          | Redis (`redis` pkg)   | Upstash Redis (serverless)   | —                         | —                |
| Auth Identity  | JWT only (internal)   | Firebase Auth → backend JWT  | Supabase Auth → backend JWT | —             |
| Validation     | Zod                   | —                            | —                         | —                |
| Logging        | Pino + pino-http      | —                            | —                         | —                |
| Queue / Jobs   | BullMQ + Redis        | Inngest (serverless)         | —                         | —                |
| File Storage   | AWS S3                | Cloudflare R2                | Firebase Storage          | Supabase Storage |
| Email          | Resend                | SendGrid                     | Nodemailer                | —                |
| Tests          | Vitest + Supertest    | Jest + Supertest             | —                         | —                |
| API Docs       | Swagger / OpenAPI 3   | —                            | —                         | —                |

> **Active Stack for this project:**
> _(Fill in after choosing above — example below)_
> - Runtime: Node.js LTS + TypeScript
> - Framework: Express 5
> - Database: {{ MongoDB + Mongoose }}
> - Cache: {{ Redis }}
> - Auth: {{ JWT access + refresh }}
> - Deploy: {{ Vercel }}

---

## 3. Non-Negotiable Rules

The AI agent must follow every rule below at all times, on every task, no exceptions.

### 3A. Architecture Rules

1. Always follow the layer architecture in Section 5 before writing any code.
2. Never put all logic in one file.
3. Controllers must be thin — only read input, call service, send response.
4. Business logic lives in services/use-cases only.
5. Database queries live in repositories only. No DB access in controllers or services directly.
6. Validate every request body, query param, and route param before any controller logic runs.
7. Never return raw database documents if they may contain sensitive fields.
8. Use consistent response and error shapes for every endpoint (see Section 7).
9. Use pagination on every list endpoint, no exceptions.
10. Add DB indexes for every field used in filters, sorts, lookups, uniqueness, or cursor pagination.
11. Never duplicate code — extract shared helpers, utilities, and middleware.
12. Never hardcode secrets — all config comes from environment variables.
13. Never block the Node.js event loop with synchronous CPU-heavy work inside a request handler.
14. Keep files under 250 lines unless clearly justified with a comment.
15. Never touch unrelated code when working on a feature.

### 3B. Security Rules (all mandatory)

16. Use HTTPS in production at all times.
17. Use Helmet for security headers on every response.
18. Use a strict CORS allowlist — never `*` in production.
19. Enforce request body size limits (default: 10kb JSON, 5MB multipart).
20. Hash passwords with bcrypt (cost ≥ 12) or argon2 — never store plain text.
21. Never log passwords, tokens, OTPs, card numbers, or any secret value.
22. Use short-lived JWT access tokens + long-lived refresh tokens for auth.
23. Store refresh tokens in the database and support single-device and all-device revoke.
24. Apply rate limiting to every auth, OTP, password reset, and public write endpoint.
25. Return generic error messages for auth failures — never reveal whether email or password was wrong.
26. Hide stack traces and internal error details in production responses.
27. Sanitize all user input that touches DB queries to prevent injection attacks.
28. Use `httpOnly`, `secure`, `sameSite=strict` flags on cookies when used.
29. Add `X-Request-Id` to every request and response for traceability.
30. Validate file type and size before accepting any upload.
31. Use signed or pre-signed URLs for private file access — never expose storage bucket directly.
32. Apply RBAC (role-based access control) middleware on admin and privileged routes.
33. Never trust client-supplied user IDs — always derive identity from the verified JWT.
34. Use parameterized queries for SQL (Prisma handles this; do not use raw string interpolation in queries).
35. Log security events: failed logins, token revocations, rate limit hits, permission denials.

### 3C. Performance Rules

36. Use `.lean()` for all read-only MongoDB queries.
37. Always use projection — never return fields the client does not need.
38. Cache read-heavy, rarely-changing data in Redis with appropriate TTL.
39. Invalidate or update cache immediately after writes.
40. Use cursor-based pagination on large collections instead of offset/skip.
41. Avoid N+1 queries — use `populate`, `include`, joins, or data loaders appropriately.
42. Run heavy background work (emails, image processing, reports) in queues, not inside request handlers.
43. Keep database connection pools tuned to the environment.
44. Use indexes strategically — review indexes whenever a new filter or sort endpoint is added.
45. Avoid regex searches on large unindexed text fields.
46. Use streaming for large file responses — never buffer entire files in memory.
47. Measure P95/P99 response time; any endpoint over 300ms in production must be investigated.

### 3D. Code Quality Rules

48. TypeScript strict mode is required on all files.
49. Prefer named exports.
50. Use async/await — never raw Promise chains or callbacks.
51. Use dependency injection where it improves testability.
52. Keep functions small and focused — one responsibility per function.
53. Use descriptive names for variables, functions, and files.
54. Avoid magic strings and numbers — use constants or enums.
55. Add comments only for non-obvious business logic, not for code that explains itself.
56. Never use `any` unless absolutely unavoidable — document why if used.
57. Never swallow errors silently — every catch block either re-throws or logs + responds.
58. Never use `console.log` in production code — use the logger.
59. Every exported function must have TypeScript types for all parameters and return values.

---

## 4. Project Structure

Use feature-based clean architecture. Every feature is a self-contained module folder.

```
src/
  app.ts                          # Express app setup, global middleware
  server.ts                       # Local dev server entry (not used on Vercel)
  index.ts                        # Vercel / serverless export

  config/
    env.ts                        # Validated environment config (Zod)
    constants.ts                  # App-wide constants and enums

  core/
    errors/
      AppError.ts                 # Custom error class with code + status
      errorHandler.ts             # Global Express error handler
      asyncHandler.ts             # Wraps async controllers to catch errors
    http/
      apiResponse.ts              # Standardised success and error response helpers
      statusCodes.ts              # HTTP status code constants
    utils/
      pagination.ts               # Cursor and offset pagination helpers
      hash.ts                     # Password hashing helpers (bcrypt/argon2)
      slug.ts                     # Slug generation helper
      token.ts                    # JWT sign and verify helpers
      date.ts                     # Date formatting helpers
      pick.ts                     # Object field picker (for safe DTO responses)
      generateId.ts               # Unique ID generator (nano-id or uuid)
    types/
      common.ts                   # Shared TypeScript types (PaginatedResult, etc.)
      express.d.ts                # Augment Express Request with req.user

  infra/
    db/
      mongo.ts                    # MongoDB connection (singleton)           [if MongoDB]
      prisma.ts                   # Prisma client (singleton)                [if PostgreSQL]
      firebase.ts                 # Firebase Admin SDK init                  [if Firebase]
      supabase.ts                 # Supabase client init                     [if Supabase]
    cache/
      redis.ts                    # Redis connection (singleton)
      cacheService.ts             # get / set / del / invalidate helpers
    queue/
      queue.ts                    # BullMQ / Inngest queue setup
      workers/
        email.worker.ts           # Email job processor
        media.worker.ts           # Media processing job processor
    storage/
      storageService.ts           # Unified upload / signed URL interface
    email/
      emailService.ts             # Send email via Resend / SendGrid
    logger/
      logger.ts                   # Pino logger instance

  middlewares/
    auth.middleware.ts            # requireAuth, requireAdmin, requireRole
    validate.middleware.ts        # Zod request validator
    rateLimit.middleware.ts       # Per-route rate limit factories
    requestId.middleware.ts       # Attach X-Request-Id to every request
    upload.middleware.ts          # Multer config for multipart/form-data
    ipBlock.middleware.ts         # Block known bad IPs / abuse patterns

  modules/
    auth/
      auth.routes.ts
      auth.controller.ts
      auth.service.ts
      auth.repository.ts
      auth.model.ts               # or auth.schema.ts for Prisma
      auth.dto.ts
      auth.validation.ts
      auth.types.ts
      auth.test.ts
    users/
      users.routes.ts
      users.controller.ts
      users.service.ts
      users.repository.ts
      users.model.ts
      users.dto.ts
      users.validation.ts
      users.types.ts
      users.test.ts
    media/
      media.routes.ts
      media.controller.ts
      media.service.ts
      media.repository.ts
      media.model.ts
      media.validation.ts
      media.types.ts
    notifications/
      notifications.routes.ts
      notifications.controller.ts
      notifications.service.ts
      notifications.repository.ts
      notifications.model.ts
      notifications.types.ts
    <feature>/                    # One folder per feature, same pattern
      <feature>.routes.ts
      <feature>.controller.ts
      <feature>.service.ts
      <feature>.repository.ts
      <feature>.model.ts
      <feature>.dto.ts
      <feature>.validation.ts
      <feature>.types.ts
      <feature>.test.ts

  docs/
    openapi.ts                    # Swagger / OpenAPI 3 spec

tests/
  setup.ts                        # Global test setup (DB connect, seed, teardown)
  fixtures/                       # Reusable test data factories

data/                             # Imported data files (gitignored)
scripts/                          # One-time migration, seed, import scripts
```

Recommended file size targets:

```
controller:   50–120 lines
service:      80–200 lines
repository:   60–180 lines
model:        40–150 lines
validation:   30–120 lines
```

Split any file that grows beyond its target.

---

## 5. Layer Responsibilities

### Route (`<feature>.routes.ts`)

- Defines URL, HTTP method, and middleware order.
- No business logic, no DB calls.
- Example:

```ts
router.post(
  '/login',
  rateLimitAuth,
  validate(loginSchema),
  asyncHandler(authController.login)
);
```

### Middleware

- Handles: auth, validation, rate limit, request ID, file upload, error handling.
- Must be reusable across modules.
- Never contain business logic.

### Controller (`<feature>.controller.ts`)

- Reads validated input from `req.body`, `req.params`, `req.query`, `req.user`.
- Calls exactly one service method per handler.
- Sends a standard response.
- No DB queries, no business rules.
- Example:

```ts
export const login = async (req: Request, res: Response) => {
  const result = await authService.login(req.body);
  sendSuccess(res, 200, 'Welcome back.', result);
};
```

### Service / Use Case (`<feature>.service.ts`)

- Contains all business logic.
- Coordinates repositories, cache, queues, external APIs.
- Throws `AppError` for expected business errors.
- Never touches `req` or `res`.
- Example:

```ts
export const login = async (dto: LoginDto) => {
  const user = await userRepository.findByEmail(dto.email);
  if (!user || !(await verifyPassword(dto.password, user.passwordHash))) {
    throw new AppError('INVALID_CREDENTIALS', 'The email or password you entered is incorrect.', 401);
  }
  const { accessToken, refreshToken } = await issueTokens(user);
  return { user: sanitizeUser(user), accessToken, refreshToken };
};
```

### Repository (`<feature>.repository.ts`)

- The only place for database queries.
- Uses projection, indexes, lean reads, and pagination.
- No HTTP, no business rules, no cache.
- Every method is typed.
- Example:

```ts
export const findByEmail = async (email: string): Promise<UserDoc | null> => {
  return UserModel.findOne({ email }).select('+passwordHash').lean();
};
```

### Model / Schema (`<feature>.model.ts`)

- Defines the data structure.
- Includes timestamps, indexes, and safe `toJSON` transforms.
- Never exposes password, tokens, or private fields in default transforms.

### DTO (`<feature>.dto.ts`)

- TypeScript types for request input and service output shapes.
- Keeps the layer contracts explicit.

### Validation (`<feature>.validation.ts`)

- Zod schemas for every request (body, query, params).
- Reuse sub-schemas across endpoints.

---

## 6. Database Adapter Rules

### If MongoDB + Mongoose

```ts
// Model rules
const UserSchema = new Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, select: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

// Always add indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ createdAt: -1, _id: -1 });
UserSchema.index({ status: 1, createdAt: -1 });

// Always sanitize toJSON
UserSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    ret.id = ret._id;
    delete ret._id;
    return ret;
  },
});
```

Query rules:
- Always use `.lean()` for read-only queries.
- Always use projection: `.select('name email avatar')`.
- Avoid unbounded `.find()` — always paginate.
- Avoid regex on large unindexed fields.
- Use transactions only when multiple writes must be atomic.
- Prefer cursor pagination over offset on large collections.

### If PostgreSQL + Prisma

- Define all models in `prisma/schema.prisma`.
- Use `@@index` and `@@unique` for every query pattern.
- Always use `select` or `omit` to exclude sensitive fields.
- Use Prisma transactions (`prisma.$transaction`) for multi-write atomicity.
- Never use `prisma.$queryRaw` with string interpolation — parameterize always.
- Run `npx prisma migrate dev` for development and `npx prisma migrate deploy` for production.

### If Firebase Firestore

- Define collection names as constants — never hardcode strings inline.
- Use compound indexes in `firestore.indexes.json` for multi-field queries.
- Use Firestore transactions for atomic multi-document writes.
- Always paginate with `startAfter` and a cursor document.
- Use Firestore Security Rules for row-level security in addition to backend checks.
- Never use Firebase `idToken` directly on protected API routes — exchange for a backend-issued JWT.

### If Supabase

- Use the Supabase client from `infra/db/supabase.ts` (singleton).
- Use Row Level Security (RLS) policies on every table.
- Use Supabase Auth only for identity — exchange for a backend-issued JWT before accepting API calls.
- Always use typed Supabase clients generated from the schema.
- Never expose the service role key to the client.

---

## 7. API Conventions

### Base Path

```
/api/{{ v1 }}
```

### RESTful Resource Pattern

```
GET    /api/v1/<resources>              List (paginated)
GET    /api/v1/<resources>/:id          Get one
POST   /api/v1/<resources>              Create
PATCH  /api/v1/<resources>/:id          Update (partial)
DELETE /api/v1/<resources>/:id          Delete
POST   /api/v1/<resources>/:id/<action> Custom action (e.g. approve, publish)
```

### HTTP Status Codes

```
200  OK                  — successful read, update, delete, or action
201  Created             — successful resource creation
204  No Content          — successful delete (no body)
400  Bad Request         — invalid or malformed request
401  Unauthorized        — missing or invalid auth token
403  Forbidden           — authenticated but not permitted
404  Not Found           — resource does not exist
409  Conflict            — duplicate resource or state conflict
422  Unprocessable       — validation failure
429  Too Many Requests   — rate limit hit
500  Internal Error      — unexpected server error
```

### Standard Success Response

```json
{
  "success": true,
  "message": "User fetched successfully.",
  "data": {},
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "hasNextPage": true
  }
}
```

For cursor pagination:

```json
{
  "success": true,
  "message": "Posts fetched successfully.",
  "data": [],
  "meta": {
    "nextCursor": "abc123",
    "hasNextPage": true,
    "limit": 20
  }
}
```

### Standard Error Response

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the highlighted fields and try again.",
    "details": [
      { "field": "email", "message": "A valid email address is required." }
    ],
    "requestId": "req_abc123"
  }
}
```

### User-Facing Message Rules

The `message` field is frontend UX copy. It is shown directly to the end user.

- Success messages: short, clear, natural. Example: `Welcome back.` / `Your profile has been updated.`
- Error messages: actionable and non-technical. Example: `Please check the highlighted fields and try again.`
- Never expose stack traces, DB error strings, or provider error messages in `message`.
- Use `error.code` for machine handling by the frontend.

Standard message examples:

```
Validation failure    → "Please check the highlighted fields and try again."
Invalid credentials   → "The email or password you entered is incorrect."
Expired token         → "Your session has expired. Please sign in again."
Invalid reset link    → "This link is no longer valid. Please request a new one."
Username taken        → "This username is already taken."
Username available    → "This username is available."
Not found             → "We couldn't find what you were looking for."
Unknown endpoint      → "We could not find that endpoint."
Too many requests     → "Too many attempts. Please try again in a few minutes."
Server error          → "Something went wrong on our end. Please try again."
```

---

## 8. Auth & JWT Rules

### Token Flow

1. Client sends credentials to `POST /api/v1/auth/login`.
2. Backend validates, generates `accessToken` (short-lived) and `refreshToken` (long-lived).
3. Backend stores `refreshToken` hash in DB (linked to user + device).
4. Client uses `accessToken` in `Authorization: Bearer <token>` on every authenticated request.
5. When `accessToken` expires, client calls `POST /api/v1/auth/refresh` with `refreshToken`.
6. On logout, backend deletes the `refreshToken` from DB (single device) or all tokens (all devices).

### Token Expiry Defaults

```
JWT_ACCESS_EXPIRES_IN  = 15m    # Short-lived; change to 'never' only by explicit product decision
JWT_REFRESH_EXPIRES_IN = 30d
```

### Auth Middleware (`requireAuth`)

- Reads token from `Authorization: Bearer` header only (not cookies unless explicitly configured).
- Verifies signature and expiry with `jwt.verify`.
- Attaches `{ id, role, email }` to `req.user`.
- Returns `401` if token is missing, malformed, or expired.

### Social / Firebase / Supabase Auth

- Client authenticates with provider (Firebase, Supabase, Google OAuth).
- Client sends provider `idToken` to `POST /api/v1/auth/social-login`.
- Backend verifies `idToken` with the provider SDK (never trust without verification).
- Backend finds or creates the user, then issues backend-owned `accessToken` and `refreshToken`.
- All subsequent API calls use the backend `accessToken` — never the provider token.

### Auth Endpoints

```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/resend-verification
POST   /api/v1/auth/social-login
GET    /api/v1/auth/usernames/availability?username=
GET    /api/v1/auth/me
```

### Username Rules

- Normalize to lowercase on save.
- Enforce uniqueness at DB level.
- Require on registration (or auto-generate for social login).
- Expose `GET /api/v1/auth/usernames/availability?username=` — public but rate-limited.

### Password Rules

- Minimum 8 characters.
- Hash with `bcrypt` (cost 12+) or `argon2id`.
- Never return, log, or store plain text passwords.
- Compare with `bcrypt.compare` / `argon2.verify` — timing-safe by design.

---

## 9. Pagination, Filtering, Sorting

Every list endpoint must support safe pagination.

### Offset Pagination (small collections, < 100k docs)

```
GET /api/v1/posts?page=1&limit=20&sort=-createdAt&status=published
```

Rules:
- Default limit: 20.
- Max limit: 100.
- Validate allowed filter fields — reject unknown query params.
- Validate allowed sort fields — reject unknown sort keys.
- Use projection to return only required fields.

### Cursor Pagination (large collections, > 100k docs)

```
GET /api/v1/posts?limit=20&cursor=<encodedCursor>&sort=-createdAt
```

Rules:
- Cursor must use indexed fields (`_id`, `createdAt`, or both as compound).
- Encode cursor as base64 to avoid leaking internal IDs.
- Return `nextCursor` and `hasNextPage` in `meta`.
- Never use offset-based `skip` on large collections.

### Filtering

- Validate every allowed filter field with Zod before building the query.
- Never pass raw query params directly into the DB query.
- For text search, use DB text indexes or a dedicated search field.

### Sorting

- Maintain a whitelist of sortable fields.
- Default: `-createdAt` (newest first).

---

## 10. Redis Cache Rules

Use Redis only where it adds clear performance or reliability value.

### Good Cache Targets

- Read-heavy, rarely-changing public data (categories, config, popular listings).
- User profile metadata after auth.
- Rate limiting counters.
- Short-lived computed responses.
- Distributed locks for preventing duplicate job execution.
- OTP codes with short TTL.

### Cache Key Format

```
{{ myapp }}:v1:<module>:<operation>:<identifier>
```

Examples:

```
myapp:v1:users:profile:usr_abc123
myapp:v1:posts:list:status_published_page_1
myapp:v1:categories:all
myapp:v1:otp:email:user@example.com
```

### Rules

- Always set a TTL — never cache without expiry.
- Default TTL ranges:

```
OTP / short codes         60–300 seconds
API response cache        30–300 seconds
User session metadata     900–3600 seconds
Rarely-changing config    3600–86400 seconds
```

- Include user ID or role in key for user-specific data.
- Never cache sensitive data without strict scoping.
- Cache must be a performance layer only — if Redis is down, the API must still work for non-critical paths.
- Invalidate or update cache immediately after any write that affects cached data.
- Use `SCAN` instead of `KEYS` for pattern-based invalidation in production.

---

## 11. Security Checklist (enforce on every feature)

### Input Security

- [ ] All inputs validated with Zod before entering controller logic.
- [ ] File uploads: validate MIME type, size, and extension independently.
- [ ] No raw user input passed directly to DB query builders.
- [ ] No SQL/NoSQL injection vectors in custom queries.

### Auth Security

- [ ] All protected routes require `requireAuth` middleware.
- [ ] Admin routes require both `requireAuth` and `requireAdmin`.
- [ ] Token signature verified server-side — never trust client-decoded claims.
- [ ] Refresh tokens stored as hashes — never plain text.
- [ ] Logout deletes refresh tokens from DB.

### Transport Security

- [ ] HTTPS enforced in production.
- [ ] Helmet middleware applied globally.
- [ ] CORS allowlist configured — no wildcard `*` in production.
- [ ] Request body size limits applied.

### Data Security

- [ ] Passwords hashed with bcrypt ≥ 12 rounds or argon2id.
- [ ] No passwords, tokens, OTPs, or secrets appear in logs.
- [ ] Private fields excluded from all API responses.
- [ ] Signed/pre-signed URLs used for private file access.

### Rate Limiting

- [ ] Auth endpoints rate-limited (login, register, forgot-password, OTP).
- [ ] Public write endpoints rate-limited.
- [ ] Admin endpoints rate-limited separately.
- [ ] Rate limit responses return `429` with `Retry-After` header.

### Error Security

- [ ] Stack traces hidden in production (`NODE_ENV=production`).
- [ ] Internal error codes logged server-side, user-safe messages sent to client.
- [ ] Generic error messages for auth failures (do not reveal email/password status).

### Observability Security

- [ ] `X-Request-Id` applied to every request and included in every log line and error response.
- [ ] Security events logged: failed login, token revoke, rate limit hit, permission denial.
- [ ] No PII (email, name, phone) in URL paths or query strings that get logged.

---

## 12. File Upload & Media Rules

- Never accept file uploads directly into the API handler memory for large files.
- Preferred pattern: generate a pre-signed upload URL from the storage provider, return it to the client, client uploads directly.
- For small uploads (< 5MB), accept via `multipart/form-data` through `upload.middleware.ts`.
- Validate MIME type, file extension, and size before accepting.
- Store only the reference URL/key in the database, never the raw binary.
- Use `media` module to track uploaded assets with `userId`, `url`, `size`, `mimeType`, `createdAt`.
- Keep storage provider behind `storageService.ts` interface so switching providers requires only one file change.

Media endpoint:

```
POST   /api/v1/media/upload          # Upload file or get pre-signed URL
GET    /api/v1/media/:id             # Get media record
DELETE /api/v1/media/:id             # Delete media record and storage object
```

---

## 13. Background Jobs & Queues

Never run slow or unreliable work inside a request handler.

Queue these:

- Sending emails.
- Sending push notifications.
- Image/video processing.
- Generating reports or exports.
- Syncing data to third-party services.
- Any work that could take > 500ms.

Pattern:

```ts
// Service: enqueue the job, return immediately
await emailQueue.add('send-welcome', { userId: user.id });
sendSuccess(res, 201, 'Account created.', { user });

// Worker: process the job async
emailWorker.process('send-welcome', async (job) => {
  await emailService.sendWelcome(job.data.userId);
});
```

Rules:
- Every job must have a retry policy and a dead-letter queue.
- Log job start, success, and failure with job ID.
- Never put sensitive secrets in job payloads — pass IDs and fetch from DB in the worker.

---

## 14. Environment Variables

Use `.env.example` for all required variables. Never commit real `.env`.

```env
# ─── App ─────────────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=3000
APP_NAME={{ myapp }}
API_VERSION={{ v1 }}

# ─── Database ─────────────────────────────────────────────────────────────────
# MongoDB
MONGODB_URI=

# PostgreSQL (Prisma)
DATABASE_URL=

# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=

# ─── Cache ────────────────────────────────────────────────────────────────────
REDIS_URL=

# ─── Auth ─────────────────────────────────────────────────────────────────────
JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# ─── Storage ──────────────────────────────────────────────────────────────────
STORAGE_PROVIDER={{ s3 | r2 | firebase | supabase }}
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=

CLOUDFLARE_R2_ENDPOINT=
CLOUDFLARE_R2_ACCESS_KEY=
CLOUDFLARE_R2_SECRET_KEY=
CLOUDFLARE_R2_BUCKET=

# ─── Email ────────────────────────────────────────────────────────────────────
EMAIL_PROVIDER={{ resend | sendgrid | nodemailer }}
RESEND_API_KEY=
SENDGRID_API_KEY=
EMAIL_FROM=noreply@{{ yourdomain.com }}

# ─── Security ─────────────────────────────────────────────────────────────────
CORS_ORIGINS=http://localhost:3000,https://{{ yourdomain.com }}
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
BODY_LIMIT_JSON=10kb
BODY_LIMIT_MULTIPART=5mb

# ─── Logging ──────────────────────────────────────────────────────────────────
LOG_LEVEL=info

# ─── External APIs ────────────────────────────────────────────────────────────
# Add project-specific third-party API keys below
```

---

## 15. Vercel / Serverless Deployment Rules

Applies when `DEPLOY_TARGET=vercel` or any serverless platform.

- Keep all functions stateless — no in-memory state between requests.
- Do not rely on in-memory sessions.
- Reuse MongoDB / Redis / Prisma clients with module-level singletons (initialise once, reuse across warm invocations).
- Do not run long background jobs inside request handlers — use external queues (BullMQ with separate worker, Inngest, etc.).
- Keep dependencies minimal to reduce cold start time.
- Avoid large file uploads through the API function — use pre-signed direct upload URLs.
- Every route must respond quickly and handle timeouts gracefully.
- `GET /health` must return JSON quickly and must not depend on auth, DB writes, or uploads.
- Root path `/` serves a lightweight HTML status page for preview checks.
- Keep environment variables in Vercel Project Settings — never in committed files.
- Use the `Express` framework preset when importing the Git repo to Vercel.
- Do not add an `api/` folder or catch-all `vercel.json` rewrite unless deliberately proxying.
- Run `npm run build`, `npm run typecheck`, and `npm test` before merging any deployment change.

---

## 16. Required npm Scripts

```json
{
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "db:migrate": "prisma migrate deploy",
    "db:seed": "tsx scripts/seed.ts",
    "db:studio": "prisma studio",
    "import:geonames": "tsx scripts/import-geonames.ts"
  }
}
```

Adapt only if the project already uses a different tool.

---

## 17. OpenAPI / Swagger Rules

Maintain `src/docs/openapi.ts` and keep it in sync with the real API at all times.

- Update the spec whenever routes, request bodies, response shapes, or auth rules change.
- Every endpoint must have at least one success example.
- Every endpoint must include common error responses: `400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`.
- Keep documented payloads aligned with the real response shape, including nested `data` and `meta`.
- Expose docs at `GET /api/docs` in development only (`NODE_ENV !== 'production'` or behind an admin flag).
- Document auth: which endpoints require `Bearer` token, which are public, which require admin role.

---

## 18. Testing Rules

Every feature must have tests before it is considered complete.

### Unit Tests

- Test service methods in isolation with mocked repositories.
- Test validation schemas with valid and invalid inputs.
- Test utility functions.

### Integration Tests

- Use Supertest against the real Express app.
- Use a separate test database — never the development or production DB.
- Seed required data in `beforeEach` or `beforeAll` and clean up in `afterEach` or `afterAll`.
- Test the full happy path and key error paths for every endpoint.

### Test Coverage Targets

```
Auth module:        100%
Core utilities:     100%
Feature modules:    ≥ 80%
```

### What to Test on Every Endpoint

- [ ] Happy path returns correct status and response shape.
- [ ] Missing required fields returns `422`.
- [ ] Invalid token returns `401`.
- [ ] Insufficient role returns `403`.
- [ ] Duplicate resource returns `409`.
- [ ] Not found returns `404`.
- [ ] Rate limit returns `429` after threshold.

---

## 19. Feature Generation Protocol

When asked to add any feature or API, the AI agent must do the following steps in order — no skipping.

1. Understand the feature request fully before writing code.
2. Check existing modules for reusable patterns, utilities, and helpers.
3. Create or update only the relevant module files.
4. Add route with correct middleware chain (validate → auth → controller).
5. Add Zod validation schema for every request shape.
6. Add DTO types for request input and service output.
7. Add thin controller method.
8. Add service method with all business logic.
9. Add repository method(s) with projection and indexes.
10. Add or adjust DB indexes for the new query patterns.
11. Add cache logic where the feature benefits from caching.
12. Add background queue job if any step is slow or unreliable.
13. Add tests: happy path and key error paths.
14. Update `src/docs/openapi.ts` with the new endpoint.
15. Summarise changes in the Output Format (Section 20).

Do not ask unnecessary questions. Use safe defaults and state assumptions clearly.

---

## 20. AI Agent Output Format

After every coding task, respond with this exact format:

```
SUMMARY
- What was built or changed, in plain language.

FILES CHANGED
- src/modules/<feature>/<feature>.routes.ts       — added X route
- src/modules/<feature>/<feature>.validation.ts   — added Y schema
- ...

API
- POST   /api/v1/<resource>         — description
- GET    /api/v1/<resource>/:id     — description

VALIDATION RULES
- field: rule description
- field: rule description

DB / CACHE
- Added index: { field: 1 } on <collection>
- Cache key: myapp:v1:<module>:<operation>:<id>, TTL 300s

SECURITY
- Rate limit: X requests per Y minutes on auth endpoints
- Auth required: yes / no
- Role required: user / admin / none

TESTS
- auth.test.ts: 8 tests — all passed
- or: tests not run — reason

ASSUMPTIONS
- Any assumptions made where the request was underspecified.

NEXT STEPS
- Optional: what should be done next.
```

Keep explanations short and concrete. No filler.

---

## 21. Performance Checklist

Before marking any feature as done, verify every item:

- [ ] Request has Zod validation before controller logic.
- [ ] Controller is thin — only reads input and sends response.
- [ ] Service owns all business logic.
- [ ] Repository owns all DB access.
- [ ] List endpoints are paginated with a max limit.
- [ ] DB queries use projection.
- [ ] All filter/sort/lookup fields have indexes.
- [ ] No unbounded DB reads anywhere.
- [ ] No N+1 queries.
- [ ] No duplicate code — shared logic is in `core/utils`.
- [ ] All errors use `AppError` and flow through the global error handler.
- [ ] Response shape matches the standard format.
- [ ] Every log line includes `requestId`.
- [ ] Cache strategy documented if Redis is used.
- [ ] Background queue used if any operation is slow.
- [ ] Tests added or updated.
- [ ] OpenAPI docs updated.
- [ ] TypeScript compiles without errors.

---

## 22. Definition of Done

A feature is complete only when **all** of these are true:

- API works end-to-end and returns the correct response shape.
- Code follows every rule in this README.
- No unrelated code was changed.
- `npm run typecheck` passes with zero errors.
- `npm run lint` passes with zero errors.
- All tests pass, or failures are documented with a reason.
- All error cases are handled and return appropriate status codes and messages.
- Frontend can consume the response without transformation.
- Performance impact has been considered.
- Security impact has been considered.
- OpenAPI docs are updated.

---

## 23. Example: Full Auth Module Expected Shape

### Register

```
POST /api/v1/auth/register
```

Request:

```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "SuperSecret123!"
}
```

Response `201`:

```json
{
  "success": true,
  "message": "Account created successfully.",
  "data": {
    "user": {
      "id": "usr_abc123",
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": "15m"
  }
}
```

### Login

```
POST /api/v1/auth/login
```

Request:

```json
{
  "email": "john@example.com",
  "password": "SuperSecret123!"
}
```

Response `200`:

```json
{
  "success": true,
  "message": "Welcome back.",
  "data": {
    "user": {
      "id": "usr_abc123",
      "username": "john_doe",
      "displayName": "John Doe",
      "email": "john@example.com",
      "avatar": null,
      "role": "user"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "expiresIn": "15m"
  }
}
```

Security applied to this module:

- Validate email format and password minimum length with Zod.
- Compare with hashed password — never plain text comparison.
- Return generic `"The email or password you entered is incorrect."` for any failure.
- Never return the password hash in any response.
- Rate limit: max 10 login attempts per 15 minutes per IP.
- Log only safe metadata on login attempt: userId (if found), IP, timestamp — never password.

Implementation files:

```
modules/auth/auth.routes.ts
modules/auth/auth.controller.ts
modules/auth/auth.service.ts
modules/auth/auth.repository.ts
modules/auth/auth.model.ts
modules/auth/auth.validation.ts
modules/auth/auth.dto.ts
modules/auth/auth.types.ts
modules/auth/auth.test.ts
```

---

## 24. Common Error Codes (Machine-Readable)

Use these `error.code` values consistently across all modules.

```
VALIDATION_ERROR          422   — Zod validation failed
INVALID_CREDENTIALS       401   — Wrong email or password
UNAUTHORIZED              401   — Missing or invalid token
FORBIDDEN                 403   — Authenticated but not permitted
NOT_FOUND                 404   — Resource does not exist
CONFLICT                  409   — Duplicate or state conflict
RATE_LIMIT_EXCEEDED       429   — Too many requests
INTERNAL_ERROR            500   — Unexpected server error
TOKEN_EXPIRED             401   — JWT access token expired
REFRESH_TOKEN_INVALID     401   — Refresh token invalid or revoked
EMAIL_NOT_VERIFIED        403   — Account exists but email not verified
ACCOUNT_SUSPENDED         403   — Account is suspended
FILE_TOO_LARGE            400   — Upload exceeds size limit
INVALID_FILE_TYPE         400   — File MIME type not allowed
USERNAME_TAKEN            409   — Username already in use
EMAIL_TAKEN               409   — Email already in use
```

---

*End of README. This file is the single source of truth for all backend development on this project.*
*The AI agent must re-read this file at the start of every new session before writing any code.*
