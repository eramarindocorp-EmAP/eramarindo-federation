# Eramarindo AI Federation — FM-001

**Development foundation | Version 0.2.0**

FM-001 is the provider-neutral gateway and orchestration engine for connecting OpenAI, DeepSeek, and Google Gemini behind one internal API. This repository is the Development workspace for the Eramarindo AI Federation.

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
- Orchestration modes: single provider, parallel comparison, strict-majority exact-text consensus, and ordered fallback.
- Deterministic unit tests and GitHub Actions CI.
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
- `POST /v1/chat/completions` — single-provider completion.
- `POST /v1/orchestrate` — authenticated orchestration.

Example parallel request:

```json
{
  "plan": { "mode": "parallel", "providers": ["openai", "deepseek", "gemini"] },
  "messages": [{ "role": "user", "content": "Compare the approved alternatives." }]
}
```

Modes:
- `single`: exactly one provider.
- `parallel`: 2–3 providers called concurrently; all outcomes returned.
- `consensus`: declares agreement only when a strict majority returns matching normalized text. This is not semantic or factual verification.
- `fallback`: tries providers in the supplied order and stops at the first successful non-empty response.

Multi-provider modes require the providers to be explicitly enabled. Parallel and consensus requests can generate multiple provider charges after credentials are configured. No provider is enabled by default.

See [Architecture](docs/ARCHITECTURE.md), [Security](docs/SECURITY.md), and [Roadmap](docs/ROADMAP.md).

## Current limitations

This remains a Development MVP, not a production-ready federation platform. It does not yet include a Command Center UI, enterprise identity/RBAC, durable audit storage, distributed quotas, streaming, tool execution, semantic response evaluation, retrieval, or deployment automation. The in-memory rate limiter is per process only. The bootstrap bearer token is not suitable as enterprise identity.

## Operating principle

**One Gate – One Standard – One Command.**  
**Evidence Before Status. NO SILENT CHANGE.**
