# Eramarindo AI Federation — FM-001

**Development foundation | Version 0.1.0**

FM-001 is the provider-neutral gateway for connecting OpenAI, DeepSeek, and Google Gemini behind one internal API. This repository is the Development workspace for the Eramarindo AI Federation.

## Governance status

- Environment: **Development only**
- Delivery: feature branch and Draft Pull Request
- Production deployment: **not performed**
- Supabase schema/data changes: **not performed**
- Provider API keys or billing: **not created or configured**
- Merge: **not performed**
- Founder approval is required before merge, production promotion, database migration, or enabling paid provider traffic.

## Implemented foundation

- Node.js 22+ HTTP gateway with no third-party runtime dependencies.
- Server-side adapters for OpenAI Chat Completions, DeepSeek Chat Completions, and Gemini generateContent.
- Opt-in provider allowlist; no provider is enabled by default.
- Bearer-token authentication, request size limits, message validation, request timeout, basic rate limiting, and request IDs.
- Liveness endpoint, authenticated provider discovery, structured logs without prompt/completion content.
- Built-in Node test runner and GitHub Actions CI workflow.
- Architecture, security baseline, and staged delivery roadmap.

## Quick start

```bash
cp .env.example .env
# Set FM001_API_KEY to a unique random value of at least 32 characters.
# Add provider credentials and model IDs only in your local secret environment.
# Add approved provider names to FM001_ENABLED_PROVIDERS, e.g. openai,deepseek.
npm run check
npm test
npm start
```

The sample environment is intentionally unconfigured. Never commit real secrets or place provider keys in browser code.

## API

- `GET /health` — liveness check.
- `GET /v1/models` — authenticated list of enabled provider identifiers.
- `POST /v1/chat/completions` — authenticated provider request.

Example:

```bash
curl -X POST http://127.0.0.1:8787/v1/chat/completions \
  -H "Authorization: Bearer $FM001_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"provider":"openai","messages":[{"role":"user","content":"Hello"}]}'
```

See [Architecture](docs/ARCHITECTURE.md), [Security](docs/SECURITY.md), and [Roadmap](docs/ROADMAP.md).

## Current limitations

This is a foundation, not a production-ready federation platform. It does not yet include a Command Center UI, enterprise identity/RBAC, durable audit storage, distributed quotas, streaming, tool execution, consensus orchestration, retrieval, or deployment automation. The in-memory rate limiter is per process only.

## Operating principle

**One Gate – One Standard – One Command.**  
**Evidence Before Status. NO SILENT CHANGE.**
