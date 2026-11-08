# Vercel Development Hosting — FM-001

## Deployment shape

- Static Command Center: `public/index.html`.
- Server API: `api/[...path].js`, a Vercel Node.js Function delegating to the shared `handleRequest` implementation in `src/server.js`.
- Existing local Node HTTP entry point remains available through `npm start` for local development and regression testing.
- The adapter strips the `/api` prefix, preserving the established routes: `/health`, `/v1/providers/status`, `/v1/models`, `/v1/chat/completions`, and `/v1/orchestrate`.
- The browser Command Center calls the same-origin `/api` prefix. Provider keys remain server-side.

## Vercel settings

- Runtime: Node.js 22 (align with `package.json` engines).
- Function region: Singapore (`sin1`).
- Function maximum duration: 45 seconds; FM-001 provider timeout defaults to 30 seconds.
- Static assets served from `public/`.
- Security response headers are declared in `vercel.json`.

## Required Development environment variables

Set these only in the Vercel Development/Preview environment, never in browser code or Git:

- `FM001_API_KEY`: unique random bearer token, at least 32 characters.
- `FM001_ENABLED_PROVIDERS`: intentionally blank until providers and data handling are approved.
- `FM001_MAX_BODY_BYTES`: optional, default 1048576.
- `FM001_REQUEST_TIMEOUT_MS`: optional, default 30000.
- `FM001_RATE_LIMIT_PER_MINUTE`: optional, default 60 (per warm function instance only; not a distributed quota).
- `OPENAI_API_KEY`, `OPENAI_MODEL`, `DEEPSEEK_API_KEY`, `DEEPSEEK_MODEL`, `GEMINI_API_KEY`, `GEMINI_MODEL`: leave unset until Founder approval for the selected provider(s), model(s), data transfer, and paid usage.

## Important serverless considerations

- Vercel Functions are request-scoped serverless executions, not a persistent Node.js process.
- The in-memory rate limiter is best-effort and per warm instance. It is not an enterprise-wide rate limit and must be replaced with a shared limiter before production.
- No Supabase migration or write is part of this adapter.
- No provider is enabled and no provider API calls are made by the deployment adapter itself.
- Deployment, merge, and production promotion remain separate Founder-controlled steps.
